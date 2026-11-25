from __future__ import annotations

from forge.identity.crosswalk import map_ensembl, map_hgnc

KNOWN = {"HGNC:1": "TST1", "HGNC:2": "TST2", "HGNC:3": "TST3"}


def test_hgnc_unique_when_both_agree() -> None:
    result = map_hgnc(["HGNC:1"], ["HGNC:1"], KNOWN)
    assert (result.status, result.chosen, result.reason) == (
        "unique",
        "HGNC:1",
        "UniProt and HGNC agree",
    )


def test_hgnc_unique_from_one_side_says_which() -> None:
    assert (
        map_hgnc([], ["HGNC:2"], KNOWN).reason == "from HGNC; UniProt has no HGNC cross-reference"
    )
    assert map_hgnc(["HGNC:2"], [], KNOWN).reason.startswith("from UniProt")


def test_hgnc_several_genes_is_ambiguous_and_chooses_none() -> None:
    result = map_hgnc(["HGNC:1", "HGNC:2"], ["HGNC:1", "HGNC:2"], KNOWN)
    assert (result.status, result.chosen, result.candidates) == (
        "ambiguous",
        None,
        ("HGNC:1", "HGNC:2"),
    )
    assert result.reason == "2 HGNC genes encode this protein"


def test_hgnc_disagreement_is_ambiguous_and_says_so() -> None:
    result = map_hgnc(["HGNC:1"], ["HGNC:3"], KNOWN)
    assert result.status == "ambiguous"
    assert result.reason == "UniProt names HGNC:1 and HGNC names HGNC:3: they disagree"


def test_hgnc_withdrawn_id_is_missing_with_reason() -> None:
    result = map_hgnc(["HGNC:99"], [], KNOWN)
    assert result.status == "missing"
    assert result.reason == "UniProt names HGNC:99, which HGNC's table does not have"


def test_ensembl_unique_from_uniprot() -> None:
    assert map_ensembl(["ENSG00000000001"], None).chosen == "ENSG00000000001"


def test_ensembl_several_settled_by_hgnc_keeps_every_candidate() -> None:
    result = map_ensembl(["ENSG00000000002", "ENSG00000000001"], "ENSG00000000002")
    assert (result.status, result.chosen) == ("unique", "ENSG00000000002")
    assert result.candidates == ("ENSG00000000001", "ENSG00000000002")


def test_ensembl_several_not_settled_stay_ambiguous() -> None:
    result = map_ensembl(["ENSG00000000002", "ENSG00000000001"], "ENSG00000000009")
    assert (result.status, result.chosen) == ("ambiguous", None)


def test_ensembl_from_hgnc_when_uniprot_has_none() -> None:
    result = map_ensembl([], "ENSG00000000009")
    assert (result.status, result.reason) == (
        "unique",
        "from HGNC; UniProt has no Ensembl cross-reference",
    )


def test_ensembl_missing_when_neither_has_one() -> None:
    assert map_ensembl([], None).status == "missing"
