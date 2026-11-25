"""The one place pyarrow is imported.

pyarrow publishes no type information, so everything it returns is untyped.
This module turns declared schemas into Arrow schemas, builds tables from plain
Python columns, and reads and writes Parquet with fixed settings, behind
functions with typed signatures. Nothing else in the Forge imports pyarrow.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any, Final

import pyarrow as pa
import pyarrow.parquet as pq

from forge.pipeline.schema import ColumnType, TableSchema

# Writer settings are part of the output's identity: changing one changes every
# table's bytes. Row groups of 64k rows keep a reader's range requests small.
ROW_GROUP_SIZE: Final = 65_536
COMPRESSION: Final = "zstd"
COMPRESSION_LEVEL: Final = 9

_EVIDENCE: Final = pa.struct([("code", pa.string()), ("source", pa.string())])
_PROPERTY: Final = pa.struct([("key", pa.string()), ("value", pa.string())])
_TYPES: Final[Mapping[ColumnType, object]] = {
    "string": pa.string(),
    "int8": pa.int8(),
    "int32": pa.int32(),
    "int64": pa.int64(),
    "bool": pa.bool_(),
    # Parquet's standard list layout names the item "element"; declaring it so
    # makes a table read back from Parquet equal to the one written.
    "list<string>": pa.list_(pa.field("element", pa.string())),
    "list<evidence>": pa.list_(pa.field("element", _EVIDENCE)),
    "list<property>": pa.list_(pa.field("element", _PROPERTY)),
}


class Table:
    """A pyarrow table that has been checked against its declared schema."""

    __slots__ = ("_raw", "schema")

    def __init__(self, raw: Any, schema: TableSchema) -> None:  # noqa: ANN401
        self._raw = raw
        self.schema = schema

    @property
    def raw(self) -> Any:  # noqa: ANN401
        """The underlying pyarrow table, for code that hands it to another Arrow reader."""
        return self._raw

    @property
    def num_rows(self) -> int:
        return int(self._raw.num_rows)

    def column(self, name: str) -> list[object]:
        if name not in self.schema.column_names:
            raise KeyError(f"{self.schema.name} has no column {name!r}")
        return list(self._raw.column(name).to_pylist())

    def null_count(self, name: str) -> int:
        return int(self._raw.column(name).null_count)


def arrow_schema(schema: TableSchema) -> object:
    fields = [
        pa.field(
            c.name,
            _TYPES[c.type],
            nullable=c.nullable,
            metadata={"description": c.description, "kind": c.kind},
        )
        for c in schema.columns
    ]
    return pa.schema(
        fields,
        metadata={
            "table": schema.name,
            "description": schema.description,
            "sources": ",".join(schema.sources),
            "key": ",".join(schema.key),
        },
    )


def build_table(
    schema: TableSchema, columns: Mapping[str, Sequence[object]], *, sort: bool = True
) -> Table:
    """Build a table from plain Python columns, sorted by the schema's key unless `sort` is off.

    Raises ValueError if a column is missing, extra, the wrong length, or holds
    a null where the schema forbids one.
    """
    missing = [n for n in schema.column_names if n not in columns]
    extra = sorted(set(columns) - set(schema.column_names))
    if missing or extra:
        raise ValueError(f"{schema.name}: missing columns {missing}, unexpected columns {extra}")
    lengths = {len(columns[n]) for n in schema.column_names}
    if len(lengths) > 1:
        raise ValueError(f"{schema.name}: columns have different lengths {sorted(lengths)}")
    target = arrow_schema(schema)
    arrays = [
        pa.array(columns[c.name], type=_TYPES[c.type], from_pandas=False) for c in schema.columns
    ]
    for column, array in zip(schema.columns, arrays, strict=True):
        if not column.nullable and array.null_count:
            raise ValueError(
                f"{schema.name}.{column.name}: {array.null_count} null value(s) "
                "in a column that may not be null"
            )
    raw = pa.Table.from_arrays(arrays, schema=target)
    return Table(_sorted(raw, schema) if sort else raw, schema)


def concat(schema: TableSchema, parts: Sequence[Table]) -> Table:
    if not parts:
        return build_table(schema, {name: [] for name in schema.column_names})
    raw = pa.concat_tables([p.raw for p in parts])
    return Table(_sorted(raw, schema), schema)


def _sorted(raw: Any, schema: TableSchema) -> Any:  # noqa: ANN401
    if raw.num_rows == 0:
        return raw
    keys = [(k, "ascending") for k in schema.key]
    return raw.sort_by(keys).combine_chunks()


def encode_parquet(table: Table) -> bytes:
    """The table's Parquet bytes. Same rows and schema in, same bytes out."""
    sink = pa.BufferOutputStream()
    pq.write_table(
        table.raw,
        sink,
        row_group_size=ROW_GROUP_SIZE,
        compression=COMPRESSION,
        compression_level=COMPRESSION_LEVEL,
        use_dictionary=True,
        write_statistics=True,
        data_page_version="2.0",
        version="2.6",
        store_schema=True,
    )
    return bytes(sink.getvalue().to_pybytes())


def decode_parquet(data: bytes, schema: TableSchema) -> Table:
    """Read Parquet bytes, refusing a file whose schema differs from the declaration."""
    raw = pq.read_table(pa.BufferReader(data))
    expected = arrow_schema(schema)
    if not raw.schema.equals(expected, check_metadata=True):
        raise ValueError(f"{schema.name}: the Parquet schema differs from the declaration")
    return Table(raw.combine_chunks(), schema)


def read_parquet(path: Path, schema: TableSchema) -> Table:
    return decode_parquet(path.read_bytes(), schema)
