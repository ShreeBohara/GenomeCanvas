STATUS: DONE
Exit criteria: 11 of 11 passed
Commits: 149a313..394d0f2 on v2 (15 commits), then this report's commit. All pushed; CI run 45687886075 green on 394d0f2.

The first real deployment is not one of the criteria and has not happened: it needs the owner's Cloudflare account. See "Blocked on the owner".

## Exit criteria

"Fresh clone" means `git clone --branch v2 <this repository> <scratch>/clone` at `394d0f2`, with `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`, on Node 20.19.0 (unchanged; `node -v` prints `v20.19.0`), uv 0.11.29, Python 3.12.8, macOS on an Apple M3 Pro, Docker 29.7.2.

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Fresh clone: install, then `check:all`, exit 0 | Pass | `corepack pnpm install --frozen-lockfile` → `Lockfile is up to date … Done in 2.4s using pnpm v10.34.9`; `(cd forge && uv sync --frozen)`; `corepack pnpm e2e:install`; `corepack pnpm check:all` → exit 0. Its output includes `Tests  95 passed (95)` (protocol), `7 passed` (ui), `29 passed` (engine), `35 passed` (query), `99 passed` (web unit), `First-load JavaScript: 99.6 KB gzip, within the 150.0 KB budget.`, `All checks passed!`, `116 passed in 0.17s` (pytest), `15 sources, 4 verified, checked against 2026-11-25.`, `Done: 3 written, 0 already there, none deleted.` (the release loaded into local R2) and `20 passed (3.8s)` (Playwright). |
| 2 | Running locally: ranged request, cache headers, `304`, `..` → `404` | Pass | With `corepack pnpm dev` running (it printed `written sample/manifest.json (read back, SHA-256 matches)`). `curl -H 'Range: bytes=0-15' …/release/sample/points.f958edcc94e000e4.bin` → `HTTP/1.1 206 Partial Content`, `content-range: bytes 0-15/502`, `content-length: 16`; `cmp` against the first 16 bytes of `build/release/sample/points.f958edcc94e000e4.bin` → identical (`4743 5054 0000 1000 3600 0000 0000 0000  GCPT....6.......`). `curl -I …/manifest.json` → `200`, `cache-control: no-cache`. `curl -I …/points.f958edcc94e000e4.bin` → `cache-control: public, max-age=31536000, immutable`. The same request with `If-None-Match: "e6ac0d37b36e03525eb67c1cd3ea744e"` → `304`. `curl --path-as-is …/release/sample/../manifest.json` → `{"error":"not_found"} 404`; `…/release/sample/..%2Fmanifest.json` → `{"error":"not_found"} 404`. |
| 3 | No release file in static assets; e2e passes through the Worker route | Pass | `apps/web/public/` is gone; the release builds into `build/release/sample/` (ignored). The e2e test `no release file is left in the app's static assets` checks `dist/client/` has no `release/` and none of the release's file names. `the page reads its release through the Worker route` records the page's own responses: the manifest arrives with `no-cache` and the points file with `immutable`, which only the Worker route sets. All 20 browser tests pass locally and on the runner (11 from 1B, 9 new). |
| 4 | `tofu fmt -check -recursive` and `tofu validate` pass; CI job green | Pass | `infra/tofu.sh fmt -check -recursive` → exit 0, no output. `infra/tofu.sh -chdir=cloudflare init -backend=false -input=false -lockfile=readonly` then `validate` → `Success! The configuration is valid.`; the same for `github`. Image `ghcr.io/opentofu/opentofu:1.13.10@sha256:f89e790760542e8ca6c168301e7ab7fb0885ea9a4856fb810e75ee02b40ae727` (multi-architecture index, pulled 2026-11-25). CI job `OpenTofu (format and validate)`: success in 45687886075. |
| 5 | `wrangler deploy --dry-run` for `staging` and `production`; bundle size | Pass | `corepack pnpm deploy:dry-run` → for staging `Total Upload: 71.83 KiB / gzip: 20.05 KiB`, `env.RELEASES (genomecanvas-releases-staging)`, `--dry-run: exiting now.`; for production the same size and `env.RELEASES (genomecanvas-releases-production)`. Read 8 files from the assets directory. CI's end-to-end job runs the same script. |
| 6 | actionlint clean; deploy and preview jobs **skipped** on the last pushed commit | Pass | `actionlint .github/workflows/*.yml` prints nothing. On `394d0f2`: Deploy run 45687885902: `Look for Cloudflare credentials: success`, `Build, upload and deploy: skipped`. Preview run 45687897095 (pull request 5): `Look for Cloudflare credentials: success`, `Upload a preview: skipped`, `Post the preview address: skipped`. Both workflows concluded `success`. |
| 7 | Lighthouse job green in CI; three runs' scores | Pass | Table below. Accessibility and best practices are 100 in every run. |
| 8 | Upload plan for the sample release shown; tests pass | Pass | Plan below. 26 tests in `apps/web/scripts/release-upload/` pass (in the 99). |
| 9 | Three mutations seen to fail, then restored | Pass | See "Mutations". |
| 10 | Runbook exists, lists every owner action with its command, no secret, no local path | Pass | [`docs/runbooks/first-deploy.md`](../../runbooks/first-deploy.md). `grep -n -E "/Users\|<username>\|token=\|[0-9a-f]{32}"` on it → nothing, exit 1. |
| 11 | Tree clean, small commits, CI green for the last pushed commit | Pass | `git status --short` empty. 15 commits plus this report, one concern each. CI run 45687886075 on `394d0f2` (push): all six jobs success; 45687897086 (pull request event): success. `git grep` for key patterns and for absolute local paths and the username, outside `docs/build/briefs/` and the earlier report that quotes the patterns, → nothing. This report's commit gets its own run, which I give in my reply. |

