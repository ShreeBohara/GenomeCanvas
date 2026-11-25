"""The identity crosswalk: UniProt accession to Ensembl gene, HGNC gene and approved symbol.

Built from UniProt's own cross-references and HGNC's complete set. Each row
says, for the HGNC gene and for the Ensembl gene separately, whether the
mapping is unique, ambiguous or missing, and why, in words. Nothing is chosen
by guesswork: an ambiguous mapping keeps every candidate and names none.

Rules, applied per protein:

HGNC gene. Candidates are the HGNC ids UniProt cross-references and the HGNC
genes whose UniProt list names the protein, kept only if HGNC's table has
them. One candidate is unique; several are ambiguous; none is missing.

Ensembl gene. Candidates are the Ensembl genes of UniProt's Ensembl
cross-references (versions dropped). One is unique. Several are ambiguous,
unless the protein's HGNC gene is unique and HGNC links it to one of them,
which then settles it and the reason says so. None: if the unique HGNC gene has an
Ensembl gene, that one is used and the reason says it came from HGNC;
otherwise missing.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from typing import Final, Literal

from forge.pipeline import sql
from forge.pipeline.arrow import Table, build_table
from forge.pipeline.schema import Column, TableSchema

Status = Literal["unique", "ambiguous", "missing"]

CROSSWALK: Final = TableSchema(
    name="crosswalk",
    description=(
        "For each protein: its Ensembl gene, HGNC gene and approved symbol, each "
        "marked unique, ambiguous or missing, with the reason."
    ),
    sources=("uniprot", "hgnc"),
    key=("accession",),
    columns=(
        Column("accession", "string", "The protein's primary UniProtKB accession.", "identifier"),
        Column(
            "uniprot_symbol",
            "string",
            "The gene symbol UniProt gives the protein (proteins.gene_symbol).",
            "curated",
            nullable=True,
        ),
        Column(
            "hgnc_id",
            "string",
            "The protein's HGNC gene, when the mapping is unique.",
            "identifier",
            nullable=True,
        ),
        Column(
            "approved_symbol",
            "string",
            "HGNC's approved symbol for that gene, when the mapping is unique.",
            "curated",
            nullable=True,
        ),
        Column("hgnc_status", "string", "unique, ambiguous or missing.", "pipeline"),
        Column("hgnc_reason", "string", "Why, in words.", "pipeline"),
        Column(
            "hgnc_candidates",
            "list<string>",
            "Every HGNC gene considered, sorted. More than one when ambiguous.",
            "identifier",
        ),
        Column(
            "ensembl_gene_id",
            "string",
            "The protein's Ensembl gene (unversioned), when the mapping is unique.",
            "identifier",
            nullable=True,
        ),
        Column("ensembl_status", "string", "unique, ambiguous or missing.", "pipeline"),
        Column("ensembl_reason", "string", "Why, in words.", "pipeline"),
        Column(
            "ensembl_candidates",
            "list<string>",
            "Every Ensembl gene considered, sorted. More than one when ambiguous.",
            "identifier",
        ),
        Column(
            "symbol_agrees",
            "bool",
            "Whether UniProt's symbol equals HGNC's approved symbol. Null when either is missing.",
            "pipeline",
            nullable=True,
        ),
    ),
)


@dataclass(frozen=True, slots=True)
class Resolution:
    status: Status
    reason: str
    chosen: str | None
    candidates: tuple[str, ...]


def _strings(value: object) -> list[str]:
    if not isinstance(value, list):
        raise TypeError(f"expected a list from the query, got {value!r}")
    return [str(v) for v in value]


def _plural(n: int, word: str) -> str:
    return f"{n} {word}" if n == 1 else f"{n} {word}s"


def map_hgnc(
    from_uniprot: Sequence[str], from_hgnc: Sequence[str], known: Mapping[str, str]
) -> Resolution:
    """The HGNC mapping for one protein. `known` maps HGNC ids to approved symbols."""
    uniprot = sorted(set(from_uniprot))
    hgnc = sorted(set(from_hgnc))
    stale = sorted(i for i in uniprot if i not in known)
    candidates = tuple(sorted({i for i in uniprot if i in known} | set(hgnc)))
    note = f" ({', '.join(stale)} not in HGNC's table)" if stale else ""
    if not candidates:
        if stale:
            return Resolution(
                "missing",
                f"UniProt names {', '.join(stale)}, which HGNC's table does not have",
                None,
                (),
            )
        return Resolution(
            "missing", "neither UniProt nor HGNC links this protein to an HGNC gene", None, ()
        )
    if len(candidates) == 1:
        only = candidates[0]
        in_uniprot = only in uniprot
        in_hgnc = only in hgnc
        if in_uniprot and in_hgnc:
            reason = "UniProt and HGNC agree"
        elif in_uniprot:
            reason = "from UniProt; HGNC does not list this accession for the gene"
        else:
            reason = "from HGNC; UniProt has no HGNC cross-reference"
        return Resolution("unique", reason + note, only, candidates)
    if set(hgnc) and set(uniprot) and set(hgnc) != {i for i in uniprot if i in known}:
        reason = (
            f"UniProt names {', '.join(uniprot) or 'none'} and HGNC names "
            f"{', '.join(hgnc)}: they disagree"
        )
    else:
        reason = f"{_plural(len(candidates), 'HGNC gene')} encode this protein"
    return Resolution("ambiguous", reason + note, None, candidates)


def map_ensembl(from_uniprot: Sequence[str], hgnc_gene_ensembl: str | None) -> Resolution:
    """The Ensembl mapping for one protein, given its unique HGNC gene's Ensembl id, if any."""
    candidates = tuple(sorted(set(from_uniprot)))
    if len(candidates) == 1:
        return Resolution(
            "unique", "from UniProt's Ensembl cross-references", candidates[0], candidates
        )
    if len(candidates) > 1:
        if hgnc_gene_ensembl is not None and hgnc_gene_ensembl in candidates:
            return Resolution(
                "unique",
                f"UniProt lists {_plural(len(candidates), 'Ensembl gene')}; HGNC links the "
                "protein's gene to one of them",
                hgnc_gene_ensembl,
                candidates,
            )
        return Resolution(
            "ambiguous",
            f"UniProt lists {_plural(len(candidates), 'Ensembl gene')} and HGNC does not settle it",
            None,
            candidates,
        )
    if hgnc_gene_ensembl is not None:
        return Resolution(
            "unique",
            "from HGNC; UniProt has no Ensembl cross-reference",
            hgnc_gene_ensembl,
            (hgnc_gene_ensembl,),
        )
    return Resolution(
        "missing", "UniProt has no Ensembl cross-reference and HGNC gives none", None, ()
    )


