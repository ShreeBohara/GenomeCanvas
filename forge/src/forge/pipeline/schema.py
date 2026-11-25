"""Declared table schemas: every column with its type, meaning and kind.

A stage's output must match its declared schema exactly; the data dictionary
and each Parquet file's own field metadata are generated from these
declarations, so the description a reader sees is the one the code checks.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Final, Literal

# What kind of value a column holds (plan section 4.10). "per row" means the
# kind varies by row and is given in that row's `evidence_kind` column.
# "identifier" names a record; "pipeline" is written by the Forge itself
# (hashes, statuses, reasons) and is not a claim about biology.
Kind = Literal["measured", "curated", "predicted", "generated", "identifier", "per row", "pipeline"]
KINDS: Final[tuple[Kind, ...]] = (
    "measured",
    "curated",
    "predicted",
    "generated",
    "identifier",
    "per row",
    "pipeline",
)

# Column types the Forge writes, by name. Kept to a small closed set so the
# data dictionary, the Parquet schema and the checks agree on every one.
ColumnType = Literal[
    "string",
    "int8",
    "int32",
    "int64",
    "bool",
    "list<string>",
    "list<evidence>",
    "list<property>",
]


@dataclass(frozen=True, slots=True)
class Column:
    name: str
    type: ColumnType
    description: str
    kind: Kind
    nullable: bool = False


@dataclass(frozen=True, slots=True)
class TableSchema:
    name: str
    description: str
    sources: tuple[str, ...]
    # Rows are sorted by these columns, and together they are unique.
    key: tuple[str, ...]
    columns: tuple[Column, ...]

    def column(self, name: str) -> Column:
        for column in self.columns:
            if column.name == name:
                return column
        raise KeyError(f"{self.name} has no column {name!r}")

    @property
    def column_names(self) -> tuple[str, ...]:
        return tuple(c.name for c in self.columns)

    def fingerprint(self) -> str:
        """SHA-256 of what a reader depends on: names, types, nullability and key."""
        document = {
            "columns": [[c.name, c.type, c.nullable] for c in self.columns],
            "key": list(self.key),
            "name": self.name,
        }
        text = json.dumps(document, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(text.encode("utf-8")).hexdigest()


def validate_schema(schema: TableSchema) -> list[str]:
    """Problems with a declaration itself, found before any data is written."""
    problems: list[str] = []
    names = [c.name for c in schema.columns]
    duplicates = sorted({n for n in names if names.count(n) > 1})
    if duplicates:
        problems.append(f"{schema.name}: duplicate column(s) {', '.join(duplicates)}")
    for key in schema.key:
        if key not in names:
            problems.append(f"{schema.name}: key column {key!r} is not declared")
        elif schema.column(key).nullable:
            problems.append(f"{schema.name}: key column {key!r} may not be nullable")
    if not schema.key:
        problems.append(f"{schema.name}: has no key")
    for column in schema.columns:
        if not column.description.strip():
            problems.append(f"{schema.name}.{column.name}: no description")
        if column.kind not in KINDS:
            problems.append(f"{schema.name}.{column.name}: unknown kind {column.kind!r}")
    return problems
