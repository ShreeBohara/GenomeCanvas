# 6. A typed command vocabulary and Trails

Status: Accepted, 2026-11-25

## Context

Version 1's store applied whatever entity ID arrived, and the interface, the
guide and tests each changed the view in their own way (plan sections 1.2 and 4.5).

## Decision

One typed vocabulary describes everything the interface can do. Clicks, keyboard
shortcuts, the Guide, stories, shared links, outside assistants and tests all
produce commands. Four rules: every command is validated against the release
before it is applied; the reducer is a pure function; every command can be
undone; commands say what, never how (no camera poses).

A **Trail** is an ordered list of steps pinned to a data release; each step is a
command, optionally with a claim and its evidence. One format serves sharing,
stories, agent output, free demos, tests, outside assistants and release diffs.

## Alternatives rejected

- **Direct state mutation from each feature (version 1).** Nothing validated
  IDs, and no two callers changed the view the same way.
- **Recording camera poses.** A Trail recorded on a laptop would not replay on a
  phone.
- **Adopting the AG-UI event format now.** Possible later if a second front end
  needs it; not needed for one.

## Consequences

- Undo, redo, replay and end-to-end tests come from one mechanism.
- Every new interface action needs a command first; nothing may bypass it.
- The vocabulary itself lands in Phase 5; step 1A adds only the typed IDs.