### Lighthouse

`tools/lighthouse/run.mjs` against `vite preview` (built assets, the Worker and local R2), Lighthouse 13.6.0, default mobile settings with simulated throttling, SwiftShader WebGL, a fresh Chrome profile per run.

**CI, `394d0f2` (run 45687886075), after one discarded warm-up run:**

Warm-up run (not counted): performance 60. Browser: HeadlessChrome 157 on Linux.

| Category | Run 1 | Run 2 | Run 3 | Min | Max | Spread |
|---|---|---|---|---|---|---|
| performance | 75 | 79 | 74 | 74 | 79 | 5 |
| accessibility | 100 | 100 | 100 | 100 | 100 | 0 |
| best practices | 100 | 100 | 100 | 100 | 100 | 0 |
| SEO | 91 | 91 | 91 | 91 | 91 | 0 |

The job concluded success, with one warning: `performance 74 is below 90 (a warning, not a failure)`.

**CI, `754894e`, before the warm-up run was added** (runs 45687000887 and 45687011751):

| Category | Run 1 | Run 2 | Run 3 | Spread | | Run 1 | Run 2 | Run 3 | Spread |
|---|---|---|---|---|---|---|---|---|---|
| performance | 56 | 76 | 77 | 21 | | 55 | 71 | 73 | 18 |
| accessibility | 100 | 100 | 100 | 0 | | 100 | 100 | 100 | 0 |
| best practices | 100 | 100 | 100 | 0 | | 100 | 100 | 100 | 0 |
| SEO | 91 | 91 | 91 | 0 | | 91 | 91 | 91 | 0 |

**This Mac** (HeadlessChrome 158, same flags): performance 87, 85, 86; accessibility, best practices 100; SEO 91.

**Performance warns, it does not fail.** The first run was always about 20 points lower: it paid for the preview server's start-up. With a discarded warm-up run the measured runs are closer (74 to 79, spread 5), but the score still depends on a shared runner rendering WebGL in software, and the same build scores 85–87 here and 74–79 there. A failing threshold at the plan's 90 would always fail in CI, and one set below the noise would catch nothing. Accessibility below 95 or best practices below 90 fails the job, on the worst of the three runs. Phase 4's budget (90 on a protein page, plan section 7) should be measured where rendering is stable.

### The upload plan for the sample release

`corepack pnpm --filter @genomecanvas/web run release:upload ../../build/release/sample --release sample --env staging`, no credentials in the shell:

```
Release "sample" to bucket genomecanvas-releases-staging (the staging account): 3 objects, in this order.
  put if absent sample/points.f958edcc94e000e4.bin  502 bytes  sha256 f958edcc94e000e4…
                Content-Type: application/octet-stream
                Cache-Control: public, max-age=31536000, immutable
  put if absent sample/proteins.0c919232e600b999.json  6002 bytes  sha256 0c919232e600b999…
                Content-Type: application/json; charset=utf-8
                Cache-Control: public, max-age=31536000, immutable
  replace       sample/manifest.json  1160 bytes  sha256 cc3d2c12bd4bc1aa…
                Content-Type: application/json; charset=utf-8
                Cache-Control: no-cache
Nothing is ever deleted.

This was the plan only; nothing was changed. Add --apply to upload.
```

