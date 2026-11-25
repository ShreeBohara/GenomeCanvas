# 7. The Guide: TypeScript, tools in the browser, verification in code

Status: Accepted, 2026-11-25

## Context

The Guide answers questions by driving the interface. Its tools need the
browser's state, and its claims must be checked against evidence (plan 4.6).

## Decision

The Guide is written in TypeScript with the official Anthropic SDK. Its tools run
in the visitor's browser. Each turn is two passes, and code, not the model, checks
every sentence against the evidence the tools retrieved. Model calls go through
the Worker's relay under a daily budget, or directly with the visitor's own key.
Evals run in Inspect AI.

## Alternatives rejected

- **A Python agent behind FastAPI.** The tools need the browser's state, and it
  would bring back the server ADR 1 removes.
- **The Claude Agent SDK.** It runs a command-line subprocess needing about 1 GB
  per session, which rules out the browser and the edge.

## Consequences

- No server-side agent state; a turn is replayable as a Trail.
- The budget guard is ours to build (a Durable Object), because Cloudflare's
  rate limits are per location and the paid plan has no hard spending cap.
- Verification logic is ordinary code with ordinary tests.
