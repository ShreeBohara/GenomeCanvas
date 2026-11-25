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
