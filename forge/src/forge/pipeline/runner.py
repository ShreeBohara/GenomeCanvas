"""Run stages in order, reusing cached outputs, and check every table.

The runner works out the order from what each stage reads, refuses to start if
any stage reads a source that is not verified and in use in the licence ledger,
verifies every pinned file against the lock, then for each stage either loads
its outputs from the cache or runs it. A cache entry is found by a key made of
the stage's name, version and parameters, the Forge's own code, and the content
hashes of everything the stage reads, so a change to any of them runs it again.
"""

from __future__ import annotations

import hashlib
import json
import time
from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from typing import Final

from forge.ledger import Source, check_ledger
from forge.pipeline.arrow import Table, decode_parquet, encode_parquet
from forge.pipeline.lock import FORGE_ROOT, Artifact, Lock, LockError, Profile, Variant, verify_file
from forge.pipeline.schema import TableSchema, validate_schema
from forge.pipeline.stage import Check, CheckContext, CheckOutcome, Severity, Stage, StageInputs

CODE_ROOT: Final = Path(__file__).resolve().parents[1]


class BuildError(RuntimeError):
    """The build cannot go on. `problems` lists every reason found, not only the first."""

    def __init__(self, problems: Sequence[str]) -> None:
        self.problems = tuple(problems)
        super().__init__("; ".join(self.problems))


@dataclass(frozen=True, slots=True)
class CheckResult:
    name: str
    table: str
    stage: str
    protects: str
    severity: Severity
    passed: bool
    detail: str
    examples: tuple[str, ...]

    @property
    def status(self) -> str:
        return "passed" if self.passed else "failed"


@dataclass(frozen=True, slots=True)
class StageRecord:
    name: str
    version: int
    cache_key: str
    cached: bool
    seconds: float
    report: Mapping[str, object]


@dataclass
class BuildResult:
    profile: Profile
    tables: dict[str, Table] = field(default_factory=dict)
    stages: list[StageRecord] = field(default_factory=list)
    checks: list[CheckResult] = field(default_factory=list)
    sources: dict[str, Source] = field(default_factory=dict)
    artifacts: dict[str, tuple[Artifact, Variant]] = field(default_factory=dict)
    code_fingerprint: str = ""

    @property
    def failed_errors(self) -> list[CheckResult]:
        return [c for c in self.checks if not c.passed and c.severity == "error"]


