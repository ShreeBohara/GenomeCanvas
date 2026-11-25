# Work order 1B: the walking skeleton

**Phase 1, step B of three.** Step 1A left a clean workspace with one TypeScript package and one Python module. Step 1C will add infrastructure as code and deployment.

## Goal

One small dataset travels the whole path the finished product will use: a pipeline step turns source data into an immutable binary file, the app fetches it, the real engine draws it inside the real shell, and the Worker answers a streamed request. Everything runs locally with one command and is tested end to end. **It should be thin everywhere and fake nowhere.**

## Read first

1. `CLAUDE.md`. Note rule 1 has changed: you may now push `v2` under the conditions it states.
2. `docs/build/STATUS.md` and `docs/build/reports/phase-1a.md`, for what exists and which versions are pinned and why.
3. In `Documents/genomecanvas-2.0-plan.md`: sections 3.6, 4.1, 4.2, 4.3, 4.4 (the release format table only), 4.7 and Phase 1 in section 5.
4. `docs/adr/0002`, `0003`, `0005` and `0011`.

## Before anything else

`v2` was pushed for the first time just before you started, so CI has now run for the first time. Check it: `gh run list --branch v2 --limit 5`. If a run failed, read its log, fix the cause, and get it green before building anything new. Step 1A flagged the untested part: corepack on Node 24 in the TypeScript job.

## What to build

### A. The pipeline step

1. `forge.skeleton`: a command that reads `forge/fixtures/v1/proteins.json` and writes a small release to an output folder (ignored by git): a manifest and two data files.
2. **The points format, version 0.** Little-endian binary: a fixed header (magic bytes, format version, row count), then the x and y layout positions as 32-bit floats, then one category byte per protein. Use only x and y from the fixture; the 2.0 map is flat (plan section 3.6, rule 8). Write the exact layout in `docs/formats/points-v0.md`, with a worked example small enough to check by hand.
3. A protein index file in the same row order as the points: accession, gene symbol, name, category.
4. **Immutable files, from day one.** Each data file is named with a prefix of its SHA-256. `manifest.json` is the only fixed name; it lists each file's path, byte length, full hash and format, the release name, and a `sample: true` flag with a sentence saying the positions are hand-placed version 1 data and not computed.
5. **Determinism.** No timestamps. Building twice gives byte-identical files; a test proves it.
6. Validation with tests: every accession matches the UniProt pattern, no duplicates, no missing coordinates. A row that fails is an error, never a silent skip.
7. Share the identifier test vectors between the two languages: one JSON file of valid and invalid identifiers that both the TypeScript and the Python test suites read.

### B. Reading a release in TypeScript

`packages/query` (`@genomecanvas/query`): fetch and validate a manifest, fetch a file named in it, check its byte length against the manifest, and decode points version 0 into typed arrays. No dependencies. Unit tests include a truncated file, a wrong magic number, a wrong version and a length that disagrees with the manifest; each must be rejected with a specific error.

### C. The engine

`packages/engine` (`@genomecanvas/engine`), on three.js with WebGL 2:

1. A small imperative interface, with no React inside it: create it on a canvas, give it points, resize it, pick the nearest point to a screen position, highlight a point, read counters (instances, draw calls, triangles), dispose of it.
2. **All points in one instanced draw call.** The counters come from the renderer and are what the tests assert on.
3. A flat map camera: drag to pan, wheel or pinch to zoom toward the cursor, arrow keys and plus and minus from the keyboard, a "fit everything" action. No inertia when the system asks for reduced motion.
4. Colour by category, using a palette that stays distinguishable with common colour-vision deficiencies. Keep the palette in the design tokens.
5. The mathematics that does not need a GPU (decoding, screen-to-world transforms, nearest-point picking) is in plain functions with unit tests.
6. Import only what is used from three.js, and report the size of the resulting chunk.

### D. The app and the shell

