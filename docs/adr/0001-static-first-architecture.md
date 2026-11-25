# 1. Static-first architecture

Status: Accepted, 2026-11-25

## Context

Version 1 ran a FastAPI server whose every response was precomputed data held in
memory. The reference data changes about four times a year, when the sources
publish, and is read-only in between. The project must cost under $20 a month and
stay online for five years with little maintenance (plan sections 4.1 and 6).

## Decision

Compute offline, serve files, query in the browser, keep one small Worker.

- A Python pipeline builds each data release once.
- The release is a folder of immutable files named by content hash.
- The browser reads and queries those files directly.
- One Cloudflare Worker does only what a file cannot: relay model calls under a
  budget, store shared walkthroughs, speak MCP, stamp titles into protein pages.

## Alternatives rejected

- **An API server in the request path (version 1's FastAPI).** Every byte it
  served was static; a server adds patching, cold starts and cost for nothing.
- **A managed database behind an API.** Free tiers pause when idle or are too
  small for the vector sets (see ADR 5).

## Consequences

- No GPU and no database online; delivery is free and cacheable forever.
- A visitor's gene list or sequence never leaves their machine.
- Anything that needs shared mutable state must fit inside the one Worker.
- Releases must be complete and correct before upload: there is no server to
  patch data in place.
