# Work order 1A: repository reset, toolchain and CI definition

**Phase 1, step A of three.** Step 1B builds the first running skeleton on what you leave behind. Step 1C adds infrastructure and deployment.

## Goal

Turn branch `v2` into a clean, typed, tested workspace for GenomeCanvas 2.0: version 1's application code removed from the branch (it lives on at tag `v1.0.0`), the TypeScript and Python toolchains in place and proven on one small real module each, the architecture decisions written down, and CI defined. **No product features in this step.**

## Read first

1. `CLAUDE.md` at the repository root. Its rules bind this work.
2. In `Documents/genomecanvas-2.0-plan.md`: "The short version", sections 4.1, 4.2, 4.3, 4.4 (the licence ledger part), 4.9, and Phase 1 in section 5. Do not read the rest; it is 18,000 words.
3. `docs/build/STATUS.md`, for the decisions already taken.

## Starting state

- Branch `v2`, cut from `main`. Version 1 is in `frontend/` (Next.js 14) and `backend/` (FastAPI).
- Installed and usable: Node 20.19, npm 10.8, corepack 0.31 (use pnpm through `corepack pnpm`; do not run `corepack enable`), Python 3.12.8, uv 0.11, actionlint 1.7, Docker, gh.
- Not installed, and not to be installed by you: OpenTofu, pnpm as a global.
- A `.venv/` and `frontend/node_modules/` exist from an earlier local run. Both are ignored by git and can go.

## What to build

### A. Remove version 1 from this branch

1. Copy `backend/app/data/protein_structure_assets.json` and `backend/app/data/proteins.json` to `forge/fixtures/v1/`. Add a `README.md` there saying: these come from tag `v1.0.0`; the backbone traces are real AlphaFold data for 52 of 54 proteins; `proteins.json` is hand-written illustrative data and is **not sourced**; the files exist only to feed the step 1B skeleton and must never be presented to a user as real data.
2. Remove with `git rm`: `frontend/`, `backend/`, `vercel.json`, `render.yaml`, the root `package.json` and `package-lock.json`, `.env.example`. One commit, with a message that says where version 1 can still be found.
3. Leave `Documents/`, `reports/`, `research_notes/`, `RESUME_DOSSIER.md` and `docs/build/` exactly as they are.

### B. TypeScript workspace

1. pnpm workspaces through corepack: a pinned `packageManager` field, `pnpm-workspace.yaml` covering `apps/*` and `packages/*`, a `.node-version` file, an `engines` field.
2. One `tsconfig.base.json`: strict, plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` and `isolatedModules`.
3. **One real package to prove the toolchain: `packages/protocol`, published name `@genomecanvas/protocol`.** It holds entity identifiers, carrying forward version 1's self-describing IDs:
   - branded types for a UniProt accession and for an entity ID (`P38398`, `disease:…`, `drug:…`, `pathway:…`, `go:…`);
   - `parseEntityId`, `isUniProtAccession` (use UniProt's published accession pattern; check it against UniProt's documentation) and `entityKind`;
   - unit tests that include hostile inputs: empty strings, wrong case, surrounding whitespace, a gene symbol that is an English word, an ID with an unknown prefix.
   Keep it under about 150 lines of source. Do not add the command vocabulary yet; that is Phase 5.
4. Lint and format with Biome, tests with Vitest, build with the TypeScript compiler. If Biome turns out to lack something you need, choose otherwise and record why in the tooling decision record.
5. Root scripts, all non-interactive: `lint`, `format`, `typecheck`, `test`, `build`, and `check` (which runs all of them).
6. Do not create empty packages or empty `apps/` folders. Step 1B creates what it needs.

### C. Python project

1. `forge/` as a uv project: `pyproject.toml`, a committed `uv.lock`, Python 3.12 or later, package name `forge`.
2. **One real module to prove the toolchain: the licence ledger from plan section 4.4.**
   - `forge/sources.yaml`: one row per data source with `id`, `name`, `version`, `url`, `licence`, `licence_url`, `checked` (a date), `attribution`, `in_use` and `status` (`verified` or `unverified`).
   - Seed it from the table in plan section 4.4 and the "Measured first-hand" table in Appendix B. Mark a licence `verified` **only** where Appendix B says the licence page or file was read: ESM (MIT), AlphaMissense predictions (CC BY 4.0), Human Protein Atlas (CC BY 4.0 for its own content), Open Targets (CC0 1.0). Everything else is `unverified` with `licence: null`, even where the plan names a licence. Do not look licences up yourself in this step.
   - `forge/ledger.py`: load and validate the file. Fail on a missing field, a duplicate `id`, a `verified` row whose `checked` date is more than 180 days before the date passed in, or any row with `in_use: true` that is not `verified`. Take "today" as a parameter so the tests are deterministic.
   - A small command, `uv run python -m forge.ledger check`, that prints a table and exits non-zero on failure.
   - Tests for each failure mode.
3. ruff for lint and format, a strict type checker (pyright or mypy, your choice, recorded), pytest.
4. Root scripts `check:py` and `check:all`, so one command checks both languages.

### D. Decisions and documents

1. **Eleven architecture decision records** in `docs/adr/`, numbered, each under about 40 lines: context, decision, alternatives rejected and why, consequences, status. Take the content from plan section 4.3 and do not invent new decisions:
   1. Static-first architecture: compute offline, serve files, query in the browser, one small Worker.
   2. React with Vite and TanStack Router on Cloudflare, over Next.js on Vercel. Status: accepted, pending owner confirmation.
   3. three.js on WebGL 2 with instanced geometry; WebGPU deferred until a benchmark earns it.
   4. Mol* from npm, run headless, with MolViewSpec for export.
   5. Reference data as immutable Parquet and binary files on R2; no graph database and no vector database.
   6. A typed command vocabulary and Trails as the core abstraction.
   7. The Guide: TypeScript with the official Anthropic SDK, tools run in the browser, two passes, verification in code.
   8. The pipeline: Python, Dagster assets run in CI, DuckDB and Polars, Pandera. Note that the orchestrator choice is a judgment to revisit after a month.
   9. OpenTofu and GitHub Actions for infrastructure and delivery.
   10. Licensing: Apache-2.0 for code, CC BY 4.0 for the dataset, the share-alike layer separate. Status: accepted, pending owner confirmation before the first push.
   11. Tooling: pnpm workspaces, Biome, Vitest, Playwright, uv, ruff, the type checker you chose, pytest.
2. **`README.md`, rewritten.** What GenomeCanvas is in one paragraph (plan section 3.1). An honest status line: 2.0 is being rebuilt on this branch, version 1 is at tag `v1.0.0`, nothing is deployed. Quickstart with the real commands. A repository map. Links to the plan, the decision records and `docs/build/STATUS.md`. No badges for things that do not exist and no claim that is not yet true.
3. **`LICENSE`**: the Apache-2.0 text, fetched from `https://www.apache.org/licenses/LICENSE-2.0.txt` and not retyped. Record its SHA-256 in your report. **`NOTICE`**: "GenomeCanvas. Copyright 2026 The GenomeCanvas Authors."
4. `docs/licensing.md`: a short page on the intended dataset licence and the separate share-alike layer, pointing at the ledger.
5. Short, real `CONTRIBUTING.md` and `SECURITY.md`. `.editorconfig`. `.gitattributes` (text normalisation; `.bin` and `.parquet` as binary). An updated `.gitignore`.
6. In `CLAUDE.md`, fill in the "Commands" section and nothing else.
7. In `.claude/launch.json`, remove the stale `frontend` entry, leaving an empty configurations list.

