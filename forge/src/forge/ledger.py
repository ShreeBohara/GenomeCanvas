"""The licence ledger: load `sources.yaml`, check it, and report.

Run `python -m forge.ledger check` to print the ledger and exit non-zero if any
row breaks the rules. "Today" is always passed in, never read inside the
checks, so the same file gives the same verdict in every test.
"""

from __future__ import annotations

import argparse
import sys
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Final, Literal

import yaml

MAX_CHECK_AGE_DAYS: Final = 180
DEFAULT_LEDGER: Final = Path(__file__).resolve().parents[2] / "sources.yaml"

REQUIRED_FIELDS: Final = (
    "id",
    "name",
    "version",
    "url",
    "licence",
    "licence_url",
    "checked",
    "attribution",
    "in_use",
    "status",
)
OPTIONAL_FIELDS: Final = ("note",)
# Fields a verified row must fill in; an unverified row must leave `licence` empty.
VERIFIED_REQUIRES: Final = ("licence", "licence_url", "checked", "attribution")

Status = Literal["verified", "unverified"]


@dataclass(frozen=True)
class Source:
    id: str
    name: str
    version: str | None
    url: str
    licence: str | None
    licence_url: str | None
    checked: date | None
    attribution: str | None
    in_use: bool
    status: Status
    note: str | None = None


@dataclass(frozen=True)
class Verdict:
    sources: tuple[Source, ...]
    problems: tuple[str, ...]

    @property
    def ok(self) -> bool:
        return not self.problems


def parse_ledger(text: str) -> object:
    """Parse the YAML text. Shape is checked by `check_ledger`, not here."""
    return yaml.safe_load(text)


