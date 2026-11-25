"""Each check goes red on input data broken in the way it guards against."""

from __future__ import annotations

import gzip
from pathlib import Path

import pytest

from forge.pipeline.lock import Variant
from forge.pipeline.stage import Check, CheckContext
from forge.testdata import SCORES_TSV, SEQ_A, uniprot_xml
from forge.uniprot.checks import UNIPROT_CHECKS
from forge.uniprot.stage import build_uniprot_tables, parse_annotation_scores


def _context(tmp_path: Path, xml: bytes, reported: int = 2) -> CheckContext:
    path = tmp_path / "entries.xml.gz"
    path.write_bytes(gzip.compress(xml))
    tables, _ = build_uniprot_tables(path, parse_annotation_scores(SCORES_TSV))
    variant = Variant(1, "0" * 64, None, "x", reported, "the test")
    return CheckContext(tables=tables, variants={"uniprot_human_xml": variant})


def _check(name: str) -> Check:
    return next(c for c in UNIPROT_CHECKS if c.name == name)


def test_every_check_passes_on_good_data(tmp_path: Path) -> None:
    context = _context(tmp_path, uniprot_xml())
    failed = [(c.name, c.run(context).detail) for c in UNIPROT_CHECKS if not c.run(context).passed]
    assert failed == []


@pytest.mark.parametrize(
    ("name", "mutate"),
    [
        (
            "sequences: checksum matches UniProt's CRC64",
            # One residue changed inside the sequence text, checksum left as published.
            lambda x: x.replace(f">{SEQ_A}<".encode(), f">{SEQ_A[:-1]}W<".encode()),
        ),
        (
            "features: positions lie within the sequence",
            lambda x: x.replace(b'<end position="22"/>', b'<end position="40"/>'),
        ),
        (
            "features: original residues match the sequence",
            lambda x: x.replace(b"<original>K</original>", b"<original>R</original>"),
        ),
        (
            "proteins: every protein is human",
            lambda x: x.replace(
                b'id="9606"/>\n    </organism>\n    <proteinExistence type="uncertain"',
                b'id="10090"/>\n    </organism>\n    <proteinExistence type="uncertain"',
            ),
        ),
        (
            "proteins: every protein is reviewed",
            lambda x: x.replace(
                b'dataset="Swiss-Prot" created="2010', b'dataset="TrEMBL" created="2010'
            ),
        ),
        (
            "features: every feature type is known",
            lambda x: x.replace(b'<feature type="chain"', b'<feature type="mystery region"'),
        ),
        (
            "go_annotations: identifiers and aspects are well formed",
            lambda x: x.replace(b'id="GO:0005634"', b'id="GO:563"'),
        ),
        (
            "features: every evidence code has a proposed kind",
            lambda x: x.replace(b'type="ECO:0000255" key="3"', b'type="ECO:0008006" key="3"'),
        ),
        (
            "cross_references: AlphaFold DB links name the protein's own accession",
            lambda x: x.replace(
                b'type="AlphaFoldDB" id="P12345"', b'type="AlphaFoldDB" id="P99999"'
            ),
        ),
    ],
)
def test_each_check_catches_its_mutation(tmp_path: Path, name: str, mutate: object) -> None:
    good = uniprot_xml()
    bad = mutate(good)  # type: ignore[operator]
    assert bad != good, "the mutation did not apply"
    outcome = _check(name).run(_context(tmp_path, bad))
    assert not outcome.passed, outcome.detail


def test_a_lost_entry_is_caught_by_the_count(tmp_path: Path) -> None:
    outcome = _check("proteins: count equals what UniProt reports for the release").run(
        _context(tmp_path, uniprot_xml(), reported=3)
    )
    assert not outcome.passed
    assert outcome.detail == "2 proteins, but the test reports 3"


def test_a_duplicated_entry_is_caught(tmp_path: Path) -> None:
    good = uniprot_xml()
    start = good.index(b"<entry ")
    end = good.index(b"</entry>") + len(b"</entry>\n")
    duplicated = good[:end] + good[start:end] + good[end:]
    outcome = _check("proteins: accession is unique").run(_context(tmp_path, duplicated))
    assert not outcome.passed
    assert outcome.examples == ("P12345",)
