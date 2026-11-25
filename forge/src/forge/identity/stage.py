"""The HGNC and crosswalk stages, and the checks that guard their tables."""

from __future__ import annotations

from typing import Final

from forge.identity.crosswalk import CROSSWALK, build_crosswalk
from forge.identity.hgnc import ARTIFACT, HGNC_GENES, read_hgnc
from forge.pipeline import sql
from forge.pipeline.stage import (
    Check,
    CheckContext,
    CheckOutcome,
    Stage,
    StageInputs,
    StageOutput,
    failing,
    passing,
)


def _run_hgnc(inputs: StageInputs) -> StageOutput:
    return StageOutput(tables={HGNC_GENES.name: read_hgnc(inputs.artifact(ARTIFACT))})


def _run_crosswalk(inputs: StageInputs) -> StageOutput:
    table, report = build_crosswalk(
        inputs.table("proteins"), inputs.table("cross_references"), inputs.table("hgnc_genes")
    )
    return StageOutput(tables={CROSSWALK.name: table}, report=report)


def _hgnc_ids(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"hgnc_genes": context.table("hgnc_genes")},
        "select hgnc_id from hgnc_genes where not regexp_full_match(hgnc_id, 'HGNC:[0-9]+') "
        "or symbol = '' union all "
        "select hgnc_id from hgnc_genes group by hgnc_id having count(*) > 1 order by 1 limit 5",
    )
    if found:
        return failing("malformed, blank or repeated HGNC genes", [r[0] for r in found])
    return passing(f"{context.table('hgnc_genes').num_rows} genes, ids unique and well formed")


def _hgnc_ensembl(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"hgnc_genes": context.table("hgnc_genes")},
        "select hgnc_id || ' ' || ensembl_gene_id from hgnc_genes where ensembl_gene_id is not "
        "null "
        "and not regexp_full_match(ensembl_gene_id, 'ENSG[0-9]{11}') order by 1 limit 5",
    )
    if found:
        return failing("malformed Ensembl gene ids in HGNC", [r[0] for r in found])
    return passing("every Ensembl gene id in HGNC is well formed")


def _one_row_per_protein(context: CheckContext) -> CheckOutcome:
    tables = {"proteins": context.table("proteins"), "crosswalk": context.table("crosswalk")}
    found = sql.rows(
        tables,
        "select coalesce(p.accession, c.accession) from proteins p full join crosswalk c using "
        "(accession) "
        "where p.accession is null or c.accession is null order by 1 limit 5",
    )
    if found:
        return failing("crosswalk and proteins do not pair up", [r[0] for r in found])
    return passing("one crosswalk row for every protein")


def _status_consistent(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"crosswalk": context.table("crosswalk")},
        """
        select accession from crosswalk where not (
          (hgnc_status = 'unique' and hgnc_id is not null and len(hgnc_candidates) = 1
             and hgnc_candidates[1] = hgnc_id and approved_symbol is not null)
          or (hgnc_status = 'ambiguous' and hgnc_id is null and len(hgnc_candidates) > 1)
          or (hgnc_status = 'missing' and hgnc_id is null and len(hgnc_candidates) = 0))
        or not (
          (ensembl_status = 'unique' and ensembl_gene_id is not null
             and list_contains(ensembl_candidates, ensembl_gene_id))
          or (ensembl_status = 'ambiguous' and ensembl_gene_id is null
              and len(ensembl_candidates) > 1)
          or (ensembl_status = 'missing' and ensembl_gene_id is null
              and len(ensembl_candidates) = 0))
        or hgnc_reason = '' or ensembl_reason = ''
        order by 1 limit 5
        """,
    )
    if found:
        return failing("statuses that contradict their identifiers", [r[0] for r in found])
    return passing("every status agrees with its identifiers and has a reason")


def _approved_symbol(context: CheckContext) -> CheckOutcome:
    tables = {"crosswalk": context.table("crosswalk"), "hgnc_genes": context.table("hgnc_genes")}
    found = sql.rows(
        tables,
        "select c.accession from crosswalk c left join hgnc_genes h using (hgnc_id) "
        "where c.hgnc_id is not null and (h.symbol is null or h.symbol <> c.approved_symbol) "
        "order by 1 limit 5",
    )
    if found:
        return failing("approved symbols that are not HGNC's", [r[0] for r in found])
    return passing("every approved symbol is HGNC's symbol for the chosen gene")


def _ensembl_format(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"crosswalk": context.table("crosswalk")},
        "select accession || ' ' || e from crosswalk, unnest(ensembl_candidates) as t(e) "
        "where not regexp_full_match(e, 'ENSG[0-9]{11}') order by 1 limit 5",
    )
    if found:
        return failing("Ensembl gene ids that are not unversioned ENSG ids", [r[0] for r in found])
    return passing("every Ensembl gene id is an unversioned ENSG id")


HGNC_STAGE: Final = Stage(
    name="hgnc",
    version=1,
    sources=("hgnc",),
    artifacts=(ARTIFACT,),
    inputs=(),
    outputs=(HGNC_GENES,),
    run=_run_hgnc,
    checks=(
        Check(
            "hgnc_genes: ids are unique and well formed",
            "hgnc_genes",
            "Two HGNC rows for one gene, which would make every protein of that gene ambiguous.",
            "error",
            _hgnc_ids,
        ),
        Check(
            "hgnc_genes: Ensembl gene ids are well formed",
            "hgnc_genes",
            "A misread Ensembl id joining a protein to the wrong gene.",
            "error",
            _hgnc_ensembl,
        ),
    ),
)

CROSSWALK_STAGE: Final = Stage(
    name="crosswalk",
    version=1,
    sources=("uniprot", "hgnc"),
    artifacts=(),
    inputs=("proteins", "cross_references", "hgnc_genes"),
    outputs=(CROSSWALK,),
    run=_run_crosswalk,
    checks=(
        Check(
            "crosswalk: one row for every protein",
            "crosswalk",
            "A protein left out of the crosswalk, so later sources cannot join to it.",
            "error",
            _one_row_per_protein,
        ),
        Check(
            "crosswalk: statuses agree with their identifiers",
            "crosswalk",
            "A mapping marked unique with no identifier, or ambiguous with one chosen anyway.",
            "error",
            _status_consistent,
        ),
        Check(
            "crosswalk: approved symbols are HGNC's",
            "crosswalk",
            "A symbol shown as approved that HGNC does not approve for that gene.",
            "error",
            _approved_symbol,
        ),
        Check(
            "crosswalk: Ensembl gene ids are unversioned ENSG ids",
            "crosswalk",
            "Version suffixes or transcript ids leaking into gene joins in later steps.",
            "error",
            _ensembl_format,
        ),
    ),
)