def read_ledger(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _optional_str(row: dict[str, object], key: str, label: str, problems: list[str]) -> str | None:
    value = row.get(key)
    if value is None or isinstance(value, str):
        return value
    problems.append(f"{label}: '{key}' must be text or null, not {type(value).__name__}")
    return None


def _checked_date(row: dict[str, object], label: str, problems: list[str]) -> date | None:
    value = row.get("checked")
    # YAML turns an unquoted 2026-11-25 into a date; a timestamp is not a date here.
    if value is None or (isinstance(value, date) and not isinstance(value, datetime)):
        return value
    problems.append(f"{label}: 'checked' must be a date like 2026-11-25 or null")
    return None


def _check_row(index: int, raw: object, today: date, problems: list[str]) -> Source | None:
    if not isinstance(raw, dict):
        problems.append(f"row {index}: must be a mapping of fields")
        return None
    row: dict[str, object] = {str(key): value for key, value in raw.items()}
    raw_id = row.get("id")
    label = f"row {index} ({raw_id})" if isinstance(raw_id, str) else f"row {index}"
    before = len(problems)

    missing = [field for field in REQUIRED_FIELDS if field not in row]
    if missing:
        problems.append(f"{label}: missing field(s) {', '.join(missing)}")
    unknown = sorted(set(row) - set(REQUIRED_FIELDS) - set(OPTIONAL_FIELDS))
    if unknown:
        problems.append(f"{label}: unknown field(s) {', '.join(unknown)}")
    if missing:
        return None

    for key in ("id", "name", "url"):
        if not isinstance(row[key], str) or not row[key]:
            problems.append(f"{label}: '{key}' must be non-empty text")
    in_use = row["in_use"]
    if not isinstance(in_use, bool):
        problems.append(f"{label}: 'in_use' must be true or false")
    status = row["status"]
    if status not in ("verified", "unverified"):
        problems.append(f"{label}: 'status' must be 'verified' or 'unverified'")

    text = {
        key: _optional_str(row, key, label, problems)
        for key in ("version", "licence", "licence_url", "attribution", "note")
    }
    checked = _checked_date(row, label, problems)

    if status == "verified":
        empty = [key for key in VERIFIED_REQUIRES if row[key] is None]
        if empty:
            problems.append(f"{label}: verified but {', '.join(empty)} not filled in")
        if checked is not None:
            age = (today - checked).days
            if age < 0:
                problems.append(f"{label}: checked on {checked}, which is after {today}")
            elif age > MAX_CHECK_AGE_DAYS:
                problems.append(
                    f"{label}: licence last checked {age} days ago on {checked}; "
                    f"recheck it (limit {MAX_CHECK_AGE_DAYS} days)"
                )
    elif status == "unverified" and row["licence"] is not None:
        problems.append(f"{label}: unverified, so 'licence' must be null until it is read")

    if in_use is True and status != "verified":
        problems.append(f"{label}: in use but its licence is not verified")

    if len(problems) > before:
        return None
    return Source(
        id=str(row["id"]),
        name=str(row["name"]),
        version=text["version"],
        url=str(row["url"]),
        licence=text["licence"],
        licence_url=text["licence_url"],
        checked=checked,
        attribution=text["attribution"],
        in_use=bool(in_use),
        status="verified" if status == "verified" else "unverified",
        note=text["note"],
    )


def check_ledger(data: object, today: date) -> Verdict:
    """Check parsed ledger data against every rule and collect all problems."""
    if not isinstance(data, list) or not data:
        return Verdict((), ("the ledger must be a non-empty list of sources",))
    problems: list[str] = []
    sources: list[Source] = []
    seen: set[object] = set()
    for index, raw in enumerate(data, start=1):
        source_id = raw.get("id") if isinstance(raw, dict) else None
        if source_id is not None and source_id in seen:
            problems.append(f"row {index} ({source_id}): duplicate id")
        seen.add(source_id)
        source = _check_row(index, raw, today, problems)
        if source is not None:
            sources.append(source)
    return Verdict(tuple(sources), tuple(problems))


def format_table(sources: Sequence[Source], today: date) -> str:
    header = ("id", "status", "in use", "licence", "checked", "age (days)")
    rows = [
        (
            s.id,
            s.status,
            "yes" if s.in_use else "no",
            s.licence or "unknown",
            s.checked.isoformat() if s.checked else "never",
            str((today - s.checked).days) if s.checked else "-",
        )
        for s in sources
    ]
    widths = [max(len(r[i]) for r in [header, *rows]) for i in range(len(header))]
    lines = [
        "  ".join(cell.ljust(w) for cell, w in zip(r, widths, strict=True)) for r in [header, *rows]
    ]
    lines.insert(1, "  ".join("-" * w for w in widths))
    return "\n".join(line.rstrip() for line in lines)


def run_check(path: Path, today: date) -> int:
    try:
        text = read_ledger(path)
    except OSError as error:
        print(f"cannot read the ledger at {path}: {error}", file=sys.stderr)
        return 2
    try:
        data = parse_ledger(text)
    except yaml.YAMLError as error:
        print(f"{path} is not valid YAML: {error}", file=sys.stderr)
        return 1
    verdict = check_ledger(data, today)
    if verdict.sources:
        print(format_table(verdict.sources, today))
    if not verdict.ok:
        print(f"\n{len(verdict.problems)} problem(s) in {path}:", file=sys.stderr)
        for problem in verdict.problems:
            print(f"  - {problem}", file=sys.stderr)
        return 1
    verified = sum(s.status == "verified" for s in verdict.sources)
    print(f"\n{len(verdict.sources)} sources, {verified} verified, checked against {today}.")
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m forge.ledger", description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    check = commands.add_parser("check", help="validate the ledger and print it")
    check.add_argument("--file", type=Path, default=DEFAULT_LEDGER, help="ledger to check")
    check.add_argument(
        "--today",
        type=date.fromisoformat,
        default=None,
        help="date to check against, as YYYY-MM-DD (default: the system date)",
    )
    args = parser.parse_args(argv)
    today: date = args.today if args.today is not None else date.today()
    return run_check(args.file, today)


if __name__ == "__main__":
    raise SystemExit(main())
