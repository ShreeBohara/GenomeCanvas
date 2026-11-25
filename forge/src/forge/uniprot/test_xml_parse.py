from __future__ import annotations

import io

import pytest

from forge.testdata import SEQ_A, uniprot_xml
from forge.uniprot.xml_parse import ParseReport, iter_entries


def _parse(data: bytes) -> tuple[dict[str, dict[str, list[dict[str, object]]]], ParseReport]:
    report = ParseReport()
    entries = {e.accession: e.tables for e in iter_entries(io.BytesIO(data), report)}
    return entries, report


def test_reads_every_entry_in_file_order() -> None:
    entries, report = _parse(uniprot_xml())
    assert list(entries) == ["P12345", "Q99999"]
    assert report.entries == 2


def test_protein_row_carries_names_gene_and_existence() -> None:
    entries, _ = _parse(uniprot_xml())
    protein = entries["P12345"]["proteins"][0]
    assert protein["entry_name"] == "TEST1_HUMAN"
    assert protein["secondary_accessions"] == ["Q00001"]
    assert protein["protein_name"] == "Test protein one"
    assert protein["alternative_names"] == ["TP1", "Other name", "CD999"]
    assert protein["ec_numbers"] == ["1.2.3.4"]
    assert protein["gene_symbol"] == "TST1"
    assert protein["protein_existence_level"] == 1
    assert protein["length"] == len(SEQ_A)
    assert protein["gaps"] == []


def test_gaps_are_named_not_dropped() -> None:
    entries, _ = _parse(uniprot_xml())
    protein = entries["Q99999"]["proteins"][0]
    assert protein["gene_symbol"] is None
    assert protein["gaps"] == [
        "no gene symbol",
        "no Ensembl cross-reference",
        "no HGNC cross-reference",
        "non-standard residues: U",
        "sequence is a fragment",
    ]
    assert protein["protein_existence_level"] == 5
    assert entries["Q99999"]["sequences"][0]["nonstandard_residues"] == ["U"]


def test_evidence_is_resolved_with_codes_sources_and_proposed_kind() -> None:
    entries, _ = _parse(uniprot_xml())
    comment = entries["P12345"]["comments"][0]
    assert comment["evidence"] == [
        {"code": "ECO:0000269", "source": "PubMed:11111111"},
        {"code": "ECO:0000250", "source": "UniProtKB:P99999"},
    ]
    # Experimental evidence, but the text is a curator's: capped at curated.
    assert comment["evidence_kind"] == "curated"
    variant = next(f for f in entries["P12345"]["features"] if f["type"] == "sequence variant")
    assert variant["evidence_kind"] == "measured"
    site = next(f for f in entries["P12345"]["features"] if f["type"] == "binding site")
    assert site["evidence"] == [{"code": "ECO:0000255", "source": None}]
    assert site["evidence_kind"] == "predicted"


def test_feature_positions_ligands_and_unknown_ends() -> None:
    entries, _ = _parse(uniprot_xml())
    features = entries["P12345"]["features"]
    variant = features[1]
    assert (variant["begin"], variant["end"], variant["original"], variant["variation"]) == (
        2,
        2,
        "K",
        ["E"],
    )
    site = features[2]
    assert (site["ligand_name"], site["ligand_id"]) == ("Zn(2+)", "CHEBI:29105")
    region = features[3]
    assert region["begin"] is None
    assert region["begin_status"] == "unknown"
    assert region["end"] == 10
    assert region["end_status"] == "certain"


def test_go_cross_references_and_isoforms() -> None:
    entries, _ = _parse(uniprot_xml())
    go = entries["P12345"]["go_annotations"][0]
    assert go["aspect"] == "cellular component"
    assert go["term"] == "nucleus"
    assert go["evidence_kind"] == "measured"
    assert go["assigned_by"] == "UniProtKB"
    databases = [x["database"] for x in entries["P12345"]["cross_references"]]
    assert "GO" not in databases
    assert databases == ["PDB", "AlphaFoldDB", "Ensembl", "HGNC"]
    ensembl = entries["P12345"]["cross_references"][2]
    assert ensembl["molecule"] == "P12345-1"
    assert {"key": "gene ID", "value": "ENSG00000000001.5"} in ensembl["properties"]  # type: ignore[operator]
    isoforms = entries["P12345"]["isoforms"]
    assert [(i["isoform_id"], i["is_canonical"]) for i in isoforms] == [
        ("P12345-1", True),
        ("P12345-2", False),
    ]


def test_locations_and_diseases_have_their_own_rows() -> None:
    entries, _ = _parse(uniprot_xml())
    location = entries["P12345"]["subcellular_locations"][0]
    assert location["molecule"] == "Isoform 2"
    assert location["locations"] == ["Cell membrane"]
    assert location["topologies"] == ["Single-pass membrane protein"]
    disease = entries["P12345"]["diseases"][0]
    assert (disease["disease_id"], disease["acronym"], disease["mim_id"]) == (
        "DI-00001",
        "TD",
        "100000",
    )


def test_comments_without_text_are_counted_for_later_steps() -> None:
    _, report = _parse(uniprot_xml())
    assert report.as_dict()["comments_not_taken_in_this_step"] == {"interaction": 1}


def test_an_entry_without_sequence_is_an_error_not_a_skip() -> None:
    good = uniprot_xml()
    start = good.index(b'<sequence length="5"')
    broken = good[:start] + good[good.index(b"</sequence>", start) + len(b"</sequence>") :]
    with pytest.raises(ValueError, match="Q99999: entry has no sequence"):
        _parse(broken)
