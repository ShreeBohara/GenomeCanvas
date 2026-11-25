from __future__ import annotations

from forge.dictionary import DICTIONARY, render
from forge.stages import STAGES


def test_the_committed_dictionary_matches_the_schemas() -> None:
    assert DICTIONARY.read_text(encoding="utf-8") == render(), (
        "docs/data/dictionary.md is out of date: run `uv run python -m forge dictionary` in forge/"
    )


def test_every_table_and_column_is_described() -> None:
    text = render()
    for stage in STAGES:
        for schema in stage.outputs:
            assert f"## {schema.name}\n" in text
            for column in schema.columns:
                assert f"| `{column.name}` |" in text


def test_the_evidence_mapping_is_marked_as_needing_review() -> None:
    assert "needs review by a biologist" in render()
