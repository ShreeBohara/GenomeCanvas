# 5. Reference data as immutable files on R2

Status: Accepted, 2026-11-25

## Context

A release holds proteins, backbones, embeddings, a knowledge graph and residue
tracks: about 4–5 GB including a structure mirror (plan section 4.4). It is read
by the browser, by notebooks and by the MCP server.

## Decision

Immutable Parquet and binary files on Cloudflare R2, named by content hash, with
one manifest per release. The graph is stored as compact adjacency files and
traversed in the browser. Search is a lexical index plus a brute-force scan of
quantised vectors in plain JavaScript. No graph database and no vector database.

## Alternatives rejected

- **Neo4j.** The free tier pauses after three idle days and is deleted after
  thirty. **Kùzu** was archived in October 2025. **Apache AGE**: Postgres's graph
  query feature was committed in March 2026 and reverted in September.
- **Postgres with pgvector.** No free tier holds the larger vector sets, and
  scale-to-zero adds delay.
- **Any vector database.** A scan of 20,429 vectors takes a few milliseconds.

## Consequences

- Free, fast, never pauses; fits inside R2's 10 GB free allowance.
- The same Parquet files are queried with the same SQL in the browser (DuckDB-WASM),
  on the command line (DuckDB) and by the MCP server.
- Every change to the data is a new release; nothing is edited in place.
