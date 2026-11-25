# 8. The pipeline: Python, Dagster in CI, DuckDB, Polars, Pandera

Status: Accepted, 2026-11-25. The orchestrator choice is to be revisited after a
month of use.

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