With `--apply` and `--env` but no token it prints `--apply with --env needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment.` and exits 2. With `--local --apply` against an empty local state: `Done: 3 written, 0 already there, none deleted.`; run again: `1 written, 2 already there`.

### Mutations

Each made by hand, run, then restored with `git checkout`; the suites were green again afterwards (`99 passed`, `95 passed`, `20 passed`).

1. **Range arithmetic.** In `worker/range.ts`, `length: last - start + 1` → `last - start`. Unit tests: `Tests  8 failed`, among them `× reads "bytes=0-15" of 100 bytes as offset 0, length 16` and `× sends exactly the first 16 bytes with 206 and Content-Range`. Rebuilt, Playwright: `✘ a ranged request returns exactly those bytes of the file on disk`, `✘ a range in the middle of the file is exact too`, `2 failed`.
2. **Choice of cache header.** In `packages/protocol/src/release-files.ts`, the manifest given `IMMUTABLE_CACHE_CONTROL`. Protocol: `× lets the manifest be stored but checked before every use`, `1 failed | 94 passed`. Web unit: `5 failed | 94 passed` (the Worker, the upload plan, its description and the wrangler arguments). Rebuilt, Playwright: `✘ the manifest must be checked before reuse; a hashed file is kept a year`, `✘ the page reads its release through the Worker route`.
3. **Key validation.** In `worker/release.ts`, the "exactly two path parts" check replaced by taking the first and last parts, so `/release/sample/sub/manifest.json` reached the manifest. Unit: `× answers /release/sample/sub/manifest.json with a JSON 404`, `1 failed | 58 passed`. Rebuilt, Playwright: `✘ paths that try to climb out of a release are a JSON 404` (`Error: /release/../release/sample/sub/manifest.json`).

## What was built

**A1. The release route** (`apps/web/worker/release.ts`, `range.ts`, `bucket.ts`). `GET` and `HEAD` on `/release/<release>/<file>` from the `RELEASES` R2 binding; `wrangler.jsonc` now runs the Worker first for `/release/*` as well as `/api/*`. The raw path is split before anything is decoded and must be exactly two parts, each passing the shared rule, or the answer is `{"error":"not_found"}` with `404` and the bucket is never asked. Single ranges, including suffix ranges, give `206` with `Content-Range`; a range starting past the end gives `416` with `bytes */<size>`; malformed or multiple ranges get the whole file, as RFC 9110 allows. `Accept-Ranges: bytes` on every file response. `ETag` is R2's; `If-None-Match` (weak comparison, lists, `*`) gives `304`. Other methods get `405` with `Allow`. 55 unit tests (33 on the route, 22 on range parsing) against an in-memory bucket (`memory-bucket.ts`) that records every call, so tests also check that a range reads only those bytes and a `304` or `HEAD` never reads the body.

**The shared naming rule** (`packages/protocol/src/release-files.ts`). Names are lowercase letters and digits joined by single `.`, `-` or `_`, at most 128 characters. `manifest.json` is `no-cache`; `<stem>.<16 hex>.<ext>` is `public, max-age=31536000, immutable`; any other name is refused, since a fixed name could be replaced. Content types: `.bin` and `.bcif` `application/octet-stream`, `.json` `application/json; charset=utf-8`, `.parquet` `application/vnd.apache.parquet`; any other extension is refused. `packages/protocol/vectors/release-file-names.json` (24 names, 9 release names) is read by the TypeScript tests and by `forge/src/forge/test_release_names.py`, against a Python copy of the rule in `forge/src/forge/release_names.py`; every file the skeleton writes must pass it.

**A2. One path, locally too.** `release:sample` now writes `build/release/sample/`; `release:local` loads it into wrangler's local R2 with the upload command; `dev` and `check:e2e` do both. The Vite plugin's dev and preview servers both persist to `apps/web/.wrangler/state/v3`, which is where `wrangler r2 object put --local --persist-to .wrangler/state` writes (I read `getPersistenceRoot` in the plugin, then checked it by serving the files). The Worker's Vite environment now resolves workspace packages to source, as the client already did; without it the Worker imported a stale `dist/`.

**A3. End-to-end tests** (`apps/web/e2e/release-route.spec.ts`, 9 tests): exact bytes for a range at offset 0 and in the middle, compared with the file on disk; `416`; both cache headers and the manifest's bytes; `304`; five climbing or malformed paths sent byte for byte through `node:http`, each a JSON `404`; a climb all the way out of `/release/` landing on the app shell and never on `wrangler.jsonc`; the page's own release requests coming through the route; nothing left in the static assets.