### E. CI definition

1. Replace `.github/workflows/ci.yml`: runs on pushes to `v2` and `main` and on pull requests; a Node job (corepack, frozen install, `check`) and a Python job (frozen sync, the Python checks); concurrency cancellation; least-privilege permissions; actions pinned.
2. A CodeQL workflow for TypeScript and Python.
3. `.github/dependabot.yml` for npm, Python and GitHub Actions, weekly.
4. Nothing can be pushed, so none of this will run on GitHub yet. It must pass `actionlint`.

## Not in scope

Any user interface, the rendering engine, the Worker, infrastructure code, the data pipeline beyond the ledger, deployment, and any change to the plan.

## Done when

Give the command and the last lines of its output for each of these in your report.

1. In a **fresh clone** of `v2` made into a temporary directory, `corepack pnpm install --frozen-lockfile` and `corepack pnpm check` both exit 0.
2. In that same fresh clone, `uv sync --frozen` in `forge/` and the Python checks exit 0, and `uv run python -m forge.ledger check` exits 0.
3. One test in each language has been broken on purpose, seen to fail, and restored. Show both the failing and the passing output.
4. `actionlint` reports nothing for every workflow file.
5. `git ls-files` shows nothing under `frontend/` or `backend/`; `forge/fixtures/v1/` holds the two data files; nothing under the protected paths was deleted or modified.
6. Eleven decision records exist and each names at least one rejected alternative.
7. `git status` is clean, everything is committed on `v2` in small commits, and nothing has been pushed.
8. `git grep -n -I -E "(sk-ant-|AKIA|BEGIN (RSA|OPENSSH) PRIVATE KEY)"` finds nothing.
9. The SHA-256 of `LICENSE` is recorded.

## How to work

- Decide and document. Do not stop to ask. If a choice in this order turns out to be wrong, make the better choice and say why in the relevant decision record and in the report.
- Check current versions on the registry before pinning anything.
- If something needs the owner (a credential, an install, a push), mark that one item blocked, write down the exact commands they would run, and finish everything else.

## Report

Write `docs/build/reports/phase-1a.md`, commit it, and reply with the same text:

```
STATUS: DONE | PARTIAL | BLOCKED
Exit criteria: N of 9 passed
Commits: <first sha>..<last sha> on v2

## Exit criteria
| # | Criterion | Result | Evidence |
(the command and the last lines of its output)

## What was built
(by area A–E, a few lines each)

## Choices that differ from the work order, and why

## Versions pinned
(name, version, where you checked it)

## Blocked on the owner
(the exact commands they would run)

## For the orchestrator to verify
(the three things most worth checking by hand)

## Ideas outside this order
(not implemented)
```
