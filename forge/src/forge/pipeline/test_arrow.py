from __future__ import annotations

import pytest

from forge.pipeline.arrow import build_table, concat, decode_parquet, encode_parquet
from forge.pipeline.schema import Column, TableSchema, validate_schema

SCHEMA = TableSchema(
    name="things",
    description="Test rows.",
    sources=("test",),
    key=("id",),
    columns=(
        Column("id", "string", "Identifier.", "identifier"),
        Column("size", "int32", "A size.", "curated", nullable=True),
        Column("tags", "list<string>", "Tags.", "curated"),
        Column("evidence", "list<evidence>", "Evidence.", "curated"),
    ),
)
ROWS: dict[str, list[object]] = {
    "id": ["b", "a", "c"],
    "size": [2, None, 3],
    "tags": [["x"], [], ["y", "z"]],
    "evidence": [[{"code": "ECO:0000269", "source": "PubMed:1"}], [], []],
}


def test_rows_are_sorted_by_the_key() -> None:
    assert build_table(SCHEMA, ROWS).column("id") == ["a", "b", "c"]


def test_a_null_in_a_required_column_is_refused() -> None:
    with pytest.raises(ValueError, match=r"things\.id: 1 null value"):
        build_table(SCHEMA, {**ROWS, "id": ["a", None, "c"]})


def test_missing_or_extra_columns_are_refused() -> None:
    with pytest.raises(ValueError, match="missing columns"):
        build_table(SCHEMA, {k: v for k, v in ROWS.items() if k != "tags"})


def test_parquet_is_byte_identical_whatever_the_input_order() -> None:
    reordered = {k: list(reversed(v)) for k, v in ROWS.items()}
    assert encode_parquet(build_table(SCHEMA, ROWS)) == encode_parquet(
        build_table(SCHEMA, reordered)
    )


def test_concatenated_parts_equal_one_table() -> None:
    whole = build_table(SCHEMA, ROWS)
    first = build_table(SCHEMA, {k: v[:1] for k, v in ROWS.items()}, sort=False)
    rest = build_table(SCHEMA, {k: v[1:] for k, v in ROWS.items()}, sort=False)
    assert encode_parquet(concat(SCHEMA, [first, rest])) == encode_parquet(whole)


def test_round_trip_keeps_values_and_descriptions() -> None:
    data = encode_parquet(build_table(SCHEMA, ROWS))
    back = decode_parquet(data, SCHEMA)
    assert back.column("evidence")[1] == [{"code": "ECO:0000269", "source": "PubMed:1"}]
    # Descriptions travel inside the file: reading with another one is refused.
    reworded = TableSchema(
        name="things",
        description="Test rows.",
        sources=("test",),
        key=("id",),
        columns=(Column("id", "string", "Another description.", "identifier"), *SCHEMA.columns[1:]),
    )
    with pytest.raises(ValueError, match="differs from the declaration"):
        decode_parquet(data, reworded)


def test_reading_with_a_different_declaration_fails() -> None:
    data = encode_parquet(build_table(SCHEMA, ROWS))
    other = TableSchema(
        name="things",
        description="Test rows.",
        sources=("test",),
        key=("id",),
        columns=(
            *SCHEMA.columns[:1],
            Column("size", "int64", "A size.", "curated", nullable=True),
            *SCHEMA.columns[2:],
        ),
    )
    with pytest.raises(ValueError, match="differs from the declaration"):
        decode_parquet(data, other)


def test_declarations_are_checked() -> None:
    bad = TableSchema(
        "bad", "d", (), ("missing",), (Column("x", "string", "", "curated", nullable=True),)
    )
    problems = validate_schema(bad)
    assert "bad: key column 'missing' is not declared" in problems
    assert "bad.x: no description" in problems
