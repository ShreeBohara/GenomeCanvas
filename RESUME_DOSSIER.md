# GenomeCanvas — Engineering Dossier

Raw source material for a resume corpus, an interview, or a conversation with a hiring manager.
Not resume copy. Written for an engineer who has never seen the repo and needs to be able to
defend every claim in it.

**Convention:** `[measured]` = counted or executed against this repo. `[estimated]` = a
calculation or comparable-product benchmark, with the arithmetic shown so it can be defended or
discarded. Unmarked statements are plain facts from the source. Nothing here is asserted as
measured that was not actually measured.

---

## At a glance

| | |
|---|---|
| **What** | A navigable 3D universe of real AlphaFold protein structures, wired to a biomedical knowledge graph and an AI guide that drives the interface rather than talking beside it |
| **Stack** | Next.js 14 · TypeScript · Three.js / react-three-fiber · Mol* · FastAPI · Pydantic v2 · Zustand · Claude API |
| **Hand-written code** | ~7,650 lines across 71 files `[measured]` |
| **Generated data** | 1.72 MB of fixtures: 54 proteins, 187 graph nodes, 217 edges, 14,904 interpolated backbone vertices `[measured]` |
| **Tests** | **38 passing** across 3 runners — 25 backend (unittest), 13 frontend (vitest), plus 5 Playwright specs `[measured]` |
| **Backend suite runtime** | 0.092 s `[measured]` |
| **Real AlphaFold structures** | 52 of 54; the 2 fallbacks are exactly the 2 proteins above AlphaFold DB's 2,700-residue ceiling `[measured]` |
| **External calls at request time** | Zero. Everything is precomputed and in-memory. |
| **Cost per AI turn** | ~$0.003 (Haiku 4.5) → ~$0.009 (Sonnet 5) `[estimated]` |
| **Repo** | https://github.com/ShreeBohara/GenomeCanvas |
| **Live URL** | None yet — deploy config now in repo, not yet provisioned |

**The one-sentence version:** *AlphaFold published 214 million protein structures and gave the
world a file browser; GenomeCanvas is an attempt at a cockpit.*

---

## Identity

**Name:** GenomeCanvas

**What it is, plainly.** A local-first full-stack web application that turns AlphaFold's predicted
protein structures into something you can fly through.

The main viewport is a 3D scene where 54 human proteins float as their **actual alpha-carbon
backbone ribbons** — not spheres, not sprites — positioned by UMAP coordinates so functionally
similar proteins cluster together, and colored **per vertex** by AlphaFold's own pLDDT confidence
palette. A protein that AlphaFold is confident about glows blue along its structured core and
fades to orange through its disordered loops. You are looking at the model's uncertainty, drawn
onto the geometry.

Double-click a ribbon and the viewport hands off to a full Mol* molecular viewer — the same engine
PDBe, PDBe-KB, and AlphaFold DB themselves ship — loaded with that protein's real predicted
structure. A right-hand rail holds a force-directed knowledge graph of proteins → diseases → drugs
→ clinical trials, and an LLM chat panel.

The chat is what makes it one product instead of four panels. Ask *"show me proteins involved in
Alzheimer's disease"* and the backend answers with a stream that carries **UI commands before it
carries prose**: the universe dims every non-matching protein to 12% opacity, the graph re-roots on
the disease node, the camera solves a new framing and eases into it — and only then does the first
sentence of narration arrive. The interface moves before it speaks.

Underneath that, a deliberate safety property: every answer is constructed from local data
*first*, and the language model is a re-narration layer on top of an already-correct answer. If the
model fails for any reason — no key, network error, malformed JSON, schema mismatch — the grounded
answer ships unchanged and the user never learns anything went wrong.

**Repo URL:** https://github.com/ShreeBohara/GenomeCanvas

**Live URL:** none yet. As of 2026-08-06 the repo contains `vercel.json`, `backend/Dockerfile`,
`render.yaml`, and a three-job GitHub Actions workflow — but neither target has been provisioned.
Say this plainly: *the deployment is configured, not executed.*

**Current status:** working local full-stack MVP with CI defined. All **38 tests pass**
`[measured]`.

**Languages and size** `[measured]` — excludes `node_modules`, `.next`, `.venv`, lockfiles, and
the vendored Mol* bundle:

| Language | Files | Lines |
|---|---:|---:|
| TypeScript `.tsx` | 16 | 2,645 |
| Python `.py` | 28 | 2,186 |
| TypeScript `.ts` | 13 | 1,311 |
| CSS | 1 | 760 |
| Markdown (README + spec) | 2 | 461 |
| JSON config | 6 | 117 |
| YAML (CI + Render) | 2 | 114 |
| Dockerfile | 1 | 30 |
| JS `.mjs` | 2 | 27 |
| **Hand-written total** | **71** | **~7,650** |

This dossier itself (1,300+ lines of Markdown) is excluded from that count.

Generated / fixture data, tracked in git `[measured]`:

| File | Size | Contents |
|---|---:|---|
| `backend/app/data/protein_structure_assets.json` | 1.56 MB | 54 proteins × 3 LOD backbone traces + per-residue pLDDT + camera hints |
| `backend/app/data/knowledge_graph.json` | 87 KB | 187 nodes, 217 edges |
| `backend/app/data/proteins.json` | 80 KB | 54 protein records with disease / drug / GO annotations |

Vendored, **not** tracked (gitignored, regenerated by `npm postinstall`):
`frontend/public/vendor/molstar-viewer/` — 4.9 MB `molstar.js` + 76 KB `molstar.css` `[measured]`.

**Dependencies** `[measured]`: frontend 9 runtime + 14 dev, **817 packages** in the lockfile.
Backend **6 pinned** — `fastapi`, `uvicorn`, `pydantic`, `anthropic`, `httpx`, `python-dotenv`.
**Zero database drivers.** No Neo4j, no Postgres, no Redis, no ORM, no connection pool.

---

## Timeline

**Committed history through 2026-03-17** `[measured]`:

```
2026-03-14  1be1ba8  Initial commit
2026-03-14  4b920d6  Add backend
2026-03-16  0ebcf6a  Add frontend with 3D protein universe and knowledge graph
2026-03-16  f1c67d9  Merge pull request #1 from ShreeBohara/claude/serene-lamarr
2026-03-17  72b82c2  Build immersive GenomeCanvas experience
2026-03-17  c1dfe8a  Merge origin/main into immersive branch
2026-03-17  d4dedb0  Remove stale frontend scaffold after main merge
```

- **First commit:** 2026-03-14. **Original active window:** 4 calendar days.
- **Commits before 2026-04-01: 7.**
- **Commits on or after 2026-04-01: 2** — both landed 2026-08-06, described below.

**Two distinct pushes of work, four and a half months apart:**

| Phase | Dates | Shape |
|---|---|---|
| **Phase 1 — build** | 2026-03-14 → 03-17 | Spec, backend, data pipeline, first 3D universe, chat protocol. 7 commits. |
| **Phase 1.5 — rewrite** | 2026-03-18 | A ~2,900-line frontend rewrite that was **never committed** — it sat uncommitted in the working tree for 141 days. Verified: it existed on no local or remote branch and in no stash `[measured]`. |
| **Phase 2 — harden** | 2026-08-06 | The rewrite committed at last, plus three resolution bugs found and fixed, a streaming-protocol correction, dead-code removal, +13 tests, CI, and deploy config. |

That 141-day gap is the honest shape of the project: an intense build, a rewrite that was finished
but never landed, and a later pass that committed it and then went looking for what was actually
broken.

---

## What is new since 2026-04-01

Everything in this section is dated **2026-08-06** and is genuinely new. It splits into two very
different kinds of work.

### A. The 2026-03-18 rewrite, finally committed

A ~2,900-line frontend rewrite that existed only in the working tree until now. If your resume was
written from the GitHub history, it describes the *pre-rewrite* application and is missing all of
this.

**A1. UI shell: one monolith → slot-based composition.**

*Before* (`72b82c2`): `GenomeCanvasApp.tsx` was a 593-line component that rendered the whole
application inline — HUD header, search palette, floating prompt chips, hover card, and three
overlay drawers. The graph lived in `GraphPanel.tsx` as a modal drawer with a `.drawer-scrim`;
opening it put a scrim over the 3D scene. `globals.css` was 686 lines with **2** media queries and
no token layer.

*After*: six components behind a slot API.

| File | Lines | Role |
|---|---:|---|
| `components/WorkspaceShell.tsx` | 43 | Pure layout. Takes `commandBar`, `viewport`, `graph`, `guide`, `stageOverlay`, `stageFooter` as `ReactNode` slots. Zero state, zero imports beyond React. |
| `components/CommandBar.tsx` | 155 | Docked top bar: search, inline result cards with four action verbs each, status pills, rail toggles. Fully controlled — no internal state. |
| `components/UniverseViewport.tsx` | 105 | 3D canvas + Fit all / Center selection / Reset view toolbar + status row. |
| `components/StructureViewport.tsx` | 129 | Focus-mode layout: Mol* stage + sidebar with function text, disease/drug chips, nearby structures, pLDDT metrics. |
| `components/GraphWorkspace.tsx` | 328 | Persistent rail panel: 1-hop/2-hop segmented control, `ResizeObserver` sizing, custom canvas painter, entity-detail strip. |
| `components/GuideWorkspace.tsx` | 272 | Persistent rail panel: starter prompts, streaming thread, per-message action and source chips. |

`GenomeCanvasApp.tsx` is still ~597 lines but its job inverted — it now only subscribes to store
slices, owns async hydration effects, and wires callbacks into slots. It renders no layout of its
own beyond one wrapper `div`.

