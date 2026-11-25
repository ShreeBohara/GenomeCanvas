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

## Amendment, 2026-11-25 (step 1C): served through the Worker until there is a domain

Release files are read at `/release/<release>/<file>` on the app's own address,
through the Worker, from an R2 binding (`apps/web/worker/release.ts`).

- **Why not straight from R2.** An R2 bucket can be public only on a custom
  domain (production use) or on an `r2.dev` address that Cloudflare rate-limits
  and does not cache. There is no domain yet. The static-asset host is not an
  option either: it answers byte-range requests with the whole file, and the
  Parquet readers of Phase 2 depend on ranges.
- **What the Worker does.** Single byte ranges (`206`, `416`), `ETag` and `304`,
  `Cache-Control` decided by one naming rule shared with the pipeline and the
  upload command (`packages/protocol/src/release-files.ts`): `manifest.json` is
  `no-cache`, a file named `<stem>.<16 hex digits of SHA-256>.<ext>` is
  `public, max-age=31536000, immutable`, and any other name is a `404`. Keys are
  checked on the raw path before anything is decoded.
- **What it costs.** Every release request is a Worker request, counted against
  the free plan's 100,000 a day, and one or two R2 reads (the size and entity
  tag, then the bytes; a `304` or `HEAD` needs one), against R2's free 10 million
  a month. A first visit makes three release requests, so the free Worker plan
  carries about 30,000 first visits a day; browsers keep hashed files for a year
  after that. A Parquet reader making many range requests per query would spend
  this allowance much faster, which is the reason to move.
- **When a domain exists,** serve the bucket on it directly, with the same
  headers stored on each object (the upload command already writes them), and
  keep the Worker route for local development and as a fallback. That removes
  the Worker request per file.
- **Locally,** `corepack pnpm dev` and the preview server read the same route
  from wrangler's local R2, filled by the upload command, so there is one data
  path everywhere.
