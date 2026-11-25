STATUS: DONE
Exit criteria: 10 of 10 passed
Commits: 262c2aa (CI fix) and 8bfa73d..277a143 on v2, then this report's commit. All pushed; CI run 45681620974 green on 277a143.

## First: the CI failure

The first CI run on `v2` (45675910204) failed in the TypeScript job with `sh: 1: pnpm: not found`. The root scripts chained other scripts with a bare `pnpm`. That works on this machine only because a global pnpm happens to sit in the nvm folder; CI has corepack and nothing else. I reproduced it locally with a PATH holding only `node` and `corepack`, changed the scripts to `corepack pnpm …`, ran `check:all` under that PATH (exit 0) and pushed 262c2aa. CI run 45676195241 and the pull request run 45676202708 were both green before I built anything new.

## Exit criteria

"Fresh clone" means `git clone --branch v2 <this repository> <scratch>/clone` at `277a143`, with `COREPACK_ENABLE_DOWNLOAD_PROMPT=0`, on Node 20.19.0, corepack 0.31.0, uv 0.11.29, Python 3.12.8, macOS on an Apple M3 Pro.

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | Fresh clone: install, then `check:all`, exit 0 | Pass | `corepack pnpm install --frozen-lockfile` → `Lockfile is up to date … Done in 2.5s using pnpm v10.34.9`. `(cd forge && uv sync --frozen)`. `corepack pnpm check:all` → exit 0. Its output includes `Tests  49 passed (49)` (protocol), `29 passed` (engine), `7 passed` (ui), `35 passed` (query), `11 passed` (web unit), `First-load JavaScript: 99.6 KB gzip, within the 150.0 KB budget.`, `All checks passed!`, `Success: no issues found in 9 source files`, `81 passed in 0.19s`, `15 sources, 4 verified, checked against 2026-11-25.` and, from Playwright, `11 passed (4.3s)`. |
| 2 | Release builds; row count matches the fixture; two builds byte-identical | Pass | Two `uv run --locked python -m forge.skeleton build --out <scratch>/b1` (and `b2`) runs; `shasum -a 256` in each folder prints the same three lines: `cc3d2c12bd4bc1aad057763ea7321e27c560947ac60a1d2ca2d7c10e33c29462 manifest.json`, `f958edcc94e000e4cdb124115ab1f6ef59b2a0697d5808e2c43320e085269fe2 points.f958edcc94e000e4.bin`, `0c919232e600b9999c0dd22373101d6671b8637d41386c2c28090e884a8ae0d2 proteins.0c919232e600b999.json`. `diff -r` prints nothing. `manifest row_count 54 fixture rows 54`. `test_two_builds_are_byte_identical` checks the same in pytest. |
| 3 | `corepack pnpm dev` serves the app; screenshots at 1,440 and 360 | Pass | Started from scratch with `corepack pnpm dev`: the release builds, then `VITE v8.3.8 ready`, `Local: http://localhost:5173/`. `curl` → page `200`, `/api/health` → `{"status":"ok"}`, `/api/hello` → the three events. Screenshots taken from that server in Chromium on the real GPU: [1,440 light, with a hovered protein](assets/phase-1b-1440-light.png), [360 light](assets/phase-1b-360-light.png), and [1,440 dark](assets/phase-1b-1440-dark.png). |
| 4 | End-to-end suite passes locally, every section F assertion present | Pass | `corepack pnpm check:e2e` → `11 passed (3.8s)`. The F assertions, all in `apps/web/e2e/atlas.spec.ts`: instances equal `row_count` read from the built manifest on disk; draw calls between 1 and 2 (and triangles equal 2 × rows); a pixel statistic on a canvas screenshot (pixels that differ from the background and pixels that are saturated, both scaled by the row count); ArrowRight moves the camera's x and leaves y and zoom alone; hovering the protein with the farthest nearest neighbour, taken from the built index, shows its gene symbol and name; three `hello` events in order through `EventSource`; axe-core 4.14.1 run on the page returns `[]`; with the points file truncated to half by `page.route`, an alert says the map "could not be loaded" and "incomplete or damaged", and no canvas exists. Also: the sample notice is on screen, the health check answers, and every protein is on screen after a resize. |
| 5 | Three mutations seen to fail, then restored | Pass | **Decoder:** disabled the "shorter than 16 + 9n" check in `points.ts`. `vitest run` → `× rejects a file cut off inside the data`, `Tests  1 failed \| 34 passed (35)`. Restored with `git checkout`: `35 passed`. **Engine transforms:** flipped the sign of y in `screenToWorld`. Unit tests → 4 failed (`inverts exactly`, `keeps the point under the cursor fixed while zooming`, both picking tests). Rebuilt; Playwright → `✘ shows a protein's gene symbol and name when it is hovered`, `1 failed, 10 passed`. Restored: `29 passed`. **Pipeline validation:** disabled the duplicate check in `skeleton.py`. `pytest` → `FAILED …test_duplicate_accessions_are_an_error`, `1 failed, 80 passed`. Restored: `81 passed`. **A fourth, for a bug found while building** (see choice 1): removed the refit on resize. Playwright → `✘ fits every protein on screen again after the window is resized`. Restored: `11 passed`. |
| 6 | Bundle check passes; table below | Pass | `corepack pnpm budget` → `First-load JavaScript: 99.6 KB gzip, within the 150.0 KB budget.` Table below. |
| 7 | 20,429-instance measurement recorded | Pass | See "The early measurement" below: **1 draw call, median frame time 16.7 ms** (the display's 60 Hz), measured. |
| 8 | actionlint clean; CI green for the last pushed commit | Pass | `actionlint .github/workflows/*.yml` prints nothing. CI run **45681620974** on `277a143`: `TypeScript … success`, `Python … success`, `Pipeline, web build and end-to-end tests success`; the end-to-end job printed `11 passed (6.0s)` on Ubuntu. This report's commit gets its own run, which I give in my reply. |
| 9 | Format specification, README, Commands, launch entry | Pass | `docs/formats/points-v0.md` (layout, reader rules, a 34-byte worked example both test suites compare against). `README.md` status, quickstart, command table and repository map. The Commands section of `CLAUDE.md` (nothing else in it changed). `.claude/launch.json` has a `web` entry running `corepack pnpm dev` on port 5173; I used it to start the server for criterion 3. |
| 10 | Tree clean, small commits, greps find nothing | Pass | `git status --short` empty after this commit. 16 commits, one concern each, this report included. `git grep -n -I -E "(sk-ant-\|AKIA\|BEGIN (RSA\|OPENSSH) PRIVATE KEY)" -- . ':!docs/build/briefs'` → nothing, exit 1. The same for absolute local paths and the username (`/Users/`, `/home/<name>`, `C:\Users`, the username) → nothing, exit 1, in the whole tree outside `docs/build/briefs/`. |

### Bundle table

`corepack pnpm budget`, gzip at level 9 and brotli at quality 11. KB is 1,000 bytes. The production build is byte-identical between this checkout and the fresh clone (same chunk hashes).

| Chunk | From | Loads | Raw | gzip | brotli |
|---|---|---|---|---|---|
| `assets/index-BjMphCWz.js` | the shell: React, TanStack Router, query, ui, the app | first load | 311.1 KB | **99.6 KB** | 86.6 KB |
| `assets/engine-X5nDCtXW.js` | `@genomecanvas/engine` and three.js | later, by `import()` | 535.0 KB | 132.3 KB | 108.8 KB |
| `assets/index-B7RiawLW.css` | Tailwind and the tokens (not JavaScript) | first load | 12.9 KB | 3.6 KB | — |

The engine chunk starts downloading while the release is still arriving. three.js is imported by name only, but most of its WebGL renderer comes along with `WebGLRenderer`; 132 KB is what that costs. The plan sets no budget for it yet.

### The early measurement

`node apps/web/scripts/measure.mjs 20429 600`, with `corepack pnpm dev` running. It opens `?repeat=20429&measure=600` in Chromium with `--use-angle=metal`, which reports `ANGLE (Apple, ANGLE Metal Renderer: Apple M3 Pro)`, at 1,440 × 900 CSS pixels and device pixel ratio 2. `Atlas.measure` draws 600 frames back to back. Each frame it renders, reads one pixel back to wait for the GPU, and records the time between animation frames. **Measured**, three runs:

| Instances | Draw calls | Triangles | Median frame time | Median draw + GPU wait |
|---|---|---|---|---|
| 20,429 | 1 | 40,858 | 16.7 ms, 16.7 ms, 16.7 ms | 4.6 ms, 4.8 ms, 6.3 ms |
| 54 (for comparison) | 1 | 108 | 16.7 ms | 3.9 ms |

The frame time is the display's refresh interval, so the true ceiling is higher than 60 fps and this number cannot show it. The second column is the more useful one. Most of it is the readback stall, since 54 points already take 3.9 ms. Points are not ribbons: Phase 3's target is 20,429 backbones, and this is only the first floor under it.

## What was built

**A. Pipeline.** `forge/src/forge/points.py` writes points version 0: `GCPT`, version, header length, row count, reserved, then the x column, the y column and one category byte per row, 16 + 9n bytes. `forge/src/forge/skeleton.py` provides `python -m forge.skeleton build --out <folder> [--fixture]`. Validation collects every problem: an accession that fails the UniProt pattern, duplicates, blank gene symbols or names, unknown categories, missing, non-numeric, boolean or non-finite coordinates. If there is any, it writes nothing and exits 1; an unreadable fixture exits 2. Rows are sorted by accession. Data files are named `<stem>.<first 16 hex digits of SHA-256>.<ext>`. The manifest has sorted keys and no timestamps, and records per file the path, bytes, sha256 and format; it also carries `release: "sample-v1"`, `row_count`, the category list with display labels, `sample: true`, a `sample_notice` sentence and the fixture's SHA-256. Stale data files from an earlier build are removed, and the manifest is written last. 81 Python tests (52 new).

**Shared vectors.** `packages/protocol/vectors/uniprot-accessions.json` (5 valid, 12 invalid) is read by `ids.test.ts` and by `forge/src/forge/test_ids.py`. `forge.ids` anchors with `\A…\Z`, because Python's `$` accepts a trailing newline.

**B. `@genomecanvas/query`.** `parseManifest` checks every field. File names must be bare names, so a manifest cannot point outside its folder or at another host. `fetchReleaseFile` checks the byte length, then the SHA-256 through `crypto.subtle`. `decodePoints` returns zero-copy typed-array views and refuses short files (`truncated`), long files (`trailing_bytes`), wrong magic, unknown versions, bad headers, row counts that disagree with the manifest, non-finite positions and out-of-range categories, each with its own code. `loadRelease` also checks that the index's categories agree with the points, row by row. 35 tests.

**C. `@genomecanvas/engine`.** `createAtlas(canvas)` returns an imperative interface: `setPoints`, `setStyle`, `setHighlight`, `resize`, `pick`, `project`, `camera`, `panBy`, `zoomBy`, `fit`, `counters`, `measure` and `dispose`. One `InstancedBufferGeometry` quad with per-instance `aX`, `aY` and `aCategory` attributes, read straight from the decoded arrays, and a GLSL 3 `RawShaderMaterial` that sizes discs in screen pixels and draws the highlighted one larger and on top. That is one draw call. `drawCalls` and `triangles` come from `renderer.info`. `instances` is counted by wrapping the WebGL context's four draw functions, so a test rests on what was submitted. `attachControls` handles drag, wheel and pinch zoom toward the pointer, arrows (Shift for larger steps), plus and minus, and 0 or Home to fit. The glide after a drag stops within 400 ms and is skipped when the system asks for reduced motion. Camera, picking, colour parsing, the key map and the counter are plain modules with 29 tests. No React.

**D. App.** `apps/web`: React 19.3.1, Vite 8.3.8, TanStack Router 1.170.46 (one route), Tailwind 4.3.5 and `@cloudflare/vite-plugin`. The atlas fills the window. The name, the zoom buttons, the sample notice and the legend float over it on solid neutral surfaces, with no card inside a card. Hover shows the nearest protein's gene symbol (monospace) and name in a page element beside the point. Keyboard focus on the map shows a centre ring, labels the protein nearest the centre and reads it out through a polite live region. A visually hidden table lists every protein. The page reads the release only through `VITE_RELEASE_BASE_URL` (default `/release/sample/`). Loading shows a status line. A release that cannot be fetched, or that fails any check, shows an alert in plain words and no canvas, and so does a browser without WebGL 2. From 360 to 2,560 pixels the bottom row stacks on narrow screens. `packages/ui` holds the tokens (colour for light and dark, type scale, spacing, radius, motion, the Okabe–Ito category palette) as CSS variables, mapped into Tailwind with `@theme inline`; 7 tests check contrast.

**E. Worker.** `apps/web/worker/app.ts` is a Hono app under `/api`: `/health` returns JSON, and `/hello` returns three SSE events (`event: hello`, ids 1–3) with `Cache-Control: no-cache, no-transform`. JSON 404 otherwise. Four unit tests through `app.request`. One of them checks that the first chunk read holds only the first event, which a buffered response would fail.

**F. End to end.** See criterion 4. Playwright 1.65.1 runs against `vite preview`, which serves the built assets and the Worker from local workerd, with the SwiftShader flags from `beb2aab`.

**G. Measurement.** The development-only `?repeat=N` and `?measure=N` switches (`apps/web/src/dev-switches.ts`), stripped from production builds by `import.meta.env.DEV`, and `apps/web/scripts/measure.mjs`.

**H. Housekeeping.** `scripts/budget.mjs`. CI has a third job: uv, the release, `build`, `budget`, Chromium with `--with-deps`, Playwright, and the report uploaded on failure (`actions/upload-artifact` v7.0.2, pinned to `cf430e0…`, inputs checked against its `action.yml`). The new root scripts are `dev`, `release:sample`, `budget`, `e2e`, `e2e:install` and `check:e2e`; `check` now ends with `budget`, and `check:all` adds `check:e2e`. Also the launch entry, README, Commands and the ADR 2 amendment.

## Choices that differ from the work order, or that it left open

1. **A bug the tests missed at first.** In `dev`, the canvas was measured before Vite injected the CSS, so the first fit used a 1 × 1 viewport and every point landed on one spot. The production build loads CSS first, so all ten tests passed. Now a resize refits until the reader moves the map. A new end-to-end test covers it, and it fails without the fix (criterion 5).
2. **One Worker with static assets, not `apps/edge`.** Cloudflare's current documentation supports it; ADR 2 is amended with the reasons and the pages read.
3. **wrangler 4.86.0 and `@cloudflare/vite-plugin` 1.34.0, not 4.168.0 and 1.70.2.** wrangler declares Node ≥ 22 from 4.87. The same Node 20 constraint as ADR 11.
4. **axe-core 4.14.1 injected directly, not `@axe-core/playwright`,** whose 4.14 release declares Node ≥ 22.12. It is the same engine with the default rule set.
5. **`@genomecanvas/query` depends on `@genomecanvas/protocol`** for the accession pattern. I read "no dependencies" as no third-party packages; it has none.
6. **The release is served from the app's static assets** (`apps/web/public/release/sample/`, ignored by git) until step 1C moves it to R2. That is a change to `VITE_RELEASE_BASE_URL` only. No `_headers` file yet: caching rules belong with R2.
7. **No code commit in the manifest,** although plan 4.4 lists one: it would make the release change with every commit and break byte-identity for the same inputs. The fixture's SHA-256 is recorded instead.
8. **Picking is a CPU nearest-point scan,** not the off-screen ID buffer in plan 4.7. It is well under a millisecond at 20,429 points and easy to test. Revisit with ribbons.
9. **Keyboard access names the protein nearest the centre** under a ring, read out politely. It is my own design and is not in the order; Phase 4's command bar may replace it.
10. **Value kinds (plan 4.10).** Hand-placed sample positions are none of measured, curated, predicted or generated. The permanent notice stands in for a kind here. Phase 2's real data will carry a kind per value.
11. **The command vocabulary is out of scope,** so the controls and buttons call the engine directly. CLAUDE.md's rule ("nothing mutates view state behind it") applies once the vocabulary exists; these call sites are where it plugs in.
12. **The light theme uses two different category colours from the dark theme** (blue for sky blue, vermillion for yellow), because sky blue and yellow are too faint on white. Each theme is internally consistent, but a category's colour changes between themes.
13. **Workspace packages resolve to their TypeScript sources** through a `source` export condition, and builds switch it off. TypeScript 7 includes no `@types` by default; node types are opted into in test configurations only and kept out of shipped code.
14. **`check:all` now runs the browser tests,** so it needs Chromium once (`corepack pnpm e2e:install`). pnpm runs install scripts for `esbuild` and `workerd` only; `sharp` is left off.
15. **Only the last commit was verified with `check:all`.** Intermediate commits were not each installed and checked; in particular the lockfile lands in the app commit.

## Versions pinned

All checked against the npm registry on 2026-11-25, with `engines` read for Node 20.19.

| Name | Version | Note |
|---|---|---|
| react, react-dom | 19.3.1 | latest |
| @types/react / @types/react-dom | 19.3.3 / 19.3.0 | latest |
| vite | 8.3.8 | latest; `^20.19.0 \|\| >=22.12.0` |
| @vitejs/plugin-react | 6.3.0 | latest |
| @tanstack/react-router | 1.170.46 | latest; `>=20.19` |
| tailwindcss, @tailwindcss/vite | 4.3.5 | latest |
| three, @types/three | 0.187.0 | latest (r187, as the plan names) |
| hono | 4.13.22 | latest |
| wrangler | 4.86.0 | latest is 4.168.0 (Node ≥ 22 from 4.87) |
| @cloudflare/vite-plugin | 1.34.0 | latest is 1.70.2; 1.34.0 is built against wrangler 4.86.0 |
| @playwright/test | 1.65.1 | latest; Chromium 159.0.8154.6 (build 1255) |
| axe-core | 4.14.1 | latest |
| @types/node | 20.19.43 | matches the local Node major |
| actions/upload-artifact | v7.0.2 `cf430e030ddbb5b0abf93d22962f4752f3646cd9` | `gh api …/releases/latest` |

## Blocked on the owner

Nothing in this work order is blocked. For later:

- Node 22 or 24 on this machine would let wrangler, the Vite plugin, pnpm and Vitest move to their current majors, and make local runs match CI.
- The fixture's names and positions are hand-written. They are labelled as sample data everywhere a user sees them and have only been served locally. AlphaFold traces are not used yet.

## For the orchestrator to verify

1. **This report's commit has its own CI run.** I give its ID and result in my reply.
2. **The screenshots and the light palette** (choice 12). Orange (DNA repair) next to vermillion (structural) in the light theme is the closest pair; check it in a colour-vision simulator.
3. **What the truncation test exercises.** In the browser, a truncated file is stopped by the manifest's byte length (`length_mismatch`) before the decoder runs. The decoder's own `truncated` path is covered by unit tests (criterion 5's first mutation).
4. **The measurement method.** Median frame time is capped by vsync, and "draw + GPU wait" includes a readback stall. Both are labelled. A Phase 3 benchmark should use a timer query where one is available.

## Ideas outside this order

- Run the points worked example through the TypeScript decoder from the Python-written bytes in CI, not only against the shared hex string.
- Add Pointer Events tests for `attachControls` with a DOM test environment; today only the pure parts and the end-to-end keyboard path are covered.
- Fit with padding that knows where the floating panels are, so no point sits under the legend at 360 pixels.
- When R2 arrives, serve `manifest.json` with `no-cache` and hashed files as `immutable`.
- Cache the pnpm store, uv and the Playwright browser in CI; the end-to-end job is the slowest.
