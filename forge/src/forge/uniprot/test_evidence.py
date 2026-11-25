from __future__ import annotations

from forge.uniprot.evidence import EVIDENCE_CODES, KIND_BY_CODE, kind_of, text_kind_of


def test_every_code_is_mapped_once_with_a_rationale() -> None:
    codes = [e.code for e in EVIDENCE_CODES]
    assert len(codes) == len(set(codes))
    assert all(e.rationale.strip() and e.label.strip() for e in EVIDENCE_CODES)


def test_the_most_direct_kind_wins() -> None:
    assert kind_of(["ECO:0000255", "ECO:0000269"]) == "measured"
    assert kind_of(["ECO:0000501", "ECO:0000305"]) == "curated"
    assert kind_of(["ECO:0000256"]) == "predicted"


def test_no_code_means_no_kind() -> None:
    assert kind_of([]) is None


def test_an_unmapped_code_is_never_given_a_kind() -> None:
    assert "ECO:0008006" not in KIND_BY_CODE
    assert kind_of(["ECO:0000269", "ECO:0008006"]) is None


def test_curator_text_is_at_most_curated() -> None:
    assert text_kind_of(["ECO:0000269"]) == "curated"
    assert text_kind_of(["ECO:0000256"]) == "predicted"
