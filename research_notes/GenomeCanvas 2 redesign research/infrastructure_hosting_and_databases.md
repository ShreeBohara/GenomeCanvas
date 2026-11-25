# Infrastructure, hosting, databases, pipelines and ops for a $0-20/month data-heavy open-source web app (checked 2026-11-25)

Method note: figures were taken from vendor docs fetched on 2026-11-25 unless marked "search summary" (a web-search digest of a page I could not fetch directly) or "anecdotal". Several fetches returned model-summarised page text, so any number that drives a purchase decision should be re-checked on the live page. Where sources conflict this is stated. No project-identifying terms were used in queries.

---

## 1. Cloudflare free plan and $5 Workers Paid (Workers, assets, R2, D1, KV, DO, Queues, Workflows, Vectorize, Hyperdrive, Containers, AI Gateway, Turnstile, Pages, Iceberg/Pipelines/SQL)

### Takeaway
Cloudflare is the only vendor in this survey whose free tier combines static hosting, S3-compatible object storage with free egress, a SQL DB, and a stateful (Durable Object) layer. The binding constraints on Free are 10 ms CPU per request, 100k requests/day (hard failure, not throttle), 20,000 static files per Worker version, and D1's 500 MB per-DB cap. Workers Paid ($5/mo) removes the request cap and raises CPU to 30 s default. Several data-platform products were renamed ("Basin ...") or are still beta in 2026.