`globals.css` was rewritten to 759 lines with a **24-variable `:root` token block** and **3**
breakpoints (1320 / 980 / 720 px). `layout.tsx` gained `next/font` — Space Grotesk and Newsreader,
self-hosted at build time, exposed as `--font-sans` / `--font-display`.

**The overlay/scrim model is gone.** The rail is a CSS-grid sibling of the 3D stage, so the
universe is never covered — panels collapse to a one-line summary strip instead of unmounting.

**A2. Camera system: per-frame lerp → bounds-solving with eased transitions.** New module
`lib/viewport.ts` (113 lines). Full treatment in **WS-7**; it did not exist in any commit.

**A3. 3D scene additions.** `ProteinUniverse.tsx` grew +287 / −60: the camera rewrite, a new
`ClusterLabels` component (floating `drei/Text` per functional category at the cluster centroid),
and cluster-fog radius changed from a fixed `4.2` to `max(4.6, sqrt(count) · 2.6)` so the halo
scales with cluster population.

**A4. Store: +117 lines, new state-machine concepts.** `viewportPreset`, `viewportRevision`,
`rightRailSections`, `graphHops`, `graphSelectionId`, and rewritten `spotlightEntity` /
`focusProtein` / `leaveFocus` / `applyCommand`.

**A5. Compatibility shims.** `ChatPanel.tsx` reduced to **one line** re-exporting `GuideWorkspace`
so `chat-panel.test.tsx` survived the refactor unmodified; `StructurePanel.tsx` reduced to a
37-line adapter. Deliberate adapter-at-the-seam technique — see WS-8.

**A6. Three new test files** (`viewport.test.ts`, `graph-workspace.test.tsx`,
`workspace-shell.test.tsx`), a `ResizeObserver` + `scrollIntoView` stub in `test.setup.ts`, and
retargeted e2e specs.

### B. Correctness hardening — new work, 2026-08-06

This is the part that would not exist without going back and adversarially probing the code. Three
of these shipped **confidently wrong answers to the user**.

**B1. Stopword-driven entity resolution (severity: high, user-visible).**

`GET`-equivalent probe: asking **`"show me the app"`** returned a paragraph about
**Congenital bilateral absence of the vas deferens.**

The failure chain had three independent links, each individually reasonable:
1. `overlap_score(query, candidate)` counted **all** shared tokens. The query and that disease label
   share exactly one word — `"the"` — giving `1/5 = 0.2`.
2. `GraphService.search_nodes` admitted any node scoring `> 0`, so 0.2 won when nothing better
   matched.
3. `ChatService.build_response` routed to the disease branch whenever a disease resolved *and* the
   message contained `"show"`.

Fixes: a 96-word `STOPWORDS` set and a `significant_tokens()` helper in `core/text.py`;
`overlap_score` now scores only non-stopword tokens ≥2 chars; `search_nodes` gained a
`MIN_SEARCH_SCORE = 0.34` floor and returns `[]` outright for a query with no significant tokens;
and `build_response` now resolves an explicitly-named protein **first** and lets it outrank
disease-shaped phrasing.

**B2. Gene symbols matched inside ordinary English words (severity: high).**

`_resolve_protein` used raw substring containment. Measured collisions `[measured]`:

| Message | Spuriously matched gene |
|---|---|
| `"show me the application logs"` | **APP** (amyloid-beta precursor protein) |
| `"describe the appearance"` | **APP** *and* **DES** (desmin) |
| `"what is a des value"` | **DES** |

Eight of 54 gene symbols are three characters — APP, ATM, ATR, DES, FN1, RB1, SRC, VIM `[measured]`
— so this was not an edge case, it was a standing collision surface. Fixed with a new
`contains_term()` using lookarounds rather than `\b`, because gene symbols are alphanumeric and
must not match inside a longer alphanumeric run: `BRCA1` must match in `"what does BRCA1 do?"` and
must **not** match in `"the BRCA12 variant"`.

**B3. Property-value substring matching returned unrelated drugs at score 1.0 (severity: medium).**

