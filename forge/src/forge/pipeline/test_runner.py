from __future__ import annotations

import hashlib
from datetime import date
from pathlib import Path

import pytest

from forge.pipeline.arrow import build_table
from forge.pipeline.lock import Artifact, Lock, Profile, Variant
from forge.pipeline.runner import BuildError, plan, run_build
from forge.pipeline.schema import Column, TableSchema
from forge.pipeline.stage import (
    Check,
    CheckContext,
    Stage,
    StageInputs,
    StageOutput,
    failing,
    passing,
)

TODAY = date(2026, 11, 25)
WORDS = TableSchema(
    "words", "Words.", ("uniprot",), ("word",), (Column("word", "string", "A word.", "curated"),)
)
LENGTHS = TableSchema(
    "lengths",
    "Word lengths.",
    ("uniprot",),
    ("word",),
    (
        Column("word", "string", "A word.", "curated"),
        Column("n", "int32", "Its length.", "curated"),
    ),
)


def _ledger(**uniprot: object) -> list[dict[str, object]]:
    row: dict[str, object] = {
        "id": "uniprot",
        "name": "UniProt",
        "version": "2026_04",
        "url": "https://www.uniprot.org",
        "licence": "CC-BY-4.0",
        "licence_url": "https://www.uniprot.org/help/license",
        "checked": date(2026, 11, 25),
        "attribution": "UniProt.",
        "in_use": True,
        "status": "verified",
    }
    row.update(uniprot)
    return [row]


def _setup(tmp_path: Path, text: bytes = b"alpha\nbeta\n") -> tuple[Lock, Path]:
    root = tmp_path / "forge"
    (root / "snapshots").mkdir(parents=True)
    (root / "snapshots" / "words.txt").write_bytes(text)
    sha = hashlib.sha256(text).hexdigest()
    variants: dict[Profile, Variant] = {
        "sample": Variant(len(text), sha, None, "snapshots/words.txt", 2, "test"),
        "full": Variant(len(text), sha, "https://example.org/words.txt", None, 2, "test"),
    }
    return Lock({"words": Artifact("words", "uniprot", "1", "Words.", variants)}), root


class Counter:
    def __init__(self) -> None:
        self.runs = 0


def _stages(
    counter: Counter, *, sources: tuple[str, ...] = ("uniprot",), check_passes: bool = True
) -> tuple[Stage, ...]:
    def read_words(inputs: StageInputs) -> StageOutput:
        counter.runs += 1
        words = inputs.artifact("words").read_text().split()
        return StageOutput({"words": build_table(WORDS, {"word": words})}, {"read": len(words)})

    def measure(inputs: StageInputs) -> StageOutput:
        words = [str(w) for w in inputs.table("words").column("word")]
        return StageOutput(
            {"lengths": build_table(LENGTHS, {"word": words, "n": [len(w) for w in words]})}
        )

    def check(context: CheckContext) -> object:
        return passing("fine") if check_passes else failing("broken", ["alpha"])

    return (
        # Declared out of order on purpose: the runner must sort them.
        Stage("measure", 1, ("uniprot",), (), ("words",), (LENGTHS,), measure),
        Stage(
            "read",
            1,
            sources,
            ("words",),
            (),
            (WORDS,),
            read_words,
            (Check("words: fine", "words", "Nothing.", "error", check),),  # type: ignore[arg-type]
        ),
    )


def _run(
    tmp_path: Path, stages: tuple[Stage, ...], lock: Lock, root: Path, ledger: object = None
) -> object:
    return run_build(
        stages,
        lock=lock,
        ledger=_ledger() if ledger is None else ledger,
        profile="sample",
        today=TODAY,
        cache_root=tmp_path / "cache",
        fetch=None,
        forge_root=root,
    )


def test_stages_run_in_dependency_order(tmp_path: Path) -> None:
    lock, _ = _setup(tmp_path)
    assert [s.name for s in plan(_stages(Counter()), lock)] == ["read", "measure"]


def test_outputs_come_from_the_cache_the_second_time(tmp_path: Path) -> None:
    lock, root = _setup(tmp_path)
    counter = Counter()
    first = _run(tmp_path, _stages(counter), lock, root)
    second = _run(tmp_path, _stages(counter), lock, root)
    assert counter.runs == 1
    assert [s.cached for s in second.stages] == [True, True]  # type: ignore[attr-defined]
    assert second.tables["lengths"].column("n") == [5, 4]  # type: ignore[attr-defined]
    assert first.stages[0].cache_key == second.stages[0].cache_key  # type: ignore[attr-defined]


def test_new_input_bytes_run_the_stage_again(tmp_path: Path) -> None:
    counter = Counter()
    lock, root = _setup(tmp_path)
    _run(tmp_path, _stages(counter), lock, root)
    lock, root = _setup(tmp_path / "other", b"gamma\n")
    result = _run(tmp_path, _stages(counter), lock, root)
    assert counter.runs == 2
    assert result.tables["words"].column("word") == ["gamma"]  # type: ignore[attr-defined]


def test_bytes_that_differ_from_the_lock_stop_the_build(tmp_path: Path) -> None:
    lock, root = _setup(tmp_path)
    (root / "snapshots" / "words.txt").write_bytes(b"alpha\nBETA\n")
    with pytest.raises(ValueError, match="the lock names"):
        _run(tmp_path, _stages(Counter()), lock, root)


@pytest.mark.parametrize(
    ("ledger_change", "message"),
    [
        ({"in_use": False}, "which the ledger does not mark in use"),
        (
            {"status": "unverified", "licence": None, "in_use": False},
            "whose licence is not verified",
        ),
    ],
)
def test_the_ledger_rule_stops_the_build(
    tmp_path: Path, ledger_change: dict[str, object], message: str
) -> None:
    lock, root = _setup(tmp_path)
    counter = Counter()
    with pytest.raises(BuildError, match=message):
        _run(tmp_path, _stages(counter), lock, root, ledger=_ledger(**ledger_change))
    assert counter.runs == 0


def test_a_source_missing_from_the_ledger_stops_the_build(tmp_path: Path) -> None:
    lock, root = _setup(tmp_path)
    with pytest.raises(BuildError, match="'string', which has no valid row"):
        _run(tmp_path, _stages(Counter(), sources=("uniprot", "string")), lock, root)


def test_reading_an_artifact_of_an_undeclared_source_stops_the_build(tmp_path: Path) -> None:
    lock, root = _setup(tmp_path)
    ledger = [*_ledger(), {**_ledger()[0], "id": "hgnc", "name": "HGNC"}]
    with pytest.raises(BuildError, match="from source 'uniprot' without declaring that source"):
        _run(tmp_path, _stages(Counter(), sources=("hgnc",)), lock, root, ledger=ledger)


def test_a_failed_error_check_stops_before_later_stages(tmp_path: Path) -> None:
    lock, root = _setup(tmp_path)
    result = _run(tmp_path, _stages(Counter(), check_passes=False), lock, root)
    assert [s.name for s in result.stages] == ["read"]  # type: ignore[attr-defined]
    assert [c.name for c in result.failed_errors] == ["words: fine"]  # type: ignore[attr-defined]


def test_the_sample_profile_refuses_a_fetcher(tmp_path: Path) -> None:
    lock, root = _setup(tmp_path)
    with pytest.raises(BuildError, match="never fetches"):
        run_build(
            _stages(Counter()),
            lock=lock,
            ledger=_ledger(),
            profile="sample",
            today=TODAY,
            cache_root=tmp_path / "cache",
            fetch=lambda variant, downloads, label: Path("/nowhere"),
            forge_root=root,
        )