1. `apps/web`: React 19, Vite, TanStack Router, Tailwind 4. One route. Check Cloudflare's current documentation for running a Worker together with a Vite app. **If one deployable Worker with static assets is supported on the versions you can pin, build it that way** and put the API in the same app; if not, make `apps/edge` a separate Worker. Record which, and why, by amending decision record 2.
2. `packages/ui`: design tokens as CSS variables (colour for dark and light, type scale, spacing, radius, motion durations, the category palette), wired into Tailwind. A system font stack for now; Phase 4 chooses typefaces.
3. **The shell follows plan section 3.6.** The atlas fills the window. Controls float over it. There is no stacked chrome and no card inside a card.
4. What is on screen: the product name; the atlas; on hover or keyboard focus, the gene symbol and protein name of the nearest point; and a small, permanent notice that this is sample data whose positions were placed by hand. Words on screen are about biology. Nothing describes the interface and no internal state is shown.
5. The app reads the release only through one configurable base URL. No data is bundled into JavaScript.
6. Designed loading and failure states. If the release cannot be loaded or fails validation, the page says so in plain words and does not show a broken canvas.
7. Keyboard access to the atlas, a visible focus style, and a text alternative: a visually hidden table of the proteins on the map.
8. Usable from 360 to 2,560 pixels wide.

### E. The Worker

A Hono app with `GET /api/health` and `GET /api/hello`. The second streams three server-sent events, in order, with the correct content type and no buffering. Unit-test both through the app's request method, with no network. Nothing in the interface shows this endpoint; it is plumbing for the Guide in Phase 6.

### F. Tests end to end

Playwright, headless Chromium, with software WebGL so it runs on macOS and in CI. Version 1 needed the same; commit `beb2aab` on `main` shows the flags it used.

Every assertion must name something only the system could have produced:

- the instance count on the canvas equals the row count in the manifest that was just built (read it from disk in the test; do not hard-code 54);
- draw calls for the atlas are at most 2;
- the canvas is not blank (a pixel statistic, not a golden image; golden images come in Phase 5);
- an arrow key changes the camera;
- hovering a known point shows that protein's gene symbol, taken from the built index;
- the three hello events arrive in order;
- an automated accessibility audit of the page finds no violations;
- with the data file deliberately truncated, the failure state appears.

### G. One early measurement

Add a development-only switch that repeats the sample points up to 20,429 instances. Record the median frame time and the draw-call count on this machine at that size. It is one number, labelled as measured, and it is the first evidence for the Phase 3 target.

### H. Budgets, CI and housekeeping

1. A script that fails if the shell's first-load JavaScript, excluding the engine chunk, exceeds 150 KB compressed, and prints the size of every chunk.
2. CI gains the pipeline step, the web build, the budget check and the end-to-end tests, with the Playwright report uploaded when they fail. Keep `actionlint` clean.
3. One command, `corepack pnpm dev`, builds the sample release and starts everything.
4. `.claude/launch.json` gets an entry for the dev server.
5. Update `README.md`, the Commands section of `CLAUDE.md` and the repository map.

## Constraints

- It must work on Node 20.19 locally and Node 24 in CI. Where a current major needs a newer Node, pin the previous one and record it, as step 1A did.
- Check every version against the registry before pinning.
- The fixture's protein data is hand-written. It may be drawn, and it must be labelled as sample data wherever a user can see it.

## Not in scope

Real data, ribbons, Mol*, search, the dossier, the command vocabulary, the Guide, infrastructure as code, deployment, Lighthouse, typeface choices and visual polish beyond what section 3.6 requires.

## Done when

Give the command and the last lines of its output for each.

1. In a fresh clone: install, then `corepack pnpm check:all`, exit 0.
2. The sample release builds, the manifest's row count equals the fixture's, and two builds are byte-identical (show the hashes).
3. `corepack pnpm dev` serves the app. Save screenshots at 1,440 and 360 pixels wide under `docs/build/reports/assets/` and reference them in the report.
4. The end-to-end suite passes locally, with every assertion in section F present.
5. Three mutations, each seen to fail and then restored: one in the decoder, one in the engine's picking or transforms, one in the pipeline's validation.
6. The bundle check passes, and the report includes its table.
7. The 20,429-instance measurement is recorded.
8. `actionlint` is clean, and **the CI run for your last pushed commit is green**. Give its run ID.
9. The format specification, README, Commands section and launch entry are updated.
10. The tree is clean, the commits are small, and `git grep` for secrets and for absolute local paths finds nothing outside `docs/build/briefs/`.

## How to work

Decide and document; do not stop to ask. If something needs the owner, mark that one item blocked, write the exact commands, and finish the rest.

## Report

Write `docs/build/reports/phase-1b.md` in the same format as `phase-1a.md`, commit it, push, and reply with the same text. The first line is `STATUS: DONE`, `STATUS: PARTIAL` or `STATUS: BLOCKED`.
