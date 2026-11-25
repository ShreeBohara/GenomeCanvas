# 9. OpenTofu and GitHub Actions for infrastructure and delivery

Status: Accepted, 2026-11-25

## Context

Phase 1 must end with a public skeleton that an empty account can reproduce,
previews per pull request, and a merge reaching production in minutes.

## Decision

Infrastructure is code, written for OpenTofu: the bucket, the Worker, the
database, DNS and repository settings. Delivery runs on GitHub Actions: lint,
types, tests, replays, budgets and previews on every pull request; evals nightly;
a candidate release when a source publishes. Code scanning and automated
dependency updates are on from the start.

## Alternatives rejected

- **Terraform.** Moved to a business-source licence; OpenTofu keeps an open one.
- **Configuring by hand.** Not reproducible from an empty account.
- **Jenkins.** A server to run; GitHub Actions is free for public repositories.

## Consequences

- OpenTofu must be installed by the owner (no global installs by a session).
- Workflows cannot run until the owner allows `v2` to be pushed; until then
  they are validated locally with `actionlint`.
- Actions are pinned to commit SHAs and updated by Dependabot.

## Amendment, 2026-11-25 (step 1C): what OpenTofu manages and what wrangler manages

- **OpenTofu (`infra/`)** manages resources that outlive any one deploy: today
  the two release buckets (`infra/cloudflare`), later the database and DNS. It
  also holds an optional module for repository settings (`infra/github`): a
  ruleset requiring the CI checks on `main`, and Dependabot alerts. Private
  vulnerability reporting has no resource in the GitHub provider (v6.13.0), so
  `infra/README.md` gives the API call instead.
- **wrangler (`apps/web/wrangler.jsonc`)** manages the Worker: its code, its
  versions, its bindings, its `workers.dev` address and preview addresses, for
  the `staging` and `production` environments. These change with every deploy,
  and wrangler's versions and rollback are the right tool for them; managing the
  same Worker from OpenTofu too would give two owners for one resource.
- The bucket names are the seam. They appear in `infra/cloudflare/variables.tf`
  and in `wrangler.jsonc`, and the upload command reads them from
  `wrangler.jsonc`.
- **Not installed on the build machine.** `infra/tofu.sh` runs OpenTofu 1.13.10
  from its official image, pinned by digest, and CI runs `fmt -check` and
  `validate` through the same script. State is local and ignored by git until
  the owner moves it (README, "Remote state").
- **Delivery.** `deploy.yml` deploys staging from `v2` and production from
  `main`; `preview.yml` uploads a version of the staging Worker per pull request
  with its own alias. Both look for the Cloudflare secrets first and are skipped,
  not failed, while there are none.