**A4. The upload command** (`apps/web/scripts/release-upload/`). `planUpload` checks the folder against its manifest (stray, missing, wrong size, wrong SHA-256, names the rule refuses, collecting every problem) and orders data files before the manifest. `applyPlan` reads each hashed key first: same bytes, skipped; different bytes, it stops before the manifest; absent, it writes, then reads back and compares SHA-256. It never deletes. The bucket comes from the `RELEASES` binding for the chosen environment, read from `wrangler.jsonc`. The store shells out to `wrangler r2 object get/put`, `--local --persist-to` or `--remote`. 26 tests on the planning, applying, wrangler arguments and command line.

**B. Infrastructure.** `infra/cloudflare`: one `cloudflare_r2_bucket` per environment (`for_each` over a map, `prevent_destroy`), the account ID as a validated variable, an optional location, local state. `infra/github`: a ruleset on `main` (no deletion or force-push, changes through a pull request, the five CI jobs required and reported by the GitHub Actions app) and Dependabot alerts. Lock files committed. `infra/tofu.sh` runs the pinned image. `infra/README.md` covers running, applying, the GitHub module and remote state on R2. `wrangler.jsonc` has `staging` (`workers_dev`, `preview_urls`) and `production` (`workers_dev`), each binding its own bucket; the top level binds `genomecanvas-releases-local`, which exists in no account, so a deploy without an environment fails instead of creating a third Worker.

**C. Delivery.** `deploy.yml`: on push to `v2` or `main` (and by hand from those two), a first job says whether both secrets exist; the deploy job builds with `CLOUDFLARE_ENV`, uploads the release, deploys with the commit as its message, takes the `workers.dev` address from wrangler's output file, and runs `deploy:check`, which retries for a minute until `/api/health` says ok and the manifest is `no-cache` with exactly the uploaded bytes (`apps/web/scripts/deploy-check/`, 7 tests; also run against the local preview server: `/api/health is ok and the sample manifest matches.`). `preview.yml`: on `pull_request`, the same gate, then a build reading `/release/pr-<number>/`, that release uploaded to the staging bucket, `wrangler versions upload --preview-alias pr-<number>`, the same check, and a separate job, the only one with `pull-requests: write`, that creates or updates one marked comment through `actions/github-script` v9.0.0. CI gains the OpenTofu job, the Lighthouse job and a dry-run step in the end-to-end job.

**D. Runbook** and **E. documents**: README (status, commands, repository map), the Commands section of `CLAUDE.md`, ADR 5 and ADR 9 amended.

## Choices that differ from the work order, or that it left open

1. **The environment is chosen at build time, not with `wrangler --env`.** With the Cloudflare Vite plugin, `vite build` writes a resolved `wrangler.json` and wrangler deploys that; `wrangler deploy --env staging` then fails. The workflows set `CLOUDFLARE_ENV`, and `deploy:dry-run` builds each environment, dry-runs it, and rebuilds the default so the preview server is never left pointing at a remote bucket.
2. **A climb all the way out of `/release/` is not a 404.** URLs are normalised before any code runs, so `/release/sample/%2e%2e/%2e%2e/wrangler.jsonc` is a request for `/wrangler.jsonc`, which the single-page fallback answers with the app shell. Every path that stays under `/release/` and contains `..`, encoded or not, is a JSON `404`; a test pins both.
3. **Two R2 reads per GET** (size and entity tag, then the bytes), so ranges can be checked and `416` answered properly. A `304` or `HEAD` costs one. If the manifest is replaced between the two reads, one reader gets a 200 with a one-version-old `ETag`, corrected on the next request.
4. **Fixed names other than `manifest.json` are refused**, and only four extensions are served. Phase 2 will widen the list on purpose rather than by accident.
5. **The upload command reads a key to learn whether it exists,** because wrangler 4.86 has no command that only asks. Fine at 8 KB; Phase 2's gigabytes should move to R2's S3 interface (`HEAD`). It tells a missing key from other failures by wrangler's words ("The specified key does not exist"); any other failure stops the upload.
6. **The upload command uses wrangler's undocumented-as-stable `unstable_readConfig`** to read bucket names from `wrangler.jsonc`, so the names live in one file for the Worker and the command. A test pins all three. If a wrangler upgrade breaks it, that test goes red.
7. **tsx 4.23.15 is a new dev dependency**, because Node 20 cannot run TypeScript and the two commands import the shared rule from workspace sources. Node 22.18 and later would make it unnecessary.
8. **Lighthouse lives in `tools/lighthouse` with its own lockfile, outside the workspace.** Lighthouse 13.6.0 declares Node ≥ 22.19; inside the workspace it would make installs on this machine's Node 20 warn. It runs in CI on Node 24 with the runner's Google Chrome (HeadlessChrome 157 there). It did run on Node 20 here.
9. **Previews read their own `pr-<number>` release** in the staging bucket, so a pull request never replaces the manifest staging serves. Those copies (8 KB each) are never deleted automatically. A lifecycle rule on the `pr-` prefix would be the tidy fix; I left it out under "create nothing the skeleton does not use".
10. **Private vulnerability reporting is not in OpenTofu.** `integrations/github` 6.13.0 has no resource for it (checked with `tofu providers schema -json`); the README gives `gh api --method PUT repos/<owner>/GenomeCanvas/private-vulnerability-reporting`. The module turns on Dependabot alerts instead, which it can.
11. **Two Cloudflare tokens, not one, in the runbook:** a one-day token with only R2 Storage Edit for OpenTofu, and the long-lived CI token with Workers Scripts Edit and Workers R2 Storage Edit. I could not test either permission set against a real account; the runbook says to add a single named permission if a deploy reports one missing.
12. **Preview jobs fail, not skip, between storing the secrets and the first staging deploy,** because `versions upload` needs the Worker to exist. The runbook deploys staging first, straight after the secrets.
13. **Docker Desktop was started** (`open -a Docker`) to run the OpenTofu image; it was installed but not running. Nothing else used Docker.
14. **Cloudflare's documentation pages I relied on** (read 2026-11-25 by a fetching subagent): R2 pricing (modified 2026-10-30), Workers limits (2026-11-25) and pricing (2026-11-18), API token permissions (2026-11-15), Version URLs (2026-11-19). Behaviour of wrangler 4.86.0 itself (local R2, redirected config, `--preview-alias`, the output file's `deploy` and `version-upload` entries) I checked in the installed package and by running it, not from the documentation.

