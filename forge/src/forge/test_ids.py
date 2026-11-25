import json
from pathlib import Path

import pytest

from forge.ids import is_uniprot_accession

# Shared with packages/protocol's TypeScript tests.
VECTORS = Path(__file__).resolve().parents[3] / "packages/protocol/vectors/uniprot-accessions.json"


def _load(kind: str) -> list[tuple[str, str]]:
    document = json.loads(VECTORS.read_text(encoding="utf-8"))
    return [(v["value"], v["why"]) for v in document[kind]]


def test_the_shared_vectors_are_not_empty() -> None:
    assert len(_load("valid")) >= 5
    assert len(_load("invalid")) >= 10


@pytest.mark.parametrize(("value", "why"), _load("valid"))
def test_accepts_valid_accessions(value: str, why: str) -> None:
    assert is_uniprot_accession(value), why


@pytest.mark.parametrize(("value", "why"), _load("invalid"))
def test_rejects_invalid_accessions(value: str, why: str) -> None:
    assert not is_uniprot_accession(value), why
