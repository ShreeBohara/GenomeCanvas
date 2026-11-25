"""HGNC's complete set of approved human gene symbols, as a table.

The file is HGNC's monthly tab-separated archive. Multi-valued fields are
quoted and separated by `|`. Only the columns the crosswalk needs are kept.
"""

from __future__ import annotations

import csv
import gzip
import io
from collections.abc import Sequence
from pathlib import Path
from typing import Final

from forge.pipeline.arrow import Table, build_table
from forge.pipeline.schema import Column, TableSchema

ARTIFACT: Final = "hgnc_complete_set"
REQUIRED_COLUMNS: Final = (
    "hgnc_id",
    "symbol",
    "name",
    "locus_group",
    "locus_type",
    "status",
    "alias_symbol",
    "prev_symbol",
    "ensembl_gene_id",
    "uniprot_ids",
)

HGNC_GENES: Final = TableSchema(
    name="hgnc_genes",
    description="Approved human genes from HGNC, with their Ensembl gene and UniProt accessions.",
    sources=("hgnc",),
    key=("hgnc_id",),
    columns=(
        Column("hgnc_id", "string", "HGNC identifier, for example HGNC:1100.", "identifier"),
        Column("symbol", "string", "The approved gene symbol.", "curated"),
        Column("name", "string", "The approved gene name.", "curated"),
        Column(
            "locus_group",
            "string",
            "HGNC's locus group, for example 'protein-coding gene'.",
            "curated",
        ),
        Column(
            "locus_type",
            "string",
            "HGNC's locus type, for example 'gene with protein product'.",
            "curated",
        ),
        Column(
            "status", "string", "HGNC's status for the symbol, for example 'Approved'.", "curated"
        ),
        Column("alias_symbols", "list<string>", "Other symbols in use for the gene.", "curated"),
        Column("previous_symbols", "list<string>", "Symbols the gene had before.", "curated"),
        Column(
            "ensembl_gene_id",
            "string",
            "The Ensembl gene HGNC links to this gene, unversioned. Null when HGNC gives none.",
            "identifier",
            nullable=True,
        ),
        Column(
            "uniprot_ids",
            "list<string>",
            "UniProt accessions HGNC links to this gene.",
            "identifier",
        ),
    ),
)


class HgncFormatError(ValueError):
    """The file is not HGNC's complete set in the expected layout."""


def _split(value: str) -> list[str]:
    return [part for part in value.split("|") if part] if value else []


def parse_hgnc(text: str) -> dict[str, list[object]]:
    """HGNC's TSV as columns for `HGNC_GENES`."""
    reader = csv.reader(io.StringIO(text), delimiter="\t", quotechar='"')
    header = next(reader, None)
    if header is None:
        raise HgncFormatError("the file is empty")
    missing = [c for c in REQUIRED_COLUMNS if c not in header]
    if missing:
        raise HgncFormatError(f"missing column(s) {', '.join(missing)}")
    index = {name: header.index(name) for name in REQUIRED_COLUMNS}
    columns: dict[str, list[object]] = {c.name: [] for c in HGNC_GENES.columns}
    for line_number, row in enumerate(reader, start=2):
        if len(row) != len(header):
            raise HgncFormatError(
                f"line {line_number}: {len(row)} fields, header has {len(header)}"
            )

        def field(name: str, row: Sequence[str] = row) -> str:
            return row[index[name]]

        columns["hgnc_id"].append(field("hgnc_id"))
        columns["symbol"].append(field("symbol"))
        columns["name"].append(field("name"))
        columns["locus_group"].append(field("locus_group"))
        columns["locus_type"].append(field("locus_type"))
        columns["status"].append(field("status"))
        columns["alias_symbols"].append(_split(field("alias_symbol")))
        columns["previous_symbols"].append(_split(field("prev_symbol")))
        columns["ensembl_gene_id"].append(field("ensembl_gene_id") or None)
        columns["uniprot_ids"].append(_split(field("uniprot_ids")))
    return columns


def read_hgnc(path: Path) -> Table:
    """Read HGNC's file, plain as HGNC serves it or gzipped as the sample snapshot is."""
    data = path.read_bytes()
    if data[:2] == b"\x1f\x8b":
        data = gzip.decompress(data)
    return build_table(HGNC_GENES, parse_hgnc(data.decode("utf-8")))
