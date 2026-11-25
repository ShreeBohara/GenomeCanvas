# GenomeCanvas

**GenomeCanvas is a free, open atlas of the human proteome in which any question
becomes a replayable, sourced walkthrough, made by you, by the Guide, or by
another assistant.** It will cover all 20,429 reviewed human proteins, each drawn
as its real backbone, with every value labelled as measured, curated, predicted or
generated, and every source and licence recorded.

## Status

GenomeCanvas 2.0 is being rebuilt from scratch on this branch, `v2`. What exists
is a walking skeleton: a pipeline step turns 54 hand-placed sample proteins from
version 1 into a small content-hashed release, and the app draws them as one
instanced draw call on a flat map, served with its API by one Cloudflare Worker.
The Worker serves the release from an R2 bucket with byte ranges and caching, as
production will; locally that bucket is wrangler's own. The cloud resources are
described in OpenTofu, and deploys and pull request previews are wired up and
wait only for the owner's Cloudflare account
([`docs/runbooks/first-deploy.md`](docs/runbooks/first-deploy.md)). **The data
is sample data, and nothing is deployed yet.** Version 1
(Next.js and FastAPI) is frozen at tag `v1.0.0` and kept runnable on branch
`legacy`.

## Quickstart

You need Node 20.19 or later (CI uses Node 24, see `.node-version`) with corepack,
which ships with Node up to version 24, and [uv](https://docs.astral.sh/uv/)
0.11.29 or later. pnpm is used through corepack; nothing is installed globally.

```bash
corepack pnpm install --frozen-lockfile
(cd forge && uv sync --frozen)
corepack pnpm dev
```

`corepack pnpm dev` builds the sample release, loads it into wrangler's local R2,
and serves the app and its Worker at http://localhost:5173. The first `corepack pnpm` downloads pnpm and may ask for
confirmation; set `COREPACK_ENABLE_DOWNLOAD_PROMPT=0` to skip that. The end-to-end
tests need Chromium once: `corepack pnpm e2e:install`.

| Command | What it does |
|---|---|
| `corepack pnpm dev` | Build the sample release, load it into local R2, then serve the app and the Worker with live reload |
| `corepack pnpm release:sample` | Build the sample release into `build/release/sample/` |
| `corepack pnpm release:local` | Load the built sample release into wrangler's local R2 |
| `corepack pnpm deploy:dry-run` | Package the staging and production Workers without uploading anything |
| `corepack pnpm lint` | Biome lint |
| `corepack pnpm format` | Biome format, writing changes |
| `corepack pnpm typecheck` | TypeScript in every package |
| `corepack pnpm test` | Vitest in every package |
| `corepack pnpm build` | Build every package and the app |
| `corepack pnpm budget` | Print every chunk's size; fail if first-load JavaScript is over 150 KB gzip |
| `corepack pnpm check` | All of the above but `dev`, with format in verify mode |
| `corepack pnpm check:py` | ruff, mypy, pytest and the licence ledger check in `forge/` |
| `corepack pnpm check:e2e` | Build the release and the app, load local R2, then run the Playwright tests |
| `corepack pnpm check:all` | `check`, `check:py` and `check:e2e` |

## Repository map

| Path | What |
|---|---|
| `apps/web/` | The app (React, Vite, TanStack Router, Tailwind) and its Worker (`worker/`: the Hono API and the `/release/` route over R2), deployed as one Worker with static assets; environments in `wrangler.jsonc`; Playwright tests in `e2e/` |
| `apps/web/scripts/` | The bundle budget, the GPU measurement, the release upload command (`release-upload/`) and the post-deploy check (`deploy-check/`) |
| `packages/protocol/` | `@genomecanvas/protocol`: typed entity identifiers, the naming rule for release files, and test vectors shared with Python (`vectors/`) |
| `packages/query/` | `@genomecanvas/query`: fetches a release, checks lengths and hashes, decodes the points format |
| `packages/engine/` | `@genomecanvas/engine`: the atlas renderer on three.js and WebGL 2; no React |
| `packages/ui/` | `@genomecanvas/ui`: design tokens as CSS variables, wired into Tailwind |
| `forge/` | The Python data pipeline: the licence ledger, and `forge.skeleton`, which builds the sample release |
| `forge/fixtures/v1/` | Two data files kept from version 1 for the skeleton; not real data, see its README |
| `infra/` | OpenTofu: the release buckets (`cloudflare/`) and optional repository settings (`github/`) |
| `tools/lighthouse/` | Lighthouse, three runs against the built site; its own lockfile, run in CI |
| `.github/workflows/` | CI, CodeQL, deploy on push, and a preview per pull request |
| `docs/formats/` | Binary and file formats, starting with `points-v0.md` |
| `docs/runbooks/` | Steps only the owner can take, starting with `first-deploy.md` |
| `docs/adr/` | Architecture decision records |
| `docs/licensing.md` | How code and data are licensed |
| `docs/build/` | Build status, work orders and reports |
| `Documents/` | The 2.0 plan and the version 1 specification |
| `reports/`, `research_notes/` | The research behind the plan |

`packages/agent`, `python/` and `evals/` arrive in later steps.

## Read more

- The plan: [`Documents/genomecanvas-2.0-plan.md`](Documents/genomecanvas-2.0-plan.md)
- Decisions: [`docs/adr/`](docs/adr/README.md)
- Where the build stands: [`docs/build/STATUS.md`](docs/build/STATUS.md)
- [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Licensing](docs/licensing.md)

## Licence

Code is licensed under [Apache-2.0](LICENSE). The dataset's licence is described
in [`docs/licensing.md`](docs/licensing.md).
