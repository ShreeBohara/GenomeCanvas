# 11. Tooling

Status: Accepted, 2026-11-25

## Context

Version 1 declared yarn and used npm, and its type checking was loose. 2.0 needs
one fast, strict, reproducible toolchain per language (work order 1A).

## Decision

- **TypeScript:** pnpm workspaces through corepack, TypeScript 7 in strict mode,
  Biome for lint and format, Vitest for unit tests, Playwright for browser tests
  (added in step 1B, when there is a browser to test).
- **Python:** uv with a committed lockfile, ruff for lint and format, mypy in
  strict mode, pytest.
- One command each: `corepack pnpm check`, `corepack pnpm check:py`, and
  `corepack pnpm check:all` for both.

## Alternatives rejected

- **npm or yarn.** pnpm's strict linking catches undeclared dependencies.
- **ESLint and Prettier.** Two tools and many plugins where Biome is one.
- **pyright.** Its PyPI wrapper downloads Node when it runs; mypy is pure Python.
- **pnpm 11 or 12, Vitest 5.** pnpm 11 needs Node 22.13; pnpm 12 ships native
  binaries that corepack 0.31 cannot start; Vitest 5 needs Node 22.12. This
  machine has Node 20.19, so pnpm 10.34.9 and Vitest 4.1.12 are pinned.
- **Node 26 in CI.** Node 25 stopped shipping corepack, so CI uses Node 24 LTS.

## Consequences

- Biome is limited to code files: it now formats Markdown too, and the research
  notes must not be rewritten.
- Upgrading local Node to 24 lets pnpm and Vitest move forward.
