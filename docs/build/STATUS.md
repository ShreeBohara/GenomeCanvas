# Build status

Maintained by the orchestrating session. Build sessions read this and do not edit it.

**Plan:** [`Documents/genomecanvas-2.0-plan.md`](../../Documents/genomecanvas-2.0-plan.md) · **Branch:** `v2` · **Pull request:** #5 (draft) · **v1:** tag `v1.0.0`, branch `legacy`

## Where things stand

| Step | What | Work order | Status | Verified by orchestrator |
|---|---|---|---|---|
| 1A | Repository reset, toolchain, CI definition | [`briefs/phase-1a.md`](briefs/phase-1a.md) | **Done** ([report](reports/phase-1a.md)) | Yes, 2026-11-25 |
| 1B | Walking skeleton, local end to end | [`briefs/phase-1b.md`](briefs/phase-1b.md) | **Done** ([report](reports/phase-1b.md)) | Yes, 2026-11-25 |
| 1C | Data path through R2, infrastructure as code, delivery | [`briefs/phase-1c.md`](briefs/phase-1c.md) | In progress (started 2026-11-25) | — |
| 2 | The Forge: real data | — | Not started | — |
| 3 | The Atlas engine | — | Not started | — |
| 4 | Product and design system | — | Not started | — |
| 5 | Trails and stories; soft launch | — | Not started | — |
| 6 | The Guide and its evals | — | Not started | — |
| 7 | Lenses | — | Not started | — |
| 8 | Machine learning | — | Not started | — |
| 9 | Open platform | — | Not started | — |
| 10 | Harden, launch, publish | — | Not started | — |

**Phase 1 cannot close until something is deployed, and deploying needs the owner's Cloudflare account.** Step 1C prepares everything up to that point.

## Verification record

### 1B, verified 2026-11-25

Run by the orchestrator in a fresh clone of `v2` at `7e7db18`, separately from the build session's own run.

| Check | Result |
|---|---|
| Install, then `corepack pnpm check:all` | Exit 0. 131 TypeScript tests, 81 Python tests, 11 browser tests; first-load JavaScript 99.6 KB against a 150 KB budget |
| Two builds of the sample release | Byte-identical, and the three hashes match the ones in the build session's report |
| Five mutations the build session had not tried | All caught: skipping the SHA-256 comparison (1 test failed), picking the farthest point (5 failed), writing x where y belongs (1 failed), letting a proxy cache the event stream (1 failed), hiding the sample-data notice (1 browser test failed) |
| The running app, looked at by hand | At 1,440 and 375 pixels wide, dark and light: the map fills the window, controls float, hovering a point names the protein, the sample-data notice is permanent, no console errors |
| CI on GitHub | 11 checks passing, none failing, on the last pushed commit |
| Working agreement | Only its Commands section was changed |
| Personal data and key patterns in the tree | None |

Found by the build session, worth remembering: the first CI run failed because root scripts called a bare `pnpm` that exists on this machine and not on the runner. Fixed, with a clean-PATH reproduction.

### 1A, verified 2026-11-25

Run by the orchestrator in a fresh clone of `v2` at `9b234d1`.

| Check | Result |
|---|---|
| `corepack pnpm install --frozen-lockfile`, then `corepack pnpm check` | Exit 0; 46 tests passed |
| `uv sync --frozen`, then `corepack pnpm check:py` | Exit 0; 29 tests passed; ledger reports 15 sources, 4 verified |
| `actionlint` on both workflows | No findings |
| Four mutations the build session had not tried | All caught |
| `LICENSE` against apache.org | SHA-256 identical |
| Personal data and key patterns in the tree | One local folder path in the report; removed before the first push |

## Measured so far

| What | Value | Where |
|---|---|---|
| First-load JavaScript for the shell | 99.6 KB gzip | 1B report |
| Engine chunk (three.js and the atlas) | 132.3 KB gzip | 1B report |
| 20,429 points | 1 draw call; frame time capped at the display's 16.7 ms; 4.6 to 6.3 ms draw plus GPU wait | 1B report. Points, not ribbons |

## Decisions taken on the owner's behalf

| Decision | Choice | Status |
|---|---|---|
| Licence | Apache-2.0 for code, CC BY 4.0 for the dataset | **Confirmed by the owner** on 2026-11-25 |
| Framework and host | React with Vite and TanStack Router, on Cloudflare, as one Worker with static assets | Assumed; not yet confirmed in words |
| 3D engine | three.js on WebGL 2, instanced only; WebGPU deferred until measured | Assumed |
| Package manager and tool versions | pnpm 10, Vitest 4, wrangler 4.86: each one major or more behind, because this machine runs Node 20.19 | Assumed; see below |
| `RESUME_DOSSIER.md` and the `.docx` | Left where they are | Waiting on owner |

## Waiting on the owner

| What | Needed by | Why it cannot be done for them |
|---|---|---|
| **A Cloudflare account, and an API token for deployment** | To close Phase 1 | Accounts and credentials are never created or entered by a session. Step 1C writes the exact steps |
| **Node 24 on this machine** (`nvm install 24`, since nvm is present) | Soon | Changes the owner's environment. Four tools are now pinned behind their current releases because of Node 20.19, and local runs differ from CI |
| `brew install opentofu` | Step 1C can work around it | A global install |
| Turn on private vulnerability reporting for the repository | Before launch | A repository setting |
| A domain, if wanted | Any time | A purchase |
| Five conversations with potential users; two hours using the three closest products | Before Phase 3 | Plan section 5, Phase 1 |

## Permissions the owner has given

- **2026-11-25:** push branch `v2` to GitHub and open pull requests. Not given: merging into `main`, deploying, creating accounts, buying anything.

## Log

- **2026-11-25.** Plan written. Branch `v2` created from `main` at `33b521e`. Tag `v1.0.0` and branch `legacy` created at the same commit. Working agreement and this file added. Step 1A started.
- **2026-11-25.** Step 1A reported done (17 commits) and was verified. `v2` pushed and draft pull request 5 opened. Step 1B started.
- **2026-11-25.** Step 1B reported done (16 commits) and was verified. Step 1C started.
