"""Stages and data checks: the two things a source plugs into the Forge.

A stage is a function with a name, a version, the sources it reads (ids in the
licence ledger), the pinned artifacts and earlier tables it takes, and the
tables it makes. It receives everything through `StageInputs` and returns
tables; it never opens the network or the cache itself.

A check guards one table. It has a name, one sentence saying what it protects
against, and a severity. An `error` that fails stops the build; a `warning`
is recorded in the release and the build goes on.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

from forge.pipeline.arrow import Table
from forge.pipeline.lock import Profile, Variant
from forge.pipeline.schema import TableSchema

Severity = Literal["error", "warning"]


@dataclass(frozen=True, slots=True)
class StageInputs:
    profile: Profile
    artifacts: Mapping[str, Path]
    variants: Mapping[str, Variant]
    tables: Mapping[str, Table]
    params: Mapping[str, str | int]

    def artifact(self, artifact_id: str) -> Path:
        return self.artifacts[artifact_id]

    def table(self, name: str) -> Table:
        return self.tables[name]


@dataclass(frozen=True, slots=True)
class StageOutput:
    tables: Mapping[str, Table]
    # Plain facts about the run worth keeping in the release, for example how
    # many comments of each type were left for a later step.
    report: Mapping[str, object] = field(default_factory=dict)


@dataclass(frozen=True, slots=True)
class CheckOutcome:
    passed: bool
    detail: str
    examples: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class CheckContext:
    """What a check may look at: every table built so far, and the lock's variants."""

    tables: Mapping[str, Table]
    variants: Mapping[str, Variant]

    def table(self, name: str) -> Table:
        return self.tables[name]


@dataclass(frozen=True, slots=True)
class Check:
    name: str
    table: str
    protects: str
    severity: Severity
    run: Callable[[CheckContext], CheckOutcome]


@dataclass(frozen=True, slots=True)
class Stage:
    name: str
    version: int
    sources: tuple[str, ...]
    artifacts: tuple[str, ...]
    inputs: tuple[str, ...]
    outputs: tuple[TableSchema, ...]
    run: Callable[[StageInputs], StageOutput]
    checks: tuple[Check, ...] = ()
    params: Mapping[str, str | int] = field(default_factory=dict)

    @property
    def output_names(self) -> tuple[str, ...]:
        return tuple(o.name for o in self.outputs)


def failing(detail: str, examples: Sequence[object] = (), limit: int = 5) -> CheckOutcome:
    return CheckOutcome(False, detail, tuple(str(e) for e in list(examples)[:limit]))


def passing(detail: str) -> CheckOutcome:
    return CheckOutcome(True, detail)
