# Build status

Maintained by the orchestrating session. Build sessions read this and do not edit it.

**Plan:** [`Documents/genomecanvas-2.0-plan.md`](../../Documents/genomecanvas-2.0-plan.md) · **Branch:** `v2` · **Pull request:** #5 (draft) · **v1:** tag `v1.0.0`, branch `legacy`

## Where things stand

| Step | What | Work order | Status | Verified by orchestrator |
|---|---|---|---|---|
| 1A | Repository reset, toolchain, CI definition | [`briefs/phase-1a.md`](briefs/phase-1a.md) | **Done** ([report](reports/phase-1a.md)) | Yes, 2026-11-25 |
| 1B | Walking skeleton, local end to end | [`briefs/phase-1b.md`](briefs/phase-1b.md) | **Done** ([report](reports/phase-1b.md)) | Yes, 2026-11-25 |
| 1C | Data path through R2, infrastructure as code, delivery | [`briefs/phase-1c.md`](briefs/phase-1c.md) | **Done** ([report](reports/phase-1c.md)) | Yes, 2026-11-25 |
| — | **First deployment** | [`runbooks/first-deploy.md`](../runbooks/first-deploy.md) | **Waiting on the owner** | — |
| 2A | The Forge: pipeline frame, data model, identity, UniProt | [`briefs/phase-2a.md`](briefs/phase-2a.md) | In progress (started 2026-11-25) | — |
| 2B | Structures: AlphaFold DB, backbone packs | not written yet | Waiting on 2A and on download permission | — |
| 2C | Knowledge graph: Open Targets, STRING, Reactome | not written yet | Waiting | — |
| 2D | Embeddings, layouts, structural neighbours | not written yet | Waiting | — |
| 2E | Release assembly, publishing, the atlas on real data | not written yet | Waiting | — |
| 3 | The Atlas engine | — | Not started | — |
| 4 | Product and design system | — | Not started | — |
| 5 | Trails and stories; soft launch | — | Not started | — |
| 6 | The Guide and its evals | — | Not started | — |
| 7 | Lenses | — | Not started | — |
| 8 | Machine learning | — | Not started | — |
| 9 | Open platform | — | Not started | — |
| 10 | Harden, launch, publish | — | Not started | — |

**Phase 1 is built and verified, and is not closed.** Its exit criterion is a live address, and that needs the owner's Cloudflare account. Until the two secrets exist, the deploy and preview jobs skip.

## Verification record

### 1C, verified 2026-11-25

Run by the orchestrator in a fresh clone of `v2` at `aa133b8`, separately from the build session's own run.

| Check | Result |
|---|---|
| Install, then `corepack pnpm check:all` | Exit 0. 265 TypeScript tests, 116 Python tests, 20 browser tests; first-load JavaScript 99.6 KB |
| The release route, probed on a live local server | A 16-byte range and an 8-byte suffix range match the file on disk; a range past the end is `416`; the manifest is `no-cache` and the hashed file `immutable`; a matching `If-None-Match` is `304`; seven climbing or malformed paths are each a JSON `404`; `POST` is `405` |
| Six mutations the build session had not tried | All caught: suffix ranges returning the wrong end (2 tests failed), never answering `304` (2), accepting any method (1), capital letters in names (1), overwriting a hashed file that differs (1), accepting the wrong manifest after a deploy (1) |
| OpenTofu | `fmt -check` clean; both modules validate; a deliberately broken resource fails validation |
| Workflows, read line by line | Secrets reach shells only through environment variables; previews use `pull_request`; only the comment job can write to a pull request; every action is pinned to a commit |
| CI on GitHub | 17 checks passing, none failing, 3 skipped (deploy, preview, comment) as designed |
| The runbook | Read in full. One sentence corrected: it said the orchestrator merges into `main`; nothing is merged there without the owner |

Not verifiable without an account: the deploy itself, and whether the two token permission sets in the runbook are sufficient.

### 1B, verified 2026-11-25

Fresh clone at `7e7db18`: `check:all` exit 0 (131 TypeScript, 81 Python, 11 browser tests); two builds of the sample release byte-identical and matching the reported hashes; five further mutations all caught; the app checked by hand at 1,440 and 375 pixels in both themes; CI green.

### 1A, verified 2026-11-25

Fresh clone at `9b234d1`: install and both check suites exit 0; `actionlint` clean; four further mutations all caught; `LICENSE` identical to apache.org; one local folder path removed from the report before the first push.

