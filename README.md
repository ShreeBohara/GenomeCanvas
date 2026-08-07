# GenomeCanvas

GenomeCanvas is now a full-stack MVP workspace for exploring proteins, diseases, drugs, and structures through a synchronized universe view, graph panel, structure viewer, and grounded chat guide.

## What Is In This Repo

- `backend/` contains a FastAPI API with typed protein, graph, and chat endpoints.
- `frontend/` contains a Next.js 14 + TypeScript app with:
  - a 3D protein universe built with `@react-three/fiber`
  - a graph panel built with `react-force-graph-2d`
  - a Molstar-based structure viewer loaded through a local browser wrapper
  - a chat panel that consumes typed SSE events from the backend
- `Documents/genomecanvas-spec.md` contains the original product/spec document.

## Current MVP Capabilities

- Canonicalized fixture data with synchronized IDs across protein detail and graph payloads
- Typed backend routes for:
  - `GET /api/proteins/universe`
  - `GET /api/proteins/search`
  - `GET /api/proteins/{uniprot_id}`
  - `GET /api/proteins/{uniprot_id}/similar`
  - `GET /api/graph/neighborhood/{node_id}`
  - `GET /api/graph/path`
  - `POST /api/graph/query`
  - `POST /api/chat/message` as `text/event-stream`
- Curated Alzheimer fixture coverage so the app supports the main demo flows:
  - BRCA1 explanation
  - Alzheimer disease exploration
  - EGFR drug-target exploration

## Local Development

### Backend

```bash
cd backend
python3 -m uvicorn app.main:app --reload
```

The backend listens on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend listens on `http://localhost:3000`.

### Environment

Copy values from `.env.example` as needed:

- `NEXT_PUBLIC_API_BASE_URL`
- `GENOMECANVAS_CORS_ORIGINS`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`

If no Anthropic key is provided, the chat remains grounded and deterministic using local fixture data.

## Scripts

From the repo root:

```bash
npm run build:fixtures
npm run dev:backend
npm run dev:frontend
npm run test:backend
npm run test:frontend
```

From `frontend/`:

```bash
npm run lint
npm run test
npm run build
```

## Verification

- Backend tests use `unittest` in `backend/tests/` (25 tests)
- Frontend tests use `vitest` in `frontend/__tests__/` (14 tests)
- Playwright smoke tests live in `frontend/e2e/`
- CI runs all of the above plus typecheck, lint, and a production build: `.github/workflows/ci.yml`
- The Molstar browser bundle is copied into `frontend/public/vendor/molstar-viewer` by `frontend/scripts/copy-molstar-assets.mjs`

## Deployment

Config is in the repo; neither target has been provisioned yet.

- **Frontend → Vercel:** `vercel.json` sets `frontend/` as the root directory. After the first
  deploy, set `NEXT_PUBLIC_API_BASE_URL` to the API's public URL.
- **API → Render (or any container host):** `render.yaml` builds `backend/Dockerfile`. Set
  `GENOMECANVAS_CORS_ORIGINS` to the deployed frontend origin. `ANTHROPIC_API_KEY` is optional —
  without it the chat stays grounded and deterministic.

## Notes

- The current data layer is fixture-backed by design so the API and UI contracts can stabilize before live Neo4j/pgvector integrations land.
- The graph, search, similarity, and chat orchestration layers are written so the backing repositories can be swapped later without changing the frontend contract.
- Entity resolution in chat requires whole-term matches on gene symbols and accessions, and scores
  graph queries only on non-stopword tokens. Both guards exist because plain substring matching
  resolved "describe" to gene DES and "show me the app" to an unrelated disease.
