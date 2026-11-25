# Build status

Maintained by the orchestrating session. Build sessions read this and do not edit it.

**Plan:** [`Documents/genomecanvas-2.0-plan.md`](../../Documents/genomecanvas-2.0-plan.md) · **Branch:** `v2` · **v1:** tag `v1.0.0`, branch `legacy`

## Where things stand

| Step | What | Work order | Status | Verified by orchestrator |
|---|---|---|---|---|
| 1A | Repository reset, toolchain, CI definition | [`briefs/phase-1a.md`](briefs/phase-1a.md) | In progress (started 2026-11-25) | — |
| 1B | Walking skeleton, local end to end | not written yet | Waiting on 1A | — |
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

## Decisions taken on the owner's behalf

The owner asked the orchestrator to own the build end to end. These follow the plan's recommendations (section 9) and are all reversible until something is pushed or deployed.

| Decision | Choice | Status |
|---|---|---|
| Framework and host | React with Vite and TanStack Router, built to static files, on Cloudflare | Assumed; owner may overrule before Phase 1B |
| Licence | Apache-2.0 for code, CC BY 4.0 for the dataset | Assumed; **owner must confirm before the first push** |
| 3D engine | three.js on WebGL 2, instanced only; WebGPU deferred until measured | Assumed |
| Package manager | pnpm workspaces through corepack | Assumed |
| `RESUME_DOSSIER.md` and the `.docx` | Left where they are | Waiting on owner |

## Waiting on the owner

| What | Needed by | Why it cannot be done for them |
|---|---|---|
| Permission to push `v2` to GitHub and open pull requests | Before CI can run at all | Publishing to a public repository is the owner's call |
| A Cloudflare account, and an API token for deployment | Step 1C | Accounts and credentials are never created or entered by a session |
| `brew install opentofu` | Step 1C | No global installs by a session |
| A domain, if wanted | Any time | A purchase |
| Five conversations with potential users; two hours using the three closest products | Before Phase 3 | Plan section 5, Phase 1 |

## Log

- **2026-11-25.** Plan written. Branch `v2` created from `main` at `33b521e`. Tag `v1.0.0` and branch `legacy` created at the same commit. Working agreement (`CLAUDE.md`) and this file added. Step 1A started.
