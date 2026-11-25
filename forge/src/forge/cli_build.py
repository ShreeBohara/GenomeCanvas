"""`python -m forge build`: run every stage and write the table release."""

from __future__ import annotations

import resource
import sys
from datetime import date
from pathlib import Path

from forge.ledger import DEFAULT_LEDGER, parse_ledger, read_ledger
from forge.pipeline.fetch import fetch_pinned
from forge.pipeline.lock import LockError, Profile, read_lock
from forge.pipeline.manifest import (
    build_release_files,
    release_name,
    write_check_report_only,
    write_release,
)
from forge.pipeline.offline import forbid_network
from forge.pipeline.runner import BuildError, run_build
from forge.stages import STAGES


def _peak_memory_mb() -> float:
    peak = resource.getrusage(resource.RUSAGE_SELF).ru_maxrss
    # Linux reports kilobytes, macOS bytes.
    return peak / (1 << 20) if sys.platform == "darwin" else peak / 1024


def build(profile: Profile, out: Path, cache: Path, today: date) -> int:
    if profile == "sample":
        forbid_network()
    try:
        result = run_build(
            STAGES,
            lock=read_lock(),
            ledger=parse_ledger(read_ledger(DEFAULT_LEDGER)),
            profile=profile,
            today=today,
            cache_root=cache,
            fetch=None if profile == "sample" else fetch_pinned,
            log=print,
        )
    except (BuildError, LockError) as error:
        print(f"build stopped before any stage ran: {error}", file=sys.stderr)
        for problem in getattr(error, "problems", ()):
            print(f"  - {problem}", file=sys.stderr)
        return 1

    for stage in result.stages:
        print(f"stage {stage.name}: {'cached' if stage.cached else 'ran'} in {stage.seconds} s")
    passed = sum(c.passed for c in result.checks)
    print(f"checks: {passed} passed, {len(result.checks) - passed} failed")
    for check in result.checks:
        if not check.passed:
            print(
                f"  FAILED ({check.severity}) {check.name}: {check.detail} {list(check.examples)}"
            )
    if result.failed_errors or len(result.stages) < len(STAGES):
        report = write_check_report_only(result, out)
        print(f"build failed; check report written to {report}", file=sys.stderr)
        return 1

    files = build_release_files(result)
    write_release(files, out)
    print(f"release {release_name(profile)} written to {out}")
    for name in sorted(result.tables):
        table = result.tables[name]
        print(f"  table {name}: {table.num_rows} rows")
    for name, data in sorted(files.items()):
        print(f"  {len(data):>10} bytes  {name}")
    print(f"peak memory {_peak_memory_mb():.0f} MB")
    return 0
