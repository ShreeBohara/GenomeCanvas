STATUS: DONE
Exit criteria: 9 of 9 passed (criterion 8 has one self-referential match, explained below)
Commits: cfac88b..3dcdbef on v2, then this report's commit. Nothing pushed.

## Exit criteria

All "fresh clone" runs used `git clone --branch v2 <this repository> <scratch>/clone` at `3dcdbef`, with `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`, on Node 20.19.0, corepack 0.31.0, uv 0.11.29.

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Fresh clone: install and `check` exit 0 | Pass | `corepack pnpm install --frozen-lockfile` → `Done in 802ms using pnpm v10.34.9`, exit 0. `corepack pnpm check` → lint `Checked 10 files … No fixes applied.`, format `Checked 10 files … No fixes applied.`, typecheck clean, `Tests  46 passed (46)`, `tsc -p tsconfig.build.json` clean; exit 0. `git status` in the clone stays clean afterwards. |
| 2 | Fresh clone: `uv sync --frozen`, Python checks, ledger check exit 0 | Pass | `uv sync --frozen` exit 0. `corepack pnpm check:py` exit 0: `All checks passed!`, `4 files already formatted`, `Success: no issues found in 3 source files`, `29 passed in 0.15s`. `uv run --frozen python -m forge.ledger check` exit 0, last line `15 sources, 4 verified, checked against 2026-11-25.` |
| 3 | One test per language seen red, then green | Pass | **TypeScript:** changed `[OPQ]` to `[OP]` in the accession pattern in `ids.ts`. `vitest run` exit 1: `× accepts Q13315 (ATM, starting with Q)`, `Tests  1 failed \| 45 passed (46)`. Restored with `git checkout`: exit 0, `Tests  46 passed (46)`. **Python:** changed `age > MAX_CHECK_AGE_DAYS` to `age > MAX_CHECK_AGE_DAYS + 1` in `ledger.py`. `pytest -q` exit 1: `FAILED src/forge/test_ledger.py::test_a_verified_check_older_than_the_limit_fails`, `1 failed, 28 passed`. Restored: exit 0, `29 passed`. |
| 4 | `actionlint` reports nothing | Pass | `actionlint .github/workflows/*.yml` prints nothing, exit 0 (shellcheck installed and used). Seen red on a scratch copy with `contents: reed` and `github.reff`: two errors, exit 1. |
| 5 | Nothing under `frontend/`, `backend/`; fixtures present; protected paths untouched | Pass | `git ls-files frontend backend \| wc -l` → `0`. `git ls-files forge/fixtures/v1` → `README.md`, `protein_structure_assets.json`, `proteins.json` (SHA-256 identical to `v1.0.0`). `git diff --name-status fc43c72 HEAD -- Documents reports research_notes RESUME_DOSSIER.md docs/build \| wc -l` → `0` (before this report was added). `main`, `legacy` and `v1.0.0` all still at `33b521e`. |
| 6 | Eleven ADRs, each with a rejected alternative | Pass | `ls docs/adr/0*.md \| wc -l` → `11`. Rejected alternatives per record: 2, 3, 3, 3, 3, 3, 2, 3, 3, 4, 5. Longest record 35 lines. |
| 7 | Clean, small commits on `v2`, nothing pushed | Pass | `git status --short` prints nothing; branch `v2`; 16 commits from `cfac88b` to `3dcdbef`, one concern each; `v2` has no upstream and `git ls-remote --heads origin v2` returns nothing. |
| 8 | Secret pattern grep finds nothing | Pass, with one explained match | The command as written finds one line: `docs/build/briefs/phase-1a.md:98`, the work order quoting the pattern itself. This report avoids repeating it. `git grep -n -I -E "<same pattern>" -- . ':!docs/build'` finds nothing, exit 1. No secret exists in the repository. |
| 9 | SHA-256 of `LICENSE` recorded | Pass | `shasum -a 256 LICENSE` → `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`. Fetched with `curl -sSfL https://www.apache.org/licenses/LICENSE-2.0.txt`; 202 lines, ASCII. |

## What was built

**A. Version 1 removed.** `backend/app/data/protein_structure_assets.json` and `proteins.json` copied byte for byte to `forge/fixtures/v1/` with a README. I counted the traces before writing it: 52 have `structure_source: alphafold`; `P51587` (BRCA2) and `Q13315` (ATM) are `procedural` after an AlphaFold 404. Then one `git rm` commit for `frontend/`, `backend/`, `vercel.json`, `render.yaml`, the root `package.json` and `package-lock.json`, and `.env.example`. The ignored `node_modules/`, `.venv/` and leftover `frontend/` and `backend/` folders were deleted from disk.

