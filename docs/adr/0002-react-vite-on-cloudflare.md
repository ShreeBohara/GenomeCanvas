# 2. React with Vite and TanStack Router on Cloudflare

Status: Accepted, pending owner confirmation, 2026-11-25

## Context

The app is a client-side instrument over static data (ADR 1). Nothing in it needs
a rendering server. Hosting must be close to free and must not pause when idle.

## Decision

React 19, Vite 8 and TanStack Router, built to static files and served from
Cloudflare: static assets, R2, one Worker, D1 and Durable Objects, one vendor.
Requests for static assets are free and unlimited.

## Alternatives rejected

- **Next.js 16 on Vercel's free plan.** The lower-friction path and the one the
  owner knows. It carries a 100 GB monthly transfer guideline, a server framework
  that shipped security releases almost monthly in 2026, and features this app
  would not use. The choice is close, which is why it waits on the owner.
- **The old spec's Vercel, Render, Neo4j Aura, Supabase and Upstash.** Five
  vendors, two of which pause when idle.
- **Azure Container Apps and Cosmos DB (the August design).** $13–15 a month for
  capacity a static design does not need.

## Consequences

- No server to patch; the app shell is plain files.
- Byte-range requests are not served by the static-asset host, so data lives on
  R2 instead.
- At most 20,000 files per deployment, so protein pages are one shared page that
  the Worker fills in.
- If the owner chooses Next.js instead, this record is superseded before step 1B.

## Amendment, 2026-11-25 (step 1B): one Worker with static assets

The app and its API ship as **one Cloudflare Worker with static assets**, in
`apps/web`, not as a separate `apps/edge` Worker.

- Cloudflare's Vite plugin lists "single-page applications, with or without an
  integrated backend API" as a use case, and its "React SPA with an API"
  tutorial uses exactly this layout: `main: ./worker/index.ts`,
  `not_found_handling: "single-page-application"`, `run_worker_first: ["/api/*"]`
  (developers.cloudflare.com/workers/vite-plugin/, modified 2026-11-06, and
  …/vite-plugin/tutorial/, modified 2026-09-05; read 2026-11-25).
- `vite dev` and `vite preview` run the Worker in a local workerd process, so the
  end-to-end tests exercise the files and the API together, as deployed.
- **Pinned behind the current release, because of Node 20.19 on this machine.**
  wrangler 4.87 and later require Node 22; 4.86.0 is the last that accepts 20.3,
  and `@cloudflare/vite-plugin` 1.34.0 is the release built against it. Current
  versions are wrangler 4.168.0 and plugin 1.70.2. Both move forward when local
  Node reaches 22 (ADR 11).
- The sample release is served from the same static assets for now
  (`/release/sample/`). Step 1C moves releases to R2; the app reads them only
  through `VITE_RELEASE_BASE_URL`, so that is a configuration change.

Rejected: a separate `apps/edge` Worker. It would mean two deployments, two
configurations and a cross-origin API for no gain at this size; the Worker can
still be split out later, because the API is a Hono app with no dependence on the
asset binding.
