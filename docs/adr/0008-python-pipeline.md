# 8. The pipeline: Python, Dagster in CI, DuckDB, Polars, Pandera

Status: Accepted, 2026-11-25. Amended 2026-11-25 (step 2A): no orchestrator yet,
DuckDB rather than Polars, plain checks rather than Pandera; see the amendment.

## Context

About ten open sources become one versioned, citable dataset four times a year.
The work fits on free GitHub Actions runners (4 CPUs, 16 GB of memory).

## Decision

The Forge is Python. Dagster assets run inside GitHub Actions; DuckDB and Polars
do the transforms; Pandera checks the tables; Foldseek and gemmi handle
structures. Every source is recorded in the licence ledger, `forge/sources.yaml`.

Step 1A sets up `forge/` as a uv project requiring Python 3.12 or later. The plan
names Python 3.13; 3.12 is what this machine has, and nothing yet needs 3.13.

## Alternatives rejected

- **Airflow.** A server to keep running for a quarterly job.
- **Spark and Kafka.** Built for data and streams far larger than this.
- **Plain staged scripts with a content-addressed cache.** A real option, and
  the fallback: orchestrators were not researched, so Dagster is a judgment.
  If it is not earning its weight after a month, switch.

## Consequences

- Asset checks and lineage come with the orchestrator.
- The 4.8 GB AlphaFold archive must be streamed, not unpacked whole.
- Scheduled workflows stop after 60 days without repository activity, so the
  release schedule needs a keep-alive.

## Amendment, 2026-11-25 (step 2A): no orchestrator yet; DuckDB; plain checks

**No orchestration framework for now.** The Forge is plain typed stages run by
a small runner (`forge/src/forge/pipeline/runner.py`, about 400 lines with the
cache; the whole frame, with the lock file, Parquet writer and manifest, is
about 1,300).
A stage declares its name, version, the ledger sources it reads, the pinned
artifacts and tables it takes, the tables it makes and the checks that guard
them. The runner orders stages from what they read, refuses to start if a
source is not verified and in use in the ledger, verifies every input against
the lock file, and reuses a stage's cached outputs when a key over its version,
parameters, the Forge's code and the content hashes of its inputs is unchanged.

At about ten sources refreshed four times a year, run by one person on a
laptop or one GitHub runner, Dagster's server, asset graph UI and scheduling
would be more machinery than pipeline. Step 2A has four stages; the whole
proteome builds in under a minute.

**What would justify an orchestrator later**, any one of:

- more than about thirty stages, or a stage graph nobody can hold in their head;
- scheduled, partitioned or incremental runs (per-protein structure work in
  step 2B is the likeliest trigger: if 20,429 independent units need retries
  and partial reruns, the runner's whole-stage caching stops being enough);
- runs spread over several machines;
- a second regular maintainer who needs to see lineage and run history
  without reading code.

If one of these arrives, Dagster remains the first candidate; the stage
declarations map onto its assets one to one.

**DuckDB, not Polars, for transforms and checks.** Both were tried on the full
UniProt tables (2,122,026 cross-references, 776,920 features) with the same
crosswalk join and three checks. Both gave identical results in under a second.
DuckDB 2.0.1 peaked at 269 MB against Polars 2.2.0's 1,665 MB (eager reads),
its wheel is 17 MB against 43 MB, and its SQL is the same as DuckDB-WASM's in
the browser, so a check written here can be run by a reader against the
released Parquet. Polars' typed API was the main argument for it; the checks
are covered by tests that break the data on purpose instead.

**Parquet through pyarrow**, with fixed writer settings (zstd level 9, 64k-row
groups, data page v2, statistics on, no timestamps), so the same rows give the
same bytes. pyarrow publishes no type information, so it is imported in one
module, `forge.pipeline.arrow`.

**Plain checks, not Pandera.** Each check is a named function with one
sentence saying what it protects against and a severity; most are a few lines
of SQL. Pandera would add pandas and a second way of describing columns, when
the column declarations already drive the Parquet schema and the data
dictionary.

**Parsing is plain Python over a streamed XML file** (UniProt's own format,
read with the standard library), so the parse holds one entry at a time.