**B. TypeScript workspace.** `packageManager` pinned with corepack's sha512 hash, `pnpm-workspace.yaml` (`apps/*`, `packages/*`), `.node-version`, `engines`. `tsconfig.base.json` adds the four flags the order asks for, plus `noImplicitOverride`, `noImplicitReturns` and `noFallthroughCasesInSwitch`. Biome lint and format (`noExplicitAny`, `noNonNullAssertion` and `noDefaultExport` are errors; I saw all three fire on a probe file). `packages/protocol` (`@genomecanvas/protocol`) has 85 lines of source: branded `UniProtAccession` and `EntityId`, `isUniProtAccession` (UniProt's pattern, checked against `rest.uniprot.org/help/accession_numbers`, last modified 2026-06-12), `parseEntityId` (returns a result with an error code; no trimming, no case folding), and `entityKind`. 46 tests cover empty strings, surrounding whitespace, wrong case in accessions and prefixes, the English-word gene symbols `CAT` and `SET`, `describe`, the unknown prefixes `trial:` and `gene:`, malformed GO IDs and too-long input. One more test proves with `@ts-expect-error` that a plain string is not an `EntityId`. Root scripts are `lint`, `format`, `format:check`, `typecheck`, `test`, `build` and `check`.

**C. Python project.** `forge/` is a uv project (`uv_build`, `uv.lock`, `.python-version` 3.12, `requires-python >=3.12`) with ruff (a wide rule set including `BLE` against blind excepts and `ANN` for annotations), mypy `--strict` and pytest. `forge/sources.yaml` has 15 rows. Four are verified (AlphaMissense, Open Targets, ESM, Human Protein Atlas). The other 11 have `licence: null` and `in_use: false`, and every row has `in_use: false` because nothing is used yet. `forge/src/forge/ledger.py` keeps parsing, checking and file reading in separate functions and collects every problem, not just the first. It fails on a missing field, an unknown field, a duplicate `id`, a verified check more than 180 days old or dated in the future, a source in use that is not verified, an unverified row that names a licence, a verified row with empty evidence fields, and wrongly typed values. `python -m forge.ledger check [--file] [--today]` prints a table and exits 0, 1 on a broken ledger, or 2 when the file can't be read. 29 tests. Root scripts are `check:py` and `check:all`.

**D. Documents.** Eleven ADRs plus an index (`docs/adr/README.md`). New `README.md`, `LICENSE` (fetched), `NOTICE`, `docs/licensing.md`, `CONTRIBUTING.md`, `SECURITY.md`, `.editorconfig`, `.gitattributes` (LF normalisation; `.bin`, `.parquet`, `.bcif` and images binary), a rewritten `.gitignore`, the Commands section of `CLAUDE.md` (nothing else in it changed), and an empty `configurations` list in `.claude/launch.json`.

**E. CI.** `ci.yml` runs on pushes to `v2` and `main` and on pull requests. It has a TypeScript job (setup-node from `.node-version`, `corepack pnpm install --frozen-lockfile`, `corepack pnpm check`) and a Python job (setup-uv pinned to uv 0.11.29, `uv sync --locked`, then ruff, ruff format, mypy, pytest and the ledger check). It also sets concurrency cancellation, top-level `contents: read`, `persist-credentials: false`, timeouts, and pins every action to a commit SHA. `codeql.yml` covers `javascript-typescript` and `python` with `build-mode: none`, on push, on pull requests and weekly. `dependabot.yml` covers npm, uv and github-actions weekly, with grouped updates; it validated with `uvx --from check-jsonschema==0.37.1 check-jsonschema --builtin-schema vendor.dependabot` → `ok -- validation done`.

## Choices that differ from the work order, and why

