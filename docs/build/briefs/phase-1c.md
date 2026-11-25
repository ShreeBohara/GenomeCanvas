# Work order 1C: the data path through R2, infrastructure as code, and delivery

**Phase 1, step C of three.** Steps 1A and 1B left a tested skeleton that runs locally. This step finishes Phase 1 up to the one thing no session can do: use the owner's Cloudflare account.

## Goal

When this step is done:

- the app reads its release the way production will: through the Worker, from an R2 bucket, with byte ranges and correct caching, and that path runs locally;
- the cloud resources are described in code;
- pushing to `v2` would deploy a staging site, and a pull request would get a preview, the moment credentials exist, and until then those jobs skip cleanly;
- there is a runbook with the exact steps the owner has to take.

## Read first

1. `CLAUDE.md`.
2. `docs/build/STATUS.md`, `docs/build/reports/phase-1a.md` and `docs/build/reports/phase-1b.md`.
3. In `Documents/genomecanvas-2.0-plan.md`: sections 4.1, 4.4 (the release format), 4.9 and Phase 1 in section 5.
4. Decision records 1, 2 (with its amendment), 5 and 9.
5. Cloudflare's current documentation for R2 bindings, Worker environments, `wrangler versions upload` and static assets. Check behaviour against the versions pinned here (wrangler 4.86.0), not the newest.

## What to build

### A. Releases through R2

1. **A Worker route for release files.** `GET` and `HEAD` on `/release/<release>/<file>`, served from an R2 bucket binding.
   - Single byte ranges: `206` with `Content-Range`, `416` when the range cannot be satisfied, `Accept-Ranges: bytes` always. Parquet readers depend on this, and Cloudflare's static-asset host ignores ranges, which is why release data cannot live there.
   - `ETag`, and `304` for a matching `If-None-Match`.
   - Caching: `manifest.json` is `no-cache`. A file whose name carries a content hash is `public, max-age=31536000, immutable`. Decide which by the same naming rule the pipeline uses, in one shared place.
   - Content type by extension, including `.bin`, `.json`, `.parquet` and `.bcif`.
   - Only keys made of a release name and a bare file name are served. Anything else, including any path that tries to climb out, is a JSON `404`.
   - Unit tests against an in-memory stand-in for the bucket.
2. **One path, locally too.** `corepack pnpm dev` and the preview server load the sample release into wrangler's local R2 and read it through the Worker. Remove the copy that step 1B put in the app's static assets, so there is exactly one way the app gets data.
3. **End-to-end tests through that path.** A ranged request to the running Worker returns exactly the bytes at that offset of the file on disk. The manifest and a hashed file carry their respective cache headers. The existing assertions still pass.
4. **An upload command** for a built release folder. It prints its plan by default (each object, its size, its headers) and changes nothing. With an explicit flag and a token in the environment it uploads, skips hashed files that already exist, never deletes, and reads back what it wrote. Unit-test the planning.

### B. Infrastructure as code

1. `infra/`: an OpenTofu configuration with the Cloudflare provider that creates the releases bucket for staging and for production. Variables for the account ID and names. Local state by default, ignored by git, with the switch to remote state documented. An `infra/README.md`.
2. A separate, optional module for repository settings through the GitHub provider: required checks on `main`, and private vulnerability reporting. Written and validated; not applied.
3. `tofu fmt -check -recursive` and `tofu validate` pass. `tofu` is not installed on this machine. **For this step only, you may run it from the official OpenTofu container image with Docker.** Record the image digest. Add a CI job that runs both commands.
4. In the Worker's configuration, a `staging` environment (deployed from `v2`, on a `workers.dev` address) and a `production` environment (deployed from `main`), each with its bucket binding. No custom domain yet.
5. Create nothing that the skeleton does not use. The database arrives in Phase 5.

### C. Delivery

1. **Deploy on push.** `v2` deploys staging; `main` deploys production. Each run builds, uploads the sample release to that environment's bucket, deploys the Worker, then checks `/api/health` and the manifest on the deployed address and fails if either is wrong.
2. **A preview for each pull request,** with its address posted as one comment that is updated in place. Give only that job the permission to write comments. Use the `pull_request` event, never `pull_request_target`.
3. **Skip, do not fail, when credentials are missing.** With no Cloudflare secrets set, the deploy and preview jobs must finish as skipped. This will be true on your own pushes, and it is how the criterion is checked.
4. **Lighthouse in CI** against the built site served locally. Run it three times and report the spread. Fail the job on accessibility below 95 or best practices below 90. For the performance score, choose between failing and warning based on the spread you measure under software rendering, and say which you chose and why.

### D. The runbook

`docs/runbooks/first-deploy.md`, written for the owner, who has not used Cloudflare for this project:

- what to create, in order, and what each thing is for;
- the exact permissions the API token needs, and nothing broader;
- the commands the owner runs to store the secrets, typed by them and never by a session;
- how to apply the infrastructure code, or the equivalent two commands if they would rather not install OpenTofu;
- how to trigger the first deploy and how to check it worked;
- how to roll back;
- what the free plan allows and what would make it cost money.

### E. Documents

Update the README, the Commands section of `CLAUDE.md` and the repository map. Amend decision record 5 (releases are served through the Worker until a custom domain exists, and what that costs in Worker requests) and decision record 9 (what OpenTofu manages and what the Worker configuration manages).

## Constraints

- **No credentials, no accounts, no real deployments.** Do not run `wrangler login`, `wrangler deploy` without `--dry-run`, or `tofu plan` or `tofu apply` against a real account. If a command asks you to sign in, stop that command.
- Docker may be used only to run OpenTofu.
- Node 20.19 locally and Node 24 in CI; everything works on both. If `node -v` now shows 22 or later, say so in your report and leave the pins as they are.
- Check versions against the registry before pinning.

## Not in scope

Real data, the database, analytics and error-tracking accounts, a custom domain, uptime monitoring, and anything in Phases 2 to 10.

## Done when

Give the command and the last lines of its output for each.

1. In a fresh clone: install, then `corepack pnpm check:all`, exit 0.
2. With the app running locally: a ranged request for the first 16 bytes of the points file returns `206`, the right `Content-Range`, and bytes identical to the file on disk; the manifest is `no-cache`; the hashed file is `immutable`; a repeated request with `If-None-Match` returns `304`; a path containing `..` returns `404`.
3. No release file is left in the app's static assets, and the end-to-end suite passes through the Worker route.
4. `tofu fmt -check -recursive` and `tofu validate` pass, and the CI job for them is green.
5. `wrangler deploy --dry-run` succeeds for `staging` and for `production`. Report the bundle size.
6. `actionlint` is clean. On your last pushed commit, the deploy and preview jobs concluded **skipped**, not failed. Give the run ID and each job's conclusion.
7. The Lighthouse job is green in CI, with the three runs' scores in the report.
8. The upload command's plan for the sample release is shown, and its tests pass.
9. Three mutations, each seen to fail and then restored: one in the range arithmetic, one in the choice of cache header, one in key validation.
10. The runbook exists, lists every owner action with its exact command, and contains no secret and no local path.
11. The tree is clean, the commits are small, and CI is green for your last pushed commit. Give its run ID.

`STATUS: DONE` means these eleven pass. The first real deployment is not one of them; list it under "Blocked on the owner".

## How to work

Decide and document; do not stop to ask. If something needs the owner, mark that one item blocked, write the exact commands, and finish the rest.

## Report

Write `docs/build/reports/phase-1c.md` in the same format as the earlier reports, commit it, push, and reply with the same text. The first line is `STATUS: DONE`, `STATUS: PARTIAL` or `STATUS: BLOCKED`.