def code_fingerprint(root: Path = CODE_ROOT) -> str:
    """SHA-256 over the Forge's own source files (tests excluded), by relative path."""
    digest = hashlib.sha256()
    for path in sorted(root.rglob("*.py")):
        if path.name.startswith("test_") or "__pycache__" in path.parts:
            continue
        digest.update(path.relative_to(root).as_posix().encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def plan(stages: Sequence[Stage], lock: Lock) -> list[Stage]:
    """The stages in an order where each comes after the stages it reads from."""
    problems: list[str] = []
    names = [s.name for s in stages]
    if len(set(names)) != len(names):
        problems.append("two stages share a name")
    producer: dict[str, str] = {}
    for stage in stages:
        for schema in stage.outputs:
            problems.extend(validate_schema(schema))
            if schema.name in producer:
                problems.append(
                    f"table {schema.name} is made by both {producer[schema.name]} and {stage.name}"
                )
            producer[schema.name] = stage.name
        for artifact_id in stage.artifacts:
            if artifact_id not in lock.artifacts:
                problems.append(
                    f"stage {stage.name} reads {artifact_id}, which the lock does not name"
                )
        for check in stage.checks:
            if check.table not in stage.output_names:
                problems.append(
                    f"check {check.name!r} guards {check.table}, not made by {stage.name}"
                )
    for stage in stages:
        for table in stage.inputs:
            if table not in producer:
                problems.append(f"stage {stage.name} reads table {table}, which no stage makes")
    check_names = [c.name for s in stages for c in s.checks]
    duplicates = sorted({n for n in check_names if check_names.count(n) > 1})
    if duplicates:
        problems.append(f"check names used twice: {', '.join(duplicates)}")
    if problems:
        raise BuildError(problems)

    ordered: list[Stage] = []
    done: set[str] = set()
    remaining = list(stages)
    while remaining:
        ready = [s for s in remaining if all(producer[t] in done for t in s.inputs)]
        if not ready:
            raise BuildError([f"stages read each other in a cycle: {[s.name for s in remaining]}"])
        for stage in ready:
            ordered.append(stage)
            done.add(stage.name)
            remaining.remove(stage)
    return ordered


def gate_sources(
    stages: Sequence[Stage], ledger: object, lock: Lock, today: date
) -> dict[str, Source]:
    """The ledger rule: every source a stage reads is verified and marked in use.

    Raises BuildError listing every stage and source that breaks it.
    """
    verdict = check_ledger(ledger, today)
    problems = [f"licence ledger: {p}" for p in verdict.problems]
    by_id = {s.id: s for s in verdict.sources}
    used: dict[str, Source] = {}
    for stage in stages:
        for source_id in stage.sources:
            source = by_id.get(source_id)
            if source is None:
                problems.append(
                    f"stage {stage.name} reads source {source_id!r}, which has no valid row in "
                    f"the ledger"
                )
            elif source.status != "verified":
                problems.append(
                    f"stage {stage.name} reads source {source_id!r}, whose licence is not verified"
                )
            elif not source.in_use:
                problems.append(
                    f"stage {stage.name} reads source {source_id!r}, which the ledger does not "
                    f"mark in use"
                )
            else:
                used[source_id] = source
        for artifact_id in stage.artifacts:
            artifact = lock.artifacts.get(artifact_id)
            if artifact is not None and artifact.source not in stage.sources:
                problems.append(
                    f"stage {stage.name} reads {artifact_id} from source {artifact.source!r} "
                    "without declaring that source"
                )
        for schema in stage.outputs:
            undeclared = sorted(set(schema.sources) - set(stage.sources))
            if undeclared:
                problems.append(
                    f"table {schema.name} claims source(s) {', '.join(undeclared)} that "
                    f"stage {stage.name} does not declare"
                )
    if problems:
        raise BuildError(problems)
    return used


def resolve_artifacts(
    stages: Sequence[Stage],
    lock: Lock,
    profile: Profile,
    downloads: Path,
    fetch: Callable[[Variant, Path, str], Path] | None,
    forge_root: Path = FORGE_ROOT,
) -> dict[str, Path]:
    """A verified local path for every artifact the stages read.

    In the sample profile every file comes from the repository and `fetch` must
    be None: the sample build cannot reach the network even by mistake.
    """
    paths: dict[str, Path] = {}
    for artifact_id in sorted({a for s in stages for a in s.artifacts}):
        artifact = lock.artifact(artifact_id)
        variant = artifact.variant(profile)
        label = f"{artifact_id} ({profile})"
        if profile == "sample":
            if variant.path is None:
                raise LockError(f"{label}: no path")
            path = forge_root / variant.path
            if not path.is_file():
                raise LockError(f"{label}: {variant.path} is missing")
        else:
            cached = downloads / variant.sha256
            if cached.is_file():
                path = cached
            elif fetch is None:
                raise LockError(f"{label}: not in the download cache, and fetching is off")
            else:
                path = fetch(variant, downloads, label)
        verify_file(path, variant, label)
        paths[artifact_id] = path
    return paths


def _key(
    stage: Stage, artifact_hashes: Mapping[str, str], table_hashes: Mapping[str, str], code: str
) -> str:
    document = {
        "artifacts": dict(sorted(artifact_hashes.items())),
        "code": code,
        "inputs": dict(sorted(table_hashes.items())),
        "outputs": {s.name: s.fingerprint() for s in stage.outputs},
        "params": dict(sorted(stage.params.items())),
        "stage": stage.name,
        "version": stage.version,
    }
    text = json.dumps(document, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _load_cached(
    directory: Path, stage: Stage
) -> tuple[dict[str, Table], dict[str, str], dict[str, object]] | None:
    meta_path = directory / "outputs.json"
    if not meta_path.is_file():
        return None
    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    tables: dict[str, Table] = {}
    hashes: dict[str, str] = {}
    for schema in stage.outputs:
        path = directory / f"{schema.name}.parquet"
        expected = meta.get("tables", {}).get(schema.name)
        if not path.is_file() or expected is None:
            return None
        data = path.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        if digest != expected:
            return None
        tables[schema.name] = decode_parquet(data, schema)
        hashes[schema.name] = digest
    report = meta.get("report", {})
    return tables, hashes, report if isinstance(report, dict) else {}


def _store(directory: Path, encoded: Mapping[str, bytes], report: Mapping[str, object]) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    for name, data in encoded.items():
        (directory / f"{name}.parquet").write_bytes(data)
    meta = {
        "report": report,
        "tables": {
            name: hashlib.sha256(data).hexdigest() for name, data in sorted(encoded.items())
        },
    }
    # Written last: an entry without it is incomplete and is ignored.
    (directory / "outputs.json").write_text(json.dumps(meta, sort_keys=True, indent=2) + "\n")


def _check_outputs(stage: Stage, tables: Mapping[str, Table]) -> None:
    expected = set(stage.output_names)
    problems: list[str] = []
    if set(tables) != expected:
        problems.append(
            f"stage {stage.name} returned {sorted(tables)}, declared {sorted(expected)}"
        )
    for schema in stage.outputs:
        table = tables.get(schema.name)
        if table is not None and table.schema is not schema:
            problems.append(
                f"stage {stage.name}: table {schema.name} was built from another schema"
            )
    if problems:
        raise BuildError(problems)


def _run_check(check: Check, stage: Stage, context: CheckContext) -> CheckResult:
    outcome: CheckOutcome = check.run(context)
    return CheckResult(
        name=check.name,
        table=check.table,
        stage=stage.name,
        protects=check.protects,
        severity=check.severity,
        passed=outcome.passed,
        detail=outcome.detail,
        examples=outcome.examples,
    )


def run_build(
    stages: Sequence[Stage],
    *,
    lock: Lock,
    ledger: object,
    profile: Profile,
    today: date,
    cache_root: Path,
    fetch: Callable[[Variant, Path, str], Path] | None,
    forge_root: Path = FORGE_ROOT,
    log: Callable[[str], None] = lambda _: None,
) -> BuildResult:
    """Run every stage and check. Stops at the first stage whose error checks fail."""
    ordered = plan(stages, lock)
    result = BuildResult(profile=profile)
    result.sources = gate_sources(ordered, ledger, lock, today)
    if profile == "sample" and fetch is not None:
        raise BuildError(["the sample profile never fetches; pass fetch=None"])
    paths = resolve_artifacts(ordered, lock, profile, cache_root / "downloads", fetch, forge_root)
    variants = {a: lock.artifact(a).variant(profile) for a in paths}
    result.artifacts = {a: (lock.artifact(a), variants[a]) for a in paths}
    code = code_fingerprint()
    result.code_fingerprint = code
    table_hashes: dict[str, str] = {}

    for stage in ordered:
        started = time.monotonic()
        key = _key(
            stage,
            {a: variants[a].sha256 for a in stage.artifacts},
            {t: table_hashes[t] for t in stage.inputs},
            code,
        )
        directory = cache_root / "stages" / f"{stage.name}-{key[:16]}"
        cached = _load_cached(directory, stage)
        if cached is not None:
            tables, hashes, report = cached
            log(f"{stage.name}: cached")
        else:
            log(f"{stage.name}: running")
            output = stage.run(
                StageInputs(
                    profile=profile,
                    artifacts={a: paths[a] for a in stage.artifacts},
                    variants={a: variants[a] for a in stage.artifacts},
                    tables={t: result.tables[t] for t in stage.inputs},
                    params=stage.params,
                )
            )
            _check_outputs(stage, output.tables)
            encoded = {name: encode_parquet(table) for name, table in output.tables.items()}
            report = dict(output.report)
            _store(directory, encoded, report)
            tables = dict(output.tables)
            hashes = {name: hashlib.sha256(data).hexdigest() for name, data in encoded.items()}
        result.tables.update(tables)
        table_hashes.update(hashes)

        context = CheckContext(tables=dict(result.tables), variants=variants)
        stage_checks = [_run_check(c, stage, context) for c in stage.checks]
        result.checks.extend(stage_checks)
        result.stages.append(
            StageRecord(
                name=stage.name,
                version=stage.version,
                cache_key=key,
                cached=cached is not None,
                seconds=round(time.monotonic() - started, 1),
                report=report,
            )
        )
        failed = [c for c in stage_checks if not c.passed and c.severity == "error"]
        for check in stage_checks:
            log(f"  check {check.status}: {check.name} ({check.detail})")
        if failed:
            log(f"{stage.name}: {len(failed)} check(s) failed; stopping")
            break
    return result


def build_schemas(stages: Sequence[Stage]) -> list[TableSchema]:
    return [schema for stage in stages for schema in stage.outputs]
