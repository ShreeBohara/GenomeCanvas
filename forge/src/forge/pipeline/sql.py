"""Run DuckDB SQL over the Forge's tables, in memory.

DuckDB was chosen over Polars after trying both on the full UniProt tables
(decision record 8): the same results in under a second each, a fifth of the
peak memory, and the same SQL that DuckDB-WASM runs in the browser. Tables are
handed to DuckDB as Arrow without copying. A connection never reads or writes
files and never touches the network: external access is switched off.
"""

from __future__ import annotations

from collections.abc import Mapping, Sequence

import duckdb

from forge.pipeline.arrow import Table


def _connect(tables: Mapping[str, Table]) -> duckdb.DuckDBPyConnection:
    connection = duckdb.connect(":memory:", config={"enable_external_access": False, "threads": 1})
    for name, table in tables.items():
        connection.register(name, table.raw)
    return connection


def rows(
    tables: Mapping[str, Table], sql: str, parameters: Sequence[object] = ()
) -> list[tuple[object, ...]]:
    """The query's rows as tuples."""
    with _connect(tables) as connection:
        return [tuple(r) for r in connection.execute(sql, list(parameters)).fetchall()]


def scalar(tables: Mapping[str, Table], sql: str, parameters: Sequence[object] = ()) -> object:
    result = rows(tables, sql, parameters)
    if len(result) != 1 or len(result[0]) != 1:
        raise ValueError(f"expected one value, got {len(result)} row(s)")
    return result[0][0]


def count(tables: Mapping[str, Table], sql: str, parameters: Sequence[object] = ()) -> int:
    value = scalar(tables, sql, parameters)
    if not isinstance(value, int):
        raise TypeError(f"expected a count, got {value!r}")
    return value
