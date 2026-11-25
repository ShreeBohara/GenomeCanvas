from __future__ import annotations

import gzip

from forge.sample import (
    cut_hgnc,
    cut_tsv,
    cut_uniprot_xml,
    format_accession_list,
    gzip_bytes,
    parse_accession_list,
)
from forge.testdata import uniprot_xml


def test_cut_keeps_only_chosen_entries_with_the_files_header_and_footer() -> None:
    data, found = cut_uniprot_xml(uniprot_xml().splitlines(keepends=True), {"Q99999"})
    assert found == ["Q99999"]
    assert data.startswith(b'<?xml version="1.0"')
    assert data.endswith(b"</uniprot>\n")
    assert b"P12345" not in data
    assert b"<accession>Q99999</accession>" in data


def test_secondary_accessions_do_not_select_an_entry() -> None:
    _, found = cut_uniprot_xml(uniprot_xml().splitlines(keepends=True), {"Q00001"})
    assert found == []


def test_gzip_output_has_no_timestamp() -> None:
    first = gzip_bytes(b"same bytes")
    assert first == gzip_bytes(b"same bytes")
    assert first[4:8] == b"\0\0\0\0"
    assert gzip.decompress(first) == b"same bytes"


def test_accession_list_round_trips() -> None:
    text = format_accession_list({"Q99999": ["b"], "P12345": ["a", "c"]})
    assert text == "accession\treasons\nP12345\ta; c\nQ99999\tb\n"
    assert parse_accession_list(text) == ["P12345", "Q99999"]


def test_tsv_and_hgnc_cuts_keep_the_header() -> None:
    assert cut_tsv("Entry\tAnnotation\nA\t1\nB\t2\n", ["B"]) == "Entry\tAnnotation\nB\t2\n"
    hgnc = 'hgnc_id\tuniprot_ids\nHGNC:1\t"P1|P2"\nHGNC:2\tP3\nHGNC:3\t\n'
    assert cut_hgnc(hgnc, {"P2"}, {"HGNC:3"}) == 'hgnc_id\tuniprot_ids\nHGNC:1\t"P1|P2"\nHGNC:3\t\n'
