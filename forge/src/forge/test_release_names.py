import json
from pathlib import Path
from typing import Any

import pytest

from forge.release_names import is_content_hashed, is_release_name, is_servable
from forge.skeleton import build_release, validate_rows

# Shared with packages/protocol's TypeScript tests.
VECTORS = Path(__file__).resolve().parents[3] / "packages/protocol/vectors/release-file-names.json"
FIXTURE = Path(__file__).resolve().parents[2] / "fixtures/v1/proteins.json"


def _load(kind: str) -> list[dict[str, Any]]:
    document = json.loads(VECTORS.read_text(encoding="utf-8"))
    entries: list[dict[str, Any]] = document[kind]
    return entries


def test_the_shared_vectors_are_not_trivially_small() -> None:
    names = _load("names")
    assert sum(1 for v in names if v["served"]) >= 5
    assert sum(1 for v in names if not v["served"]) >= 10
    assert len(_load("releases")) >= 5


@pytest.mark.parametrize("vector", _load("names"), ids=lambda v: repr(v["name"]))
def test_classifies_file_names_like_the_worker(vector: dict[str, Any]) -> None:
    assert is_content_hashed(vector["name"]) is vector["hashed"], vector["why"]
    assert is_servable(vector["name"]) is vector["served"], vector["why"]


@pytest.mark.parametrize("vector", _load("releases"), ids=lambda v: repr(v["name"]))
def test_judges_release_names_like_the_worker(vector: dict[str, Any]) -> None:
    assert is_release_name(vector["name"]) is vector["valid"], vector["why"]


def test_every_file_the_skeleton_writes_is_servable_and_data_files_are_hashed() -> None:
    source = FIXTURE.read_bytes()
    files = build_release(
        validate_rows(json.loads(source)), source_file="proteins.json", source_bytes=source
    )
    assert "manifest.json" in files
    assert len(files) >= 3
    for name in files:
        assert is_servable(name), name
        assert is_content_hashed(name) is (name != "manifest.json"), name