### Cited Findings
- Workers limits: Free = 100,000 requests/day (reset 00:00 UTC), 10 ms CPU per HTTP request, 128 MB memory, 64 MiB worker size, 50 subrequests/invocation, 20,000 static-asset files per Worker version, 25 MiB per asset file. Paid = no request cap, 5 min max CPU (default 30 s), 10,000 subrequests (up to 10M), 100,000 asset files. Exceeding Free requests returns Error 1027 — [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
- Workers Paid: $5/month minimum per account; includes 10M requests then $0.30/M; 30M CPU-ms then $0.02/M CPU-ms; no charge for bandwidth. KV: Free 100k reads/day, 1,000 writes/day, 1 GB; Paid 10M reads, 1M writes, 1 GB then $0.50/GB. Queues: Free 10,000 ops/day; Paid 1M/month then $0.40/M. Workflows: Free 3,000 steps/day, 1 GB storage; Paid 500k steps/month. Hyperdrive: Free 100,000 queries/day, Paid unlimited — [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- Durable Objects ARE available on the Free plan, SQLite-backend only: 100,000 requests/day, 13,000 GB-s/day duration, 5M SQLite rows read/day, 100k rows written/day, 5 GB storage total. Paid: 1M requests then $0.15/M; 400k GB-s then $12.50/M GB-s; 25B rows read; 50M rows written then $1/M; $0.20/GB-month beyond 5 GB. Daily limits reset 00:00 UTC; over-limit ops fail. SQLite storage billing was scheduled to start 2026-01-07 — [DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/)
- D1: Free = 10 DBs, 500 MB max per DB, 5 GB total, 5M rows read/day, 100k rows written/day, 50 queries per invocation. Paid = 10 GB per DB, 1 TB total, 25B rows read/month and 50M written/month included, then $0.001/M reads, $1.00/M writes, $0.75/GB-month storage — [D1 limits](https://developers.cloudflare.com/d1/platform/limits/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- R2: Free tier is 10 GB-month storage, 1M Class A, 10M Class B per month, egress free. Paid: $0.015/GB-month standard ($0.01 IA, 30-day minimum, $0.01/GB retrieval), Class A $4.50/M, Class B $0.36/M. Usage rounds up to the next billing unit. Egress via Workers/S3 API/r2.dev is free. First 100,000 buckets included — [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- Vectorize (current indexes): max 1,536 dims (float32), 20,000,000 vectors/index, 100 indexes on Free (50,000 default on Paid), topK max 50 with values/metadata or 100 without, 10 KiB metadata/vector, upsert batch 1,000 (Workers) / 5,000 (HTTP). V1 indexes (200k vectors) are deprecated. The page I fetched gave no per-plan quota or price for stored/queried dimensions — [Vectorize limits](https://developers.cloudflare.com/vectorize/platform/limits/)
- Containers: no included usage on Free (table shows N/A). Paid includes 25 GiB-hours memory, 375 vCPU-minutes, 200 GB-hours disk per month; overage $0.0000025/GiB-s memory, $0.000020/vCPU-s, $0.00000007/GB-s disk. Instance types: lite (1/16 vCPU, 256 MiB), basic (1/4 vCPU, 1 GiB, 4 GB), standard-1 (1/2 vCPU, 4 GiB) … standard-4 (4 vCPU, 12 GiB). Egress 1 TB/month included in NA/EU then $0.025/GB. Snapshots are in public beta — [Containers pricing](https://developers.cloudflare.com/containers/pricing/)
- AI Gateway: core features (analytics, caching, rate limiting) "offered for free"; Workers Free accounts that created a first gateway before 2026-09-24 get 100,000 logs total across gateways; accounts created on/after that date follow Workers Logs pricing/retention; Unified Billing adds a 5% fee on credit purchases — [AI Gateway pricing](https://developers.cloudflare.com/ai-gateway/reference/pricing/)
- Turnstile: Free plan lists unlimited challenges, up to 20 widgets and 10 hostnames per widget (a Piano integration doc quotes older, lower limits) — search summary of [Turnstile plans](https://developers.cloudflare.com/turnstile/plans)
- Workers rate-limiting binding: counters are per Cloudflare location, "permissive, eventually consistent", explicitly not an accurate accounting system — search summary of [Rate limit binding docs](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- Pages is not sunset: docs call Workers the primary platform; Workers Sites is deprecated in Wrangler v4; static-asset requests on Workers are free like Pages; Workers serve assets before the script unless `assets.run_worker_first` — search summary of [migrate from Pages](https://developers.cloudflare.com/workers/static-assets/migrate-from-pages/) (third-party [DEV post](https://dev.to/rickcogley/cloudflare-pages-vs-workers-in-2026-migration-guide-ka7) says "deprecated" is overstated)
- Iceberg/analytics stack renamed in 2026 (per fetched pages): "R2 Data Catalog" is now "Basin Catalog" (GA; Iceberg REST catalog; works with Spark, PyIceberg, Trino, DuckDB, ClickHouse, Snowflake); "R2 SQL" is now "Basin SQL" (GA; old R2 SQL APIs "will be deprecated in the future"); Pipelines ("Basin Pipelines") pricing on Paid: stream ingress free, SQL transforms 50 GB included then $0.04/GB, sinks 50 GB included then $0.03/GB (R2 JSON) or $0.06/GB (Parquet/Iceberg), plus R2 and catalog charges. No catalog-operation pricing or GA/beta label for Pipelines was shown — [Basin Catalog](https://developers.cloudflare.com/r2/data-catalog/), [Basin SQL](https://developers.cloudflare.com/r2-sql/), [Pipelines pricing](https://developers.cloudflare.com/pipelines/platform/pricing/)
- 2026 changelog items seen: 2026-11-24 Email Sending available on Workers Free (verified destinations only); 2026-11-25 subscriptions (Workers Paid, R2) activatable via CLI/MCP; 2026-11-19 DO reliability improvements during runtime updates; AI Gateway logging change 2026-09-24 (above); DO SQLite billing start Jan 2026 — [Cloudflare changelog](https://developers.cloudflare.com/changelog/)
- CDN terms: Cloudflare's 2023 ToS rewrite replaced old Section 2.8; serving large/non-HTML files through the CDN is allowed when hosted on Cloudflare R2/Stream/Images, restricted for content hosted elsewhere. I could not retrieve current Service-Specific Terms text — [Cloudflare blog: updated ToS](https://blog.cloudflare.com/updated-tos/)

### Inferences
- Free-plan 20,000 asset-file cap means per-protein files (20k–570k) cannot be individual static assets; they must be packed into shards (Parquet/tar-like/binary) in R2 or served by range request.
- 10 ms CPU on Free is enough for routing, auth checks, KV/D1 lookups and proxying an LLM stream (wait time on I/O is, to my understanding, not CPU time — not verified in this session), but not for server-side graph traversal, vector search or JSON re-encoding of large payloads.
- Free-plan daily caps fail closed (Error 1027 / failed DO ops), so a traffic spike takes the API down until 00:00 UTC; Workers Paid at $5 is the cheap insurance.
- Because R2 egress is free, the cost driver for public data is Class B read count (10M free, then $0.36/M) and storage, not bandwidth.

### Gaps
- Vectorize per-plan quotas and per-dimension pricing (page fetched gave only limits). Workers Logs/Observability free quotas not fetched. Whether Workers Paid has a hard spend cap was not found (looks like none; unverified). Containers on Free: page does not say explicitly whether deployment is allowed. "Basin" rename could not be cross-checked against a Cloudflare blog/changelog entry (three fetched pages are consistent with each other).

---

## 2. Vercel Hobby and Pro

### Takeaway
Hobby is genuinely usable for a static/Next.js front end (100 GB fast data transfer, 1M function invocations, 300 s functions) but is hard-pause-on-overage (30 days), personal/non-commercial, and cannot connect to Git repos owned by a GitHub organization. Pro is $20/seat/month with a usage credit. Vercel is a good UI host but a poor store for tens of GB of data.

### Cited Findings
- Hobby included monthly usage: Fast Data Transfer 100 GB, Fast Origin Transfer 10 GB, CDN requests 1,000,000, Active CPU 4 hours, Provisioned Memory 360 GB-hours, Function Invocations 1,000,000, Image Transformations 5,000, Image Cache Reads 300,000, Image Cache Writes 100,000, Web Analytics 50,000 events, Speed Insights 10,000 events/30 days, Workflow events 50,000 — [Hobby plan](https://vercel.com/docs/plans/hobby)
- Overage on Hobby: "you will have to wait until 30 days have passed before you can use the feature again" (Web Analytics pauses 7 days) — [Hobby plan](https://vercel.com/docs/plans/hobby)
- Hobby vs Pro: function max duration 300 s on Hobby; Pro default 300 s, configurable 800 s, up to 1,800 s beta; memory/CPU 2 GB/1 vCPU on Hobby, up to 4 GB/2 vCPU on Pro; builds 2 vCPU/8 GB on Hobby; deployments/day 100 vs 6,000; 200 projects on Hobby; runtime logs 1 hour (Hobby) vs 1 day (Pro); WAF custom rules 3 vs 40; WAF IP blocks 10 vs 40; password protection is $20/month per project on Pro. Pro developer seats $20/user/month, viewers free — [Hobby plan](https://vercel.com/docs/plans/hobby), [Limits](https://vercel.com/docs/limits)
- Other Hobby limits: build time 45 min; build cache 5 GB (kept one month); CLI source upload 100 MB (Hobby) vs 1 GB (Pro); 15,000 source files per CLI deployment; 100 builds/hour; Hobby Blob rate limits 1,200 simple and 1,500 advanced ops/minute; cron jobs 100 per project (Hobby has per-day frequency restrictions per the cron usage page, which I did not fetch) — [Limits](https://vercel.com/docs/limits)
- "Vercel does not support connecting a project on your Hobby team to Git repositories owned by Git organizations" — [Limits](https://vercel.com/docs/limits)
- Pro on-demand rates: $0.60/M invocations, Active CPU from $0.128/hour, memory from $0.0106/GB-hr, image transformations $0.05/1K — [Fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)

### Inferences
- A repo under a GitHub organization cannot use Hobby; the project must live in the personal account (or move to Pro at $20, the whole budget).
- Vercel Hobby's 100 GB/month transfer is roughly one-tenth of what free R2 egress would serve at zero marginal cost for data files; keep bulk data off Vercel.

### Gaps
- The exact wording of the Hobby "non-commercial/personal use" clause was not shown in the fetched pages (the Terms page was not fetched); an open-source, non-commercial repo is plausibly fine but unconfirmed. Whether an AI Gateway free credit exists on Hobby and Blob free quota amounts were not found. Cron frequency limits on Hobby not fetched.

---

## 3. Running a Python (FastAPI) container cheaply

### Takeaway
No platform gives an always-warm Python container for $0 with good behaviour. Realistic options: Cloud Run or Azure Container Apps scale-to-zero free grants (cold starts of seconds), Fly.io at about $2-5/month, Render free (1-minute cold start), or Oracle Always Free (now only 2 OCPU/12 GB and reliability complaints). Several free tiers (Koyeb, HF Spaces) are in flux per 2026 reports.

### Cited Findings
- Cloud Run (request-based billing) free monthly allowance per Google's pricing pages: 2M requests, 180,000 vCPU-seconds, 360,000 GiB-seconds (Tier 1 regions; smaller in Tier 2); 240,000 vCPU-s and 450,000 GiB-s for always-allocated CPU/jobs. Cached copies of the page differ, so verify live — search summary of [Cloud Run pricing](https://cloud.google.com/run/pricing) (direct fetch returned truncated content)
- Azure Container Apps (Consumption): per subscription per month 180,000 vCPU-seconds, 360,000 GiB-seconds, and 2M requests free; only requests from outside the environment count — search summary of [Azure pricing](https://azure.microsoft.com/pricing/details/container-apps/) and [billing docs](https://learn.microsoft.com/en-us/azure/container-apps/billing)
- Fly.io: no free plan in the old sense; new accounts get $1 credit without a card, then after adding a card $5 of usage per month is credited; shared-cpu-1x 256 MB = $2.19/month; volumes $0.15/GB-month; egress $0.02/GB NA/EU, $0.04 APAC/SA/Oceania, $0.12 Africa/India; no minimum bill — [Fly pricing](https://docs.fly.io/about/pricing)
- Render free web service: spins down after 15 min idle; wake takes "about one minute"; 750 free instance hours per workspace per month; no persistent disk; free Postgres is 1 GB and expires 30 days after creation (14-day grace then deleted); free Key Value is in-memory only; "not for production use" — [Render free](https://render.com/docs/free)
- Oracle Always Free: Ampere A1 = first 1,500 OCPU-hours and 9,000 GB-hours per month, "equivalent to 2 OCPUs and 12 GB of memory" for Always Free tenancies; two AMD micro VMs (1/8 OCPU, 1 GB); 200 GB combined block/boot; 20 GB object storage; 10 TB/month egress; idle reclamation if over 7 days P95 CPU <20%, network <20%, and (A1) memory <20%; home region only; "out of host capacity" errors acknowledged — [Oracle Always Free](https://docs.oracle.com/en-us/iaas/Content/FreeTier/resourceref.htm). Anecdotal: an InfoQ piece (July 2026) says Oracle quietly halved A1 limits, and forum posts report instances disabled after an 2026-08-18 enforcement and persistent capacity errors — search summary of [InfoQ](https://infoq.com/news/2026/07/oracle-cloud-free-tier-limits/) and Oracle community threads (not verified against an Oracle notice)
- Koyeb (conflicting, secondary sources): free instance 512 MB / 0.1 vCPU / 2 GB, scale-to-zero after 1 hour, cannot be disabled; one source says the no-card plan ended Feb 2026 (card with $29 pre-auth hold), another says no card; one source says Koyeb was acquired by Mistral AI in Feb 2026 and new signups restricted from Sept 2026 — search summary of [Koyeb FAQ](https://www.koyeb.com/docs/faq/pricing) and aggregators
- Hugging Face Spaces: docs list CPU Basic (2 vCPU, 16 GB, 50 GB disk) as free, sleeping after 48 h inactivity. Anecdotal 2026 forum threads claim free CPU Basic quota is 0 on new accounts and Docker/Gradio SDKs restricted for unpaid accounts — search summary of [HF Spaces docs](https://huggingface.co/docs/hub/spaces-gpus) and [forum thread](https://discuss.huggingface.co/t/free-cpu-basic-quota-is-0-on-new-account/180764)

### Inferences
- For low traffic (say 100k requests/month at 200 ms and 0.5 vCPU/512 MiB): 100k x 0.2 s x 0.5 = 10,000 vCPU-s and 10,000 GiB-s, about 5% of the Cloud Run free grant, so $0 is realistic with cold starts of a few seconds when scaled to zero (cold-start latency was not measured/sourced here).
- Fly 256 MB shared is only $2.19/month always-on but FastAPI + DuckDB/numpy usually needs 512 MB-1 GB; price for those sizes was not fetched.
- Oracle's free VM is no longer a safe base for a 5-50 GB dataset server (2 OCPU/12 GB, reclamation, capacity errors); treat as a bonus not a dependency.

### Gaps
- AWS Lambda/App Runner, Railway, Northflank not researched (no sourced numbers). Measured cold starts for Cloud Run/Azure/Fly not found. Cloud Run official free-tier table not retrievable in this session. Koyeb and HF Spaces status unresolved (conflicting).

---

## 4. Serverless SQL: Neon, Supabase, Turso, D1, CockroachDB, Xata, Aiven, MotherDuck

### Takeaway
Free Postgres tiers cap at about 0.5-1 GB per database, so none can hold the full 570k-protein/10M-edge dataset; they suit user sessions and small relational tables. Turso (5 GB free) was acquired by Supabase on 2026-10-02. Extension support beyond pgvector (pgvectorscale, BM25, AGE) was not confirmed for any free tier.

### Cited Findings
- Neon Free ($0, no card): 100 projects, 10 branches/project, 100 CU-hours/project/month, autoscale to 2 CU (8 GB RAM), 1 GB storage per project (20 GB across projects), scale-to-zero after 5 min (cannot be turned off), 5 GB egress/project, 6-hour history window, 1 manual snapshot. Launch plan is usage-based, no monthly minimum: $0.106/CU-hour, $0.35/GB-month storage, 500 GB egress included, extra branches $1.50/month. Pricing page says all plans include extensions "pgvector, PostGIS, TimescaleDB, and more" — [Neon pricing](https://neon.com/pricing)
- Supabase Free: 2 active projects, 500 MB DB per project, 5 GB egress, 1 GB file storage, 50,000 MAU, projects pause after 1 week of inactivity. Pro from $25/month (8 GB disk, 250 GB egress, 100,000 MAU, $10 compute credit, no inactivity pause) — [Supabase pricing](https://supabase.com/pricing)
- Turso Free: 100 databases, 5 GB storage, 500M rows read/month, 10M rows written/month, 3 GB syncs; Developer $5.99/month ($4.99 annual), Scaler $29, Pro $499. Free users must upgrade instead of paying overage (search summary; several third-party pages show conflicting higher numbers) — [Turso pricing](https://turso.tech/pricing.md). Supabase announced it is acquiring Turso on 2026-10-02 alongside a $150M raise; Turso stays open source and operates separately for now — [Supabase announcement](https://supabase.com/blog/supabase-is-acquiring-turso), [SiliconANGLE](https://siliconangle.com/2026/10/02/database-startup-supabase-raises-150m-acquires-turso/)
- D1: see section 1 (500 MB/DB and 5 GB total on Free).

### Inferences
- A 570k x 256-dim float32 vector table alone is about 584 MB (570,000 x 256 x 4 B), so it overflows Neon Free (1 GB incl. indexes) and Supabase Free (500 MB) once an HNSW index is added; 2.3M vectors does not fit any free SQL tier.
- Use SQL for small, write-heavy data (sessions, annotations, auth) and keep read-only bulk data as files.

### Gaps
- Not researched: CockroachDB, Xata, Aiven, MotherDuck free tiers. Not confirmed on any provider: pgvectorscale, pg_search/BM25 (ParadeDB), Apache AGE availability. Neon Free storage "per project 1 GB" taken from the fetched summary; verify live.

---

## 5. Vector search: sizing and cost at 20k / 570k / 2.3M vectors

### Takeaway
Raw float32 sizes are 20k x 1,280 = 102 MB; 570k x 256 = 584 MB; 2.3M x 256 = 2.36 GB; 2.3M x 1,280 = 11.8 GB. Free hosted vector DBs (Qdrant 1 GB RAM, Upstash 1 GB, Pinecone 2 GB) cover 20k and about 570k-at-256-dim only with quantisation; 2.3M needs a paid tier or, better, a static index in R2 queried client-side or via range requests.

### Cited Findings
- Qdrant Cloud Free: 1 GB RAM, 0.5 vCPU, 4 GB disk, 1 node, "about 1 million vectors of 768 dimensions" (as documented, presumably with compression), suspended after 1 week without use and deleted after 4 weeks of inactivity; no dedicated resources, upgrades cause downtime, manual API-only snapshots — [Qdrant docs](https://qdrant.tech/documentation/cloud/create-cluster/)
- Pinecone Starter (free): 2 GB storage, 2M write units/month, 1M read units/month, 1 GB egress/month, 5 indexes, 100 namespaces/index, us-east-1 only; usage beyond allowances is blocked until next period; Standard has a $50/month minimum — [Pinecone pricing](https://www.pinecone.io/pricing/)
- Upstash Vector Free: 200M max (vectors x dimensions), max 1,536 dims, 1 GB total data/metadata, 10K queries/day, 100 namespaces, no SLA; Pay-as-you-go $0.40 per 100K requests, $0.25/GB storage, 200 GB bandwidth free, 3,072 dims, 2B vectors x dims, 50 GB max. Billing trap: adding a payment method moves all free resources on the account to paid plans — [Upstash pricing](https://upstash.com/pricing/vector.md); trap per search summary of [Upstash billing](https://upstash.com/docs/redis/overall/billing)
- Cloudflare Vectorize: up to 20M vectors/index, 1,536 dims, see section 1 (pricing not retrieved).
- Zilliz Cloud Free: 5 GB storage, 2.5M vCUs/month, up to 5 collections (third-party summaries; paid minimums reported inconsistently $99-$197) — search summary of [Zilliz pricing](https://www.zilliz.com/pricing)
- LanceDB OSS is Apache 2.0, embedded, runs on S3/GCS/Azure Blob/local disk; LanceDB Cloud free credits/tier reported inconsistently ($100 one-time credit vs. beta vs. none) — search summary of [LanceDB comparison pages](https://lancedb.com/blog/comparison-s3-vectors-lancedb) and aggregators

### Inferences
- Upstash Free capacity by its own formula: 20k x 1,280 = 25.6M (fits), 570k x 256 = 146M (fits), 2.3M x 256 = 589M (does not fit), but 10K queries/day and 1 GB data cap are the practical limits.
- int8 quantisation divides sizes by 4: 570k x 256 = 146 MB; 2.3M x 256 = 589 MB, which is feasible as one static file in R2 (free storage allowance 10 GB) searched in browser or Worker-adjacent compute; binary quantisation divides by 32.
- Cloudflare Vectorize is the only option here co-located with Workers; at 256-dim it handles 2.3M vectors per index within the 20M limit, but its price for that volume must be checked.

### Gaps
- turbopuffer and Chroma Cloud: no reliable source found (search returned nothing / conflicting aggregators). Zilliz and LanceDB Cloud numbers are from aggregators, not vendor pages. Vectorize pricing missing. No benchmark of in-browser HNSW/IVF performance was gathered.

---

## 6. Graph databases and in-memory graph options for ~100k nodes / 1-10M edges

### Takeaway
Every hosted free graph tier is far too small (Aura Free 200k nodes/400k relationships at best; FalkorDB Free 100 MB). Kuzu was archived in Oct 2025; its forks are young. SQL/PGQ will not ship in PostgreSQL 19. At $0 the sensible approach is a precomputed compact binary graph (CSR) in object storage loaded into the browser or a Worker, with pre-expanded neighbourhoods for popular nodes.

### Cited Findings
- Neo4j AuraDB Free: Neo4j FAQ says up to 200k nodes and 400k relationships (an older product page says 50,000 nodes/175,000 relationships); auto-pauses after 3 days of inactivity; deleted after 30 days paused (older 2022 post said 90 days); no backups; cannot be manually paused — search summary of [Neo4j Aura FAQ](https://neo4j.com/cloud/platform/aura-graph-database/faq/) and [GraphAcademy](https://graphacademy.neo4j.com/courses/aura-fundamentals/1-introduction/3-understand-costs); product page confirms Free still offered — [AuraDB](https://neo4j.com/product/auradb/)
- Kuzu: archived Oct 2025 (repo archive date reported as 2025-10-10; last release v0.11.3). Successors: LadybugDB (community fork, formerly Kuzu; versions cited 0.17.1 June 2026 and 0.19.1 — sources disagree), RyuGraph (Predictable Labs, adds vector and full-text search). Practical guidance from one blog: pin 0.11.3 for existing deployments, evaluate forks for new — [The Register](https://www.theregister.com/2025/10/14/kuzudb_abandoned/), [OneUptime post](https://oneuptime.com/blog/post/2026-08-12-kuzu-archived-pin-0-11-3-fork-or-migrate/view), [DBDB LadybugDB](https://dbdb.io/db/ladybugdb)
- FalkorDB Cloud Free: 100 MB storage, no card; stopped after 1 day unused, deleted after 7 days inactivity — search summary of [FalkorDB free tier](https://docs.falkordb.com/cloud/tiers/free)
- PostgreSQL SQL/PGQ: committed to master 2026-03-16 (GRAPH_TABLE, CREATE PROPERTY GRAPH), then reverted on 2026-09-07 so it will not ship in PostgreSQL 19; earliest return PostgreSQL 20 (about Sept 2027). Based on Neon's PG19 page; I did not check the official release notes — search summary of [Neon: PG19 SQL/PGQ](https://neon.com/postgresql/postgresql-19/sql-pgq-graph-queries), [Commitfest entry](https://commitfest.postgresql.org/58/4904)

### Inferences
- Memory arithmetic for an in-memory CSR: 10M edges x (4 B target + 4 B optional weight) = 40-80 MB per direction; 100k nodes x 4 B offsets is negligible. Even 10M edges is under about 160 MB for both directions, which fits a browser tab or a 128 MB Worker only if streamed or sharded (Workers memory limit 128 MB per isolate), so graph queries should run in browser or in a Container/Python job, not a Free Worker.
- A JS object graph (graphology) at 10M edges would be much heavier (hundreds of MB to GB); plan on typed arrays/CSR rather than object graphs. Not benchmarked.
- DuckDB reading Parquet edge lists over HTTP can answer 1-2 hop queries without a graph DB; recursive path queries need testing.

### Gaps
- Not researched with sources: Memgraph, ArangoDB, DuckPGQ extension status, Apache AGE, rustworkx/NetworkX/graphology memory benchmarks. Ladybug/Ryu version numbers are inconsistent across secondary sources; official repos not read.

---

## 7. Data pipeline and orchestration at $0

### Takeaway
GitHub Actions on a public repo is the zero-cost orchestrator: free standard runners (4 vCPU/16 GB/14 GB SSD), 6-hour jobs, 20 concurrent. The constraints are the 14 GB disk (stream to object storage; do not stage 50 GB), the 60-day inactivity auto-disable for schedules, and no free large/GPU runners. DuckDB 1.5.x with DuckLake v1.0 is a viable lightweight lakehouse.

### Cited Findings
- Actions is free for standard GitHub-hosted runners in public repositories — [GitHub docs: billing](https://docs.github.com/en/actions/administering-github-actions/usage-limits-billing-and-administration)
- Standard runners: `ubuntu-latest` x64 and `ubuntu-24.04-arm` (separate labels) = 4 vCPU, 16 GB RAM, 14 GB SSD; larger runners (more RAM/CPU/disk, GPU) require Team or Enterprise Cloud plans; no pricing given in the page — [GitHub-hosted runners](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
- Limits: job 6 hours on GitHub-hosted runners; workflow run 35 days; 256 matrix jobs per run; 50 re-runs; concurrent jobs on Free 20 (5 macOS); cache 10 GB per repo (uploads 200/min, downloads 1,500/min); artifact storage 500 MB on Free plan (applicability to public repos not stated in page); GITHUB_TOKEN 1,000 API requests/hour/repo — [Actions limits](https://docs.github.com/en/actions/reference/limits)
- Scheduled workflows are automatically disabled after 60 days without repository activity in public repos (and are disabled by default in forks); workarounds: keepalive commit or API re-enable. A community claim that schedules are sometimes delayed is anecdotal — [GitHub docs: disable/enable workflows](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows), [community discussion](https://github.com/orgs/community/discussions/185355)
- DuckDB 1.5.0 released 2026-03-09 ("Variegata"; team said next major, DuckDB 2.0, planned for September 2026); 1.5.2 on 2026-04-13; 1.5.3 on 2026-05-20 (adds Quack extension, beta, usable as DuckLake catalog); 1.5.4 on 2026-06-17; 1.5.5 on 2026-07-22 — [DuckDB 1.5.0](https://duckdb.org/2026/03/09/announcing-duckdb-150), [1.5.5](https://duckdb.org/2026/07/22/announcing-duckdb-155)
- DuckLake v1.0 declared production-ready with backward-compatibility guarantees on 2026-04-13 (ducklake extension in DuckDB 1.5.2) — [DuckLake 1.0](https://ducklake.select/2026/04/13/ducklake-10/)

### Inferences
- A 6 h x 4 vCPU job with 14 GB disk can build a 50 GB output only if each shard is produced and uploaded incrementally (pattern: DuckDB COPY ... TO shard, upload, delete). Peak memory 16 GB is the second constraint for 2.3M x 1,280-dim embeddings (11.8 GB float32) — compute embeddings elsewhere (another researcher covers GPU) and only quantise/index in CI.
- Pipeline-as-GitHub-Actions needs a keepalive or a monthly release/commit to avoid the 60-day schedule disable.
- Public repo artifact/storage quotas for the 500 MB figure are ambiguous; do not rely on Actions artifacts as the dataset store.

### Gaps
- Not researched: Dagster/Prefect/Airflow 3/Kestra free options, dlt, dbt-duckdb, SQLMesh, Snakemake/Nextflow, Pandera/Great Expectations/Soda, DVC/lakeFS (no sourced facts). Whether DuckDB 2.0 actually shipped (planned Sept 2026) was not checked; latest seen patch is 1.5.5 (July). GPU/larger runner prices not given by GitHub page.

---

## 8. Free hosting for large open datasets and R2 cost arithmetic (5 / 20 / 50 GB)

### Takeaway
R2 costs $0 up to 10 GB, about $0.15/month at 20 GB and about $0.60/month at 50 GB (egress free), so "free hosting elsewhere" mainly buys redundancy. Hugging Face public storage became "best-effort" for free accounts, Zenodo caps at 50 GB/100 files per record (200 GB on one-time request), and GitHub Releases has no total size limit.

### Cited Findings
- R2 arithmetic from published prices ($0.015/GB-month, 10 GB-month free, 1M Class A + 10M Class B free, egress free): 5 GB = $0.00; 20 GB = (20-10) x 0.015 = $0.15; 50 GB = (50-10) x 0.015 = $0.60. Rounding is up to the next billing unit — [R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- R2 reads: 10M Class B/month free, then $0.36/M, so 50M reads in a month = (50-10) x 0.36 = $14.40 (if the data layout needs many small range requests, this can dominate) — [R2 pricing](https://developers.cloudflare.com/r2/pricing/) (arithmetic mine)
- Hugging Face Hub: public storage for free accounts is "Best-effort"; PRO includes up to 10 TB public; private free 100 GB; "beyond the first few gigabytes" use responsibly; recommended <100k files per repo, <10k per folder, <200 GB per file, hard 500 GB single-file limit; datasets must have a dataset card and be shared for community reuse; Parquet/WebDataset recommended; storage grants possible for high-impact open-source work (case-by-case); PRO public add-on $12/TB/month — [HF storage limits](https://huggingface.co/docs/hub/storage-limits)
- Zenodo: default 50 GB and 100 files per record, one-time quota increase up to 200 GB on request, file count stays at 100 (OpenAIRE page says 100 GB, older) — search summary of [Zenodo size limits](https://support.zenodo.org/help/en-gb/1-upload-deposit/80-what-are-the-size-limitations-of-zenodo) and [quota increase](https://help.zenodo.org/docs/deposit/manage-files/quota-increase)
- GitHub: files >100 MiB blocked (use LFS), >50 MiB warning, repos ideally <1 GB (<5 GB strongly recommended); releases have no total size/bandwidth limit but each file must be under the LFS per-file maximum for the plan (exact 2 GiB figure not on the page) — [GitHub large files](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)

### Inferences
- A sensible split: canonical versioned dataset on Zenodo (DOI, 50 GB, shard into <=100 files) plus HF dataset mirror (best-effort), with R2 as the performant, CORS-enabled serving copy.
- Because HF free public storage is explicitly best-effort and the 2026 policy says "beyond the first few gigabytes," treat it as a mirror, not the origin.

### Gaps
- Source Cooperative and AWS Open Data Program: not researched. HF bandwidth/download rate limits for public datasets not found. CORS/range-request behaviour of Zenodo and HF for browser-side Parquet reads not verified. GitHub LFS free quotas not fetched.

---

## 9. Infrastructure as code

### Takeaway
OpenTofu (MPL 2.0, Linux Foundation) is the lower-risk default; Terraform is BSL 1.1 under IBM. Provider maturity and free remote-state options were not verified with primary sources.

### Cited Findings
- HashiCorp moved Terraform from MPL 2.0 to BSL 1.1 in 2023; OpenTofu remains MPL 2.0 under the Linux Foundation; IBM's HashiCorp acquisition closed 2025-02-27; OpenTofu has state encryption, provider-level `for_each`, early variable evaluation and `-exclude` which Terraform's binary lacks (secondary sources). OpenTofu 1.11 added ephemeral values/resources and write-only attributes; Wikipedia lists 1.12.3 as stable (June 2026) while other posts list 1.11.x — [Scalr comparison](https://scalr.com/learning-center/opentofu-vs-terraform), [Wikipedia: OpenTofu](https://en.wikipedia.org/wiki/OpenTofu), [DEV post](https://dev.to/xancloud/terraform-vs-opentofu-in-2026-im-still-on-terraform-at-work-and-heres-the-honest-math-1bae)
- SST v3 is built on Pulumi; Pulumi has a free individual tier with state in local files/S3/Pulumi Cloud; CDKTF reportedly sunset Dec 2025 — search summary of [pkgpulse comparison](https://www.pkgpulse.com/guides/pulumi-vs-sst-vs-cdktf-infrastructure-as-code-2026) (low-authority)

### Inferences
- With Cloudflare as primary platform, wrangler config files plus a small OpenTofu module for DNS/R2/bucket/Neon/GitHub settings keeps IaC minimal; for a one-developer project IaC is mostly about reproducibility for contributors.

### Gaps
- Maturity of Cloudflare/Vercel/Neon/GitHub providers, Alchemy, free remote-state options (Cloudflare R2 backend, Terraform Cloud free) — no sourced facts gathered.

---

## 10. CI/CD and supply-chain practice

### Takeaway
Little was verified here; only platform-specific limits relevant to previews were captured.

### Cited Findings
- Vercel Hobby: 100 deployments/day, 100 builds/hour, 45-minute builds, 1 concurrent build; previews supported but Hobby cannot connect to org-owned repos — [Vercel limits](https://vercel.com/docs/limits)
- Cloudflare 2026-11-23 changelog: CPU and heap profiling for Worker Previews (measure a PR's resource use before merging) — [Cloudflare changelog](https://developers.cloudflare.com/changelog/)
- GitHub Actions free on public repos (see section 7), so Playwright, Lighthouse CI, CodeQL and Scorecard workflows run at no cost — [GitHub docs](https://docs.github.com/en/actions/administering-github-actions/usage-limits-billing-and-administration)

### Inferences
- Hosted headless Chromium in Actions generally has software WebGL only, so visual regression of the 3D scene needs fixed SwiftShader rendering and tolerance (not verified in this session).

### Gaps
- Not researched: Playwright visual regression practice, Lighthouse CI, bundle budgets, CodeQL, Renovate/Dependabot, OpenSSF Scorecard, artifact attestations/SLSA, release-please/changesets.

---

## 11. Observability at $0

### Takeaway
All main vendors have free tiers, but figures below come mostly from aggregators or competitors and need re-checking.

### Cited Findings
- Sentry free Developer: 1 user, 5K errors/month, 5M spans, 50 replays (third-party tracker, verified June 2026; Sentry moved to spans-based metrics in Aug 2025) — search summary of [AgentDeals Sentry](https://agentdeals.dev/vendor/sentry)
- Grafana Cloud Free: "free forever", 14-day retention (official), specific caps not captured — search summary of [Grafana free tier](https://grafana.com/products/cloud/free-tier/)
- PostHog free: 1M product-analytics events/month; AI observability 100K LLM events/month, 30-day retention — search summary of [PostHog blog](https://posthog.com/blog/cheapest-ai-observability-tools)
- Langfuse free: 50K units/month, 2 seats, 30-day retention (claim by a competitor, PostHog) — [PostHog comparison](https://posthog.com/compare/cheapest-ai-observability-tools.md); Langfuse's own pricing page was not read
- Vercel Hobby runtime logs: 1 hour retention — [Vercel Hobby](https://vercel.com/docs/plans/hobby)

### Inferences
- Vercel 1-hour log retention means errors must go to an external sink (Sentry) from day one.

### Gaps
- Not researched: Axiom, Honeycomb, Better Stack, Pydantic Logfire, Checkly, Braintrust, Helicone, Arize Phoenix free tiers; OpenTelemetry on Workers; Cloudflare Workers Logs quotas; status page options.

---

## 12. Authentication and abuse protection

### Takeaway
For a free, open-source app: Better Auth (self-hosted library, free) with D1/Neon storage, or no accounts at all (anonymous session tokens) plus Turnstile. Auth.js is in maintenance mode.

### Cited Findings
- Auth.js is in maintenance mode (security patches); its core team joined Better Auth in Sept 2025; many sources now recommend Better Auth for new projects — search summary of [LogRocket](https://blog.logrocket.com/best-auth-library-nextjs-2026/) and [devtoolpicks](https://devtoolpicks.com/blog/better-auth-vs-clerk-vs-authjs-indie-hackers-2026)
- Clerk free Hobby plan covers 50,000 monthly retained users since Feb 2026 (older posts say 10,000 MAU); hard cap; MFA/passkeys need $25/month Pro — search summary of [Clerk pricing explained](https://clerk.com/articles/clerk-pricing-explained)
- Supabase Free auth: 50,000 MAU — [Supabase pricing](https://supabase.com/pricing). Neon Free: 60k MAU auth per project — [Neon pricing](https://neon.com/pricing)
- Turnstile free and rate-limiting binding details: see section 1. AI Gateway rate limiting and caching are free — [AI Gateway pricing](https://developers.cloudflare.com/ai-gateway/reference/pricing/)

### Inferences
- LLM-endpoint protection stack at $0: Turnstile token verified in a Worker, per-IP/per-session rate-limit binding (approximate, per-location), a hard daily budget counter in a Durable Object (strongly consistent) or D1, and a provider-side spend cap on the LLM key. The rate-limit binding alone is not an accurate cost control.
- On Workers Free the 100k-request/day cap is itself a crude global abuse ceiling, but it fails the whole site.

### Gaps
- WorkOS AuthKit not researched. Better Auth specifics (adapters, bundle/CPU on Workers) not verified.

---

## 13. Self-hosting story

### Takeaway
No sourced facts gathered; recommendations below are inference only.

### Cited Findings
- (none retrieved)

### Inferences
- Keep the data-plane contract file-based (Parquet/CSR on any S3-compatible store) so the cloud deployment (R2) and docker compose (MinIO or local disk) read identical artifacts; keep the thin API as one Hono/FastAPI service with storage adapters (R2 binding vs filesystem). Cloudflare Containers/Workers specifics are not needed on the self-host path.

### Gaps
- All of: community expectations, compose/Helm norms, how projects keep cloud and self-hosted in sync.

---

## 14. Reference architectures, monthly cost arithmetic, first limits hit, biggest risk

### Takeaway
A: Strict $0 is feasible if the served dataset fits in the 10 GB R2 allowance (otherwise $0.15-$0.60/month, effectively zero) and traffic stays under 100k Worker requests/day. B: add Workers Paid ($5) plus optional Containers/Fly for Python and you are at roughly $6-14/month, leaving headroom under $20.

### Cited Findings (inputs only; arithmetic is mine)
- All price inputs are from the sources in sections 1, 3, 4, 8 above.

### Inferences

**Architecture A: strict $0**
- Frontend and API: one Cloudflare Worker with static assets (Free: 100k req/day, 10 ms CPU; assets <20,000 files, <25 MiB each). Static asset requests are free.
- Data: sharded Parquet/binary (graph CSR, int8 vectors, packed per-protein geometry) in R2 (<=10 GB = $0.00; 20 GB = $0.15; 50 GB = $0.60), plus mirror on Hugging Face (best-effort) and Zenodo (<=50 GB, 100 files). All queries run in the browser (DuckDB-WASM/typed arrays) via HTTP range requests. Class B reads 10M/month free.
- Sessions/multiplayer: D1 (100k writes/day, 500 MB per DB) for saved sessions; Durable Object (SQLite) for optional rooms (100k requests/day, 13,000 GB-s/day).
- LLM agent: Worker streaming proxy (Turnstile + rate-limit binding + DO daily budget) to an external provider (cost covered by other researcher; AI Gateway core features free).
- Pipeline: GitHub Actions scheduled workflow (public repo, free), DuckDB + DuckLake or plain Parquet, upload shards to R2 with S3 API; keepalive for the 60-day rule.
- Ops: Sentry/PostHog free tiers, Better Auth or anonymous sessions, OpenTofu or wrangler for config.
- Monthly cost: $0.00 at 5-10 GB; about $0.15 at 20 GB; about $0.60 at 50 GB; any usage of Cloud Run/Azure grants (if a Python endpoint is needed) $0 within grants.
- First limits hit: (1) Workers Free 100k requests/day and 10 ms CPU; (2) GitHub runner 14 GB disk/16 GB RAM during 50 GB builds; (3) 10 GB R2 free storage; (4) Class B reads if range-request granularity is too fine; (5) D1 100k writes/day for multiplayer-heavy use.
- Single biggest risk: a traffic or abuse spike exhausts the Free request/DO/D1 daily caps, which fail closed (Error 1027), taking the entire app offline until 00:00 UTC; second-order risk is Cloudflare Free-plan terms and 2026 product renames/beta status changing.

**Architecture B: comfortable, up to $20**
- Workers Paid $5.00 (10M requests, 30M CPU-ms included; no bandwidth charges).
- R2 at 50 GB: $0.60 (Class B beyond 10M: +$0.36/M).
- D1 and Durable Objects inside Paid allowances (D1 5 GB included, 25B reads, 50M writes; DO 1M requests, 400k GB-s): $0 incremental at low traffic.
- Python service (FastAPI/DuckDB, heavier queries, server-side vector search): option 1, Cloudflare Container `basic` (1/4 vCPU, 1 GiB, 4 GB disk) always-on 730 h: memory (730-25) x $0.009/GiB-h = $6.35; disk (2,920-200) x $0.000252/GB-h = $0.69; CPU about $0.86 at ~10% duty cycle; total about $7.90, and far less if scaled to zero. Option 2: Cloud Run/Azure free grants ($0 at low traffic) or Fly shared-cpu-1x 256 MB $2.19/month (more for larger RAM).
- Optional extras within budget: Vectorize (price unverified), Neon Launch usage ($0.106/CU-hour; 100 CU-hours would be about $10.60 if free tier exceeded), Turso/Supabase Pro ($25, over budget).
- Totals: baseline $5.00 + $0.60 = $5.60; with always-on container ≈ $13.50; with Fly instead ≈ $7.79. Leaves $6-14 of headroom under $20.
- First limits hit: Class B request charges (if heavy), container CPU on graph/vector queries, GitHub runner disk, and LLM provider spend (outside this budget).
- Single biggest risk: single-vendor concentration and unbounded usage billing: everything (assets, data, DB, state, AI gateway, containers) depends on one Cloudflare account, several products were renamed/changed in 2026, and I found no hard spend cap on Workers Paid, so an abused LLM endpoint or runaway Class B reads can exceed $20 without a self-built budget guard.

### Gaps
- No cost for the LLM provider, Vectorize, Workers Logs, or Neon beyond Free. Hard spend-cap behaviour on Workers Paid unverified. Cold-start measurements and in-browser performance for 10M-edge graphs and 2.3M vectors were not tested.