## Versions pinned

Checked against the registries on 2026-11-25.

| Name | Version | Note |
|---|---|---|
| OpenTofu (image) | 1.13.10, `sha256:f89e7907…ae727` | latest release, 2026-11-23 |
| cloudflare/cloudflare provider | 5.29.0 (`~> 5.29`) | latest |
| integrations/github provider | 6.13.0 (`~> 6.13`) | latest |
| tsx | 4.23.15 | latest; Node ≥ 18 |
| lighthouse | 13.6.0 | latest; Node ≥ 22.19, so outside the workspace |
| chrome-launcher | 1.2.3 | latest |
| actions/github-script | v9.0.0 `3a2844b7e9c422d3c10d287c895573f7108da1b3` | latest; `using: node24` |
| wrangler, @cloudflare/vite-plugin | 4.86.0, 1.34.0 | unchanged; latest wrangler is 4.168.0 (Node ≥ 22) |

## Blocked on the owner

- **The first real deployment.** Everything before it is ready: [`docs/runbooks/first-deploy.md`](../../runbooks/first-deploy.md) lists, with exact commands, the Cloudflare account, R2 (which may ask for a payment method), the `workers.dev` subdomain, the two buckets (`tofu apply` or two `wrangler r2 bucket create` commands), the CI token, `gh secret set CLOUDFLARE_API_TOKEN` and `gh secret set CLOUDFLARE_ACCOUNT_ID`, then `gh workflow run deploy.yml --ref v2`. Until then the deploy and preview jobs skip.
- Optional: apply `infra/github`, and turn on private vulnerability reporting with the `gh api` call above.
- Still open from 1B: Node 22 or later on this machine would retire tsx and the Lighthouse split, and let wrangler move to its current major.

## For the orchestrator to verify

1. **This report's commit has its own CI run.** I give its ID in my reply.
2. **The token permissions** in the runbook are the minimum I could justify from the documentation, untested against a real account.
3. **The Lighthouse warm-up run** (the Lighthouse section): whether discarding one run is a fair way to measure.
4. **`unstable_readConfig`** (choice 6) as a dependency of the upload command.

## Ideas outside this order

- A lifecycle rule in `infra/cloudflare` that expires `pr-*` objects in the staging bucket after 30 days.
- Use the Workers Cache API in the release route for hashed files, so a popular file costs no R2 read at all.
- When a domain exists, serve the bucket on it directly (ADR 5 amendment) and keep the Worker route for development.
- Move the upload command's existence check to R2's S3 `HEAD` before Phase 2's large releases.
- Add `If-Range` support if a Parquet reader turns out to send it.
