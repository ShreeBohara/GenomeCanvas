# GenomeCanvas

**GenomeCanvas is a free, open atlas of the human proteome in which any question
becomes a replayable, sourced walkthrough, made by you, by the Guide, or by
another assistant.** It will cover all 20,429 reviewed human proteins, each drawn
as its real backbone, with every value labelled as measured, curated, predicted or
generated, and every source and licence recorded.

## Status

GenomeCanvas 2.0 is being rebuilt from scratch on this branch, `v2`. It has no
interface yet: what exists is the toolchain, one typed package and the licence
ledger. **Nothing is deployed.** Version 1 (Next.js and FastAPI, 54 proteins) is
frozen at tag `v1.0.0` and kept runnable on branch `legacy`.

## Quickstart

You need Node 20.19 or later (CI uses Node 24, see `.node-version`) with corepack,
which ships with Node up to version 24, and [uv](https://docs.astral.sh/uv/)
0.11.29 or later. pnpm is used through corepack; nothing is installed globally.

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm check
```

```bash
cd forge && uv sync --frozen && cd ..
corepack pnpm check:py
```

`corepack pnpm check:all` runs both. The first `corepack pnpm` downloads pnpm and
may ask for confirmation; set `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` to skip that.

| Command | What it does |
|---|---|
| `corepack pnpm lint` | Biome lint |
| `corepack pnpm format` | Biome format, writing changes |
| `corepack pnpm typecheck` | TypeScript in every package |
| `corepack pnpm test` | Vitest in every package |
| `corepack pnpm build` | Build every package |
| `corepack pnpm check` | All of the above, with format in verify mode |
| `corepack pnpm check:py` | ruff, mypy, pytest and the licence ledger check in `forge/` |
| `corepack pnpm check:all` | Both languages |

## Repository map

| Path | What |
|---|---|
| `packages/protocol/` | `@genomecanvas/protocol`: typed entity identifiers |
| `forge/` | The Python data pipeline; today, the licence ledger (`sources.yaml`, `src/forge/ledger.py`) |
| `forge/fixtures/v1/` | Two data files kept from version 1 for the skeleton; not real data, see its README |
| `docs/adr/` | Architecture decision records |
| `docs/licensing.md` | How code and data are licensed |
| `docs/build/` | Build status, work orders and reports |
| `Documents/` | The 2.0 plan and the version 1 specification |
| `reports/`, `research_notes/` | The research behind the plan |

`apps/` and the other packages in the plan arrive in later steps.

## Read more

- The plan: [`Documents/genomecanvas-2.0-plan.md`](Documents/genomecanvas-2.0-plan.md)
- Decisions: [`docs/adr/`](docs/adr/README.md)
- Where the build stands: [`docs/build/STATUS.md`](docs/build/STATUS.md)
- [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Licensing](docs/licensing.md)

## Licence

Code is licensed under [Apache-2.0](LICENSE). The dataset's licence is described
in [`docs/licensing.md`](docs/licensing.md).
