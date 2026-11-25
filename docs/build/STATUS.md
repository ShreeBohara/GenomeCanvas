# Build status

Maintained by the orchestrating session. Build sessions read this and do not edit it.

**Plan:** [`Documents/genomecanvas-2.0-plan.md`](../../Documents/genomecanvas-2.0-plan.md) · **Branch:** `v2` · **v1:** tag `v1.0.0`, branch `legacy`

## Where things stand

| Step | What | Work order | Status | Verified by orchestrator |
|---|---|---|---|---|
| 1A | Repository reset, toolchain, CI definition | [`briefs/phase-1a.md`](briefs/phase-1a.md) | **Done** ([report](reports/phase-1a.md)) | Yes, 2026-11-25. See below. |
| 1B | Walking skeleton, local end to end | [`briefs/phase-1b.md`](briefs/phase-1b.md) | In progress (started 2026-11-25) | — |
| 1C | Infrastructure as code and delivery | not written yet | Waiting on 1B | — |
| 2 | The Forge: real data | — | Not started | — |
| 3 | The Atlas engine | — | Not started | — |
| 4 | Product and design system | — | Not started | — |
| 5 | Trails and stories; soft launch | — | Not started | — |
| 6 | The Guide and its evals | — | Not started | — |
| 7 | Lenses | — | Not started | — |
| 8 | Machine learning | — | Not started | — |
| 9 | Open platform | — | Not started | — |
| 10 | Harden, launch, publish | — | Not started | — |

## Verification record

### 1A, verified 2026-11-25

Run by the orchestrator in a fresh clone of `v2` at `9b234d1`, separately from the build session's own run.

| Check | Result |
|---|---|
| `corepack pnpm install --frozen-lockfile`, then `corepack pnpm check` | Exit 0; 46 tests passed |
| `uv sync --frozen`, then `corepack pnpm check:py` | Exit 0; 29 tests passed; ledger reports 15 sources, 4 verified |
| `actionlint` on both workflows | No findings |
| Four mutations the build session had not tried | All caught: allowing a `trial:` prefix (1 test failed), dropping the whitespace check (4 failed), letting an unverified source be in use (2 failed), marking an unverified ledger row as in use (ledger check exits 1) |
| `LICENSE` against apache.org | SHA-256 identical |
| Protected paths | Only the Commands section of `CLAUDE.md` and the report were added |
| Personal data and key patterns in the tree | One local folder path in the report; removed before the first push |

Not verified locally: the CI path itself (Node 24 with its bundled corepack). The first push is that test.

## Decisions taken on the owner's behalf

The owner asked the orchestrator to own the build end to end. These follow the plan's recommendations (section 9).

| Decision | Choice | Status |
|---|---|---|
| Licence | Apache-2.0 for code, CC BY 4.0 for the dataset | **Confirmed by the owner** on 2026-11-25, with permission to push |
| Framework and host | React with Vite and TanStack Router, built to static files, on Cloudflare | Assumed; not yet confirmed in words |
| 3D engine | three.js on WebGL 2, instanced only; WebGPU deferred until measured | Assumed |
| Package manager | pnpm through corepack. Pinned to pnpm 10 because pnpm 11 and 12 need Node 22 or a newer corepack than this machine has | Assumed |
| `RESUME_DOSSIER.md` and the `.docx` | Left where they are | Waiting on owner |

## Waiting on the owner

| What | Needed by | Why it cannot be done for them |
|---|---|---|
| A Cloudflare account, and an API token for deployment | Step 1C | Accounts and credentials are never created or entered by a session |
| `brew install opentofu` | Step 1C | No global installs by a session |
| Node 24 on this machine (optional) | Any time | A global install. Local runs use Node 20.19 while CI uses 24; pnpm and Vitest are held one major back because of it |
| Turn on private vulnerability reporting for the repository | Before launch | A repository setting. `SECURITY.md` relies on it |
| A domain, if wanted | Any time | A purchase |
| Five conversations with potential users; two hours using the three closest products | Before Phase 3 | Plan section 5, Phase 1 |

## Permissions the owner has given

- **2026-11-25:** push branch `v2` to GitHub and open pull requests. Not given: merging into `main`, deploying, creating accounts, buying anything.

## Log

- **2026-11-25.** Plan written. Branch `v2` created from `main` at `33b521e`. Tag `v1.0.0` and branch `legacy` created at the same commit. Working agreement (`CLAUDE.md`) and this file added. Step 1A started.
- **2026-11-25.** Step 1A reported done (17 commits) and was verified independently. `v2` pushed for the first time and a draft pull request opened so CI can run. Step 1B started.