`search_nodes` scored against every stringified node property. Every drug carries
`drug_type: "Therapeutic"` — and `"the"` is a substring of `"therapeutic"`, so
`search_nodes("the")` returned Berzosertib, Bosutinib, Cobimetinib… each at **1.0**, the maximum
possible score `[measured]`. Fixed by the same whole-term matching, with a separate `starts_term()`
prefix tier at 0.85 so type-ahead (`"alzh"` → *Alzheimer's disease*) still works.

**B4. Streaming protocol dropped paragraph structure (severity: low, cosmetic but pervasive).**

`chunk_text` split on `\n` and discarded the separators; the client rejoined every chunk with a
single space. The backend deliberately writes two-paragraph responses; **all of them rendered as
one block.** Fixed by adding a `TextChunk(paragraph, text)` dataclass, emitting
`{"text": …, "paragraph": N}` on the SSE `chunk` event, and making the store insert `"\n\n"` on a
paragraph-index change — plus `white-space: pre-wrap` on the message body so the break renders.
The wire field is optional and defaults to 0, so it is backward-compatible.

**B5. Deprecated model pin.** `config.py` defaulted `ANTHROPIC_MODEL` to
`claude-sonnet-4-20250514`, deprecated with a retirement date of 2026-06-15 — two months past.
Now `claude-sonnet-5`. Notably the app had *not* been failing: `LLMNarrator` catches every
exception, so a 404 on a retired model silently produced the grounded answer. The fallback design
had been quietly absorbing a dead dependency.

**B6. Dead code removed.** `components/GraphPanel.tsx` (223 lines, unimported),
`public/molstar-viewer.html` (57 lines, orphaned iframe wrapper from an earlier Mol* attempt), and
`scripts/fetch-backbones.mjs` (178 lines, wrote to `frontend/src/` which was deleted in `d4dedb0`).
All three verified unreferenced before deletion `[measured]`.

**B7. +13 tests.** New `backend/tests/test_resolution.py` (11 tests) is an adversarial probe suite —
every test pins an input that previously produced a wrong answer. Two new store tests pin the
paragraph-rejoin behavior. Backend went 14 → **25**; frontend 11 → **13**.

**B8. CI and deployment configuration.** A three-job GitHub Actions workflow (backend unittest;
frontend typecheck + lint + vitest + production build; Playwright smoke behind both), plus
`vercel.json`, `backend/Dockerfile` (non-root user, healthcheck, fixtures baked in), and
`render.yaml`. Before this, 38 passing tests were run by nobody automatically.

---

## Architecture

### The whole system

```
┌──────────────────────────── BROWSER ─────────────────────────────┐
│ Next.js 14 App Router · page.tsx → one client component          │
│                                                                   │
│  GenomeCanvasApp ── async hydration + 30 store subscriptions      │
│        │                                                          │
│        ├─► zustand store (lib/store.ts) — single flat store       │
│        │     universe[] · universeAssets{} · structureAssets{}    │
│        │     proteinDetails{} · graphData · chatSession[]         │
│        │     selectedEntity · experienceMode                      │
│        │     viewportPreset + viewportRevision                    │
│        │     rightRailSections{graph,guide}                       │
│        │                                                          │
│        └─► WorkspaceShell (6 ReactNode slots)                     │
│              ├─ CommandBar ......... search · 4 verbs per result  │
│              ├─ STAGE (never occluded)                            │
│              │   UniverseViewport ⇄ StructureViewport             │
│              │     └ ProteinUniverse — r3f Canvas                 │
│              │         CameraRig · ClusterMist · ClusterLabels    │
│              │         ProteinRibbon × 54  (halo + core Lines)    │
│              │     └ MolstarViewport — side-loaded UMD, 4.9 MB    │
│              └─ RAIL (grid sibling, collapses not overlays)       │
│                  ├─ GraphWorkspace ... canvas force graph         │
│                  └─ GuideWorkspace .... streaming chat            │
│                                                                   │
│  lib/api.ts — fetch + hand-rolled SSE reader (\n\n framing)       │
└───────────────────────────┬───────────────────────────────────────┘
                            │  HTTP · text/event-stream
┌───────────────────────────▼───────────────────────────────────────┐
│ FastAPI · app/main.py                                             │
│  lifespan() builds the object graph ONCE:                         │
│    FixtureRepository → ProteinService                             │
│                     → GraphService                                │
│                     → ChatService(repo, protein, graph, Narrator) │
│  parked on app.state; routers pull via Depends(Request)           │
│                                                                   │
│  /api/proteins   universe · universe-assets · search              │
│                  {id} · {id}/similar · {id}/structure-asset       │
│  /api/graph      neighborhood/{id} · search · path · query        │
│  /api/chat       message → text/event-stream                      │
│  /api/health     loaded counts                                    │
└───────────────────────────┬───────────────────────────────────────┘
                            │  in-process · zero network
┌───────────────────────────▼───────────────────────────────────────┐
│ FixtureRepository — everything in RAM for the process lifetime    │
│   proteins_by_id          dict[str, ProteinDetail]         54     │
│   nodes_by_id             dict[str, GraphNode]            187     │
│   edges                   list[GraphEdge]                 217     │
│   adjacency               defaultdict[str, [(nbr, edge)]]         │
│   structure_assets_by_id  dict[str, ProteinStructureAsset] 54     │
└───────────────────────────┬───────────────────────────────────────┘
                            │  OFFLINE · npm run build:fixtures
┌───────────────────────────▼───────────────────────────────────────┐
│ structure_asset_builder.py                                        │
│   AlphaFold DB REST → prediction entry → .pdb                     │
│   → CA extraction (fixed-column) → centroid removal + normalize   │
│   → arc-length resample × 3 LOD tiers → pLDDT histogram           │
│ fixture_builder.py                                                │
│   two mismatched JSON sources → canonical IDs → merged graph      │
└───────────────────────────────────────────────────────────────────┘

External services actually contacted:
  AlphaFold DB REST  — BUILD TIME ONLY, never during a request
  Anthropic Messages — optional; absent key ⇒ deterministic path
  UniProt            — link targets in citations only, never fetched
```

### One chat turn, end to end

This is the most interesting path in the system. Nine steps:

```
 1  GuideWorkspace snapshots UI context from the store
      {selected_entity, selected_protein, graph_root, universe_filter, highlighted_ids}
                                   │
 2  POST /api/chat/message  ───────┘
                                   │
 3  ChatService resolves the entity BEFORE any model is involved
      a. protein explicitly named in the message?   ← whole-term match, wins outright
      b. protein pinned in the UI context?
      c. ranked search with a 0.75 score floor
      d. disease resolved only if no protein was named
                                   │
 4  Branch on intent → build a ChatEnvelope entirely from fixture data
      {response: str, commands: [ChatCommand], sources: [ChatSource]}
      Command target_ids come from entities resolved 3 lines earlier,
      so they are guaranteed to exist.
                                   │
 5  LLMNarrator.narrate({message, context, grounded_response})
      returns None on ANY failure ─────────────┐
                                   │           │
 6  return llm_response or grounded ◄──────────┘   ← the entire safety argument
                                   │
 7  SSE serialization, ORDER IS DELIBERATE:
      event: sources   ──►  citations first
      event: command   ──►  ×N   ★ UI RECONFIGURES HERE
      event: chunk     ──►  ×M   {text, paragraph}
      event: done
                                   │
 8  lib/api.ts buffers bytes, splits on "\n\n", dispatches.
      The command handler is AWAITED, so load_structure finishes
      hydrating detail + asset before the next event is processed.
                                   │
 9  store.applyCommand mutates shared state → every panel already subscribed
```

**Step 7 is the design.** Commands precede prose, so the universe filters, the graph re-roots, and
the camera starts easing while the first sentence is still being chunked.

**Step 6 is the safety.** One line. Either the model improved the wording, or the deterministic
answer ships. There is no degraded mode, no "AI unavailable" banner, no partial answer.

### Storage

There is none, deliberately. Three JSON files deserialized into Pydantic models at process start
and held in dicts. `FixtureRepository` exposes exactly four read methods — `list_proteins`,
`get_protein`, `neighbors`, `get_structure_asset` — so a Neo4j or Postgres implementation is a
drop-in that changes one line in `lifespan()` and nothing above it. Stated as an explicit decision
in `README.md`, not an omission.

---

## Workstreams

### WS-1: Fixture canonicalization and knowledge-graph construction

**What and why.** Two source files were authored independently — `proteins.json` with nested
disease and drug objects, `knowledge_graph.json` with its own node/edge ID scheme — and their IDs
did not agree. The same disease existed as free text inside a protein record and as a node under
some other ID, so a click in the detail panel could not resolve to a node in the graph.
`fixture_builder.py` is the reconciliation pass that rebuilds both into one bundle where every
reference resolves.

**Files.** `backend/app/repositories/fixture_builder.py` (303), `backend/app/core/text.py`
(`slugify`), `backend/scripts/build_fixtures.py`, `backend/tests/test_data_consistency.py`.

**Dates.** 2026-03-17. **New since 2026-04-01:** No.

**Technique.** Deterministic ID canonicalization with a rewrite map.
`_canonical_node_id(type, label, existing_id)` emits `"{type}:{slugify(label)}"` for diseases,
drugs, pathways, and GO terms; passes proteins through as their UniProt accession; and for trials
regex-extracts `NCT\d+` from either the label or the existing ID to emit `trial:nct01234567`.
Every `register_node` call records `id_map[existing_id] = canonical_id`, and pre-existing edges are
rewritten through that map **before** registration. Node merging via `_merge_properties` only
overwrites when the incoming value is not `None`/`""`/`[]`/`{}`, so a node registered from a
protein record and later from a graph node accumulates properties instead of losing them. Edge
dedup is a dict keyed on the `(source, target, label)` triple. Output is fully sorted, so a rebuild
produces a clean diff or no diff — never noise.

**Hardest part.** The ordering constraint. Protein-derived nodes must register before edges are
rewritten, because `id_map` is populated as a *side effect* of registration. Get it wrong and edges
point at IDs that no longer exist — no exception, just an empty graph. What makes this safe rather
than fragile is `test_data_consistency.py`, which asserts that every protein accession, every
nested disease id, every nested drug id, and both endpoints of all 217 edges resolve into the node
set. That test is the contract.

**Scale demonstrably handled** `[measured]`: 54 proteins → 187 nodes (76 disease, 54 protein,
42 drug, 15 trial) and 217 edges (118 `ASSOCIATED_WITH`, 47 `TARGETS`, 20 `INTERACTS_WITH`,
17 `INVESTIGATED_IN`, 15 `STUDIES`). **Zero isolated nodes.**

Deeper topology, computed fresh `[measured]`:

| Property | Value |
|---|---|
| Connected components | 22 |
| Largest component | 101 nodes — **54.0%** of the graph |
| Diameter of largest component | **8 hops** |
| Mean shortest-path length | **4.08 hops** |
| Degree distribution | 87 nodes at degree 1, 50 at 2, 13 at 3, 13 at 4, 11 at 5, 4 at 6, 7 at 7, 1 at 10, 1 at 18 |
| Max degree | 18 (`disease:breast_cancer`) |

That degree distribution is heavy-tailed in the way real biomedical knowledge graphs are — a long
tail of degree-1 leaf entities and a handful of hubs. It is a genuine small-world structure at
small scale, not a synthetic uniform graph.

`[estimated]` The whole canonicalization pass runs inside the 0.092 s backend suite, so it is well
under 50 ms. At the spec's 10,000-protein target it would be ~35,000 nodes / ~200,000 edges; the
only super-linear step is the final sort at O(E log E), so single-threaded it should stay under 5 s.

**Proposed lenses (PROPOSED — starting point, not a verdict):**
backend **4/5** (least glamorous, most load-bearing code in the repo — reconciling mismatched
sources is a real data-engineering problem with a real test) · swe **4/5** (deterministic output,
composite-key dedup, non-destructive merge, enforceable invariant) · systems 2/5.

---

### WS-2: AlphaFold structure asset pipeline (CA extraction → LOD generation)

**What and why.** The universe renders each protein as its real backbone. That needs the
alpha-carbon trace of an actual AlphaFold model — but a full model is thousands of atoms, and
fetching 54 of them at page load would be tens of megabytes. This pipeline runs offline, pulls
every model once, reduces each to three fixed-size polylines, and bakes the result into one file
the API serves from memory.

**Files.** `backend/app/repositories/structure_asset_builder.py` (260),
`backend/scripts/build_fixtures.py`, output `protein_structure_assets.json`.

**Dates.** 2026-03-17. **New since 2026-04-01:** No.

**Technique, step by step.**

1. **Prediction resolution** — `GET alphafold.ebi.ac.uk/api/prediction/{accession}`, then select the
   entry whose `uniprotAccession` matches *and* whose `sequenceStart == 1`, falling back to entry 0.
2. **CA extraction from PDB fixed-column format** — slices by byte offset, not whitespace splitting:
   `line[12:16]` atom name, `[21:22]` chain, `[22:26]` residue number, `[30:38]/[38:46]/[46:54]`
   coordinates, `[60:66]` the B-factor field, which in AlphaFold models carries **pLDDT (0–100)**,
   not a crystallographic B-factor. A `(chain, residue)` set dedupes altlocs.
3. **Centroid removal + unit normalization** — subtract the per-axis mean, divide by the max radius
   so every trace lands in the unit sphere. The pre-normalization radius is retained as
   `bounds_radius` and becomes the render-space scale hint.
4. **Arc-length resampling** — the interesting step. `_arc_lengths` builds a cumulative-distance
   array; `_resample_trace` walks a cursor along it and linearly interpolates **both position and
   pLDDT** at N evenly spaced arc-length positions. Sampling in arc-length space rather than index
   space matters because CA–CA spacing is not uniform — index sampling over-represents tightly
   packed regions and stretches loops.
5. **Three LOD tiers** — 24 / 72 / 180 vertices, each capped at input length so short chains are
   never upsampled.
6. **Confidence histogram** — mean/min/max plus the four AlphaFold bands as fractions.
7. **Procedural fallback** — on any failure, a helical curve deterministically seeded from
   `sum((i+1) · ord(c))` over `"{accession}:{gene}"`, stamped `structure_source: "procedural"` and
   surfaced honestly in the UI.

**Hardest part.** The resampler's cursor advance:
`while cursor < len(distances) - 2 and distances[cursor + 1] < target: cursor += 1`.
The `- 2` keeps `points[cursor + 1]` in bounds at the final sample, where `target` equals total
length exactly. Off by one and it's an `IndexError` on the last vertex of every protein. The
subtler thing the same code gets right: interpolating pLDDT with the *same* ratio at the *same*
cursor, so confidence coloring stays spatially aligned with geometry after resampling.

**Scale demonstrably handled** `[measured]`:

- 54 proteins, sequence lengths **189 – 3,418 aa** (mean 1,014).
- **52 real AlphaFold traces, 2 procedural.** The two fallbacks are BRCA2 (3,418 aa) and ATM
  (3,056 aa) — **and that is not a parser bug.** AlphaFold DB only publishes single full-length
  models up to **2,700 residues**; longer Swiss-Prot entries are released as overlapping 1,400-aa
  fragments (F1, F2, …) instead. ATR at 2,644 aa succeeds; BRCA2 and ATM sit just over the line.
  The fallback triggers precisely at a real external constraint.
- **14,904** interpolated vertices across all LOD tiers; **9,720** in the focus tier.
- Total normalized backbone contour length rendered: **1,268.3 units across 54 chains** `[measured]`.

Per-residue confidence across the whole focus tier — 9,720 values `[measured]`:

| pLDDT band | Residues | Share |
|---|---:|---:|
| Very high (≥90) | 4,361 | **44.9%** |
| Confident (70–90) | 2,191 | 22.5% |
| Low (50–70) | 973 | 10.0% |
| Very low (<50) | 2,195 | **22.6%** |

p10 = 36.1 · **p50 = 87.8** · p90 = 97.5. That bimodal shape — a large very-high mass and a large
very-low mass with a thin middle — is the real signature of the human proteome: well-folded
domains plus genuinely disordered regions. The visualization renders that split directly, which is
the whole point of coloring per vertex rather than per protein.

- Payloads: `universe-assets` (low + mid tiers) serializes to **198.7 KB**; one `structure-asset`
  is **10.6 KB** `[measured]`.
- `[estimated]` A cold rebuild is network-bound: 54 API calls + 54 PDB downloads at observed
  AlphaFold response times of ~0.5–2 s ⇒ roughly **2–4 minutes wall clock**. CPU time is negligible
  against it.

**Proposed lenses (PROPOSED):** backend **5/5** (external API integration, fixed-format parsing,
numerical resampling, honest degradation) · ai 2/5 (consumes an ML model's output; trains nothing)
· systems 3/5 (build/serve split, LOD budgeting, a deliberate 1.5 MB precompute buying sub-200 KB
page payloads).

---

### WS-3: FastAPI service layer and typed API contract

**What and why.** Eleven endpoints across three routers, every one `response_model`-typed with a
Pydantic v2 model. The contract is the deliverable — `frontend/lib/types.ts` mirrors
`models/schemas.py`, and the generated OpenAPI document is itself asserted in tests.

**Files.** `main.py`, `core/config.py`, `dependencies.py`, `models/schemas.py` (199 lines,
22 models), `routers/*.py`, `services/protein_service.py`, `frontend/lib/{types,api}.ts`,
`tests/test_api.py`.

**Dates.** 2026-03-14 → 03-17. **New since 2026-04-01:** No.

**Technique.** Constructor-injected services built once in an async `lifespan` context manager and
parked on `app.state`; routers reach them through `Depends(get_protein_service)` where the getter
is `lambda request: request.app.state.…`. Nothing is constructed per request — a singleton object
graph with an explicit build order, and `Request`-based getters keep routers free of module-level
globals, which is what makes `TestClient(app)` work cleanly as a context manager.

Schema modelling worth naming: `ProteinSearchResult`, `SimilarProteinResult`, and `ProteinDetail`
all **inherit** `ProteinSummary`, so the universe payload's field set is structurally guaranteed to
be a subset of the detail payload's. `ProteinStructureAsset` inherits `ProteinUniverseAsset` and
adds `focus_trace` / `camera` / `confidence_palette` — one type hierarchy expressing the LOD tiers.
`ChatCommandType` and `GraphNodeType` are `Literal` unions, so an invalid command type is a
serialization error, not a silent browser no-op.

Two ranking algorithms live here:
- **Search** — tiered with early exit: exact accession 1.0, exact gene symbol 0.99, else five
  candidate fields at descending base weights (gene 0.95, name 0.90, disease 0.72, drug 0.68,
  description 0.60), substring hit awarding the base weight and otherwise base × token overlap.
  Ties break on gene name, so results are stable.
- **Similarity** — Euclidean distance in the stored 3D UMAP space converted by `1 / (1 + d)`.
  **Honest caveat:** this is proximity in the *reduced* embedding, not cosine similarity over the
  full ESM-2 vector the spec calls for. UMAP preserves local neighborhoods but not global
  distances, so this is a visual-neighborhood metric, not a biological one. Volunteer this.

**Hardest part.** Making `"alzheimer"` work as a query when the term appears in no gene symbol and
no protein name — only inside nested disease objects. `proteins_for_disease` strips generic tokens
(`disease`, `syndrome`, `cancer`, `disorder`, `type`) and sub-3-char tokens before scoring;
without that, `"Alzheimer's disease"` matches every protein that has *any* disease at all through
the shared token `disease`. Pinned by `test_api.py`: `search?q=alzheimer&limit=4` must contain both
`P05067` and `P49768`.

**Scale demonstrably handled** `[measured]`: 11 endpoints, 22 models, 25 backend tests green in
0.092 s. Search and similarity are O(N) linear scans — exactly the code path a vector index
replaces at the spec's target. `[estimated]` The same scan over 10,000 records is ~15–40 ms
single-threaded; the real motivation for pgvector at that scale is the 768-dimensional embedding,
not the row count.

**Proposed lenses (PROPOSED):** backend **4/5** · swe 4/5.

---

### WS-4: Graph traversal engine

**What and why.** Backs the graph panel: bounded-hop neighborhood expansion, shortest path between
any two entities, and ranked node search over an in-memory adjacency structure.

**Files.** `services/graph_service.py` (now 141), `repositories/fixture_repository.py`,
`routers/graph.py`, `tests/test_services.py`, `tests/test_resolution.py`.

**Dates.** 2026-03-17; scoring reworked 2026-08-06. **Partially reworked** — see B1/B3.

**Technique.**
- **Adjacency:** `defaultdict[str, list[tuple[str, GraphEdge]]]` built once, each edge inserted
  **twice** so a directed edge list behaves as an undirected graph for traversal while keeping
  direction in the edge object for display.
- **Neighborhood:** frontier BFS with an explicit hop budget (1 or 2, enforced by `Field(ge=1,
  le=2)`). **Collected edges are keyed on the `(source, target, label)` triple in a dict**, which is
  what stops the same edge appearing twice when both endpoints are in the frontier. Nodes emitted in
  sorted ID order for stable rendering.
- **Shortest path:** BFS with a `parents: dict[node, (parent, edge)]` map, then walk backwards and
  reverse. Unweighted BFS is correct because every edge is one relational hop.
- **Search:** now three-tier — whole-term containment 1.0, word-prefix 0.85, else significant-token
  overlap; admitted at a 0.34 floor, with an early return for queries carrying no significant
  tokens. `rank_nodes()` exposes scores for callers that need the confidence.
- **`query()`** dispatches the LLM-facing endpoint: `entity_id` wins; else `search` — and if the
  search resolves to exactly one node it **expands that node's neighborhood** rather than returning
  a bare node list, so a specific natural-language query returns an explorable subgraph instead of
  a single dot.

**Hardest part.** The edge-dedup key. On a 2-hop expansion from a hub, the same edge is reachable
from both endpoints; naive appending renders duplicate links, and `react-force-graph-2d` treats
duplicates as *two* links, doubling the simulation's link force on that pair and visibly distorting
the layout. The `label` must be in the key because two nodes can genuinely be connected by more
than one relationship type.

**Scale demonstrably handled** `[measured]` — real 2-hop blast radius, which is what the panel
actually renders:

| Root | 1-hop | 2-hop |
|---|---:|---:|
| `disease:breast_cancer` | 18 | **52 nodes** |
| `P38398` (BRCA1) | 6 | 30 |
| `P00533` (EGFR) | 7 | 26 |
| `disease:alzheimer_s_disease` | 4 | 10 |

BFS is O(V + E) ≈ 400 operations — sub-millisecond. Paths verified in tests: BRCA1 → Olaparib and
EGFR → Osimertinib both resolve with correct endpoints. `[estimated]` The canvas renderer, not the
traversal, is the ceiling: `react-force-graph-2d` draws to a single HTML5 canvas rather than the
DOM and is documented as the right choice above ~1,000 nodes — roughly two orders of magnitude of
headroom before layout becomes the bottleneck.

**Proposed lenses (PROPOSED):** backend 4/5 · swe 3/5 · systems 2/5.

---

### WS-5: Grounded chat with an SSE UI-command protocol

**What and why.** The feature that makes this one product instead of four panels.

**Files.** `services/chat_service.py` (176), `services/llm_service.py` (65), `routers/chat.py`,
`core/text.py`, `frontend/lib/api.ts:89–164`, `components/GuideWorkspace.tsx`,
`lib/store.ts` (`applyCommand`), plus 4 test files across both runners.

**Dates.** 2026-03-16 → 03-17; consumer rewritten 03-18; **resolution and protocol fixed
2026-08-06.** **Partially reworked.**

**Technique.** Grounded-first generation with an LLM re-narration layer and a typed side channel.

Six `Literal`-constrained command types: `highlight`, `navigate`, `filter_universe`,
`load_structure`, `set_graph_root`, `set_viewport`.

Three decisions stack, and each is defensible on its own:

1. **Commands are structured JSON on their own SSE event type.** The spec (§8.2) proposed inline
   markers like `[HIGHLIGHT:ERBB2]` that the frontend would regex out of the prose. Rejecting that
   removes an entire category of escaping and leakage bugs: the model never emits markers into
   user-visible text, so there is nothing to strip and nothing to mis-escape.
2. **Emission order is commands-before-prose.** Four lines of ordering in `routers/chat.py`, and it
   is the entire difference between *a chatbot beside a visualization* and *a guide driving one*.
3. **The LLM cannot invent an entity.** Command `target_id`s are constructed from fixture entities
   resolved three lines earlier, so they are guaranteed to resolve. `LLMNarrator.narrate` wraps
   everything — the import, the API call, text extraction, the JSON slice, and
   `ChatEnvelope.model_validate` — in one `try/except Exception: return None`, and the caller is
   `return llm_response or grounded`. That is the whole safety argument, in four lines, and it is
   also why the app is fully functional with no API key (which is how the Playwright specs run).

**Hardest part.** Deciding the model does not get to determine *what happens*, only *how it reads*.
The naive design has the model emit commands directly, which means a hallucinated `target_id`
navigates the graph to a node that does not exist.

**Scale demonstrably handled** `[measured]`: a protein flow emits **4 commands + 1 source**; a
disease flow emits **4 commands + up to 4 sources** covering up to 6 proteins. `test_api.py`
asserts all four event types in a real streaming response; `api.test.ts` feeds a hand-built
`ReadableStream` through `streamChatMessage` including a chunk split across the buffer boundary.

`[estimated]` **Cost per turn.** ~200 system tokens + ~650 payload = **~850 input**; realistic
envelope response **~400 output**:

| Model | Input $/M | Output $/M | Per turn | 1,000 turns/mo |
|---|---:|---:|---:|---:|
| Claude Haiku 4.5 | $1 | $5 | **~$0.003** | ~$3 |
| Claude Sonnet 5 | $3 | $15 | **~$0.009** | ~$9 |
| Claude Opus 5 | $5 | $25 | **~$0.014** | ~$14 |

Structurally capped: one fixed-size re-narration call per turn, no agent loop, no fan-out. Matches
the spec's §13.2 estimate of $0–20/month.

**Proposed lenses (PROPOSED):** ai **4/5** (the interesting AI content is the *containment* design
— grounded generation, schema-validated output, all-or-nothing fallback, a structured action
channel the model cannot use to reference nonexistent entities) · backend 4/5 · frontend 4/5
(hand-rolled SSE reader with correct framing and an awaited async handler in the dispatch loop).

---

### WS-6: 3D protein universe renderer

**What and why.** The main viewport: 54 real normalized CA backbones, UMAP-positioned, per-vertex
pLDDT coloring, hover/select/focus states, per-protein idle animation, cluster fog, floating labels.

**Files.** `components/ProteinUniverse.tsx` (549), `components/UniverseViewport.tsx` (105),
`lib/utils.ts`, `app/globals.css`.

**Dates.** 2026-03-16 → 03-18. **Partially reworked** (+287 / −60 on 03-18).

**Technique.**
- Each protein is a `<group>` at `[umap_x·2.25, umap_y·1.845, umap_z·2.7]` containing **two**
  `drei/Line` primitives: a wide low-opacity halo in the category color, and a thinner core with
  `vertexColors` — one `THREE.Color` per vertex through a four-band step function
  (≥90 `#1d5fff`, ≥70 `#57cbff`, ≥50 `#ffd561`, else `#ff9757`). AlphaFold's own palette, applied
  to geometry.
- **LOD switching is state-driven, not distance-driven** — `mid_trace` (72 vertices) when selected,
  hovered, highlighted, or focused; `low_trace` (24) otherwise. `useMemo` on `trace.points` means
  geometry is rebuilt only when the tier flips.
- **Scale mapping** `proteinScale(r) = clamp(0.48 + √r/12, 0.55, 1.38)` — square-root, so a 185 Å
  protein is ~2.5× the visual size of a 36 Å one rather than 5×; clamped so nothing vanishes or
  dominates.
- **Opacity is a five-way cascade**: focus mode dims non-focused to 0.08; else filter-dimmed 0.12,
  selected/hovered 1.0, highlighted 0.94, ambient 0.62. Line width and halo opacity follow parallel
  cascades.
- **Deterministic idle animation** — each ribbon rotates by a sine of elapsed time offset by a
  `pulseSeed` derived from its accession's character codes. Never uniformly synchronized, always
  reproducible.
- **Double-click without a `dblclick` handler** — `onClick` compares `performance.now()` against a
  ref; under 260 ms dives into focus mode, over spotlights. r3f pointer events don't surface
  `dblclick` on line geometry.

**Hardest part.** The interaction between LOD switching and vertex colors. Swapping 24 → 72
vertices means the `vertexColors` array must change with it; if the two `useMemo`s have different
dependency arrays you get a one-frame mismatch where `three` receives 72 positions and 24 colors and
renders garbage or throws. Both memos key off the same `trace` object, so they flip atomically. A
two-line detail, invisible when correct and a hard crash when wrong.

**Scale demonstrably handled** `[measured]`: 54 proteins × 2 line primitives = **108 line objects**
per frame, plus 5 fog spheres, 5 text labels, 1,800 stars, 64 sparkles. Vertex budget **1,296** at
all-low, **7,776** at the theoretical all-mid worst case. Payload to get there: **198.7 KB**.

`[estimated]` Comfortable 60 fps on integrated graphics — the scene is geometry-trivial and the
cost is per-object draw calls, not vertices. **Where it stops scaling is the interesting answer:**
108 individually-material'd line objects means 108 draw calls, and that becomes the wall around
1,000–2,000 objects. The spec's 10,000-protein target explicitly calls for `THREE.InstancedMesh`
point sprites (§5.2) — one draw call for the whole universe — which is a *different rendering
strategy*, not a bigger version of this one. This implementation traded that ceiling for showing
real backbone geometry instead of dots, which is the thing that makes it look like a protein
universe rather than a scatter plot. Say that trade out loud.

**Proposed lenses (PROPOSED):** frontend **5/5** · swe 3/5 · systems 3/5.

---

### WS-7: Camera framing system

**What and why.** Makes "Fit all", "Center selection", and focus mode correct at any window size
and any data extent, and makes the transitions look intentional.

**Files.** `lib/viewport.ts` (113), `ProteinUniverse.tsx:59–224` (`CameraRig`),
`__tests__/viewport.test.ts`.

**Dates.** 2026-03-18 only. **The single most clearly new subsystem** — it existed in no commit
until 2026-08-06.

**Technique.** AABB bounds + FOV-limited distance solve + eased dual-lerp.

```
θ_h      = 2·atan( tan(θ_v/2) · max(aspect, 0.75) )
θ_limit  = min(θ_v, θ_h)
distance = radius · framing / tan(θ_limit / 2)
```

Taking the **minimum** of the two FOVs is what makes it correct on portrait and square windows —
using only the vertical FOV, the common shortcut, clips horizontally whenever `aspect < 1`. The
`max(aspect, 0.75)` floor stops very narrow viewports from pushing the camera toward infinity.

Position is offset from bounds center by fractions of that distance — lateral on X, elevation on Y,
full distance on Z — so framing is a three-quarter view at every zoom level. Three profiles:
`fit-all` (1.12 / 0.14 / 0.16), `selection` (0.92 / 0.15 / 0.12), `focus` (0.72 / 0.09 / 0.06).

Transitions animate **camera position and orbit target together** through `easeInOutCubic` —
animating position alone makes the scene swing, because the look-at point jumps.
`OrbitControls`' `minDistance`/`maxDistance` are re-asserted from a ref every frame rather than
passed as props, because they derive from whichever bounds are active; in focus mode they tighten
to `max(1.6, min·0.7)` / `max(18, max·0.45)`.

**Hardest part.** Making a repeated identical action re-fire. React effects don't run when state is
set to the value it already holds, so "Fit all" while already fitted did nothing. The fix is
`viewportRevision`, a monotonically increasing integer bumped by `setViewportPreset` regardless of
whether the preset changed, included in the effect's dependency array. Two lines, and the
difference between a button that works and a button that works *sometimes* — which is worse.

**Scale demonstrably handled** `[measured]`: four property-style tests — non-degenerate bounds; a
single-ID selection yields a strictly smaller radius than the full set; distance grows monotonically
with radius; a built frame satisfies `position.z > target.z` and `maxDistance > minDistance`. The
tests assert *relationships*, not magic constants, so they hold at any N and any aspect ratio.
`computeUniverseBounds` is O(N) and memoized on the protein array — once per data load, not per
frame.

**Proposed lenses (PROPOSED):** frontend **5/5** (real 3D camera math, not library-calling) ·
swe 4/5 · systems 2/5.

---

### WS-8: Workspace shell, command bar, and design system

**What and why.** Replaces overlay drawers with a persistent split workspace where nothing ever
covers the 3D scene, and gives the app one visual language driven by CSS custom properties.

**Files.** `WorkspaceShell.tsx` (43), `CommandBar.tsx` (155), `globals.css` (760),
`GenomeCanvasApp.tsx` (597), `layout.tsx`, `__tests__/workspace-shell.test.tsx`.

**Dates.** 2026-03-18. Entirely new relative to committed history.

**Technique.** Slot-based composition (`ReactNode` props, not `children` + context) plus a
token-driven CSS layer.

`WorkspaceShell` has no state, no store import, and no knowledge of what goes in its slots — which
is exactly why it is testable in 26 lines. `CommandBar` is fully controlled. All coordination lives
in `GenomeCanvasApp`, which subscribes to **30 individual store slices** with selector functions
rather than destructuring the whole store — so a chat message re-renders the guide panel and not
the 3D canvas.

Search uses React 18 concurrency properly: `useDeferredValue` on the trimmed input plus
`useTransition` around the fetch, with stale in-flight responses dropped by a `cancelled` flag in
the effect cleanup. Every async effect in the file follows the same cancellation pattern.

Command-bar results are **action cards, not a list**: each protein result offers four verbs —
Spotlight, Dive, Filter, Graph — so one search surface drives four different state transitions.

The CSS is 24 `:root` tokens → ~90 component classes referencing only those tokens → three
breakpoints. A single `keydown` handler implements a **layered Escape stack**: palette → focus mode
→ guide → graph, closing exactly one layer per press.

**Hardest part.** Deciding to gut a working 593-line component. The rewrite touched every file in
the frontend and broke every existing test's assumptions about labels and structure. What made it
tractable was **adapter-at-the-seam**: `ChatPanel.tsx` became a one-line re-export and
`StructurePanel.tsx` a thin forwarding adapter, so `chat-panel.test.tsx` kept passing *unmodified*
through a ~2,900-line refactor. Deliberate technique, not an accident, and it is why the suite came
out green.

**Scale demonstrably handled** `[measured]`: 6 slots, 30 store subscriptions, 3 breakpoints,
24 tokens. The rewrite touched 10 tracked files and added 12.

**Proposed lenses (PROPOSED):** frontend **5/5** · swe **4/5**.

---

### WS-9: Knowledge-graph canvas panel

**What and why.** Renders the current entity's neighborhood as an interactive force-directed graph
in the right rail, with hop control and node inspection.

**Files.** `components/GraphWorkspace.tsx` (328), `__tests__/graph-workspace.test.tsx` (135).

**Dates.** 2026-03-16 (as `GraphPanel`) → 03-18 (as `GraphWorkspace`); predecessor deleted
2026-08-06. **Partially reworked.**

**Technique.**
- **Deterministic layout seeding.** The root is pinned at `(0,0)` with `fx`/`fy` — d3-force will not
  move it — and every other node is placed on a **type-stratified ring**: radius
  `135 + typeIndex·42`, angle `-π/2 + (2π/total)·index`. Proteins inner, then diseases, drugs,
  pathways, GO terms, trials. This is the difference between a layout that settles into a readable
  radial arrangement every time and one that lands somewhere different on every load.
- **Force tuning through the imperative API**: charge −240; link distance 128 for root-incident
  edges vs 84 otherwise; link strength 0.24 vs 0.14; `d3VelocityDecay(0.34)`, `d3AlphaDecay(0.08)`,
  `d3ReheatSimulation()`, then a **280 ms deferred `zoomToFit`** — deferred because fitting before
  the simulation moves anything frames the seed ring, not the settled layout.
- **Custom canvas painter**: dark backing disc for contrast against the starfield, type-colored
  fill, cyan ring for active / white for highlighted, and a label at
  `fontSize = max(8, 13 / globalScale)` so text stays legible while zooming. Labels render only when
  active, highlighted, or `globalScale > 1.45`.
- `ResizeObserver` drives canvas width (the library needs explicit pixel dimensions and ignores
  CSS); `next/dynamic(..., {ssr: false})` because it touches `window` at import.

**Hardest part.** Testing an imperative-ref library in jsdom, where canvas doesn't render and the
force simulation doesn't run. The solution mocks `next/dynamic` with a `forwardRef` component that
installs a fake imperative API via `useImperativeHandle` — `d3Force` returns an object with
`distance`/`strength` spies, `zoomToFit` is a spy — then combines `vi.useFakeTimers()` with
`act(() => vi.advanceTimersByTime(320))` to prove the deferred fit actually fires. A real testing
technique, not a smoke test.

**Scale demonstrably handled** `[measured]`: up to **52 nodes** in a 2-hop expansion from the
breast-cancer hub. Canvas fixed at 360 px height, width tracked live. `[estimated]` The practical
limit is label legibility in a ~560 px rail, which degrades well before the renderer does — which
is exactly why the hop budget is capped at 2 in the Pydantic model rather than left open.

**Proposed lenses (PROPOSED):** frontend **4/5** · swe 4/5.

---

### WS-10: Mol* integration

**What and why.** Focus mode shows the real AlphaFold model in Mol* — the viewer PDBe, PDBe-KB, and
AlphaFold DB themselves ship. Getting a 4.9 MB UMD bundle that touches `window` at import time into
a Next.js App Router page is the entire problem.

**Files.** `components/MolstarViewport.tsx` (159), `components/StructureViewport.tsx` (129),
`scripts/copy-molstar-assets.mjs` (21), `package.json` postinstall hook.

**Dates.** 2026-03-17; orphaned iframe wrapper deleted 2026-08-06.

**Technique.** Vendored UMD bundle + idempotent runtime script injection, keyed by `useId`.

- `postinstall` finds `molstar/build/viewer` in either the local *or* hoisted `node_modules` (this
  is a workspaces monorepo), wipes the target, and `cpSync`s it into `public/vendor/`. That
  directory is gitignored, so the 4.9 MB blob is regenerated rather than committed.
- `ensureMolstarAssets()` injects `<link>` and `<script>` on first use and **memoizes the load
  promise on `window.__molstarLoaderPromise`**, so N simultaneous mounts share one network request.
  It also handles the case where the tag exists but hasn't fired `load` yet. Never imported by the
  bundler ⇒ Mol* contributes **zero bytes** to the Next.js JS payload.
- Container ID is `` `molstar-${useId().replace(/:/g, "")}` `` — React 18's `useId` emits IDs
  containing `:`, which are invalid CSS selectors and break Mol*'s `getElementById` mounting.
- Format inferred from URL suffix: `.bcif` → binary CIF, `.cif` → mmCIF, else PDB.
- Cleanup calls `plugin.clear()` behind a `cancelled` flag so a fast unmount during the async mount
  doesn't write into a detached node.

**Hardest part.** Four hazards stacked, each needing a different fix, and the memoized global
promise is the one that's easy to get subtly wrong — a naive `if (window.molstar) return` still lets
two mounts both start a load. Project memory records an earlier attempt that gave up and used an
AlphaFold DB iframe; the orphaned `public/molstar-viewer.html`, deleted on 2026-08-06, was that
attempt's archaeology.

**Scale demonstrably handled** `[measured]`: 4.9 MB JS + 76 KB CSS, loaded **once per session,
lazily, only on first entry into focus mode**. 52 of 54 proteins expose a resolvable PDB URL; the
other two show an honest explanatory card. `[estimated]` ~1.3–1.6 MB gzipped over the wire, roughly
1–3 s on typical broadband — which is exactly why it sits behind an explicit user action rather
than page mount.

**Proposed lenses (PROPOSED):** frontend **5/5** · systems 3/5.

---

### WS-11: Client state machine

**What and why.** One Zustand store holds every piece of cross-panel state, so a chat command, a
graph click, and a 3D double-click all converge on the same transitions.

**Files.** `lib/store.ts` (416), `lib/types.ts` (187), `lib/utils.ts`, `__tests__/store.test.ts`.

**Dates.** 2026-03-16 → 03-18; paragraph handling added 2026-08-06. **Partially reworked.**

**Technique.** A flat store with **composite transition actions** rather than per-field setters. The
individual setters exist, but the interesting actions write 6–9 fields atomically:
`spotlightEntity` (selection + graph root + highlight union + camera mode + rail open + preset +
revision), `focusProtein` (all of that plus experience mode and focused id), `leaveFocus` (restores
the camera to whatever is still *selected* rather than resetting to origin — so backing out of a
structure returns you where you were), and `applyCommand` (the six-way switch mapping chat commands
onto those transitions).

**Entity type is inferred from ID shape, not carried as a field:**
`inferEntityType(id) = id.includes(":") ? id.split(":")[0] : "protein"`. Because WS-1 canonicalized
every non-protein ID to `type:slug` and every protein to a bare accession, **an ID is
self-describing** — which is why `applyCommand` routes six command types knowing only a string, why
the chat protocol never transmits entity types, and therefore why it can never transmit a wrong one.
One decision in the data layer paying off three subsystems away.

**Hardest part.** Keeping `graphOpen`/`guideOpen` in sync with `rightRailSections.{graph,guide}`.
The rewrite introduced the sections object but kept the older booleans because three call sites and
an existing test reference them; every action that writes one writes both. Duplicated state is a
smell — but it is *deliberately* duplicated to keep a migration safe, and it is the honest answer to
"what would you clean up next."

**Scale demonstrably handled** `[measured]`: 21 state fields, 30 actions, 6 command types, 4 store
tests including the paragraph-rejoin regression.

**Proposed lenses (PROPOSED):** frontend 4/5 · swe 4/5.

---

### WS-12: Test and verification harness

**What and why.** 38 tests across three runners covering data invariants, service behavior, API
contract, SSE protocol, adversarial entity resolution, store transitions, camera math, and component
rendering.

**Files.** `backend/tests/*.py` (4 files), `frontend/__tests__/*` (6 files),
`frontend/e2e/genomecanvas.spec.ts`, `test.setup.ts`, `vitest.config.ts`, `playwright.config.ts`.

**Dates.** 2026-03-17 → 03-18; **+13 tests 2026-08-06.** **Partially reworked.**

**Technique.** Five layers, each catching something the others cannot.

1. **Data invariants** — referential integrity over the built bundle. Makes WS-1 safe to change.
2. **Service behavior** — ranking and traversal directly, including asserting that BRCA2 returns
   `structure_source == "procedural"`. The fallback path is a *tested* path, not an untested rescue.
3. **Adversarial resolution** (new) — every test pins an input that previously produced a
   confidently wrong answer: stopword-only overlap must score 0.0, `"application"` must not match
   gene APP, `search_nodes("the")` must return `[]`, `"show me the app"` must mention APP and must
   **not** mention "vas deferens".
4. **API contract** — `TestClient` as a context manager so `lifespan` runs; asserts SSE
   content-type and all four event names in a real streaming response; and asserts the **generated
   OpenAPI document** contains the expected paths, so a route rename that would break the frontend
   fails a *backend* test.
5. **Frontend units + E2E** — SSE parsing against a synthetic `ReadableStream`; store transitions;
   camera-math properties; component rendering; and five Playwright specs covering the three README
   demo flows plus shell layout and rail collapse.

**Hardest part.** Testing `GraphWorkspace` at all (see WS-9). Runner-up: testing the streaming
client without a server — `api.test.ts` builds a `ReadableStream` and enqueues all four event blocks
as one encoded chunk, which specifically exercises the `\n\n` buffer-splitting loop rather than the
easy one-event-per-read case.

**Scale demonstrably handled** `[measured]`: **38 tests, all green.** Backend 25 in 0.092 s;
frontend 13. Now executed by CI on every push.

**Proposed lenses (PROPOSED):** swe **5/5** (five deliberate layers, an OpenAPI assertion, an
imperative-ref mock, and an adversarial suite where every case is a real historical defect) ·
backend 3/5.

---

### WS-13: Correctness hardening

**What and why.** A dedicated adversarial pass over entity resolution, done by probing the system
with hostile inputs rather than reading the code. It found three defects that shipped wrong answers.

**Files.** `core/text.py` (rewritten, 125), `services/graph_service.py` (150),
`services/chat_service.py` (184), `routers/chat.py`, `frontend/lib/{store,types,api}.ts`,
`backend/tests/test_resolution.py` (113 lines, 11 tests).

**Dates.** 2026-08-06. **New since 2026-04-01: yes — entirely.**

**Technique.** Three named primitives replacing ad-hoc string matching:

| Primitive | Replaces | Guarantee |
|---|---|---|
| `significant_tokens()` | raw `tokenize()` in scoring | 96-word stopword set + ≥2 chars, so function words carry no retrieval weight |
| `contains_term()` | Python `in` | Whole-term match via lookarounds, not `\b` — correct for alphanumeric gene symbols (`BRCA1` ≠ inside `BRCA12`) |
| `starts_term()` | — | Word-prefix tier at 0.85, preserving type-ahead after the tightening |

Plus a `MIN_SEARCH_SCORE = 0.34` admission floor, an early `[]` return for stopword-only queries,
and an intent-precedence rule: an explicitly named protein outranks disease-shaped phrasing.

**Hardest part.** Tightening matching without breaking the three demo flows. Every guard is a
potential regression: raise the floor too high and `"show me proteins involved in Alzheimer's
disease"` stops resolving. It scores exactly **0.5** — significant tokens `{proteins, involved,
alzheimer, disease}` against `{alzheimer, disease}` — comfortably above 0.34 but not by much, which
is why the threshold is pinned by a test rather than left as a tuned constant someone can nudge.
The tension is real: too loose and `"the"` matches a disease; too tight and a legitimate
natural-language query stops working.

**Scale demonstrably handled** `[measured]`: 11 new tests, all three demo flows still green, and
the 14 pre-existing backend tests unchanged and passing.

**Proposed lenses (PROPOSED):** backend **4/5** · swe **5/5** (finding bugs by adversarial probing
rather than code reading, then pinning each with a regression test named after the failure, is the
highest-signal engineering work in the repo) · ai 3/5 (this is what makes the grounded-first chat
actually trustworthy — a containment design that resolves the wrong entity is not contained).

---

### WS-14: CI and deployment configuration

**What and why.** 38 passing tests that nothing runs automatically are 38 tests one commit from
rotting. And the spec plans a deployment (§13) that had no configuration at all.

**Files.** `.github/workflows/ci.yml` (3 jobs), `backend/Dockerfile`, `render.yaml`, `vercel.json`.

**Dates.** 2026-08-06. **New since 2026-04-01: yes.**

**Technique.** Three CI jobs with a real dependency edge: `backend` and `frontend` run in parallel;
`e2e` runs only after both pass, boots uvicorn, polls `/api/health` in a bounded 30-iteration loop
before starting Playwright, and fails loudly if health never comes up. The frontend job does
typecheck → lint → unit tests → **production build**, so a type error or a build-time failure is
caught in CI rather than at deploy. `permissions: contents: read` and zero `github.event.*`
interpolation — nothing in the workflow consumes untrusted input.

`backend/Dockerfile` runs as a non-root UID, bakes the fixtures into the image (the repository is
read-only at runtime, so there is no volume and no migration step), and defines a `HEALTHCHECK`
that hits `/api/health`. `vercel.json` sets `frontend/` as root and marks the vendored Mol* bundle
`immutable` with a one-year max-age — correct because it is content-addressed by the postinstall
copy and never mutates in place.

**Hardest part.** Nothing algorithmically. The judgment call worth defending is the deliberate
split — frontend on Vercel (needs Next.js edge/image handling), API as a plain container (no
attached storage, no database) — with the two coupled only by `NEXT_PUBLIC_API_BASE_URL` and
`GENOMECANVAS_CORS_ORIGINS`. That is the smallest deployable surface this architecture allows.

**Status, stated honestly:** configured, **not provisioned**. Neither target has been created.

**Proposed lenses (PROPOSED):** systems 3/5 · swe 3/5.

---

## Genuinely hard

Six things a competent engineer would not get right on the first attempt.

**1. Arc-length resampling that carries a second signal.**
Reducing a 3,000-point polyline to exactly 180 points is easy by index and wrong by geometry.
Doing it in **arc-length space** — cumulative-distance array, then interpolating between the two
points bracketing each target distance — is what preserves shape, because CA–CA spacing along a
backbone is not uniform. On top of that, pLDDT must be interpolated with the *same* ratio at the
*same* cursor or the confidence coloring drifts out of alignment with the geometry it describes.
And the loop bound is `len(distances) - 2`, not `- 1`, because the final target equals total length
exactly. Three separate correctness constraints in a 40-line function.

**2. ID canonicalization across mismatched sources, in the right order.**
Two independently-authored files disagreed about IDs. The reconciliation builds a canonical ID for
every entity, records a rewrite map *as a side effect of registration*, and then rewrites every
pre-existing edge through it. Order is load-bearing: register protein-derived nodes first, or edges
point at IDs that no longer exist — silently, no exception, just an empty graph. What makes it
defensible is a referential-integrity test that runs in 60 ms. The knock-on payoff is that the
canonical ID *shape* became a type tag the frontend reads directly, which is why the chat protocol
never transmits entity types and therefore cannot transmit a wrong one.

**3. FOV-limited camera framing with eased dual-lerp.**
"Put the camera far enough back that this sphere fits" is a one-liner if you only consider the
vertical FOV — and it clips horizontally on every portrait window. The correct solve derives the
horizontal FOV from aspect, takes the **minimum** as the limiting angle, and floors the aspect at
0.75. Layered on: animating position *and* orbit target together (position alone makes the scene
swing), re-asserting distance clamps from a ref every frame because they derive from the active
bounds, and a monotonic revision counter because React won't re-run an effect when you set state to
the value it already holds.

**4. Ordered SSE with commands ahead of prose, and an all-or-nothing LLM fallback.**
Three stacked decisions: commands are a **typed side channel** rather than markers regexed out of
prose (removes an entire category of escaping bugs); emission order is **commands first** so the
interface reconfigures before the first sentence, with the command handler `await`ed inside the
stream loop so `load_structure` finishes hydrating before the next event; and the LLM is a
**re-narration layer over an already-correct answer**, returning `None` on any failure with the
caller reading `return llm_response or grounded`. Commands are built from resolved fixture entities,
so a hallucinated ID cannot reach the UI. Four lines of safety, and the reason the app works with no
API key at all.

**5. Mol* inside Next.js App Router.**
Four hazards, four different fixes. The library touches `window` at module scope, so it can never be
`import`ed — side-loaded as a script tag, contributing zero bytes to the bundle. The load promise is
**memoized on `window`** so simultaneous mounts share one 4.9 MB fetch (and the code handles the tag
existing but not yet loaded). The container ID comes from `useId()` with colons stripped, because
React 18 emits IDs containing `:` which are invalid CSS selectors. And unmount cleanup calls
`plugin.clear()` behind a `cancelled` flag so a fast unmount mid-async-mount doesn't write into a
detached node.

**6. Finding the resolution bugs at all.**
This one is about method, not cleverness. The three defects in WS-13 were **invisible to code
review** — `if query_lower in haystack` and `best > 0` both read as obviously fine. They were found
by writing hostile probes and running them: feed the resolver *"what are the parameters here"* and
watch it confidently return a disease about the vas deferens. The general lesson is that
similarity-scoring code fails silently and asymmetrically — it does not throw, it returns a wrong
answer with full confidence — so the only way to find it is to attack it with inputs designed to be
misread, and then pin every one with a regression test named after the failure it prevents.

---

## The build story: AI as an instrument, expertise as the direction

This section exists because it is the most current and most transferable thing about the project.

### What was actually built here

GenomeCanvas is a startup-shaped product, not a tutorial exercise. It has a written specification
with a market thesis, a data pipeline against real external APIs, a typed API contract, a
non-trivial 3D renderer, a state machine coordinating four surfaces, an AI feature with an explicit
safety property, an adversarial test suite, and CI. It was designed the way a small team would
design a v1: pick a slice that makes every demo path complete rather than a slice that maximizes row
count, ship the contract before the storage layer, and make the AI feature fail closed.

### The division of labor

The honest framing is that **AI agents wrote most of the code and the engineering judgment was
mine.** The repository shows the collaboration directly: feature branches named
`claude/serene-lamarr` and `codex/immersive-ui-rebuild`, agent work merged through PR #1,
`.claude/launch.json` configuring dev-server launch for agent-driven browser verification, and
`.claude/worktrees/` for isolated parallel work.

What that leaves as the human contribution is the part that determines whether the output is any
good:

**1. Specification before code.** A 351-line technical spec — problem statement, data-source table
with per-source scale, four-phase ETL design (ESM-2 → UMAP → pgvector → RAG), Neo4j schema, five-
month timeline, MVP / V2 / out-of-scope split, a risks-and-mitigations table, deployment
architecture, cost model — written *first*. Agents are extremely good at executing a well-specified
plan and extremely bad at inventing one. The spec is the artifact that made everything downstream
tractable.

**2. Architectural decisions that agents will not make unprompted.** Every one of these is a
judgment call with a defensible alternative:
- Fixtures instead of Neo4j, behind a four-method interface, so the contract could stabilize first.
- Commands as a *typed side channel* rather than the spec's own inline `[HIGHLIGHT:X]` markers —
  overriding the spec I wrote, because the implementation revealed the marker design was worse.
- Commands emitted *before* prose, which is the entire product feel.
- The LLM as a re-narration layer with an all-or-nothing fallback, so a model failure is invisible.
- Real backbone geometry instead of instanced sprites, accepting a ~1,000-object rendering ceiling
  in exchange for the thing that makes it look like a protein universe.
- Precomputing 1.5 MB of LOD traces at build time so request-time external calls are zero.

**3. Decomposition into subsystems with clean interfaces.** Fourteen workstreams with real
boundaries. This is what makes agent-generated code reviewable — a 300-line module with four public
methods and a test can be verified; a 3,000-line tangle cannot.

**4. Verification as the control loop.** Five test layers exist precisely because generated code
needs an executable contract rather than a code review.
`test_data_consistency.py` is the clearest example: it does not test a function, it asserts an
*invariant* over generated data, which is the only thing that makes the canonicalization pass safe
to regenerate.

**5. Adversarial review — the thing agents did not do on their own.** WS-13 is the sharpest
illustration. Three bugs sat in code that had passed review, passed 25 tests, and read as obviously
correct. Finding them required deciding to attack the system's weakest assumption — that string
matching is good enough for entity resolution — and then probing it with inputs chosen to be
misread. `"show me the app"` returning a paragraph about the vas deferens is not something a linter,
a type system, or a passing test suite catches. It is the kind of failure only a human who is
suspicious of their own system goes looking for.

### Why this is the interesting part

The transferable skill on display is not "can write TypeScript." It is **specifying, decomposing,
and verifying work at a rate that a single engineer could not produce by hand** — and knowing which
decisions cannot be delegated. Two of the highest-leverage things in this repo are a four-line
fallback (`return llm_response or grounded`) and a 96-word stopword list. Neither is difficult to
write. Both required knowing they were necessary.

---

## Interview ammunition

**"Why not Neo4j / pgvector, like your own spec says?"**
Because the API contract needed to stabilize before the storage layer was worth building.
`FixtureRepository` is four methods; swapping in Neo4j means implementing four methods and changing
one line in `lifespan()`. At 187 nodes an in-memory adjacency does BFS in microseconds — a graph
database would have added a container, a connection pool, a query language, and a deployment
dependency to buy nothing measurable. It is written down in the README as a decision, not left as
an omission.

**"Isn't 54 proteins a toy?"**
It is a deliberate slice, not a limit. The pipeline is N-agnostic; what changes at 10,000 is a
vector index instead of a linear scan, and `InstancedMesh` instead of 108 line objects — both named
in the spec. What 54 buys is that *every* protein has a real AlphaFold structure, real disease
associations, and real drug links, so no demo path hits a hole. Coverage over count.

**"Where does it break?"**
Three ceilings in order. **Rendering:** 108 draw calls today; the wall is ~1,000–2,000 objects, and
the fix is a different strategy, not a bigger version of this one. **Payload:** 198.7 KB for 54
proteins ⇒ ~37 MB at 10,000, so you need viewport culling or streaming LOD, not one big fetch.
**Search:** linear scan over 10,000 is still tens of milliseconds; the real reason for pgvector at
that scale is searching 768 dimensions, not the row count.

**"What's the biological accuracy caveat?"**
`similar()` is Euclidean distance in the **3D UMAP projection**, not cosine similarity over full
embeddings. UMAP preserves local neighborhoods but not global distances, so "similar" here means
*visually adjacent in the reduced space* — a weaker claim than *functionally similar*. Volunteer
this; knowing the limitation is worth more than the feature.

**"Tell me about a bug you found."**
The best one in the repo: `"show me the app"` answered about *Congenital bilateral absence of the
vas deferens*. Walk the three-link chain — token overlap counting stopwords, a `> 0` admission bar,
and an intent router that let disease phrasing beat an explicitly named protein. Each link was
individually reasonable; the failure only existed at their intersection. Then explain the fix in
three primitives (`significant_tokens`, `contains_term`, a score floor), the precedence rule, and
the 11 regression tests. This is the strongest story in the project because it demonstrates finding
a silent failure, root-causing across three modules, and preventing recurrence.

**"How did you use AI?"**
Two separate answers, and keeping them separate is the point. *In the product:* AlphaFold supplies
every structure and confidence value; UMAP positions the universe; Claude re-narrates an already-
correct answer under a schema, with an all-or-nothing fallback, and cannot reference an entity that
does not exist. *Building the product:* agents wrote most of the code against a spec I wrote first,
decomposed into subsystems with clean interfaces, verified by five test layers — and the bugs that
mattered were found by adversarially probing the result, not by reading it.

**"What would you fix next?"**
In order: provision the deploy (config is in, nothing is running); collapse the duplicated
`graphOpen` / `rightRailSections.graph` state; replace UMAP-distance similarity with real embedding
cosine similarity so the "similar proteins" claim is defensible; add server-side viewport culling
before raising the protein count; and add AlphaFold fragment stitching so BRCA2 and ATM get real
geometry instead of the procedural fallback.

**"Anything still stale?"**
The `similar()` metric caveat above, and `frontend/scripts/copy-molstar-assets.mjs` silently
depends on Mol*'s internal `build/viewer` path — a Mol* major-version bump could move it and the
postinstall would throw at install time rather than degrade. That is arguably the right failure
mode, but it is undefended.

---

## Small things that are actually interesting

- **The 2,700-residue boundary is visible in the data.** Exactly two of 54 proteins fall back to
  procedural traces — BRCA2 (3,418 aa) and ATM (3,056 aa) — while ATR at 2,644 aa succeeds.
  AlphaFold DB publishes single full-length models only up to 2,700 residues. The fallback triggers
  precisely at a real external constraint, and the UI says so rather than pretending.
- **The confidence histogram is bimodal, and that's biology.** 44.9% of residues are very high
  confidence and 22.6% are very low, with a thin middle — well-folded domains plus genuinely
  disordered regions. Per-vertex coloring renders that split directly.
- **The knowledge graph is a real small-world.** 22 components, largest covering 54%, diameter 8,
  mean shortest path 4.08 hops, and a heavy-tailed degree distribution running from 87 leaf nodes to
  one hub at degree 18.
- **Every fixture rebuild is byte-identical.** Sorted output, deterministic slugs, character-code
  seeding for the procedural fallback — a rebuild produces a clean diff or no diff, never noise.
- **IDs are self-describing.** `"disease:breast_cancer"` vs `"P38398"`. One canonicalization
  decision in the data layer is why the chat protocol doesn't transmit entity types and why a wrong
  type is structurally impossible.
- **The interface moves before it speaks.** Four lines of event ordering, and the entire difference
  between a chatbot next to a visualization and a guide driving one.
- **`viewportRevision`.** A monotonic integer whose only job is making React re-run an effect when
  state is set to the value it already holds. Two lines. Without it, "Fit all" silently does nothing
  when you're already fitted — intermittent and invisible in review.
- **A refactor kept green by adapters.** `ChatPanel.tsx` is one line purely so its test survived a
  ~2,900-line rewrite unmodified.
- **Mol\* contributes zero bytes to the bundle** despite being 4.9 MB, because it is never imported
  — only side-loaded, once, behind an explicit user action.
- **A dead dependency went unnoticed for two months** because the fallback design absorbed it. The
  pinned model retired 2026-06-15 and the app kept answering correctly on the deterministic path.
  Good design and a silent gap look identical from the outside — which is itself the argument for
  monitoring.

---

*Generated 2026-08-06. Every `[measured]` figure is reproducible from this repo at the commit that
contains this file; every `[estimated]` figure shows its arithmetic or names its comparable.*

**Sources for external figures:**
[AlphaFold DB in 2024 (Nucleic Acids Research)](https://academic.oup.com/nar/article/52/D1/D368/7337620) ·
[AlphaFold DB FAQ — 2,700-residue limit](https://alphafold.ebi.ac.uk/faq) ·
[When the AlphaFold DB is not an option (EMBL-EBI)](https://www.ebi.ac.uk/training/online/courses/navigating-alphafold-database/what-is-the-afdb/when-is-the-alphafold-protein-structure-database-not-an-option/) ·
[ESM Metagenomic Atlas (Meta AI)](https://ai.meta.com/blog/protein-folding-esmfold-metagenomics/) ·
[Mol* Viewer (Nucleic Acids Research)](https://academic.oup.com/nar/article/49/W1/W431/6270780) ·
[force-graph — why canvas beats the DOM](https://starlog.is/articles/data-knowledge/vasturiano-force-graph/) ·
[Open Targets Platform (Nucleic Acids Research)](https://academic.oup.com/nar/article/53/D1/D1467/7917960)
