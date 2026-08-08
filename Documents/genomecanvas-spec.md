# GenomeCanvas — Navigating the Protein Universe with an AI Guide

**Technical Specification & Implementation Plan**
Version 1.0 — March 2026

---

## 1. Executive Summary

GenomeCanvas is an interactive web application that makes protein structural biology accessible to everyone. It combines AlphaFold's predicted 3D protein structures with a biomedical knowledge graph and an LLM-powered conversational guide, letting users explore proteins, diseases, drugs, and clinical trials through a visually rich, AI-narrated experience.

The core experience has three integrated views: a 3D protein universe where thousands of proteins float as nodes clustered by function, an embedded molecular viewer that renders any protein's 3D structure with AlphaFold confidence coloring, and a knowledge graph panel that maps relationships between proteins, diseases, and drugs. An LLM panel ties it all together, letting users ask natural language questions that drive navigation across all three views.

---

## 2. Problem & Motivation

AlphaFold's database contains 214+ million predicted protein structures, arguably the most impactful scientific dataset of the decade. Yet exploring this data requires specialized tools like Mol* or PyMol that are built for researchers, not general audiences. There is no single platform that lets a curious student, a biotech PM, or a clinician type "show me proteins involved in Alzheimer's" and get an explorable, narrated visual experience connecting structures to diseases to therapeutics.

GenomeCanvas fills this gap by building an integrated exploration layer on top of existing open data sources and APIs.

---

## 3. Architecture Overview

### 3.1 High-Level Components

- **Frontend:** Next.js 14 (App Router) with TypeScript, Three.js for the 3D universe, Mol* (Molstar) for protein rendering, D3.js / react-force-graph for knowledge graph visualization, and a chat panel for LLM interaction.
- **Backend API:** FastAPI (Python) handling LLM orchestration, embedding search, knowledge graph queries, and data aggregation from external APIs.
- **Knowledge Graph Database:** Neo4j storing protein→disease→drug→clinical trial relationships, pre-populated from structured open data sources.
- **Vector Store:** PostgreSQL with pgvector for protein embedding similarity search and RAG document retrieval.
- **External APIs:** AlphaFold DB REST API, UniProt REST API, OpenTargets GraphQL API, RCSB PDB API.

### 3.2 Data Flow

When a user types a natural language query, the FastAPI backend classifies the intent (search proteins, explain structure, find drugs, explore disease pathway) and routes to the appropriate handler. The handler queries Neo4j for graph traversals, pgvector for semantic search, and external APIs for on-demand data. Results are assembled and sent to the frontend, which updates all three panels simultaneously. The LLM generates a narrated explanation that references the visual elements on screen.

---

## 4. Data Sources & Pipeline

### 4.1 Data Sources

| Source | What We Get | Access Method | Size / Scope |
|--------|-------------|---------------|--------------|
| **UniProt** | Protein metadata, function annotations, gene/organism info, GO terms | REST API + bulk TSV | ~570K reviewed (Swiss-Prot) |
| **AlphaFold DB** | Predicted 3D structures (.cif/.pdb), per-residue confidence (pLDDT) | REST API (on-demand) | 214M+ structures |
| **OpenTargets** | Target→disease associations, drug→target mappings, clinical evidence | GraphQL API | ~63K targets, ~20K diseases |
| **DisGeNET** | Gene→disease associations with evidence scores | Bulk TSV download | ~1.1M associations |
| **ChEMBL** | Drug compound data, mechanism of action, clinical trial phases | REST API | ~2.4M compounds |
| **ClinicalTrials.gov** | Active/completed trials for drug-target-disease combos | REST API | ~480K studies |

### 4.2 Data Pipeline (ETL)

The data pipeline runs as a set of Python scripts that populate Neo4j and pgvector. It does not need to run in real-time; it's a one-time setup with periodic refresh capability.

**Phase 1: Core Protein Dataset (~10,000 proteins)**

We scope the initial dataset to human proteins in Swiss-Prot (reviewed UniProt entries for Homo sapiens, ~20,500 entries), then filter to the ~10,000 most therapeutically relevant proteins based on OpenTargets association scores. This keeps the 3D universe performant while covering the vast majority of drug targets and disease-associated proteins.

**Phase 2: Knowledge Graph Construction**

