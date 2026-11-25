# GenomeCanvas: working agreement for every session

GenomeCanvas 2.0 is being rebuilt from scratch on branch `v2`. Version 1 is frozen at tag `v1.0.0` (branch `legacy`).

The plan is `Documents/genomecanvas-2.0-plan.md`. Read "The short version", then only the sections your work order names. The plan is the specification; where it and a work order disagree, the work order wins and you say so in your report.

## How the build is run

- One orchestrating session plans, writes work orders and verifies. Each build session executes exactly one work order from `docs/build/briefs/`.
- State lives in `docs/build/STATUS.md`. Only the orchestrator edits it.
- A build session finishes by writing `docs/build/reports/<step>.md` and replying with the same text. The first line is `STATUS: DONE`, `STATUS: PARTIAL` or `STATUS: BLOCKED`, followed by one line saying how many exit criteria passed.

## Hard rules

1. **Branch.** Work only on `v2`. Never check out, commit to, merge into, rebase or delete `main`, `legacy` or any tag. Never push. Never force anything.
2. **No accounts, credentials, purchases or deployments.** If a step needs one, write the exact commands into a runbook under `docs/runbooks/` and report that item as blocked. Do the rest.
3. **No `sudo` and no global installs** (`npm i -g`, `brew`, `pipx`), and never pipe an installer from the internet into a shell. If a tool is missing, say so in the report.
4. **Do not delete or rewrite** `Documents/`, `reports/`, `research_notes/`, `RESUME_DOSSIER.md` or `docs/build/`.
5. **Stay inside the work order.** Ideas for anything else go in the report, not in the diff.
6. **Data honesty.** Never fabricate and never substitute silently. A missing value is recorded as missing, with the reason. Version 1 turned two failed downloads into invented structures through a bare `except`; do not repeat that.
7. **Measure, then claim.** A report states what was run and what it printed. "Should work" is not evidence. A test nobody has seen fail is not evidence either: where it is cheap, break the thing once and watch the test go red.
8. **Check versions against the registry before pinning.** Version numbers in the plan or a work order may be stale.
9. **No secrets in the repository,** including in tests, fixtures and examples.

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

Phase 1A fills this section in. Until then there are none.
