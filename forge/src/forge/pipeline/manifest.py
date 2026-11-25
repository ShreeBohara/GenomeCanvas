"""Write a table release: content-hashed Parquet files, a check report and a manifest.

Like the Phase 1 sample release, every data file is named by a prefix of its
SHA-256 and `manifest.json` is the only fixed name, written last. A table
release has its own name (`tables-sample`, `tables-full`), so the app, which
reads the release named `sample`, is unaffected. Nothing in a release depends
on the clock, the machine or whether a stage came from the cache.
"""

from __future__ import annotations

import hashlib
import json
import re
from collections.abc import Mapping
from pathlib import Path
from typing import Final

from forge.pipeline.arrow import encode_parquet
from forge.pipeline.runner import BuildResult
from forge.release_names import MANIFEST_FILE, is_servable

MANIFEST_FORMAT: Final = "table-release/0"
CHECKS_FORMAT: Final = "check-report/0"
HASH_PREFIX: Final = 16
_OWN_FILE: Final = re.compile(r"\A[a-z0-9_]+\.[0-9a-f]{16}\.(?:parquet|json)\Z")


def release_name(profile: str) -> str:
    return f"tables-{profile}"


def _canonical(document: object) -> bytes:
    text = json.dumps(document, sort_keys=True, ensure_ascii=False, indent=2)
    return (text + "\n").encode("utf-8")


def _named(stem: str, data: bytes, extension: str) -> str:
    name = f"{stem}.{hashlib.sha256(data).hexdigest()[:HASH_PREFIX]}.{extension}"
    if not is_servable(name):
        raise ValueError(f"{name} breaks the release naming rule")
    return name


def check_report(result: BuildResult) -> dict[str, object]:
    return {
        "checks": [
            {
                "detail": c.detail,
                "examples": list(c.examples),
                "name": c.name,
                "protects": c.protects,
                "severity": c.severity,
                "stage": c.stage,
                "status": c.status,
                "table": c.table,
            }
            for c in result.checks
        ],
        "failed": sum(not c.passed for c in result.checks),
        "format": CHECKS_FORMAT,
        "passed": sum(c.passed for c in result.checks),
        "profile": result.profile,
    }


def build_release_files(result: BuildResult) -> dict[str, bytes]:
    """Every file of the release by name, `manifest.json` included."""
    files: dict[str, bytes] = {}
    tables: dict[str, object] = {}
    for name in sorted(result.tables):
        table = result.tables[name]
        data = encode_parquet(table)
        path = _named(name, data, "parquet")
        files[path] = data
        tables[name] = {
            "bytes": len(data),
            "columns": len(table.schema.columns),
            "path": path,
            "rows": table.num_rows,
            "schema_fingerprint": table.schema.fingerprint(),
            "sha256": hashlib.sha256(data).hexdigest(),
            "sources": list(table.schema.sources),
        }
    report = _canonical(check_report(result))
    report_path = _named("checks", report, "json")
    files[report_path] = report

    sources: dict[str, object] = {}
    for source_id, source in sorted(result.sources.items()):
        inputs: dict[str, object] = {}
        for artifact_id, (artifact, variant) in sorted(result.artifacts.items()):
            if artifact.source != source_id:
                continue
            inputs[artifact_id] = {
                "bytes": variant.bytes,
                "release": artifact.release,
                "sha256": variant.sha256,
                **({"url": variant.url} if variant.url else {"path": variant.path}),
            }
        sources[source_id] = {
            "attribution": source.attribution,
            "checked": source.checked.isoformat() if source.checked else None,
            "inputs": inputs,
            "licence": source.licence,
            "licence_url": source.licence_url,
            "name": source.name,
            "version": source.version,
        }
    manifest = {
        "checks": {
            "failed": sum(not c.passed for c in result.checks),
            "passed": sum(c.passed for c in result.checks),
            "path": report_path,
            "results": {c.name: c.status for c in result.checks},
        },
        "code_fingerprint": result.code_fingerprint,
        "format": MANIFEST_FORMAT,
        "profile": result.profile,
        "release": release_name(result.profile),
        "sample": result.profile == "sample",
        "sources": sources,
        "stages": [
            {"cache_key": s.cache_key, "name": s.name, "report": s.report, "version": s.version}
            for s in result.stages
        ],
        "tables": tables,
    }
    files[MANIFEST_FILE] = _canonical(manifest)
    return files


def write_release(files: Mapping[str, bytes], out_dir: Path) -> None:
    """Write the files, first removing this writer's files from an earlier build."""
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.iterdir():
        if old.is_file() and (old.name == MANIFEST_FILE or _OWN_FILE.match(old.name)):
            old.unlink()
    for name, data in sorted(files.items()):
        if name != MANIFEST_FILE:
            (out_dir / name).write_bytes(data)
    if MANIFEST_FILE in files:
        (out_dir / MANIFEST_FILE).write_bytes(files[MANIFEST_FILE])


def write_check_report_only(result: BuildResult, out_dir: Path) -> Path:
    """On a failed build: the check report alone, so the failures can be read, and no manifest."""
    data = _canonical(check_report(result))
    files = {_named("checks", data, "json"): data}
    write_release(files, out_dir)
    return out_dir / next(iter(files))
