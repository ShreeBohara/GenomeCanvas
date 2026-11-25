"""The Forge's command line.

    python -m forge build --profile sample|full --out <folder>
    python -m forge lock verify
    python -m forge lock refresh uniprot|hgnc
    python -m forge sample select
    python -m forge sample cut
    python -m forge dictionary [--check]

`build` is the pipeline. The sample profile reads only files committed to the
repository and cannot open a network connection. The full profile downloads
what the lock names, once, into `build/forge-cache/downloads/`.
"""

from __future__ import annotations

import argparse
import sys
import time
from collections.abc import Sequence
from datetime import date
from pathlib import Path
from typing import Final

from forge import cli_build, cli_lock, cli_sample, dictionary
from forge.pipeline.lock import FORGE_ROOT

REPOSITORY: Final = FORGE_ROOT.parent
DEFAULT_CACHE: Final = REPOSITORY / "build" / "forge-cache"


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m forge", description=__doc__.split("\n\n")[0])
    commands = parser.add_subparsers(dest="command", required=True)

    build = commands.add_parser("build", help="run the pipeline and write a table release")
    build.add_argument("--profile", choices=("sample", "full"), required=True)
    build.add_argument("--out", type=Path, required=True, help="folder to write the release into")
    build.add_argument("--cache", type=Path, default=DEFAULT_CACHE, help="download and stage cache")
    build.add_argument(
        "--today", type=date.fromisoformat, default=None, help="date for the ledger check"
    )

    lock = commands.add_parser("lock", help="check or refresh the pinned downloads")
    lock_commands = lock.add_subparsers(dest="lock_command", required=True)
    lock_commands.add_parser("verify", help="check the committed sample snapshots against the lock")
    refresh = lock_commands.add_parser(
        "refresh", help="pin the current upstream files (uses the network)"
    )
    refresh.add_argument("source", choices=cli_lock.REFRESHERS)
    refresh.add_argument("--cache", type=Path, default=DEFAULT_CACHE)

    sample = commands.add_parser("sample", help="choose the sample proteins and cut the snapshots")
    sample_commands = sample.add_subparsers(dest="sample_command", required=True)
    select = sample_commands.add_parser(
        "select", help="rewrite the sample accession list from a full build"
    )
    select.add_argument("--release", type=Path, required=True, help="a full table release folder")
    cut = sample_commands.add_parser("cut", help="cut the snapshots from the cached full downloads")
    cut.add_argument("--cache", type=Path, default=DEFAULT_CACHE)

    docs = commands.add_parser("dictionary", help="write the data dictionary from the schemas")
    docs.add_argument(
        "--check", action="store_true", help="fail if the committed dictionary is stale"
    )

    args = parser.parse_args(argv)
    started = time.monotonic()
    if args.command == "build":
        today: date = args.today if args.today is not None else date.today()
        code = cli_build.build(args.profile, args.out, args.cache, today)
        print(f"wall time {time.monotonic() - started:.1f} s")
        return code
    if args.command == "lock":
        if args.lock_command == "verify":
            return cli_lock.verify()
        return cli_lock.refresh(args.source, args.cache)
    if args.command == "sample":
        if args.sample_command == "select":
            return cli_sample.select(args.release)
        return cli_sample.cut(args.cache)
    return dictionary.main(check=args.check)


if __name__ == "__main__":
    sys.exit(main())
