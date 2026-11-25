"""The walking skeleton's pipeline step: version 1's fixture in, a small release out.

    python -m forge.skeleton build --out <folder>

A release is a folder of data files, each named with a prefix of its own SHA-256,
plus `manifest.json`, the only file with a fixed name. Nothing in it depends on
the clock or on where the command runs, so two builds are byte-identical.

Reading and writing files live in `load_fixture` and `write_release`; everything
between them is computation on values, which is what the tests exercise.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Final

from forge.ids import is_uniprot_accession
from forge.points import FORMAT_NAME as POINTS_FORMAT
from forge.points import Point, encode_points

RELEASE_FORMAT: Final = "release/0"
INDEX_FORMAT: Final = "protein-index/0"
RELEASE_NAME: Final = "sample-v1"
HASH_PREFIX_LENGTH: Final = 16
DEFAULT_FIXTURE: Final = Path(__file__).resolve().parents[2] / "fixtures" / "v1" / "proteins.json"

# Every category the fixture may use, with the words a reader sees. A category
# not listed here is an error: it is never mapped to a default.
CATEGORY_LABELS: Final[Mapping[str, str]] = {
    "dna_repair": "DNA repair",
    "enzyme": "Enzyme",
    "signaling": "Signalling",
    "structural": "Structural",
    "transporter": "Transporter",
}

_DATA_FILE: Final = re.compile(r"\A(?:points|proteins)\.[0-9a-f]{16}\.(?:bin|json)\Z")


class SkeletonValidationError(ValueError):
    """The fixture broke at least one rule. `problems` lists every one, not just the first."""

    def __init__(self, problems: Sequence[str]) -> None:
        self.problems = tuple(problems)
        super().__init__(f"{len(self.problems)} problem(s) in the fixture")


@dataclass(frozen=True, slots=True)
class ProteinRow:
    accession: str
    gene_symbol: str
    name: str
    category: str
    x: float
    y: float


def _number(value: object) -> float | None:
    # bool is an int in Python; a coordinate of `true` is a mistake, not 1.0.
    if isinstance(value, bool) or not isinstance(value, int | float):
        return None
    as_float = float(value)
    return as_float if math.isfinite(as_float) else None


def _text(value: object) -> str | None:
    if not isinstance(value, str) or value.strip() == "" or value != value.strip():
        return None
    return value


def validate_rows(raw: object) -> list[ProteinRow]:
    """Check every row and return them sorted by accession, or raise with every problem."""
    if not isinstance(raw, list):
        raise SkeletonValidationError(["the fixture is not a JSON array of proteins"])
    if len(raw) == 0:
        raise SkeletonValidationError(["the fixture has no proteins"])

    problems: list[str] = []
    rows: list[ProteinRow] = []
    seen: dict[str, int] = {}
    for i, item in enumerate(raw):
        if not isinstance(item, dict):
            problems.append(f"row {i}: not an object")
            continue
        where = f"row {i}"
        accession = item.get("uniprot_id")
        if not isinstance(accession, str) or not is_uniprot_accession(accession):
            problems.append(f"{where}: uniprot_id {accession!r} is not a UniProt accession")
            accession = None
        else:
            where = f"row {i} ({accession})"
            if accession in seen:
                problems.append(f"{where}: duplicate of row {seen[accession]}")
            else:
                seen[accession] = i

        gene_symbol = _text(item.get("gene_name"))
        if gene_symbol is None:
            problems.append(f"{where}: gene_name is missing or blank")
        name = _text(item.get("name"))
        if name is None:
            problems.append(f"{where}: name is missing or blank")
        category = item.get("function_category")
        if not isinstance(category, str) or category not in CATEGORY_LABELS:
            problems.append(f"{where}: function_category {category!r} is not a known category")
            category = None
        x = _number(item.get("umap_x"))
        if x is None:
            problems.append(f"{where}: umap_x {item.get('umap_x')!r} is not a finite number")
        y = _number(item.get("umap_y"))
        if y is None:
            problems.append(f"{where}: umap_y {item.get('umap_y')!r} is not a finite number")

        if (
            accession is not None
            and gene_symbol is not None
            and name is not None
            and category is not None
            and x is not None
            and y is not None
        ):
            rows.append(ProteinRow(accession, gene_symbol, name, category, x, y))

    if problems:
        raise SkeletonValidationError(problems)
    return sorted(rows, key=lambda r: r.accession)


def categories_in_order() -> list[str]:
    return sorted(CATEGORY_LABELS)


def encode_index(rows: Sequence[ProteinRow]) -> bytes:
    document = {
        "format": INDEX_FORMAT,
        "rows": [
            {
                "accession": r.accession,
                "category": r.category,
                "gene_symbol": r.gene_symbol,
                "name": r.name,
            }
            for r in rows
        ],
    }
    return _canonical_json(document, indent=None)


def _canonical_json(document: object, *, indent: int | None) -> bytes:
    separators = (",", ": ") if indent is not None else (",", ":")
    text = json.dumps(
        document, sort_keys=True, ensure_ascii=False, indent=indent, separators=separators
    )
    return (text + "\n").encode("utf-8")


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _hashed_name(stem: str, data: bytes, extension: str) -> str:
    return f"{stem}.{_sha256(data)[:HASH_PREFIX_LENGTH]}.{extension}"


def build_release(
    rows: Sequence[ProteinRow], *, source_file: str, source_bytes: bytes
) -> dict[str, bytes]:
    """Return every file of the release, by file name. `manifest.json` is one of them."""
    order = categories_in_order()
    index_of = {c: i for i, c in enumerate(order)}
    points = encode_points([Point(r.x, r.y, index_of[r.category]) for r in rows])
    index = encode_index(rows)

    files = {
        "points": (_hashed_name("points", points, "bin"), points, POINTS_FORMAT),
        "proteins": (_hashed_name("proteins", index, "json"), index, INDEX_FORMAT),
    }
    manifest = {
        "categories": [{"id": c, "label": CATEGORY_LABELS[c]} for c in order],
        "files": {
            key: {"bytes": len(data), "format": fmt, "path": path, "sha256": _sha256(data)}
            for key, (path, data, fmt) in files.items()
        },
        "format": RELEASE_FORMAT,
        "release": RELEASE_NAME,
        "row_count": len(rows),
        "sample": True,
        "sample_notice": (
            f"Sample data: these {len(rows)} proteins were placed on the map by hand for "
            "GenomeCanvas version 1. Their positions are not computed from any source."
        ),
        "source": {"file": source_file, "sha256": _sha256(source_bytes)},
    }
    out = {path: data for path, data, _ in files.values()}
    out["manifest.json"] = _canonical_json(manifest, indent=2)
    return out


def load_fixture(path: Path) -> tuple[bytes, object]:
    data = path.read_bytes()
    return data, json.loads(data)


def write_release(files: Mapping[str, bytes], out_dir: Path) -> None:
    """Write the release, removing data files an earlier build left behind.

    The manifest is written last, so a reader never finds one that names a file
    not yet on disk.
    """
    out_dir.mkdir(parents=True, exist_ok=True)
    for old in out_dir.iterdir():
        if old.is_file() and (old.name == "manifest.json" or _DATA_FILE.match(old.name)):
            old.unlink()
    for name, data in sorted(files.items()):
        if name != "manifest.json":
            (out_dir / name).write_bytes(data)
    (out_dir / "manifest.json").write_bytes(files["manifest.json"])


def _build(fixture: Path, out_dir: Path) -> int:
    try:
        source_bytes, raw = load_fixture(fixture)
    except (OSError, json.JSONDecodeError) as error:
        print(f"cannot read {fixture}: {error}", file=sys.stderr)
        return 2
    try:
        rows = validate_rows(raw)
    except SkeletonValidationError as error:
        print(f"{fixture}: {error}", file=sys.stderr)
        for problem in error.problems:
            print(f"  {problem}", file=sys.stderr)
        return 1

    files = build_release(rows, source_file=fixture.name, source_bytes=source_bytes)
    write_release(files, out_dir)
    print(f"release {RELEASE_NAME}: {len(rows)} proteins")
    for name, data in sorted(files.items()):
        print(f"  {_sha256(data)}  {len(data):>7} bytes  {name}")
    return 0


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m forge.skeleton")
    commands = parser.add_subparsers(dest="command", required=True)
    build = commands.add_parser("build", help="build the sample release")
    build.add_argument("--fixture", type=Path, default=DEFAULT_FIXTURE)
    build.add_argument("--out", type=Path, required=True)
    args = parser.parse_args(argv)
    return _build(args.fixture, args.out)


if __name__ == "__main__":
    sys.exit(main())
