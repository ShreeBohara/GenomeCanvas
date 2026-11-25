# GenomeCanvas: working agreement for every session

GenomeCanvas 2.0 is being rebuilt from scratch on branch `v2`. Version 1 is frozen at tag `v1.0.0` (branch `legacy`).

The plan is `Documents/genomecanvas-2.0-plan.md`. Read "The short version", then only the sections your work order names. The plan is the specification; where it and a work order disagree, the work order wins and you say so in your report.

## How the build is run

- One orchestrating session plans, writes work orders and verifies. Each build session executes exactly one work order from `docs/build/briefs/`.
- State lives in `docs/build/STATUS.md`. Only the orchestrator edits it.
- A build session finishes by writing `docs/build/reports/<step>.md` and replying with the same text. The first line is `STATUS: DONE`, `STATUS: PARTIAL` or `STATUS: BLOCKED`, followed by one line saying how many exit criteria passed.

## Hard rules

1. **Branch.** Work only on `v2`. Never check out, commit to, merge into, rebase or delete `main`, `legacy` or any tag. Never force anything. The owner has allowed pushing `v2`: push only `v2`, only to `origin`, and only commits that already pass `corepack pnpm check:all` locally. Never push tags or any other branch, and never open, merge or close a pull request; the orchestrator does that.
2. **No accounts, credentials, purchases or deployments.** If a step needs one, write the exact commands into a runbook under `docs/runbooks/` and report that item as blocked. Do the rest.
3. **No `sudo` and no global installs** (`npm i -g`, `brew`, `pipx`), and never pipe an installer from the internet into a shell. If a tool is missing, say so in the report.
4. **Do not delete or rewrite** `Documents/`, `reports/`, `research_notes/`, `RESUME_DOSSIER.md` or `docs/build/`.
5. **Stay inside the work order.** Ideas for anything else go in the report, not in the diff.
6. **Data honesty.** Never fabricate and never substitute silently. A missing value is recorded as missing, with the reason. Version 1 turned two failed downloads into invented structures through a bare `except`; do not repeat that.
7. **Measure, then claim.** A report states what was run and what it printed. "Should work" is not evidence. A test nobody has seen fail is not evidence either: where it is cheap, break the thing once and watch the test go red.
8. **Check versions against the registry before pinning.** Version numbers in the plan or a work order may be stale.
9. **No secrets in the repository,** including in tests, fixtures and examples.
10. **No absolute local paths, usernames or machine names in committed files.** Write `<repository>` or a relative path. Reports included.

## Engineering conventions

- **TypeScript:** strict mode, no `any`, no non-null assertions without a comment saying why. Named exports. Small modules with one job.
- **Python:** type hints everywhere, checked. No bare `except`. Functions that touch the network or disk are separate from functions that compute.
- **Tests** sit beside the code they test. Unit tests never touch the network. Assert on something only the code under test could have produced.
- **Determinism.** Builds and data outputs are byte-identical for identical inputs: sorted keys, fixed seeds, no timestamps inside artifacts.
- **Dependencies.** Each new runtime dependency gets one line of justification in the commit message. Prefer the platform and the standard library.
- **Commits.** Small, one concern each, imperative subject under 72 characters, a body that says why. End each commit message with the attribution line your session was given.
- **Comments** explain why, never what.

## Product rules that reach into code

- Words on screen are about biology, never about the interface. No internal state and no raw enum values in anything a user reads.
- Every value shown to a user carries its kind: measured, curated, predicted or generated (plan section 4.10).
- Everything is reachable by keyboard, and motion is off when the system asks for reduced motion.
- The interface's actions go through the typed command vocabulary (plan section 4.5). Nothing mutates view state behind it.

## Commands

Run from the repository root. pnpm only through corepack; never `corepack enable`. Set `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` in non-interactive shells.

- Install: `corepack pnpm install --frozen-lockfile`, and `uv sync --frozen` inside `forge/`. Chromium for the end-to-end tests, once: `corepack pnpm e2e:install`.
- Run it: `corepack pnpm dev` builds the sample release and serves the app and its Worker on port 5173.
- Everything, both languages and the browser tests: `corepack pnpm check:all`.
- TypeScript: `corepack pnpm check` runs `lint`, `format:check`, `typecheck`, `test`, `build` and `budget`, each also a script of its own. `corepack pnpm format` rewrites files.
- Python: `corepack pnpm check:py` runs ruff (lint and format check), mypy, pytest and the ledger check in `forge/`. Single tools: `uv run ruff check .`, `uv run mypy`, `uv run pytest` inside `forge/`.
- Sample release: `corepack pnpm release:sample` (runs `python -m forge.skeleton build`); output in `apps/web/public/release/sample/`, ignored by git.
- End to end: `corepack pnpm check:e2e` builds the release and the app, then runs Playwright against `vite preview`. `corepack pnpm e2e` alone reuses an existing build.
- Frame time on the real GPU: with `dev` running, `node scripts/measure.mjs [instances] [frames]` inside `apps/web/`.
- Licence ledger: `uv run python -m forge.ledger check` inside `forge/` (add `--today YYYY-MM-DD` to check against another date).
- Workflows: `actionlint` validates `.github/workflows/`.
