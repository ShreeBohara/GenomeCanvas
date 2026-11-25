"""The UniProt stage: the pinned XML and annotation scores in, the UniProt tables out."""

from __future__ import annotations

import csv
import gzip
import io
from collections.abc import Iterable, Mapping
from pathlib import Path
from typing import Final

from forge.pipeline.arrow import Table, build_table, concat
from forge.pipeline.schema import TableSchema
from forge.pipeline.stage import Stage, StageInputs, StageOutput
from forge.uniprot import checks
from forge.uniprot.evidence import EVIDENCE_CODES, REVIEW_STATUS
from forge.uniprot.tables import EVIDENCE_CODES as EVIDENCE_CODES_TABLE
from forge.uniprot.tables import PROTEINS, UNIPROT_TABLES
from forge.uniprot.xml_parse import ParseReport, Row, iter_entries

XML_ARTIFACT: Final = "uniprot_human_xml"
SCORES_ARTIFACT: Final = "uniprot_human_annotation_scores"
# Rows are converted to Arrow every this many entries, so Python objects for
# the whole proteome never exist at once.
_CHUNK_ENTRIES: Final = 1_000


class AnnotationScoreError(ValueError):
    """The annotation score file is not the two-column table UniProt serves."""


def parse_annotation_scores(text: str) -> dict[str, int]:
    """Accession to score, from UniProt's TSV with columns Entry and Annotation."""
    reader = csv.reader(io.StringIO(text), delimiter="\t")
    header = next(reader, None)
    if header != ["Entry", "Annotation"]:
        raise AnnotationScoreError(f"unexpected header {header!r}")
    scores: dict[str, int] = {}
    for line_number, row in enumerate(reader, start=2):
        if len(row) != 2:
            raise AnnotationScoreError(f"line {line_number}: expected 2 fields, found {len(row)}")
        accession, raw = row
        try:
            value = float(raw)
        except ValueError as error:
            raise AnnotationScoreError(
                f"line {line_number}: score {raw!r} is not a number"
            ) from error
        if not value.is_integer():
            raise AnnotationScoreError(f"line {line_number}: score {raw!r} is not a whole number")
        if accession in scores:
            raise AnnotationScoreError(f"line {line_number}: {accession} appears twice")
        scores[accession] = int(value)
    return scores


def read_annotation_scores(path: Path) -> dict[str, int]:
    with gzip.open(path, "rt", encoding="utf-8", newline="") as handle:
        return parse_annotation_scores(handle.read())


class _Buffers:
    def __init__(self, schemas: Iterable[TableSchema]) -> None:
        self._schemas = {s.name: s for s in schemas}
        self._rows: dict[str, list[Row]] = {name: [] for name in self._schemas}
        self.parts: dict[str, list[Table]] = {name: [] for name in self._schemas}

    def add(self, tables: Mapping[str, list[Row]]) -> None:
        for name, rows in tables.items():
            self._rows[name].extend(rows)

    def flush(self) -> None:
        for name, rows in self._rows.items():
            if not rows:
                continue
            schema = self._schemas[name]
            columns = {c: [r[c] for r in rows] for c in schema.column_names}
            self.parts[name].append(build_table(schema, columns, sort=False))
            self._rows[name] = []

    def tables(self) -> dict[str, Table]:
        self.flush()
        return {name: concat(self._schemas[name], parts) for name, parts in self.parts.items()}


def build_uniprot_tables(
    xml_path: Path, scores: Mapping[str, int]
) -> tuple[dict[str, Table], dict[str, object]]:
    report = ParseReport()
    buffers = _Buffers(UNIPROT_TABLES)
    seen: set[str] = set()
    without_alphafold: list[str] = []
    with gzip.open(xml_path, "rb") as stream:
        for count, entry in enumerate(iter_entries(stream, report), start=1):
            protein = entry.tables["proteins"][0]
            score = scores.get(entry.accession)
            protein["annotation_score"] = score
            if score is None:
                gaps = protein["gaps"]
                assert isinstance(gaps, list)  # noqa: S101 - the parser always writes a list
                gaps.append("no annotation score")
            seen.add(entry.accession)
            if not any(r["database"] == "AlphaFoldDB" for r in entry.tables["cross_references"]):
                without_alphafold.append(entry.accession)
            buffers.add(entry.tables)
            if count % _CHUNK_ENTRIES == 0:
                buffers.flush()
    tables = buffers.tables()
    extra_scores = sorted(set(scores) - seen)
    summary: dict[str, object] = {
        **report.as_dict(),
        "annotation_scores_without_an_entry": len(extra_scores),
        "annotation_scores_without_an_entry_examples": extra_scores[:5],
        "proteins_without_an_alphafold_db_link": sorted(without_alphafold),
    }
    return tables, summary


def evidence_codes_table() -> Table:
    rows = EVIDENCE_CODES
    return build_table(
        EVIDENCE_CODES_TABLE,
        {
            "code": [e.code for e in rows],
            "label": [e.label for e in rows],
            "go_code": [e.go_code for e in rows],
            "assertion": [e.assertion for e in rows],
            "kind": [e.kind for e in rows],
            "rationale": [e.rationale for e in rows],
            "review_status": [REVIEW_STATUS for _ in rows],
        },
    )


def _run(inputs: StageInputs) -> StageOutput:
    scores = read_annotation_scores(inputs.artifact(SCORES_ARTIFACT))
    tables, summary = build_uniprot_tables(inputs.artifact(XML_ARTIFACT), scores)
    return StageOutput(tables=tables, report=summary)


def _run_evidence(_: StageInputs) -> StageOutput:
    return StageOutput(tables={EVIDENCE_CODES_TABLE.name: evidence_codes_table()})


UNIPROT_STAGE: Final = Stage(
    name="uniprot",
    version=1,
    sources=("uniprot",),
    artifacts=(XML_ARTIFACT, SCORES_ARTIFACT),
    inputs=(),
    outputs=UNIPROT_TABLES,
    run=_run,
    checks=checks.UNIPROT_CHECKS,
)

EVIDENCE_STAGE: Final = Stage(
    name="evidence_codes",
    version=1,
    sources=(),
    artifacts=(),
    inputs=(),
    outputs=(EVIDENCE_CODES_TABLE,),
    run=_run_evidence,
    checks=checks.EVIDENCE_CHECKS,
)

__all__ = ["EVIDENCE_STAGE", "PROTEINS", "UNIPROT_STAGE", "build_uniprot_tables"]
