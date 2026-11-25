# Work order 2A: the Forge's frame, the data model, identity, and UniProt

**Phase 2, step A of five.** Phase 1 left a tested skeleton that draws 54 hand-placed sample proteins. Phase 2 replaces the sample with the real human proteome. This step builds the pipeline's frame and brings in the first and central source. Later steps add structures (2B), the knowledge graph (2C), embeddings and layouts (2D), and assemble and publish the release (2E).

## Goal

A pipeline that turns a pinned UniProt download into validated, documented Parquet tables for **every reviewed human protein**, reproducibly, with every source's licence read and recorded before its data is used. The frame built here is what every later source plugs into, so it should be small, typed and hard to misuse.

## Read first

1. `CLAUDE.md`. Rule 6 (data honesty) is the one this phase lives by.
2. `docs/build/STATUS.md` and the three reports in `docs/build/reports/`.
3. In `Documents/genomecanvas-2.0-plan.md`: sections 4.1, 4.4, 4.10, and Phase 2 in section 5.
4. Decision records 5, 8 and 10, and `docs/licensing.md`.
5. What exists in `forge/`: the licence ledger, the release naming rule, the points format, the skeleton command.

## Decisions already made for this step

- **No orchestration framework yet.** The plan named Dagster and said to revisit. At about ten sources refreshed four times a year, plain typed stages with a content-addressed cache do the job with far less machinery. Amend decision record 8 to say so, with the conditions that would justify adopting an orchestrator later (for example more than about thirty stages, scheduled or partitioned runs, or a team).
- **Parquet for tables, DuckDB or Polars for transforms, Pandera or plain checks for validation.** Choose between the alternatives by trying them on the real data, and record why.
- **This step does not touch the app.** `apps/` and `packages/` stay as they are, apart from shared test vectors if you need them. The atlas moves to real data in step 2E.

## What to build

### A. The frame

1. **Stages.** A stage is a function with a name, a version, declared inputs (other stages or pinned downloads) and declared outputs (tables or files). A small runner works out the order, computes a cache key from the stage's version, its parameters and the content hashes of its inputs, and skips a stage whose outputs are already in the cache. No network inside a stage unless it is a download stage.
2. **Pinned downloads.** Every upstream file is named in a lock file committed to the repository: its URL, the release it belongs to, its size and its SHA-256. A build uses exactly what the lock names and fails if the bytes differ. Refreshing the lock is a separate, explicit command. Downloads are kept in an ignored cache folder and are never re-fetched when the hash matches.
3. **Profiles.** `sample` builds from a small snapshot committed to the repository and never touches the network; it is what CI runs on every push. `full` builds every reviewed human protein from the pinned download.
4. **The ledger rule from the plan.** A stage declares which sources it reads. The build fails if any of them has no verified row in `forge/sources.yaml` or is not marked in use. Test that it fails.
5. **Data checks as code,** next to the table they guard. Each has a name, a sentence saying what it protects against, and a severity. A failed check stops the build and is listed in the release.
6. **Determinism.** The same inputs give byte-identical outputs: sorted rows, fixed writer settings, no timestamps inside artifacts. A test proves it for the `sample` profile.
7. **A manifest for table releases** that records, for each table, its path, size, hash, row count and schema fingerprint; for each source, its version, licence and input hashes; the check results; and the profile. Keep it compatible in spirit with the sample manifest from Phase 1, and write it to a different release name so the app is unaffected.
8. One command: `python -m forge build --profile sample|full --out <folder>`.

### B. UniProt

