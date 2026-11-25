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
