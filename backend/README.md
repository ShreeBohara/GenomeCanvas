# GenomeCanvas Backend

The backend is a FastAPI API that loads curated fixture data, exposes typed protein and graph endpoints, generates structure trace assets, and streams grounded chat responses that can control the frontend UI.

It is designed as a stable API layer over a replaceable data source. Today the data source is JSON fixtures in `backend/app/data/`; later it could become a database, graph store, vector index, object store, or external biomedical API layer.

## Table Of Contents

- [Backend Role](#backend-role)
- [Directory Map](#directory-map)
- [Startup Lifecycle](#startup-lifecycle)
- [Configuration](#configuration)
- [Data Files](#data-files)
- [Fixture Build Pipeline](#fixture-build-pipeline)
- [Core Models](#core-models)
- [Repository Layer](#repository-layer)
- [Service Layer](#service-layer)
- [Routers And Endpoints](#routers-and-endpoints)
- [Chat Streaming Protocol](#chat-streaming-protocol)
- [Structure Assets](#structure-assets)
- [Tests](#tests)
- [Running Locally](#running-locally)
- [Common Development Tasks](#common-development-tasks)
- [Current Limitations](#current-limitations)

## Backend Role

The backend owns the application contracts and data behavior. Its job is to answer questions like:

- What proteins exist in the current universe?
- What does a selected protein contain in detail?
- Which proteins match a search query?
- Which proteins are nearest to a selected protein in the fixture coordinate space?
- What graph nodes and edges are near a selected protein, disease, drug, or trial?
- Is there a graph path between two entities?
- What local facts support a chat answer?
- What UI commands should the chat answer send back to the frontend?
- What trace data is available for 3D rendering and structure focus?

The backend does not render UI. It returns typed JSON and SSE events that the frontend renders.

## Directory Map

```text
backend/
|-- README.md
|-- requirements.txt
|-- scripts/
|   `-- build_fixtures.py
|-- app/
|   |-- __init__.py
|   |-- main.py
|   |-- dependencies.py
|   |-- core/
|   |   |-- __init__.py
|   |   |-- config.py
|   |   `-- text.py
|   |-- data/
|   |   |-- proteins.json
|   |   |-- knowledge_graph.json
|   |   `-- protein_structure_assets.json
|   |-- models/
|   |   |-- __init__.py
|   |   `-- schemas.py
|   |-- repositories/
|   |   |-- __init__.py
|   |   |-- fixture_repository.py
|   |   |-- fixture_builder.py
|   |   `-- structure_asset_builder.py
|   |-- routers/
|   |   |-- __init__.py
|   |   |-- proteins.py
|   |   |-- graph.py
|   |   `-- chat.py
|   `-- services/
|       |-- __init__.py
|       |-- protein_service.py
|       |-- graph_service.py
|       |-- chat_service.py
|       |-- llm_service.py
|       `-- data_loader.py
`-- tests/
    |-- __init__.py
    |-- test_api.py
    |-- test_data_consistency.py
    `-- test_services.py
```

Note: `backend/app/services/data_loader.py` provides a small `load_protein_data()` helper over the fixture builder. The active API startup path is still `FixtureRepository` plus the fixture builders.

## Startup Lifecycle

`backend/app/main.py` creates the FastAPI app.

Startup steps:

1. `get_settings()` reads app configuration.
2. The FastAPI lifespan function creates one `FixtureRepository`.
3. The repository loads normalized fixture data and structure assets.
4. The app creates:
   - `ProteinService`
   - `GraphService`
   - `LLMNarrator`
   - `ChatService`
5. These objects are stored on `app.state`.
6. Routers are mounted:
   - `/api/proteins`
   - `/api/graph`
   - `/api/chat`
7. CORS middleware allows configured frontend origins.

The dependency functions in `backend/app/dependencies.py` retrieve these stateful services for each route:

- `get_repository`
- `get_protein_service`
- `get_graph_service`
- `get_chat_service`

This keeps route functions small and makes services reusable in tests.

## Configuration

Configuration lives in `backend/app/core/config.py`.

The `Settings` dataclass contains:

| Setting | Source | Meaning |
| --- | --- | --- |
| `api_title` | code default | FastAPI title, currently `GenomeCanvas API`. |
| `api_version` | code default | FastAPI version, currently `2.0.0`. |
| `cors_origins` | `GENOMECANVAS_CORS_ORIGINS` | Allowed browser origins. |
| `data_dir` | code-derived path | Path to `backend/app/data`. |
| `chat_model` | `ANTHROPIC_MODEL` | Model name for optional Anthropic narration. |

Environment variables:

| Variable | Default | Required | Purpose |
| --- | --- | --- | --- |
| `GENOMECANVAS_CORS_ORIGINS` | `http://localhost:3000,http://localhost:3001` | No | Comma-separated frontend origins. |
| `ANTHROPIC_API_KEY` | empty | No | Enables optional LLM narration. |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` | No | Anthropic model used by `LLMNarrator`. |

Settings are cached with `@lru_cache(maxsize=1)`, so code that needs changed environment values in the same Python process should clear the cache or restart the process.

## Data Files

The active data directory is `backend/app/data/`.

### `proteins.json`

Contains protein records used for both protein endpoints and graph construction.

Important fields:

- `uniprot_id`
- `name`
- `gene_name`
- `organism`
- `function_description`
- `function_category`
- `sequence_length`
- `subcellular_location`
- `alphafold_url`
- `umap_x`
- `umap_y`
- `umap_z`
- `diseases`
- `drugs`
- `go_terms`

The app currently has 54 protein records.

### `knowledge_graph.json`

Contains graph nodes and edges. The fixture builder normalizes IDs and merges graph data derived from proteins.

Current graph contents:

- 187 nodes
- 217 edges
- node types: disease, protein, drug, trial
- edge labels: `ASSOCIATED_WITH`, `TARGETS`, `INTERACTS_WITH`, `INVESTIGATED_IN`, `STUDIES`

### `protein_structure_assets.json`

Contains precomputed structure traces and confidence summaries for every protein.

Each asset includes:

- `uniprot_id`
- `cluster_id`
- `halo_color`
- `lod_key`
- `bounds_radius`
- `low_trace`
- `mid_trace`
- `focus_trace`
- `camera`
- `confidence_palette`
- `alphafold_pdb_url`
- `structure_source`
- `similar_ids`

The current file has 54 assets:

- 52 AlphaFold-derived assets
- 2 procedural fallback assets

## Fixture Build Pipeline

The build script is `backend/scripts/build_fixtures.py`.

Run from the repo root:

```bash
npm run build:fixtures
```

Or directly:

```bash
python3 backend/scripts/build_fixtures.py
```

The script does two major things:

1. Calls `write_fixture_bundle(get_settings().data_dir)`.
2. Calls `write_structure_assets(get_settings().data_dir)`.

### Fixture normalization

`backend/app/repositories/fixture_builder.py` is responsible for building a canonical fixture bundle.

It:

- loads raw `proteins.json`
- loads raw `knowledge_graph.json`
- adds curated Alzheimer-related proteins when missing
- canonicalizes protein IDs to uppercase UniProt IDs
- canonicalizes disease IDs into `disease:{slug}`
- canonicalizes drug IDs into `drug:{slug}`
- canonicalizes trial IDs into `trial:nct...` when an NCT ID exists
- registers every protein as a graph node
- registers diseases and drugs referenced by proteins as graph nodes
- merges useful properties without overwriting existing meaningful values with blanks
- maps old graph IDs to canonical IDs
- creates `ASSOCIATED_WITH` edges from proteins to diseases
- creates `TARGETS` edges from drugs to proteins
- adds curated Alzheimer `INTERACTS_WITH` edges
- sorts proteins, nodes, and edges for stable output

Curated Alzheimer additions currently include:

- `APP` (`P05067`)
- `PSEN1` (`P49768`)
- `MAPT` (`P10636`)
- `APOE` (`P02649`)

These support the demo flow "Show me proteins involved in Alzheimer's disease".

### Structure asset generation

`backend/app/repositories/structure_asset_builder.py` builds `protein_structure_assets.json`.

For each protein it:

1. Calls the AlphaFold prediction API URL from the protein record.
2. Selects a matching prediction entry.
3. Fetches a PDB URL when available.
4. Parses alpha-carbon (`CA`) atoms from the PDB text.
5. Extracts coordinates and pLDDT confidence values.
6. Centers and normalizes the trace.
7. Resamples the trace into:
   - low trace, up to 24 points
   - mid trace, up to 72 points
   - focus trace, up to 180 points
8. Computes confidence fractions:
   - very high, `>= 90`
   - confident, `70-89`
   - low, `50-69`
   - very low, `< 50`
9. Stores an AlphaFold PDB URL when available.
10. Falls back to a deterministic procedural trace when fetching or parsing fails.

The procedural fallback uses a seed derived from UniProt ID and gene name, so generated fallback traces remain stable across builds.

## Core Models

All API schemas live in `backend/app/models/schemas.py`.

Important groups:

### Protein models

- `DiseaseReference`
- `DrugReference`
- `GOTerm`
- `ProteinSummary`
- `ProteinSearchResult`
- `SimilarProteinResult`
- `ProteinDetail`

`ProteinSummary` is the lightweight universe payload. `ProteinDetail` adds function text, sequence length, subcellular location, AlphaFold URL, diseases, drugs, and GO terms.

### Structure models

- `StructureTrace`
- `ConfidencePalette`
- `CameraHint`
- `ProteinUniverseAsset`
- `ProteinStructureAsset`

The universe asset is intentionally lighter than the focus asset. It only includes low and mid traces. The full structure asset adds focus trace, camera hint, confidence palette, AlphaFold PDB URL, source, and similar IDs.

### Graph models

- `GraphNode`
- `GraphEdge`
- `GraphData`
- `GraphPathResponse`
- `GraphQueryRequest`

Node types are typed as:

```text
protein, disease, drug, trial, go_term, pathway
```

The current fixture contains protein, disease, drug, and trial nodes.

### Chat models

- `ChatContext`
- `ChatRequest`
- `ChatCommand`
- `ChatSource`
- `ChatEnvelope`

Chat commands are typed as:

```text
highlight, navigate, filter_universe, load_structure, set_graph_root, set_viewport
```

These commands are applied by the frontend Zustand store.

## Repository Layer

The active repository is `FixtureRepository` in `backend/app/repositories/fixture_repository.py`.

On `refresh()`, it:

1. Calls `build_fixture_bundle(data_dir)`.
2. Validates proteins into `ProteinDetail` models.
3. Validates graph nodes into `GraphNode` models.
4. Validates graph edges into `GraphEdge` models.
5. Builds `proteins_by_id`.
6. Builds `nodes_by_id`.
7. Builds an undirected adjacency map for graph traversal.
8. Loads `protein_structure_assets.json` if it exists.
9. Validates structure assets into `ProteinStructureAsset` models.

Repository methods:

| Method | Purpose |
| --- | --- |
| `refresh()` | Rebuild all in-memory maps from fixture data. |
| `list_proteins()` | Return all loaded proteins. |
| `get_protein(uniprot_id)` | Return one protein by uppercase UniProt ID. |
| `get_structure_asset(uniprot_id)` | Return one full structure asset by uppercase UniProt ID. |
| `list_nodes()` | Return all graph nodes. |
| `list_nodes_by_type(node_type)` | Return graph nodes filtered by type. |
| `get_node(node_id)` | Return one graph node. |
| `neighbors(node_id)` | Return adjacent node IDs and edges. |

Because services call repository methods rather than reading files directly, a future database-backed repository can preserve most service and router code.

## Service Layer

### `ProteinService`

File: `backend/app/services/protein_service.py`

Responsibilities:

- return sorted universe summaries
- attach visual metadata to proteins
- return full protein detail
- return lightweight universe assets
- return full structure assets
- compute similar proteins
- search proteins
- find proteins associated with a disease phrase

Important behavior:

- Universe proteins are sorted by `gene_name`.
- Empty search returns a catalog sample.
- Exact UniProt ID match scores `1.0`.
- Exact gene symbol match scores `0.99`.
- Other matches score by substring or token overlap against:
  - gene symbol
  - protein name
  - function description
  - disease names
  - drug names
- Similarity is `1 / (1 + distance)` where distance is Euclidean distance between fixture coordinates `[umap_x, umap_y, umap_z]`.
- Disease lookup ignores generic disease words and scores disease name overlap.
- Visual metadata comes from structure assets when available:
  - `cluster_id`
  - `halo_color`
  - `lod_key`
  - `bounds_radius`

### `GraphService`

File: `backend/app/services/graph_service.py`

Responsibilities:

- return graph neighborhoods
- search graph nodes
- find shortest paths
- execute the generic graph query endpoint

Important behavior:

- Neighborhood search supports 1 or 2 hops.
- The graph is traversed as undirected for neighborhood and path search.
- Node search checks label, ID, and property values.
- Path search uses breadth-first search.
- Generic query priority is:
  1. `entity_id`
  2. `search`
  3. `node_type`
  4. default sample

### `ChatService`

File: `backend/app/services/chat_service.py`

Responsibilities:

- resolve a protein from chat text or selected context
- resolve a disease from chat text
- build deterministic grounded chat envelopes
- create frontend UI commands
- attach sources
- optionally pass grounded envelopes through `LLMNarrator`

Current intent behavior:

- If a disease is resolved and the message includes words such as `show`, `involved`, or `disease`, it builds a disease response.
- If a protein is resolved and the message includes `drug` or `target`, it builds a drug-target response.
- If a protein is resolved otherwise, it builds a protein explanation response.
- If nothing is resolved, it builds a general onboarding response.

Protein responses usually command the frontend to:

- highlight the protein
- set graph root to the protein
- load the protein structure
- switch viewport to focus mode

Disease responses usually command the frontend to:

- filter the universe
- highlight the disease and related proteins
- navigate to the disease
- set graph root to the disease

Drug-target responses usually command the frontend to:

- highlight the protein and linked drug nodes
- set graph root to the protein
- load the protein structure
- switch viewport to focus mode

### `LLMNarrator`

File: `backend/app/services/llm_service.py`

Responsibilities:

- optionally call Anthropic when `ANTHROPIC_API_KEY` exists
- send only grounded local application state
- require strict JSON output with `response`, `commands`, and `sources`
- validate returned JSON into `ChatEnvelope`
- return `None` on missing key, JSON parse failure, validation failure, or provider errors

If `LLMNarrator` returns `None`, `ChatService` returns the deterministic grounded envelope.

## Routers And Endpoints

### Health

Defined in `backend/app/main.py`.

| Method | Path | Response | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | `HealthResponse` | Reports `status`, `proteins_loaded`, and `nodes_loaded`. |

### Protein router

File: `backend/app/routers/proteins.py`

Mounted at `/api/proteins`.

| Method | Path | Response | Purpose |
| --- | --- | --- | --- |
| `GET` | `/universe` | `list[ProteinSummary]` | All proteins for the 3D universe. |
| `GET` | `/universe-assets` | `list[ProteinUniverseAsset]` | Low and mid traces for universe rendering. |
| `GET` | `/search` | `list[ProteinSearchResult]` | Search proteins with `q` and `limit`. |
| `GET` | `/{uniprot_id}/structure-asset` | `ProteinStructureAsset` | Full structure asset for focus mode. |
| `GET` | `/{uniprot_id}` | `ProteinDetail` | Full protein detail. |
| `GET` | `/{uniprot_id}/similar` | `list[SimilarProteinResult]` | Similar proteins by coordinate distance. |

404 behavior:

- `/{uniprot_id}` returns `Protein not found`.
- `/{uniprot_id}/similar` returns `Protein not found` if the target protein is missing.
- `/{uniprot_id}/structure-asset` returns `Structure asset not found` if the asset is missing.

### Graph router

File: `backend/app/routers/graph.py`

Mounted at `/api/graph`.

| Method | Path | Response | Purpose |
| --- | --- | --- | --- |
| `GET` | `/neighborhood/{node_id}` | `GraphData` | Return graph neighborhood for 1 or 2 hops. |
| `GET` | `/search` | `list[GraphNode]` | Search graph nodes by `q`, optional `type`, and `limit`. |
| `GET` | `/path` | `GraphPathResponse` | Return shortest path from `from` to `to`. |
| `POST` | `/query` | `GraphData` | Generic graph query body. |

404 behavior:

- `/neighborhood/{node_id}` returns `Node not found` if no nodes are found.
- `/path` returns `Path not found` if no path exists.

### Chat router

File: `backend/app/routers/chat.py`

Mounted at `/api/chat`.

| Method | Path | Response | Purpose |
| --- | --- | --- | --- |
| `POST` | `/message` | `text/event-stream` | Stream sources, commands, text chunks, and completion. |

The router uses `chunk_text()` from `backend/app/core/text.py` to split response text into small SSE chunks.

## Chat Streaming Protocol

The backend formats each event as:

```text
event: EVENT_NAME
data: JSON_PAYLOAD

```

Events:

| Event | Payload | Emitted when |
| --- | --- | --- |
| `sources` | array of `ChatSource` | Immediately after the chat envelope is built. |
| `command` | one `ChatCommand` | Once per command. |
| `chunk` | `{ "text": "..." }` | Once per response text chunk. |
| `done` | `{ "status": "ok" }` | After all chunks have been sent. |
| `error` | `{ "detail": "..." }` | If response building raises an exception. |

Response headers:

- `Cache-Control: no-cache`
- `Connection: keep-alive`
- media type `text/event-stream`

## Structure Assets

Structure assets are a backend-created bridge between external AlphaFold data and frontend rendering needs.

Why structure assets exist:

- The universe needs small traces for rendering many proteins efficiently.
- Focus mode needs richer traces and confidence metrics.
- The frontend should not fetch and parse every PDB just to render the universe.
- Some AlphaFold lookups can fail, so the app needs stable fallback records.

Trace levels:

| Trace | Max points | Used for |
| --- | ---: | --- |
| `low_trace` | 24 | Default wide universe rendering. |
| `mid_trace` | 72 | Selected, hovered, highlighted, or focused universe rendering. |
| `focus_trace` | 180 | Focus mode and fallback detail. |

Confidence colors are interpreted by the frontend:

| pLDDT | Meaning in code | Color in frontend |
| --- | --- | --- |
| `>= 90` | very high | blue |
| `70-89` | confident | cyan |
| `50-69` | low | yellow |
| `< 50` | very low | orange |

Function category halo colors are defined in the backend builder and mirrored in frontend utils:

| Category | Color |
| --- | --- |
| `enzyme` | `#8de285` |
| `signaling` | `#f1766a` |
| `structural` | `#77b0ff` |
| `transporter` | `#f5b55f` |
| `dna_repair` | `#7de7dc` |

## Tests

Run backend tests from the repo root:

```bash
npm run test:backend
```

Or directly:

```bash
python3 -m unittest discover -s backend/tests
```

### `test_api.py`

Covers:

- `/api/health`
- Alzheimer protein search
- graph path and query endpoints
- chat SSE event stream
- structure asset endpoints
- OpenAPI route presence

### `test_services.py`

Covers:

- Alzheimer disease lookup
- coordinate-distance similarity ordering
- structure asset traces and procedural fallback source
- graph path for direct drug-target links
- graph search for Alzheimer node

### `test_data_consistency.py`

Covers:

- every protein resolves to a graph node
- every disease reference resolves to a graph node
- every drug reference resolves to a graph node
- every edge references known nodes
- curated Alzheimer fixture exists

## Running Locally

Install dependencies:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start the API:

```bash
python3 -m uvicorn app.main:app --reload
```

The API runs on `http://localhost:8000`.

Useful URLs:

- `http://localhost:8000/api/health`
- `http://localhost:8000/openapi.json`
- `http://localhost:8000/docs`

## Common Development Tasks

### Rebuild fixtures

```bash
npm run build:fixtures
```

Use this after editing:

- `backend/app/data/proteins.json`
- `backend/app/data/knowledge_graph.json`
- fixture builder logic
- structure asset builder logic

### Add a protein

1. Add a record to `backend/app/data/proteins.json`.
2. Include a stable UniProt ID and coordinates.
3. Include disease, drug, and GO term data if known.
4. Include `alphafold_url` when available.
5. Run `npm run build:fixtures`.
6. Run `npm run test:backend`.

### Add a relationship

1. Add or update nodes/edges in `backend/app/data/knowledge_graph.json`.
2. Prefer canonical IDs:
   - proteins: `P38398`
   - diseases: `disease:breast_cancer`
   - drugs: `drug:olaparib`
   - trials: `trial:nct...`
3. Run `npm run build:fixtures`.
4. Run `npm run test:backend`.

### Add a response field

1. Add the field to `backend/app/models/schemas.py`.
2. Populate it in the service or repository.
3. Update tests.
4. Mirror the field in `frontend/lib/types.ts`.

### Add a chat command

1. Add the command literal to `ChatCommandType` in `schemas.py`.
2. Update `ChatService` to emit it.
3. Update `SYSTEM_PROMPT` in `llm_service.py` if the optional narrator should preserve it.
4. Mirror the command type in `frontend/lib/types.ts`.
5. Implement command behavior in `frontend/lib/store.ts`.
6. Add tests on both sides if the behavior is stateful.

## Current Limitations

- Data is fixture-backed.
- Graph traversal is in memory.
- Search uses substring and token overlap scoring.
- Similarity uses fixture-space Euclidean distance.
- Structure generation fetches AlphaFold data during fixture rebuilds and falls back procedurally.
- Optional LLM narration is best-effort and silently falls back to deterministic local responses.
- No authentication, authorization, persistence, or user sessions are implemented.
- This backend is for exploratory visualization, not clinical decision support.