_UNIPROT_LINKS: Final = """
select p.accession, p.gene_symbol,
  coalesce((select list_sort(list_distinct(list(x.id))) from cross_references x
            where x.accession = p.accession and x.database = 'HGNC'), []) as hgnc,
  coalesce((select list_sort(list_distinct(list(regexp_replace(e.value, '\\.[0-9]+$', ''))))
            from cross_references x, unnest(x.properties) as t(e)
            where x.accession = p.accession and x.database = 'Ensembl'
              and e.key = 'gene ID'), []) as ensembl
from proteins p order by p.accession
"""

_HGNC_BY_ACCESSION: Final = """
select u.accession, list_sort(list(h.hgnc_id))
from hgnc_genes h, unnest(h.uniprot_ids) as u(accession) group by u.accession
"""


def build_crosswalk(
    proteins: Table, cross_references: Table, hgnc_genes: Table
) -> tuple[Table, dict[str, object]]:
    tables = {"proteins": proteins, "cross_references": cross_references, "hgnc_genes": hgnc_genes}
    links = sql.rows(tables, _UNIPROT_LINKS)
    by_accession = {str(a): _strings(ids) for a, ids in sql.rows(tables, _HGNC_BY_ACCESSION)}
    symbols = dict(
        zip(
            (str(i) for i in hgnc_genes.column("hgnc_id")),
            (str(s) for s in hgnc_genes.column("symbol")),
            strict=True,
        )
    )
    ensembl_of = {
        str(i): (str(e) if e is not None else None)
        for i, e in zip(
            hgnc_genes.column("hgnc_id"), hgnc_genes.column("ensembl_gene_id"), strict=True
        )
    }
    columns: dict[str, list[object]] = {c.name: [] for c in CROSSWALK.columns}
    uniprot_only: dict[str, int] = {"unique": 0, "ambiguous": 0, "missing": 0}
    for accession, symbol, hgnc_ids, ensembl_ids in links:
        hgnc_list = _strings(hgnc_ids)
        ensembl_list = _strings(ensembl_ids)
        hgnc = map_hgnc(hgnc_list, by_accession.get(str(accession), []), symbols)
        ensembl = map_ensembl(ensembl_list, ensembl_of.get(hgnc.chosen) if hgnc.chosen else None)
        n = len(set(ensembl_list))
        uniprot_only["unique" if n == 1 else "missing" if n == 0 else "ambiguous"] += 1
        approved = symbols.get(hgnc.chosen) if hgnc.chosen else None
        columns["accession"].append(accession)
        columns["uniprot_symbol"].append(symbol)
        columns["hgnc_id"].append(hgnc.chosen)
        columns["approved_symbol"].append(approved)
        columns["hgnc_status"].append(hgnc.status)
        columns["hgnc_reason"].append(hgnc.reason)
        columns["hgnc_candidates"].append(list(hgnc.candidates))
        columns["ensembl_gene_id"].append(ensembl.chosen)
        columns["ensembl_status"].append(ensembl.status)
        columns["ensembl_reason"].append(ensembl.reason)
        columns["ensembl_candidates"].append(list(ensembl.candidates))
        columns["symbol_agrees"].append(
            None if symbol is None or approved is None else symbol == approved
        )
    report: dict[str, object] = {"ensembl_status_from_uniprot_alone": uniprot_only}
    return build_table(CROSSWALK, columns), report
