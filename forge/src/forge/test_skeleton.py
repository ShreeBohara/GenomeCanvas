import copy
import hashlib
import json
from pathlib import Path
from typing import Any

import pytest

from forge.ids import is_uniprot_accession
from forge.skeleton import (
    DEFAULT_FIXTURE,
    SkeletonValidationError,
    build_release,
    load_fixture,
    main,
    validate_rows,
    write_release,
)


def _fixture() -> list[dict[str, Any]]:
    _, raw = load_fixture(DEFAULT_FIXTURE)
    assert isinstance(raw, list)
    return raw


def _row(**overrides: object) -> dict[str, object]:
    row: dict[str, object] = {
        "uniprot_id": "P38398",
        "gene_name": "BRCA1",
        "name": "Breast cancer type 1 susceptibility protein",
        "function_category": "dna_repair",
        "umap_x": 1.0,
        "umap_y": 2.0,
    }
    row.update(overrides)
    return row


def _problems(raw: object) -> tuple[str, ...]:
    with pytest.raises(SkeletonValidationError) as caught:
        validate_rows(raw)
    return caught.value.problems


def test_the_fixture_is_valid_and_keeps_every_row() -> None:
    raw = _fixture()
    rows = validate_rows(raw)
    assert len(rows) == len(raw) == 54
    assert [r.accession for r in rows] == sorted(p["uniprot_id"] for p in raw)


def test_rows_are_sorted_by_accession_whatever_the_input_order() -> None:
    raw = _fixture()
    assert validate_rows(list(reversed(raw))) == validate_rows(raw)


@pytest.mark.parametrize(
    ("overrides", "expected"),
    [
        ({"uniprot_id": "p38398"}, "is not a UniProt accession"),
        ({"uniprot_id": "P38398 "}, "is not a UniProt accession"),
        ({"uniprot_id": None}, "is not a UniProt accession"),
        ({"gene_name": ""}, "gene_name is missing or blank"),
        ({"gene_name": " BRCA1"}, "gene_name is missing or blank"),
        ({"name": None}, "name is missing or blank"),
        ({"function_category": "kinase"}, "is not a known category"),
        ({"umap_x": None}, "umap_x None is not a finite number"),
        ({"umap_y": "2.0"}, "umap_y '2.0' is not a finite number"),
        ({"umap_y": True}, "umap_y True is not a finite number"),
        ({"umap_x": float("nan")}, "umap_x nan is not a finite number"),
    ],
)
def test_a_bad_field_is_an_error_not_a_skip(overrides: dict[str, object], expected: str) -> None:
    problems = _problems([_row(uniprot_id="Q13315", gene_name="ATM"), _row(**overrides)])
    assert len(problems) == 1
    assert expected in problems[0]
    assert problems[0].startswith("row 1")


def test_a_missing_coordinate_is_an_error() -> None:
    row = _row()
    del row["umap_y"]
    assert _problems([row]) == ("row 0 (P38398): umap_y None is not a finite number",)


def test_duplicate_accessions_are_an_error() -> None:
    problems = _problems([_row(), _row(gene_name="OTHER")])
    assert problems == ("row 1 (P38398): duplicate of row 0",)


def test_every_problem_is_reported_not_just_the_first() -> None:
    problems = _problems([_row(uniprot_id="bad"), _row(umap_x=None, name="")])
    assert len(problems) == 3


@pytest.mark.parametrize("raw", [{}, [], "proteins", [1]])
def test_a_fixture_that_is_not_a_list_of_objects_is_an_error(raw: object) -> None:
    assert len(_problems(raw)) == 1


def _release() -> dict[str, bytes]:
    data, raw = load_fixture(DEFAULT_FIXTURE)
    return build_release(validate_rows(raw), source_file="proteins.json", source_bytes=data)


def test_the_manifest_describes_every_file_exactly() -> None:
    files = _release()
    manifest = json.loads(files["manifest.json"])
    assert manifest["sample"] is True
    assert "placed on the map by hand" in manifest["sample_notice"]
    assert manifest["row_count"] == 54
    assert set(files) == {"manifest.json", *(f["path"] for f in manifest["files"].values())}
    for entry in manifest["files"].values():
        data = files[entry["path"]]
        digest = hashlib.sha256(data).hexdigest()
        assert entry["bytes"] == len(data)
        assert entry["sha256"] == digest
        # The name carries a prefix of the content's own hash.
        assert entry["path"].split(".")[1] == digest[:16]
    assert manifest["files"]["points"]["bytes"] == 16 + 9 * 54
    assert manifest["source"]["sha256"] == hashlib.sha256(DEFAULT_FIXTURE.read_bytes()).hexdigest()


def test_the_index_is_in_the_same_row_order_as_the_points() -> None:
    files = _release()
    manifest = json.loads(files["manifest.json"])
    index = json.loads(files[manifest["files"]["proteins"]["path"]])
    points = files[manifest["files"]["points"]["path"]]
    n = manifest["row_count"]
    accessions = [r["accession"] for r in index["rows"]]
    assert accessions == sorted(accessions)
    assert all(is_uniprot_accession(a) for a in accessions)
    order = [c["id"] for c in manifest["categories"]]
    category_bytes = points[16 + 8 * n :]
    assert [order[b] for b in category_bytes] == [r["category"] for r in index["rows"]]


def test_two_builds_are_byte_identical(tmp_path: Path) -> None:
    first, second = tmp_path / "a", tmp_path / "b"
    assert main(["build", "--out", str(first)]) == 0
    assert main(["build", "--out", str(second)]) == 0
    names = sorted(p.name for p in first.iterdir())
    assert names == sorted(p.name for p in second.iterdir())
    assert len(names) == 3
    for name in names:
        assert (first / name).read_bytes() == (second / name).read_bytes()


def test_a_rebuild_removes_files_an_earlier_build_left(tmp_path: Path) -> None:
    stale = tmp_path / "points.0123456789abcdef.bin"
    stale.write_bytes(b"old")
    unrelated = tmp_path / "notes.txt"
    unrelated.write_text("kept")
    write_release(_release(), tmp_path)
    assert not stale.exists()
    assert unrelated.exists()


def test_the_command_fails_on_a_bad_fixture_and_writes_nothing(tmp_path: Path) -> None:
    raw = copy.deepcopy(_fixture())
    raw[3]["umap_x"] = None
    bad = tmp_path / "bad.json"
    bad.write_text(json.dumps(raw))
    out = tmp_path / "out"
    assert main(["build", "--fixture", str(bad), "--out", str(out)]) == 1
    assert not out.exists()


def test_the_command_reports_an_unreadable_fixture(tmp_path: Path) -> None:
    missing = tmp_path / "missing.json"
    assert main(["build", "--fixture", str(missing), "--out", str(tmp_path / "out")]) == 2