1. **Read the licence first.** Open UniProt's licence page, record what it says in the ledger with the URL and today's date, and only then mark the source in use. Do the same for any second source you bring in (see C). If a licence is not what the plan assumed, stop using that source and say so in the report.
2. **One pinned bulk artifact,** not thousands of API calls. Measure the options (the reviewed human set as a compressed stream from the REST API, or the taxonomic-division file from the FTP site) and choose. Record the UniProt release it came from; the plan was written against 2026_04, which had 20,429 reviewed human proteins.
3. **Tables.** At least: proteins (one row each: accession, entry name, protein name, primary gene symbol, length, mass, annotation score, protein existence level); sequences; gene names and synonyms; cross-references (Ensembl, HGNC, AlphaFold DB, PDB, Reactome, ChEMBL and Open Targets where present); features with positions (domains, regions, sites, modified residues, signal and transmembrane segments, natural variants); GO annotations; comments (function, subcellular location, disease involvement); keywords. Keep UniProt's evidence codes on every row that carries them.
4. **Evidence kinds.** Plan section 4.10 defines four kinds: measured, curated, predicted, generated. Propose a mapping from UniProt's evidence codes to those kinds, apply it as a column, and write the mapping table into the data dictionary with a clear note that it needs review by a biologist. Do not present the mapping as settled.
5. **Nothing is dropped silently.** A protein with no gene symbol, no Ensembl identifier or an unusual sequence stays in, with the gap recorded.

### C. Identity

One crosswalk table from UniProt accession to Ensembl gene, HGNC identifier and approved symbol, built from UniProt's own cross-references and, if it adds coverage, HGNC's published table (read and record its licence first). Each row says whether the mapping is unique, ambiguous or missing, and why. Report the counts.

### D. The sample profile

About 200 accessions chosen to include the awkward cases: the longest protein (titin), BRCA2 and another protein over 2,700 residues, the shortest proteins, a selenoprotein, a protein with no gene symbol if one exists, several with many isoforms, and the 54 from version 1. Commit the list and a compressed snapshot of exactly those entries, small enough to live in git (aim for under 3 MB), with UniProt's attribution beside it.

### E. Documents and CI

1. A data dictionary generated from the schemas (table, column, type, description, kind, source), with a test that fails when it is out of date.
2. CI runs the `sample` profile on every push, with the network disallowed in the tests.
3. A manually triggered workflow that runs the `full` profile on a GitHub runner, uploads the tables and the check report as an artifact, and prints how long it took. Run it once.
4. Update the README, the Commands section of `CLAUDE.md`, the repository map, decision record 8 and `docs/licensing.md`.

## Constraints

- **Downloads in this step: UniProt and, if used, HGNC only, and under 300 MB in total.** Nothing from AlphaFold DB, Open Targets or any other source yet. The owner has not yet agreed to the large downloads of later steps.
- No GPU, no model inference.
- Unit tests never touch the network.
- Never fabricate a value and never fill a gap with a guess. If a field cannot be parsed, record it as missing with the reason and count it in the report.

## Not in scope

Structures, the knowledge graph, embeddings, layouts, publishing to any outside service, the Python package for users, and any change to the app.

## Done when

Give the command and the last lines of its output for each.

1. In a fresh clone: install, then `corepack pnpm check:all`, exit 0, with the `sample` profile built and tested offline as part of it.
2. Two `sample` builds are byte-identical (show the hashes).
3. A `full` build on this machine: the number of proteins, which must equal the count UniProt reports for the pinned release; the wall time and peak memory; the size and row count of every table; every check passing.
4. The ledger: UniProt (and HGNC if used) verified with the URL, date and licence; the rule that a stage's sources must be verified is implemented and seen to fail.
5. At least 20 data checks, listed with their results on the `full` build. Three mutations of the **input data** (not the code), each caught by the check written for it, then restored.
6. The crosswalk's counts of unique, ambiguous and missing mappings, with three examples of each kind that exists.
7. The evidence-kind mapping, documented and marked as needing expert review.
8. The data dictionary exists and its freshness test passes.
9. The manual `full` workflow ran green on GitHub. Give its run ID and duration.
10. Decision record 8 is amended; the README and Commands are updated.
11. The tree is clean, the commits are small, and CI is green for your last pushed commit. Give its run ID.

## How to work

Decide and document; do not stop to ask. Where the plan's assumption about the data turns out wrong (a count, a field, a licence), the data wins: say what you found. If something needs the owner, mark that one item blocked, write the exact commands, and finish the rest.

## Report

Write `docs/build/reports/phase-2a.md` in the same format as the earlier reports, commit it, push, and reply with the same text. The first line is `STATUS: DONE`, `STATUS: PARTIAL` or `STATUS: BLOCKED`. Include a short section, "What the data taught us", for anything about UniProt's real contents that later steps should know.