## Measured so far

| What | Value | Where |
|---|---|---|
| First-load JavaScript for the shell | 99.6 KB gzip, against a 150 KB budget | 1B report |
| Engine chunk (three.js and the atlas) | 132.3 KB gzip | 1B report |
| Worker bundle | 20.05 KiB gzip | 1C report |
| 20,429 points | 1 draw call; frame time capped at the display's 16.7 ms; 4.6 to 6.3 ms draw plus GPU wait | 1B report. Points, not ribbons |
| Lighthouse on the skeleton, in CI under software rendering | Performance 74 to 79; accessibility 100; best practices 100; SEO 91 | 1C report. Performance is 85 to 87 on a real GPU |

## Follow-ups noted during verification

Small, none blocking. Each belongs to the step named.

| What | When |
|---|---|
| The release route sets `Content-Length` from the first bucket read; if the manifest is replaced between its two reads the length can be one version stale. Take it from the second read. | 2E, when the route is next touched |
| The upload command reads a whole object to learn whether it exists. Move to R2's S3 `HEAD` before uploading gigabytes. | 2E |
| Preview releases under `pr-<number>/` are never cleaned up. Add a lifecycle rule. | 2E |
| Cache hashed release files with the Workers Cache API. | Phase 10 |
| The light theme's orange and vermillion categories are the closest pair; check with a colour-vision simulator. | Phase 4 |

## Decisions taken on the owner's behalf

| Decision | Choice | Status |
|---|---|---|
| Licence | Apache-2.0 for code, CC BY 4.0 for the dataset | **Confirmed by the owner** on 2026-11-25 |
| Framework and host | React with Vite and TanStack Router, on Cloudflare, as one Worker with static assets | Assumed; not yet confirmed in words |
| 3D engine | three.js on WebGL 2, instanced only; WebGPU deferred until measured | Assumed |
| Pipeline orchestration | Plain typed stages with a content-addressed cache; no orchestrator until the stage count or scheduling needs justify one | Assumed; decision record 8 is being amended in 2A. The plan named Dagster and said to revisit |
| Tool versions | pnpm 10, Vitest 4, wrangler 4.86: each behind its current release, because this machine runs Node 20.19 | Assumed |
| `RESUME_DOSSIER.md` and the `.docx` | Left where they are | Waiting on owner |

## Waiting on the owner

| What | Needed by | Why it cannot be done for them |
|---|---|---|
| **The first deployment:** a Cloudflare account, two buckets, one API token, two repository secrets. Steps are in [`runbooks/first-deploy.md`](../runbooks/first-deploy.md) | To close Phase 1 | Accounts and credentials are never created or entered by a session |
| **Permission to download about 8 to 10 GB of public datasets to this machine** (the AlphaFold DB human archive is 4.8 GB; Open Targets, STRING and others make up the rest) | Step 2B | A large download onto the owner's disk |
| **Node 24 on this machine** (`nvm install 24`) | Soon | Changes the owner's environment. Local runs differ from CI, and four tools are pinned behind current because of it |
| Hugging Face and Zenodo accounts with tokens, to publish the open dataset | Step 2E | Accounts and credentials |
| Turn on private vulnerability reporting for the repository | Before launch | A repository setting |
| A domain, if wanted | Any time | A purchase |
| Five conversations with potential users; two hours using the three closest products | Before Phase 3 | Plan section 5, Phase 1 |

For information: the 1C build session started Docker Desktop on this machine to run OpenTofu, as its work order allowed. It is still running.

## Permissions the owner has given

- **2026-11-25:** push branch `v2` to GitHub and open pull requests. Not given: merging into `main`, deploying, creating accounts, buying anything.

## Log

- **2026-11-25.** Plan written. Branch `v2` created from `main` at `33b521e`. Tag `v1.0.0` and branch `legacy` created at the same commit. Working agreement and this file added. Step 1A started.
- **2026-11-25.** Step 1A reported done (17 commits) and was verified. `v2` pushed and draft pull request 5 opened. Step 1B started.
- **2026-11-25.** Step 1B reported done (16 commits) and was verified. Step 1C started.
- **2026-11-25.** Step 1C reported done (16 commits) and was verified. Phase 1 is built; its first deployment waits on the owner. Phase 2 split into five steps; step 2A started.
