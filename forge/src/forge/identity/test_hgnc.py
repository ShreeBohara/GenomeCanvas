from __future__ import annotations

import gzip
from pathlib import Path

import pytest

from forge.identity.hgnc import REQUIRED_COLUMNS, HgncFormatError, parse_hgnc, read_hgnc

HEADER = "\t".join(REQUIRED_COLUMNS)
ROW = "\t".join(
    [
        "HGNC:1100",
        "BRCA1",
        "BRCA1 DNA repair associated",
        "protein-coding gene",
        "gene with protein product",
        "Approved",
        '"RNF53|BRCC1"',
        "",
        "ENSG00000012048",
        "P38398",
    ]
)


def test_quoted_lists_are_split_and_blanks_are_null() -> None:
    columns = parse_hgnc(f"{HEADER}\n{ROW}\n")
    assert columns["alias_symbols"] == [["RNF53", "BRCC1"]]
    assert columns["previous_symbols"] == [[]]
    assert columns["uniprot_ids"] == [["P38398"]]
    assert columns["ensembl_gene_id"] == ["ENSG00000012048"]


def test_a_missing_column_is_an_error() -> None:
    with pytest.raises(HgncFormatError, match="missing column"):
        parse_hgnc("hgnc_id\tsymbol\nHGNC:1\tA\n")


def test_a_short_row_is_an_error() -> None:
    with pytest.raises(HgncFormatError, match="line 2"):
        parse_hgnc(f"{HEADER}\nHGNC:1\tA\n")


def test_reads_plain_and_gzipped_files_alike(tmp_path: Path) -> None:
    text = f"{HEADER}\n{ROW}\n".encode()
    (tmp_path / "a.tsv").write_bytes(text)
    (tmp_path / "b.tsv.gz").write_bytes(gzip.compress(text))
    assert read_hgnc(tmp_path / "a.tsv").column("symbol") == read_hgnc(
        tmp_path / "b.tsv.gz"
    ).column("symbol")
