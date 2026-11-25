from __future__ import annotations

import re
from datetime import date, timedelta
from pathlib import Path

import pytest

from forge.ledger import DEFAULT_LEDGER, MAX_CHECK_AGE_DAYS, check_ledger, main, parse_ledger

TODAY = date(2026, 11, 25)


def verified_row(**overrides: object) -> dict[str, object]:
    row: dict[str, object] = {
        "id": "example",
        "name": "Example source",
        "version": "1.0",
        "url": "https://example.org",
        "licence": "CC-BY-4.0",
        "licence_url": "https://example.org/licence",
        "checked": TODAY,
        "attribution": "Example source, version 1.0.",
        "in_use": True,
        "status": "verified",
    }
    row.update(overrides)
    return row


def unverified_row(**overrides: object) -> dict[str, object]:
    row = verified_row(
        id="pending",
        licence=None,
        licence_url=None,
        checked=None,
        attribution=None,
        in_use=False,
        status="unverified",
    )
    row.update(overrides)
    return row


def problems(rows: object) -> tuple[str, ...]:
    return check_ledger(rows, TODAY).problems


def test_a_well_formed_ledger_passes() -> None:
    verdict = check_ledger([verified_row(), unverified_row(note="licence not read")], TODAY)
    assert verdict.ok
    assert [s.id for s in verdict.sources] == ["example", "pending"]
    assert verdict.sources[1].note == "licence not read"


def test_the_committed_ledger_passes_on_the_day_it_was_seeded() -> None:
    verdict = check_ledger(parse_ledger(DEFAULT_LEDGER.read_text(encoding="utf-8")), TODAY)
    assert verdict.problems == ()
    verified = {s.id for s in verdict.sources if s.status == "verified"}
    assert verified == {"alphamissense", "esm", "human-protein-atlas", "open-targets"}
    assert all(s.licence is None for s in verdict.sources if s.status == "unverified")


@pytest.mark.parametrize("field", ["id", "licence", "checked", "in_use", "status"])
def test_a_missing_field_fails(field: str) -> None:
    row = verified_row()
    del row[field]
    assert any(f"missing field(s) {field}" in p for p in problems([row]))


def test_an_unknown_field_fails() -> None:
    assert any("unknown field(s) licence_ur" in p for p in problems([verified_row(licence_ur="x")]))


def test_a_duplicate_id_fails() -> None:
    found = problems([verified_row(), unverified_row(id="example")])
    assert found == ("row 2 (example): duplicate id",)


def test_a_verified_check_older_than_the_limit_fails() -> None:
    stale = TODAY - timedelta(days=MAX_CHECK_AGE_DAYS + 1)
    found = problems([verified_row(checked=stale)])
    assert len(found) == 1
    assert "181 days ago" in found[0]


def test_a_verified_check_exactly_at_the_limit_passes() -> None:
    assert problems([verified_row(checked=TODAY - timedelta(days=MAX_CHECK_AGE_DAYS))]) == ()


def test_the_age_rule_uses_the_date_passed_in() -> None:
    row = verified_row(checked=date(2026, 1, 1))
    assert check_ledger([row], date(2026, 6, 1)).ok
    assert not check_ledger([row], date(2026, 12, 1)).ok


def test_a_check_dated_in_the_future_fails() -> None:
    assert any("after 2026-11-25" in p for p in problems([verified_row(checked=date(2027, 1, 1))]))


def test_a_source_in_use_without_a_verified_licence_fails() -> None:
    found = problems([unverified_row(in_use=True)])
    assert found == ("row 1 (pending): in use but its licence is not verified",)


def test_an_unverified_row_may_not_name_a_licence() -> None:
    assert any("'licence' must be null" in p for p in problems([unverified_row(licence="CC0-1.0")]))


def test_a_verified_row_must_fill_in_its_evidence() -> None:
    found = problems([verified_row(licence_url=None, attribution=None)])
    assert any("licence_url, attribution not filled in" in p for p in found)


@pytest.mark.parametrize(
    ("overrides", "message"),
    [
        ({"in_use": "yes"}, "'in_use' must be true or false"),
        ({"status": "Verified"}, "'status' must be 'verified' or 'unverified'"),
        ({"checked": "last week"}, "'checked' must be a date"),
        ({"version": 1.0}, "'version' must be text or null"),
        ({"url": ""}, "'url' must be non-empty text"),
    ],
)
def test_wrongly_typed_values_fail(overrides: dict[str, object], message: str) -> None:
    assert any(message in p for p in problems([verified_row(**overrides)]))


@pytest.mark.parametrize("data", [None, [], {"id": "example"}, "sources"])
def test_a_ledger_that_is_not_a_list_of_rows_fails(data: object) -> None:
    assert problems(data) == ("the ledger must be a non-empty list of sources",)


def test_every_problem_is_reported_not_just_the_first() -> None:
    found = problems([unverified_row(in_use=True), verified_row(checked=date(2020, 1, 1))])
    assert len(found) == 2


def test_the_command_prints_the_table_and_exits_zero(capsys: pytest.CaptureFixture[str]) -> None:
    assert main(["check", "--today", "2026-11-25"]) == 0
    out = capsys.readouterr().out
    assert re.search(r"^alphamissense +verified +no +CC-BY-4.0 +2026-11-25 +0$", out, re.M)
    assert "15 sources, 4 verified, checked against 2026-11-25." in out


def test_the_command_exits_non_zero_on_a_broken_ledger(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    ledger = tmp_path / "sources.yaml"
    ledger.write_text("- id: lonely\n", encoding="utf-8")
    assert main(["check", "--file", str(ledger), "--today", "2026-11-25"]) == 1
    assert "missing field(s)" in capsys.readouterr().err


def test_the_command_exits_non_zero_when_the_ledger_is_missing(tmp_path: Path) -> None:
    assert main(["check", "--file", str(tmp_path / "absent.yaml")]) == 2