1. **pnpm 10.34.9, not the latest 12.23.0.** Under corepack 0.31, pnpm 12 fails with `Cannot find module …/pnpm/12.23.0/bin/pnpm.cjs` (it ships native binaries). pnpm 11.29.0 needs Node ≥22.13. This machine has Node 20.19. ADR 11 records this.
2. **Vitest 4.1.12, not 5.1.2.** Vitest 5 declares `node: ^22.12.0 || ^24.0.0 || >=26.0.0`.
3. **CI runs Node 24.22.3 (`.node-version`); `engines` allows ≥20.19.0.** Node 26 is the current LTS, but Node 25 stopped distributing corepack (nodejs/node#57617, in `CHANGELOG_V25.md`). Node 24 still bundles it (corepack 0.36.0). The CI path, Node 24 with corepack 0.36, has **not** been run locally.
4. **The ledger module is at `forge/src/forge/ledger.py`, not `forge/ledger.py`.** With `pyproject.toml` in `forge/` and the package named `forge`, `python -m forge.ledger` needs a `forge` package inside the project. The src layout is uv's default. `forge/sources.yaml` is where the order put it.
5. **Ledger schema details.** `checked`, `licence_url` and `attribution` are null on unverified rows, because nothing was checked. `version` may be null where the plan pins none (ClinVar, InterPro, TED, Europe PMC, PubTator3). There is an optional `note` field, which records the licence the plan names without claiming it. Unknown fields are rejected, so a typo cannot hide a field.
6. **Open Targets is marked verified, as the order says.** But Appendix B's table does not list a read of its licence. The evidence is in `research_notes/…/data_sources_and_knowledge_graphs.md` line 58, which quotes `platform-docs.opentargets.org/licence`. I kept it verified on that basis; see item 1 of the verification list below.
7. **`check` runs `format:check`, not `format`.** `format` rewrites files, and a check that edits files would hide problems in CI.
8. **CI uses `uv sync --locked`.** It is stricter than `--frozen` because it also fails when `uv.lock` no longer matches `pyproject.toml`. The exit criterion was run with `--frozen` as written.
9. **Biome checks only code and JSON files.** Biome 2.6 formats Markdown, and my first run wanted to rewrite the research notes. `forge/` is excluded too, since ruff owns it.
10. **Python 3.12, not the 3.13 the plan names.** 3.12.8 is what is installed, and the order allows "3.12 or later".
11. **TypeScript 7.0.2** (the native compiler) is the registry's `latest`, and I pinned it. `tsc` builds and type-checks cleanly with it.
12. **Version 1's `trial:` prefix is not carried forward.** The order lists five kinds, so `trial:` is rejected as an unknown prefix.
13. Also added, beyond the order: an ADR index, and `noDefaultExport` in Biome. The second enforces CLAUDE.md's "named exports".

## Versions pinned

| Name | Version | Where checked (2026-11-25) |
|---|---|---|
| pnpm | 10.34.9 (+sha512 in `packageManager`) | `npm view pnpm dist-tags` (latest 12.23.0, latest-10 10.34.9); ran it under corepack |
| typescript | 7.0.2 | `npm view typescript` (latest) |
| @biomejs/biome | 2.6.9 | `npm view @biomejs/biome` (latest) |
| vitest | 4.1.12 | `npm view vitest dist-tags` (latest 5.1.2, V4 4.1.12) and `engines` |
| Node (CI) | 24.22.3 | `nodejs.org/dist/index.json` (24.22.3 "Krypton" LTS, 2026-11-10) |
| pyyaml | 6.0.4 | PyPI JSON API |
| ruff | 0.17.6 | PyPI |
| mypy | 2.4.1 | PyPI |
| pytest | 9.2.0 | PyPI |
| types-pyyaml | 6.0.12.20261122 | PyPI |
| uv_build | >=0.11.29,<0.12.0 | as `uv init --package` writes it for uv 0.11.29 (PyPI latest is 0.13.10) |
| uv (CI) | 0.11.29 | matches local; PyPI latest is 0.13.10 |
| actions/checkout | v7.0.1 `3d3c42e5aac5ba805825da76410c181273ba90b1` | `gh api repos/actions/checkout/releases/latest`, inputs checked against `action.yml` at the SHA |
| actions/setup-node | v7.1.0 `949feb2413d6458794dcd2491c4babbbce0c15c1` | same |
| astral-sh/setup-uv | v10.4.0 `1db35dd8eee11c5894872e0b383ae6c406cf738d` | same |
| github/codeql-action | v4.39.5 `915412ff23e8b7659517e607487dbeae018f2934` | `gh api repos/github/codeql-action/tags` |

## Blocked on the owner

Nothing in this work order is blocked. These are owner actions for later steps, not done here:

- Confirm the licence choice (ADR 10) before anything is pushed.
- Allow `v2` to be pushed so CI, CodeQL and Dependabot can run: `git push -u origin v2`
- Turn on private vulnerability reporting, which `SECURITY.md` relies on: `gh api -X PUT repos/ShreeBohara/GenomeCanvas/private-vulnerability-reporting`
- Optional: put Node 24 on this machine with whatever version manager you use. pnpm and Vitest can then move to their current majors, and local runs will match CI.

## For the orchestrator to verify

1. **The ledger's four verified rows** in `forge/sources.yaml`, especially Open Targets (choice 6), and the attribution texts. They are the only licence claims this step makes. They expire on 2027-05-24, when CI's ledger check will start failing by design.
2. **The CI workflow has never run.** actionlint cannot check the inputs of SHA-pinned actions: an input I misspelled on purpose passed. I checked every input against each action's `action.yml` at the pinned SHA instead. The first push is the real test, above all of corepack on Node 24 and `package-manager-cache: false`.
3. **The strictness of `parseEntityId`**: no trimming, GO IDs exactly seven digits, local IDs limited to `[A-Za-z0-9][A-Za-z0-9_.-]*`, at most 128 characters. Step 1B and Phase 2 will feed it real IDs; widen it there if a real identifier is rejected.

## Ideas outside this order

- Cache the pnpm store and the uv cache in CI once the jobs have run once.
- Add the plan's other ledger rule in Phase 2: CI fails if a source the pipeline reads has no row.
- Add a test in 1B that checks the fixtures' SHA-256 against `forge/fixtures/v1/README.md`, so they cannot drift.
- Add a workflow security linter (for example zizmor) next to actionlint.
- Schedule a reminder before 2027-05-24 to re-read the four verified licences.