1. Fetch protein metadata from UniProt REST API (function, subcellular location, GO terms, pathway annotations).
2. Query OpenTargets GraphQL for each protein's target→disease associations (score > 0.3 threshold) and known drug mechanisms.
3. Supplement with DisGeNET gene→disease associations for broader coverage.
4. Pull drug/compound data from ChEMBL for each identified drug target.
5. Create Neo4j nodes: Protein, Disease, Drug, ClinicalTrial, Pathway, GOTerm.
6. Create Neo4j edges: ASSOCIATED_WITH, TARGETS, TREATS, HAS_TRIAL, PARTICIPATES_IN, HAS_FUNCTION.

**Phase 3: Embedding Generation**

For each protein, generate a 768-dimensional embedding using ESM-2 (Facebook's protein language model) from the amino acid sequence. These embeddings capture structural and functional similarity. Reduce to 3D using UMAP for the universe visualization coordinates. Store both the full embeddings (in pgvector for similarity search) and UMAP coordinates (for rendering).

**Phase 4: RAG Document Indexing**

Chunk and embed UniProt functional annotations, PDB structure descriptions, and OpenTargets evidence summaries. Store in pgvector with metadata linking back to the relevant protein/disease/drug. This powers the LLM's ability to give detailed, sourced explanations.

---

## 5. Frontend Architecture

### 5.1 Layout

The app uses a split-panel layout with three main areas. On the left (60% width): the primary viewport that toggles between the 3D protein universe and the molecular structure viewer. On the right (40% width): a vertically split panel with the knowledge graph visualization on top and the LLM chat panel on bottom. All three panels are interconnected — clicking a node in any view updates the others.

### 5.2 3D Protein Universe (Three.js)

The universe view renders ~10,000 proteins as instanced point sprites in a Three.js scene. Each protein is a glowing particle, colored by its primary functional category (enzyme = green, structural = blue, signaling = red, transporter = yellow, etc.). Positions come from pre-computed UMAP coordinates, so functionally similar proteins naturally cluster together.

- Instanced rendering via `THREE.InstancedMesh` for performance (10K points is trivial for modern GPUs).
- Raycasting for hover/click interactions on individual proteins.
- Camera controls: orbit, zoom, pan. Smooth animated transitions when the LLM filters or focuses on a subset.
- Search highlights: when a query returns results, non-matching proteins dim to 10% opacity and matching ones pulse with a glow effect.
- Cluster labels rendered as `THREE.Sprite` text labels floating above each functional cluster.

### 5.3 Molecular Structure Viewer (Molstar)

When a user selects a protein, the viewport transitions to the Molstar embedded viewer showing the AlphaFold predicted structure. Molstar is loaded as an npm package (`@molstar/mol-star`) and initialized in a React component.

- Default representation: cartoon (ribbon) colored by pLDDT confidence (blue > 90, cyan 70–90, yellow 50–70, orange < 50).
- Toggle options: surface, ball-and-stick, spacefill representations.
- Highlight residues on hover with tooltip showing amino acid name, position, and pLDDT score.
- If AlphaMissense data is available for the protein, overlay pathogenicity scores as a secondary coloring mode.

### 5.4 Knowledge Graph Panel (D3 / react-force-graph)

A 2D force-directed graph showing the currently selected protein's neighborhood in the knowledge graph. Nodes are colored by type (protein = blue, disease = red, drug = green, trial = purple). Edges labeled with relationship types. Clicking any node in the graph navigates to that entity — clicking a disease shows all associated proteins, clicking a drug shows its targets and trials.

### 5.5 LLM Chat Panel

A conversational interface (similar to a chat window) where users interact with the AI molecular biologist. The LLM's responses include both text explanations and action commands that update the other panels. For example, when the LLM says "This protein is primarily targeted by Trastuzumab," the drug node in the knowledge graph simultaneously highlights.

---

## 6. Backend Architecture

### 6.1 FastAPI Service

The backend is a single FastAPI service with the following route groups:

**`/api/proteins`**

- `/api/proteins/universe` — Returns all protein IDs, UMAP coordinates, and functional categories for the 3D view. Cached in memory on startup (~2MB payload).
- `/api/proteins/{uniprot_id}` — Fetches protein detail: metadata from Neo4j, 3D structure URL from AlphaFold API, and pre-computed annotations.
- `/api/proteins/search?q=...` — Semantic search over protein embeddings in pgvector. Returns top-K similar proteins.
- `/api/proteins/{uniprot_id}/similar` — Finds structurally/functionally similar proteins using embedding cosine similarity.

**`/api/graph`**

- `/api/graph/neighborhood/{node_id}` — Returns 1-hop or 2-hop neighborhood from Neo4j for knowledge graph visualization.
- `/api/graph/path?from=...&to=...` — Shortest path between two entities in the knowledge graph.
- `/api/graph/query` — Accepts a structured graph query (generated by LLM from natural language) and returns matching subgraph.

**`/api/chat`**

- `/api/chat/message` — Streaming endpoint. Takes user message + current UI context (selected protein, visible graph state). Routes through the LLM orchestration pipeline and streams back response chunks with embedded UI commands.

### 6.2 LLM Orchestration Pipeline

The chat endpoint uses a multi-step pipeline:

1. **Intent Classification:** Determine what the user wants (explain protein, search proteins, find drugs, compare structures, explore pathway). Uses a small prompt with few-shot examples; no separate model needed.
2. **Query Planning:** Based on intent, generate a plan of data fetches (Neo4j Cypher queries, API calls, pgvector searches). The LLM generates these queries given schema descriptions in the system prompt.
3. **Data Retrieval:** Execute planned queries in parallel. Aggregate results.
4. **RAG Augmentation:** Retrieve relevant chunks from the indexed UniProt/PDB/OpenTargets documents via pgvector similarity search on the user's question embedding.
5. **Response Generation:** Feed the retrieved data + RAG context + conversation history to Claude (via Anthropic API). The system prompt instructs the model to act as a molecular biologist, reference specific data points, and include UI command markers (e.g., `[HIGHLIGHT:ERBB2]` or `[NAVIGATE:disease:alzheimers]`) that the frontend parses to update visualizations.

### 6.3 External API Integration

All external API calls go through a caching layer (Redis or in-memory LRU cache) with TTL of 24 hours. This is critical because the AlphaFold and UniProt APIs have rate limits, and repeated queries for the same protein should be instant.

---

## 7. Knowledge Graph Schema (Neo4j)

### 7.1 Node Types

| Node Type | Key Properties | Source |
|-----------|---------------|--------|
| **Protein** | uniprot_id, name, gene_name, organism, function_description, sequence_length, subcellular_location, umap_x/y/z | UniProt + ESM-2 embeddings |
| **Disease** | disease_id (EFO/MONDO), name, description, therapeutic_area | OpenTargets + DisGeNET |
| **Drug** | chembl_id, name, drug_type, max_phase, mechanism_of_action | ChEMBL + OpenTargets |
| **ClinicalTrial** | nct_id, title, phase, status, start_date | ClinicalTrials.gov |
| **Pathway** | pathway_id, name, source (Reactome/KEGG) | UniProt cross-references |
| **GOTerm** | go_id, name, category (molecular_function/biological_process/cellular_component) | UniProt GO annotations |

### 7.2 Relationship Types

- `(Protein)-[:ASSOCIATED_WITH {score, evidence_count, source}]->(Disease)`
- `(Drug)-[:TARGETS {mechanism, action_type}]->(Protein)`
- `(Drug)-[:INDICATED_FOR {max_phase}]->(Disease)`
- `(Drug)-[:HAS_TRIAL]->(ClinicalTrial)`
- `(Protein)-[:PARTICIPATES_IN]->(Pathway)`
- `(Protein)-[:HAS_FUNCTION]->(GOTerm)`
- `(Protein)-[:INTERACTS_WITH {evidence}]->(Protein)` — from STRING DB or IntAct

---

## 8. LLM Interaction Design

### 8.1 Example Interactions

**Protein Exploration**

> **User:** "What does BRCA1 do?"
>
> **System:** Classifies as EXPLAIN_PROTEIN intent. Fetches BRCA1 data from Neo4j (function, diseases, drugs). Retrieves RAG chunks about BRCA1 from UniProt annotations. LLM generates explanation referencing the 3D structure now displayed in Molstar, highlighting DNA-binding domains and known mutation hotspots. Knowledge graph shows BRCA1's connections to breast cancer, ovarian cancer, and PARP inhibitors like Olaparib.

**Disease-Centric Search**

> **User:** "Show me proteins involved in Alzheimer's disease."
>
> **System:** Classifies as SEARCH_BY_DISEASE. Queries Neo4j: `MATCH (p:Protein)-[:ASSOCIATED_WITH]->(d:Disease) WHERE d.name CONTAINS 'Alzheimer' RETURN p`. Returns matching proteins. Universe view dims all proteins except hits, which glow and are labeled. LLM summarizes the top hits (APP, PSEN1, PSEN2, APOE, MAPT) and explains each one's role.

**Drug Discovery Traversal**

> **User:** "Find drug targets for this protein." (with EGFR selected)
>
> **System:** Classifies as FIND_DRUGS. Queries Neo4j for drugs targeting EGFR. Returns Erlotinib, Gefitinib, Osimertinib, Cetuximab, etc. Knowledge graph expands to show drug nodes with trial status. LLM explains the difference between small-molecule TKIs and monoclonal antibodies targeting EGFR, and notes which are FDA-approved vs. in trials.

**Mutation Analysis (V2 feature)**

> **User:** "What happens if residue 858 mutates in EGFR?"
>
> **System:** Looks up AlphaMissense pathogenicity score for EGFR L858R. Overlays the score on the 3D structure. LLM explains that L858R is one of the most common activating mutations in non-small cell lung cancer, making the kinase constitutively active, and that this specific mutation is sensitive to Osimertinib.

### 8.2 UI Command Protocol

The LLM's response includes inline commands that the frontend parses and executes. These are stripped from the displayed text and routed to the appropriate panel.

- `[HIGHLIGHT:{entity_type}:{entity_id}]` — Highlight a node in the knowledge graph or universe view.
- `[NAVIGATE:{entity_type}:{entity_id}]` — Navigate the knowledge graph to center on this entity.
- `[LOAD_STRUCTURE:{uniprot_id}]` — Load a protein structure in Molstar.
- `[FILTER_UNIVERSE:{query}]` — Filter the 3D universe to show only matching proteins.
- `[COLOR_RESIDUES:{uniprot_id}:{residue_range}:{color}]` — Highlight specific residues in Molstar.

---

## 9. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend Framework | Next.js 14 + TypeScript | SSR, App Router, excellent DX |
| 3D Universe | Three.js + @react-three/fiber | Mature, performant, wide support |
| Protein Viewer | Molstar (@molstar/mol-star) | Industry standard, AlphaFold native |
| Knowledge Graph Viz | react-force-graph-2d | Lightweight, interactive, React-native |
| Backend API | FastAPI (Python) | Async, fast, great for ML/data work |
| LLM | Claude API (Anthropic) | Strong reasoning, long context |
| Graph Database | Neo4j (Aura Free or Docker) | Purpose-built for graph traversals |
| Vector Store | PostgreSQL + pgvector | Familiar, co-locates with other data |
| Embeddings | ESM-2 (protein) + text-embedding-3-small (RAG) | Best protein embeddings + cheap text embeddings |
| Caching | Redis or in-memory LRU | Rate limit protection for external APIs |
| Deployment | Vercel (frontend) + Railway/Render (backend) + Neo4j Aura | Free tiers available, simple CI/CD |

---

## 10. Implementation Timeline

### Month 1: Data Foundation

| Week | Milestone | Deliverables |
|------|-----------|-------------|
| 1–2 | Environment Setup | Next.js project scaffold, FastAPI project, Neo4j instance (Aura free or Docker), pgvector setup, CI/CD pipeline |
| 3–4 | Data Pipeline V1 | UniProt bulk download script, OpenTargets GraphQL fetcher, Neo4j node/edge creation scripts, ~10K protein dataset loaded |
| 5–6 | Embeddings | ESM-2 inference pipeline for protein sequences (can use pre-computed from UniProt), UMAP dimensionality reduction, pgvector population |

### Month 2: Frontend Core

| Week | Milestone | Deliverables |
|------|-----------|-------------|
| 7–8 | 3D Universe | Three.js scene with instanced particles, UMAP-positioned, color by function, orbit controls, raycasting for selection |
| 9–10 | Molstar Integration | Embed Molstar viewer, load AlphaFold structures by UniProt ID, pLDDT confidence coloring, representation toggles |
| 11–12 | Knowledge Graph Panel | react-force-graph-2d rendering Neo4j neighborhood data, node click navigation, type-based coloring, edge labels |

### Month 3: LLM Integration

| Week | Milestone | Deliverables |
|------|-----------|-------------|
| 13–14 | RAG Pipeline | Chunk + embed UniProt annotations and OpenTargets summaries, pgvector retrieval, context assembly for LLM |
| 15–16 | Chat Backend | FastAPI streaming endpoint, intent classifier, Cypher query generation from natural language, LLM response pipeline |
| 17–18 | Frontend Chat + Commands | Chat UI component, parse UI command protocol from LLM responses, wire commands to Three.js/Molstar/graph panels |

### Month 4: Polish & Advanced Features

| Week | Milestone | Deliverables |
|------|-----------|-------------|
| 19–20 | AlphaMissense (V2) | Download AlphaMissense TSV for human proteome, pre-process for indexed proteins, overlay pathogenicity on Molstar |
| 21–22 | UX Polish | Loading states, animations (smooth universe transitions, graph expansion), responsive layout, error handling, onboarding tour |
| 23–24 | Performance | API response caching, lazy loading, bundle optimization, Molstar load time reduction, WebWorker for embedding search |

### Month 5: Ship It

| Week | Milestone | Deliverables |
|------|-----------|-------------|
| 25–26 | Deployment | Vercel + Railway/Render deployment, Neo4j Aura prod, domain setup, SSL, environment configs |
| 27–28 | Demo & Content | Record demo video, write README + blog post, create sample exploration paths (Alzheimer's, cancer, rare diseases) |
| 29–30 | Launch | Deploy to production, share on LinkedIn/Twitter/HN/Reddit, gather feedback, bug fixes |

---

## 11. MVP Scope

### 11.1 MVP (Must Have)

1. 3D protein universe with ~10K human proteins, clustered by function, clickable
2. Molstar viewer loading AlphaFold structures with confidence coloring
3. Neo4j knowledge graph with protein→disease→drug relationships from OpenTargets
4. Interactive knowledge graph panel with 1-2 hop exploration
5. LLM chat that can explain proteins, search by disease, and find drugs for targets
6. RAG-augmented responses citing UniProt and OpenTargets data
7. Natural language → graph query translation (at least 5 query types)
8. UI commands from LLM that update all three panels

### 11.2 V2 (Nice to Have)

1. AlphaMissense mutation pathogenicity overlay
2. Protein-protein interaction edges (from STRING DB)
3. ClinicalTrials.gov integration for trial details
4. Pathway visualization (Reactome diagrams)
5. Multi-protein comparison mode
6. User accounts and saved exploration sessions

### 11.3 Out of Scope

- WebGPU rendering (Three.js WebGL is sufficient for 10K nodes)
- LLM-based knowledge extraction from literature (using structured APIs instead)
- Full 214M protein database (subset is more than sufficient)
- Custom molecular dynamics simulations
- Mobile-native app (responsive web is the target)

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Molstar integration complexity | Could delay Month 2 by 1–2 weeks | Start Molstar spike in Week 1. Use their React example as baseline. Fall back to 3Dmol.js if blocked. |
| LLM hallucination on biology | Incorrect medical/drug info | RAG-only responses (never pure generation). Include source citations. Disclaimer that this is educational, not medical advice. |
| Neo4j Aura free tier limits | May hit storage/query limits | Start with Docker locally. Migrate to Aura only for production. Keep graph under 500K nodes. |
| AlphaFold API rate limits | Slow structure loading | Cache every fetched structure in Redis/disk. Pre-fetch structures for the 10K indexed proteins during pipeline. |
| ESM-2 compute for embeddings | Slow embedding generation | Use pre-computed embeddings from ESM Atlas if available. Otherwise, run batch inference once on Google Colab/GPU instance. |
| Scope creep | Project never ships | Strict MVP definition. No V2 features until MVP is deployed. Weekly milestone check-ins. |

---

## 13. Deployment Architecture

### 13.1 Infrastructure

- **Frontend:** Vercel (free tier, automatic deploys from GitHub main branch)
- **Backend API:** Railway or Render (free/hobby tier, Docker container with FastAPI + uvicorn)
- **Neo4j:** Neo4j Aura Free (50K nodes, 175K relationships) or self-hosted on Railway
- **PostgreSQL + pgvector:** Supabase free tier (500MB) or Railway Postgres
- **Redis:** Upstash free tier (10K commands/day) for API response caching
- **Domain:** genomecanvas.com or genomecanvas.app

### 13.2 Estimated Monthly Cost

During development and initial launch: $0–$20/month. The only potential cost is the Anthropic API for LLM responses (~$0.003 per chat turn with Claude Haiku, or ~$0.015 with Sonnet). At low traffic this is negligible. All other services have free tiers that cover the project's needs.

---

## 14. Success Metrics

For a portfolio project, success is measured by demonstrability and technical depth, not user metrics. The key goals are:

1. A live, deployed app that a visitor can interact with without setup.
2. A compelling 3–5 minute demo video showing end-to-end protein exploration.
3. At least 3 complete exploration paths that demonstrate the full feature set (e.g., Alzheimer's pathway, cancer drug discovery, rare disease investigation).
4. Clean, well-documented GitHub repository with architecture diagrams and README.
5. Technical blog post explaining the architecture and design decisions.
