# ML compute and LLM costs for a solo, near-zero-budget protein-exploration web app (checked 2026-11-25)

All prices were read from the cited pages on 2026-11-25 (US dollars) unless stated. WebFetch summarises pages with a small model, so a few figures (flagged) may be imperfect. Anything marked "[third party]" is not from the vendor. Arithmetic is shown inline. Assumptions that are mine, not sourced, are labelled "ASSUMPTION".

## 1. Free and cheap GPU for batch work (Kaggle, Colab, Lightning, Modal, HF, RunPod, Lambda, Vast, others)

### Takeaway
Embedding even 2.3M sequences with a 650M model is a few GPU-hours on a rented L4/A100 (about $3-$15 at Modal rates, see section 3), so paid GPU is cheap and the real saving is free tiers (Kaggle ~30 h/week, Modal $30/month, Lightning ~$30 once). For on-demand "paste a sequence" inference, Hugging Face ZeroGPU is the one route where visitors, not the owner, pay the GPU time (free accounts can now host 2 ZeroGPU Spaces, Gradio SDK only).

### Cited Findings
**Per-hour GPU prices (as published)**
- Modal per-second prices: T4 $0.000164, L4 $0.000222, A10 $0.000306, L40S $0.000542, A100 40GB $0.000583, A100 80GB $0.000694, H100 $0.001097, H200 $0.001261, B200 $0.001736 — [Modal pricing](https://modal.com/pricing). Converted to per hour (x3600): T4 $0.59, L4 $0.80, A10 $1.10, L40S $1.95, A100-40 $2.10, A100-80 $2.50, H100 $3.95, H200 $4.54, B200 $6.25.
- Modal CPU $0.0000131 per physical core-second (2 vCPU), memory $0.00000222 per GiB-second; Starter plan $0 base, **$30/month free credits**, 3 seats, 100 containers, 10 concurrent GPUs; Team $250/month with $100 credits; Starter has no free Model API usage — [Modal pricing](https://modal.com/pricing).
- Modal credit programmes: startups (amount unspecified, apply at /startups) and academics "up to $10k" for graduate students, labs, researchers — [Modal pricing](https://modal.com/pricing).
- Lightning AI first-list prices: T4 16GB $0.55/h, L4 24GB $0.79/h, L40S 48GB $3.54/h, A100 40GB $2.19/h, H100 80GB $5.45/h; page notes other tabs show different prices for some GPUs — [Lightning pricing](https://lightning.ai/pricing).
- Lightning Free plan: up to 30 credits (5 on registration + 25 after adding a card), described as about 50 GPU hours on interruptible machines; credits expire after 12 months; 1 free Studio restarting every 4 h, up to 2 concurrent GPUs, 50 GB storage; A100/H100/H200 sessions capped at 4 h; Pro $50/month ($20/month shown for annual billing) — [Lightning pricing](https://lightning.ai/pricing).
- RunPod pods per hour (Community / Secure): L4 $0.44/$0.69, L40S $0.79/$1.09, A100 80GB PCIe $1.19/$2.09, A100 80GB SXM $1.39/$2.19, H100 PCIe $1.99/$2.89, H100 SXM $2.69/$4.39, RTX 4090 $0.34/$0.89, A40 $0.35/$0.59. The page also shows A5000 at $0.16/$0.27, which looks anomalously low and is unverified — [RunPod pricing](https://www.runpod.io/pricing).
- RunPod serverless is listed per hour only: L4/A5000/3090 $0.75, L40S/L40/6000 Ada $1.89, A100 80GB $2.99, H100 80GB $5.89, 4090 $1.34, A40/A6000 $1.22; volume disk $0.10/GB-month running, $0.20 idle — [RunPod pricing](https://www.runpod.io/pricing).
- Lambda on-demand per GPU-hour: A10 24GB $1.29, A100 40GB $1.99, A100 80GB HGX $3.19, H100 PCIe $3.79, H100 SXM $4.69-$4.89 (by config), B200 $7.69-$7.99, GH200 $2.59; no inference API prices listed — [Lambda pricing](https://lambda.com/pricing) (config mapping inferred by the summariser).
- Vast.ai: per-second billing, no minimum; interruptible "50%+ cheaper"; reserved up to 50% off for 1/3/6 months. Live per-GPU prices are in a JS grid that I could not read — [Vast.ai pricing](https://vast.ai/pricing).
- Colab (consumer): official pricing page returned 403. A March 2026 hands-on post [third party] reports $10 per 100 compute units, burn ~1.19 units/h (T4), 1.71 (L4), 5.40 (A100-40GB), i.e. about $0.12, $0.17, $0.54/hour — as summarised by search results ([Colab pricing search result, apis.io aggregator](https://apis.io/plans/google-colab/google-colab-plans-pricing/)); units reportedly expire after 90 days (aggregator).
- Colab Enterprise (a different, Google Cloud product) lists about $0.42/h T4 and about $3.52/h A100 — [Colab Enterprise pricing](https://cloud.google.com/colab/pricing).

**Free GPU quotas**
- Kaggle: official docs pages returned only titles. Third-party/community sources say ~30 GPU hours/week (P100 or T4 x2), quota resets weekly, TPU separate; sources disagree on session length (9 h vs 12 h) — [search summary citing gpuperhour and Kaggle forum](https://gpuperhour.com/blog/free-cloud-gpus-and-credits); one source says Kaggle publishes no fixed number and quota floats.
- Hugging Face ZeroGPU: hardware is now half or full NVIDIA RTX Pro 6000 Blackwell (48 GB / 96 GB; `large` = 1x quota, `xlarge` = 2x); Gradio SDK only; PyTorch 2.8-2.13; default function duration 60 s (settable); daily GPU quota per visitor: unauthenticated 2 min, free account 5 min, PRO 40 min, Team 40 min, Enterprise 60 min; extra via credits at $1 per 10 GPU-minutes (PRO/Team/Enterprise only) — [HF ZeroGPU docs](https://huggingface.co/docs/hub/spaces-zerogpu).
- Who may host ZeroGPU Spaces: free personal accounts in good standing (verified email, older than 30 days) up to 2; PRO up to 10; Team/Enterprise orgs up to 50 — [HF ZeroGPU docs](https://huggingface.co/docs/hub/spaces-zerogpu).
- HF Inference Providers: free users get no included credits (must buy); PRO gets $2.00/month, Team/Enterprise $2.00 per seat, spendable on Providers, Endpoints, Spaces hardware, ZeroGPU overage and Jobs; no markup over provider rates; hf-inference now mostly CPU models (embedding, small classifiers) — [HF Inference Providers pricing](https://huggingface.co/docs/inference-providers/pricing).

### Inferences
- Rental cost is not the constraint: at Modal L4 $0.80/h, $30 of monthly free credit buys 37.5 GPU-hours (30/0.7992), or 14.3 A100-40 hours (30/2.0988). One month of Modal Starter credit covers every embedding scenario in section 3 for the 8M-650M ESM-2 models.
- Lightning's 30 credits are one-off; Kaggle (~30 h/week, if still true) is the best recurring free pool for a long training job such as an SAE, but its 9 h vs 12 h session cap and unofficial quota need checking in the account UI.
- ZeroGPU is structurally a fit for "embed or fold a pasted sequence": visitors consume their own 2-5 minute daily quota (large 650M-model forward passes take well under a second, so a visitor gets hundreds of calls). Constraint: Gradio-only, so the web app must call the Space through the Gradio client/API rather than a bespoke endpoint. Whether anonymous API callers from another origin get the 2-minute quota or the Space owner's quota is not confirmed in the docs I read.
- Modal's $30/month is credit, not a hard cap; set workspace spending limits.

### Gaps
- Kaggle's current official weekly quota, GPU list and session limits (docs pages returned no body text). Check the account's notebook settings.
- Colab official consumer plan prices (page 403).
- Beam, Baseten, fal, Replicate pricing were not fetched (out of tool budget). Replicate/fal/Baseten are per-second hosted-model platforms; I have no verified numbers.
- Vast.ai live marketplace prices; Lightning prices for A10G (not listed); Modal cold-start times (not on the pricing page).
- Hugging Face Inference Endpoints per-GPU hourly prices and PRO subscription price (page did not show them).

## 2. Credit programmes an individual open-source developer can realistically obtain

### Takeaway
Almost every named programme excludes a solo, non-incorporated, non-academic developer or is closed. Realistic: Modal Starter free credit, Lightning/Kaggle free tiers, Hugging Face free ZeroGPU hosting, and long-shot applications (Vercel OSS when it reopens, Anthropic Claude for OSS if download thresholds are met, which is a Max subscription and not API credit).

### Cited Findings
- Anthropic "Claude for Open Source": six months of Claude Max 20x (a subscription, not API credits); capped at 10,000 recipients; eligibility at Anthropic's discretion, e.g. maintainers with 500+ dependent repos, 100+ dependent packages or 200,000+ monthly downloads, or core contributors to recognised foundation/language projects; threshold-meeting does not guarantee acceptance — [Anthropic OSS terms](https://www.anthropic.com/claude-for-oss-terms) and search summary of [claude.com/contact-sales/claude-for-oss](https://claude.com/contact-sales/claude-for-oss). Third-party guides claiming API credits are unverified.
- Vercel Open Source Program: $3,600 in Vercel platform credits over 3 years plus an OSS starter pack of third-party credits; requires an actively maintained OSS project with measurable impact, Code of Conduct; **"Applications are currently closed"** on 2026-11-25; Spring 2026 cohort listed, no future dates — [Vercel OSS program](https://vercel.com/open-source-program).
- Google Cloud research credits: only faculty, PhD students and postdocs at accredited institutions/eligible non-profits; PhD up to $1,000 a year, faculty/postdoc up to $5,000; Master's students excluded — [Google research credits](https://edu.google.com/programs/credits/research/) (via search results).
- NVIDIA Inception: free, but requires an incorporated startup under 10 years old with a website and a developer; cloud credits are a member benefit. The individual-developer route is the NVIDIA Developer Program (free), with Google Cloud and NVIDIA credits "upon learning achievements" (amount/criteria not stated) — [NVIDIA startups](https://www.nvidia.com/en-us/startups/) and [NVIDIA Developer Program](https://developer.nvidia.com/join) (via search results).
- Modal academic credits (up to $10k) need a graduate student/lab/researcher status; startup credits need an early-stage startup — [Modal pricing](https://modal.com/pricing).
- Tamarind Bio has an Academic Plan for university/government/non-profit email addresses (extra jobs per month, number not stated) — [Tamarind pricing](https://www.tamarind.bio/pricing).
- GitHub Models (free prototyping inference) was fully retired on 2026-07-30; the docs point to Azure AI Foundry or Copilot — [GitHub docs](https://docs.github.com/en/github-models/prototyping-with-ai-models). (2026 change.)
- Vercel AI Gateway: every team gets a free tier covering a subset of models with a monthly free credit; buying credits ends the free credit; BYOK requires purchased credits — [Vercel AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing) (page updated 2026-09-08).

### Inferences
- A solo portfolio project with no incorporated entity and no academic affiliation is unlikely to qualify for Google/AWS/Azure research or startup credits, NVIDIA Inception or Modal academic/startup credits. Treat all of these as upside, not plan.
- Anthropic's OSS programme would at best replace a personal Claude Max seat, not fund visitor traffic.

### Gaps
- AWS Activate/Open Source credits, Azure for Students and GitHub Sponsors/Secure Open Source Fund: not researched (search covered only Google).
- Cloudflare Project Alexandria / Workers open-source credits (fetch returned 403).
- OpenAI and Google Gemini credit programmes for individuals: no sourced finding.
- NVIDIA academic GPU grant details: not found.

## 3. Throughput and cost estimates (ESM-2, ESM C, ProtT5, Foldseek)

### Takeaway
No credible published sequences-per-second benchmark was found for ESM-2 (8M-650M), ESM C or ProtT5 across T4/L4/A10G/A100. The only sourced anchors are per-sequence latencies of ~13-120 ms. I therefore give a first-principles FLOP estimate (clearly my assumption) that lands at roughly 0.1-17 GPU-hours and under $15 even for 2.3M sequences with the 650M model, and recommend measuring 1,000 sequences before committing.

### Cited Findings
- ProtT5-XL: 0.12 s on average per human protein, whole human proteome in about 40 min (GPU not stated) — [ProtTrans paper](https://arxiv.org/pdf/2007.06225).
- Bio-embeddings comparison over 10,000 PDB proteins: 0.1 s ProtT5 vs 0.09 s ESM-1b per sequence (as summarised) — [search summary of ProtTrans/bio-embeddings](https://arxiv.org/pdf/2007.06225).
- FANTASIA on an A100: about 19.9 ms/sequence ProtT5, about 19.8 ms ESM; on an HPC node with batch size 256: ESM 12.59 ms vs ProtT5 83.05 ms per sample — [FANTASIA execution benchmarks](https://fantasia.readthedocs.io/en/v3.0.0/performance.html).
- ESM-2 (variant not stated) on an A6000: 26.80 ms per protein, 1.83 h for "the human proteome" — [SoftGene preprint](https://arxiv.org/pdf/2610.03029). Arithmetic check: 1.83 h x 3600 / 0.0268 s = about 245,800 sequences, not 20,000, so that run evidently included isoforms or fragments; do not use it for a 20k-canonical estimate.
- ESM-2 650M architecture: 33 layers, 20 heads, hidden 1280, max 1022 residues; BioNeMo reports a training MFU of 59.2% at batch 46 on A100 (training, not inference) — [NVIDIA BioNeMo ESM-2 docs](https://docs.nvidia.com/bionemo-framework/latest/models/ESM-2/).
- ESM C: EvolutionaryScale states 300M approaches ESM2-650M performance with faster inference and lower memory, 600M rivals ESM2-3B; no throughput numbers published. 300M has 30 layers, 600M has 36. Licence conflict: announcement says MIT/academic+commercial, but the HF model card says custom non-commercial; weights now also appear under a "biohub" namespace — [ESM Cambrian blog](https://evolutionaryscale.ai/blog/esm-cambrian), [HF ESMC-600M](https://huggingface.co/biohub/ESMC-600M).
- Foldseek: prefilter on an RTX 4090 is 4x faster than a 64-core CPU; AFDB50 (54M entries) needs 151 GB RAM by default, about 35 GB with `--sort-by-structure-bits 0` — [Foldseek README](https://github.com/steineggerlab/foldseek). All-vs-all benchmark of 11,211 SCOPe40 structures was run on a 64-core AMD EPYC 7702P (runtime not retrieved) — [Foldseek paper via search summary](https://www.nature.com/articles/s41587-023-01773-0). Foldseek on a 542,378-structure Swiss-Prot set took 21 h with prefilter vs 400 h without, 16 threads — [FoldExplorer](https://arxiv.org/pdf/2311.18219).
- Foldseek-based clustering of AFDB: 52 million structures in 5 days on 64 cores — [Foldseek clustering study](https://www.nature.com/articles/s41586-023-06510-w) (via search summary).

### Inferences (ESTIMATES: my arithmetic, not published benchmarks)
ASSUMPTIONS: mean length 400 residues (+ special tokens ignored); forward FLOPs = 2 x parameters x tokens (attention term ignored, small at this length); effective throughput 20 TFLOP/s on T4/L4/A10-class and 100 TFLOP/s on A100-class in fp16 (roughly 15-35% of peak, conservative); no padding waste (real runs with sorted batching add maybe 10-30%). Parameter counts: ESM-2 8M/35M/150M/650M, ESM C 300M/600M as named; ProtT5-XL encoder about 1.2B (from memory, unsourced).

Tokens: 20,000 x 400 = 8.0M; 570,000 x 400 = 228M; 2,300,000 x 400 = 920M.
FLOPs for 650M: 2 x 650e6 x tokens = 1.3e9 FLOP/token -> 20k: 1.04e16; 570k: 2.96e17; 2.3M: 1.20e18.

GPU-hours at 20 TFLOP/s (L4-class) = FLOPs / 20e12 / 3600:
| Model | 20k | 570k | 2.3M |
|---|---|---|---|
| ESM-2 8M (x0.0123) | 0.002 h | 0.05 h | 0.20 h |
| ESM-2 35M (x0.0538) | 0.008 h | 0.22 h | 0.90 h |
| ESM-2 150M (x0.231) | 0.03 h | 0.95 h | 3.8 h |
| ESM C 300M (x0.462) | 0.07 h | 1.9 h | 7.7 h |
| ESM-2 650M / ESM C 600M (x1 / x0.92) | 0.14 h | 4.1 h | 16.6 h |
| ProtT5-XL enc. 1.2B (x1.85) | 0.27 h | 7.6 h | 30.7 h |
Worked example: 650M, 2.3M seqs: 1.196e18 / 2e13 = 59,800 s = 16.6 h. On an A100 at 100 TFLOP/s divide by 5: 3.3 h.

Dollar cost (Modal rates above): 650M on L4 ($0.80/h): 20k $0.11, 570k $3.3, 2.3M $13.3 (16.6 x 0.7992). 650M on A100-40 ($2.10/h, 100 TFLOP/s): 570k 0.82 h = $1.7; 2.3M 3.3 h = $6.9. ProtT5 on L4: 2.3M 30.7 h = $24.5. Add 30% for padding/overheads and the highest figure is still about $32. Cross-check against sourced anchors: 20 ms/seq on an A100 (FANTASIA) x 570,000 = 11,400 s = 3.2 h, consistent with the A100 estimate for a 650M-class model. At 120 ms/seq (ProtT5 paper) x 20,000 = 2,400 s = 40 min (matches the paper's claim).

All-against-all Foldseek over 20,000 structures (ESTIMATE): scale the 542k-structure, 21 h, 16-thread run quadratically: 21 h x (20,000/542,378)^2 = 21 x 1.36e-3 = 0.029 h = about 103 s; add alignment/IO overhead and call it minutes to tens of minutes. On Modal CPU, 8 physical cores for 20 min = 1,200 x 8 x $0.0000131 = $0.13. The quadratic assumption is only an approximation of prefilter behaviour.

Free alternative: 20k embeddings (0.14 h at 650M) fit in one Kaggle or Lightning session; 570k (4.1 h L4-class) fits in Kaggle's weekly quota if ~30 h/week holds.

### Gaps
- No published sequences/sec for ESM-2 sizes, ESM C, or ProtT5 on T4/L4/A10G/A100/H100; the table above is derived, not measured. Needs a 1,000-sequence pilot run (e.g. HF `EsmModel`, fp16, length-sorted batches).
- Real Foldseek runtime for an all-vs-all 20k run and exact SCOPe40 runtime were not retrievable (PMC page behind a CAPTCHA).
- ProtT5 parameter count and Swiss-Prot mean length are from memory, unverified.

## 4. Hosted biology-model APIs with free access

### Takeaway
No hosted biology API is both free and clearly permitted for a public app. NVIDIA's catalog is trial/prototyping only (limits reported by users, not officially), EvolutionaryScale Forge now sits at biohub.ai with credit-based access and unstated public-app terms, and ColabFold/Foldseek servers are for small-scale research use. Use them for offline batch work only, and self-host for anything visitor-facing.

### Cited Findings
- NVIDIA build.nvidia.com biology listing: protein structure (openfold3, Boltz-2, msa-search, openfold2), generative virtual screening (genmol, diffdock, molmim), protein design (rfd4-proteina, evo2-40b, rfdiffusion, proteinmpnn); ESMFold/ESM2 not on that page — [NVIDIA biology models](https://build.nvidia.com/explore/biology). Pricing/limits not on that page.
- NVIDIA NIM FAQ describes the hosted API catalog call allowance as designed for evaluation and prototyping; forum users report a default of 40 requests/minute (no official page found); an NVIDIA moderator says limit increases are not granted via the forum; older forum reply says 1,000 sign-up credits. A forum commenter says production use violates the ToS (unconfirmed) — [NVIDIA NIM FAQ](https://forums.developer.nvidia.com/t/nvidia-nim-faq/300317), [rate-limit thread](https://forums.developer.nvidia.com/t/api-rate-limit-increase-is-not-granted-by-requesting-it-here/368420).
- EvolutionaryScale Forge redirects to Biohub: ESM API offers ESMC, ESMFold2 and ESM3; "apply for additional credits"; pricing, free tier, rate limits and terms are not stated on the landing page (Developer Console manages keys, credits, limits) — [biohub.ai](https://biohub.ai/). (2026 change: rename/move.)
- ColabFold public MSA server: serial queries from a single IP are acceptable; do not use multiple computers; no numeric rate limits stated; large-scale work should use local `colabfold_search` (needs ~128 GB RAM, >1 TB for in-memory databases) — [ColabFold README](https://github.com/sokrypton/ColabFold).
- Foldseek web server (search.foldseek.com): README mentions it but states no usage limits — [Foldseek README](https://github.com/steineggerlab/foldseek).
- Tamarind Bio: free tier ("access to all models", email support) aimed at academics/individuals with limits unstated; open API access is a Premium feature (no price, "book a meeting"); Academic Plan for .edu/.gov/non-profit emails — [Tamarind pricing](https://www.tamarind.bio/pricing).

### Inferences
- Because Tamarind's API is Premium-only and NVIDIA's catalog is prototyping-only, none supports "visitor pastes a sequence, server calls a third-party fold API". Calling these from visitor browsers would also expose a key.
- For "fold a pasted sequence", the defensible designs are ZeroGPU (section 1), or a Modal/Cloud endpoint with a hard monthly cap, or running ESMFold/other model on the visitor's own compute.

### Gaps
- ESM Atlas folding API status (esmatlas.com): not found; treat as unverified/possibly retired.
- Neurosnap free tier and terms; Foldseek/ColabFold terms for programmatic/public-app use; NVIDIA official ToS text and official rate limit; Forge pricing and terms.

## 5. In-browser inference

### Takeaway
Browser inference is viable for embeddings and small classifiers (transformers.js, WebGPU, experimental) and Chrome's Prompt API is now stable on desktop Chrome 148 with structured output, but it needs a large disk/RAM/VRAM envelope and no documented tool calling, so it is a progressive enhancement for narration, not a tool-using agent.

### Cited Findings
- Transformers.js (`@huggingface/transformers`): WebGPU via `device: 'webgpu'` flagged experimental; WASM/CPU default; dtypes fp32 (WebGPU default), fp16, q8 (WASM default), q4; supports 100+ architectures including Llama 3, Mistral, Phi-3, Qwen2/Qwen3/Qwen3.5, Gemma 2/3/4; feature-extraction and text-generation tasks supported. Version number not stated on the page — [Transformers.js docs](https://huggingface.co/docs/transformers.js/index).
- Chrome Prompt API (Gemini Nano, on-device): web availability from Chrome 148 (extensions from Chrome 138); desktop only (Windows 10/11, macOS 13+, Linux, Chromebook Plus); needs at least 22 GB free disk on the profile volume, GPU with more than 4 GB VRAM or 16 GB RAM and 4+ cores; model downloaded on first use per browser (size not published; check chrome://on-device-internals); structured output via `responseConstraint` JSON Schema; not available in Web Workers; cross-origin iframes need `allow="language-model"`; no data sent to Google during use; tool calling not mentioned on the page — [Chrome Prompt API docs](https://developer.chrome.com/docs/ai/prompt-api). Japanese press says it went stable with Chrome 148 after Google I/O 2026 — [search result summary](https://forest.watch.impress.co.jp/docs/news/2112093.html); doc "last updated" dates conflict across language mirrors.

### Inferences
- A protein-ID narration feature ("summarise this entry from structured fields") fits Prompt API structured output; unreliable multi-step tool use should stay server-side or BYOK.
- The 22 GB disk and mobile exclusion mean a large share of visitors will have no built-in model; the UI needs a fallback (replay/cached or BYOK).

### Gaps
- WebLLM: the fetched URL (github.com/webllm/web-llm) returned 404; correct repo is probably mlc-ai/web-llm, not retrieved. No sourced model list, download sizes or tokens/sec. Same for small-model tool-calling reliability and ONNX Runtime Web.
- Edge, Safari, Firefox equivalents of built-in AI in late 2026: not found.
- Transformers.js current version number (v3 vs v4) and WebGPU tokens/sec on typical laptops: not found.

## 6. LLM API pricing and features (late 2026)

### Takeaway
Haiku 5.5, GPT-6 Luna and DeepSeek Flash are all in the $0.10-$0.60 per million range with 10x-cheaper cached reads, so a tool-using agent turn costs about $0.002 on the cheapest tier, $0.035 on Sonnet 5.5-class and $0.13 on Fable 5.2-class. Free tiers (Gemini, Cerebras, OpenRouter) exist but with training-data or tiny-limit caveats.

### Cited Findings
**Anthropic** (per MTok: base input / 5-min cache write / 1-h cache write / cache read / output) — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing):
- Fable 5.2: $8 / $10 / $16 / $0.20 / $40. Mythos 5.2 same price but limited availability (verified orgs only).
- Opus 5.5: $4 / $5 / $8 / $0.20 / $20. Opus 5 and 4.5-4.8: $5 / $6.25 / $10 / $0.50 / $25.
- Sonnet 5.5: $2 / $2.50 / $4 / $0.10 / $10. Sonnet 5: $2 / $2.50 / $4 / $0.20 / $10; its $2/$10 launch price is now permanent (the planned Sept 1 2026 rise to $3/$15 was cancelled). Sonnet 4.6/4.5: $3 / $3.75 / $6 / $0.30 / $15.
- Haiku 5.5: prompts up to 100k tokens $0.10 / $0.125 / $0.20 / $0.01 / $0.50; prompts over 100k $0.50 / $0.625 / $1 / $0.05 / $2.50. Haiku 4.5: $1 / $1.25 / $2 / $0.10 / $5.
- Batch API: 50% off input and output (Haiku 5.5 $0.05/$0.25; Sonnet 5.5 $1/$5; Opus 5.5 $2/$10; Fable 5.2 $4/$20); stacks with caching; fast mode not available in batch.
- Cache hit multipliers: 0.025x on Fable/Mythos 5.1 and 5.2, 0.05x on Opus 5.5 and Sonnet 5.5, 0.1x otherwise. 5-min write 1.25x, 1-h write 2x.
- Context: 1M tokens at standard price for Claude 4.6 and later (except Haiku 5.5, which has the 100k price break). Models 4.7 and later use a tokenizer producing about 30% more tokens for the same text. US-only inference (`inference_geo`) is 1.1x.
- Tool-use system-prompt overhead (auto): 286 tokens on Opus 5.5, Sonnet 5.5, Haiku 5.5; 354 on Sonnet 5. Web search $10 per 1,000; web fetch no extra charge.
- Browser-direct calls: the CORS opt-in header `anthropic-dangerous-direct-browser-access: true` was announced in 2024 ([Simon Willison](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access)). The current API overview page I fetched does not mention it ([Anthropic API overview](https://platform.claude.com/docs/en/api/overview)); not verified as current.

**OpenAI** (standard per 1M: input / cached / output; batch) — [OpenAI pricing](https://developers.openai.com/api/docs/pricing):
- gpt-6-luna $0.10 / $0.01 / $0.50 (batch $0.05/$0.25); gpt-6.1-terra $1 / $0.05 / $5 (batch $0.50/$2.50); gpt-6.2-sol and gpt-6.1-sol $2 / $0.10 / $10 (batch $1/$5); gpt-6.2-astra $8 / $0.40 / $40; gpt-6-astra $10 / $1 / $50; gpt-5.6-luna $0.20 / $0.02 / $1.20; gpt-5.4-nano $0.20 / $0.02 / $1.25; gpt-5-nano $0.05 / $0.005 / $0.40 (batch $0.025/$0.20); gpt-5-mini $0.25 / $0.025 / $2.
- Batch about half of standard; Flex tier at batch prices is being wound down. No free-token programme listed. Short-context prices apply up to 272K input tokens.

**Google Gemini** (per 1M: input / output / caching) — [Gemini pricing](https://aistudio.google.com/docs/pricing):
- Free tier exists for Gemini 4 Hydrogen, 3.8 Flash, 3.6 Flash, 3.5 Flash-Lite, 3.1 Flash-Lite, 3 Flash Preview, 2.5 Pro/Flash/Flash-Lite; no free tier for Gemini 4 Carbon/Argon/Neon or 3.1 Pro Preview. Free-tier content is used to improve Google products; paid is not.
- Gemini 3.5 Flash-Lite $0.30 / $2.50 / cache $0.03 (batch $0.15/$1.25). Gemini 3.1 Flash-Lite $0.25 / $1.50 / $0.025 (batch $0.125/$0.75). Gemini 2.5 Flash-Lite $0.10 / $0.40 / $0.01. Gemini 3.8 and 3.6 Flash $0.75 / $3.75, rising to $1.50 / $7.50 on 2027-01-01. Gemini 4 Hydrogen $1.50 / $7.50. Gemini 4 Carbon/Argon $2 / $10, rising to $4 / $20 on 2026-12-01.
- Deprecations: Gemini 2.5 Pro routes to Gemini 3.8 Flash and 2.5 Flash to 3.5 Flash-Lite on 2026-12-01. (2026 change; the page was truncated at 100,000 of 118,372 characters, so embedding models and anything after 2.5 Flash TTS were not read.)
- Rate-limit tiers: Free needs an active project; Tier 1 needs billing; Tier 2 $100 cumulative paid + 3 days; Tier 3 $1,000 + 30 days; billing-tier spend caps $250 / $2,000 / $20,000+; Tier 1 rolling 10-minute spend limit $10. The page gave a free-tier limit only for one oddly named model ("Gemini Decision 1": 200 RPM, 50,000 TPM, 10,000 RPD) and directs readers to AI Studio for the rest — [Gemini rate limits](https://aistudio.google.com/docs/rate-limits).

**xAI** — grok-4.7 / 4.6: $2 in, $0.50 cached, $6 out (under 200k; double above); grok-4.3 and grok-4.20 family: $1.25 / $0.20 / $2.50, 1M context — [xAI models](https://docs.x.ai/docs/models).
**DeepSeek** — deepseek-flash: cache-hit $0.003 off-peak ($0.006 peak), cache-miss $0.15 ($0.30), output $0.60 ($1.20); deepseek-v4-pro: $0.022 / $0.66 / $1.98 off-peak (double at peak); 1M context; off-peak is 50% of peak, peak = 01:00-04:00 and 06:00-10:00 UTC, Monday-Friday — [DeepSeek pricing](https://api-docs.deepseek.com/quick_start/pricing).
**Mistral** — only Mistral Large was extracted: $0.50 input / $1.50 output per MTok; batch -50%; cached input up to -90%; the page showed no "Experiment" free tier — [Mistral pricing](https://mistral.ai/pricing#api-pricing).

**Open-weight hosts and gateways**
- Cloudflare Workers AI: free 10,000 Neurons/day (reset 00:00 UTC; Workers Free cannot exceed it); paid $0.011 per 1,000 Neurons. Example per-MTok prices: gpt-oss-120b $0.35/$0.75, gpt-oss-20b $0.20/$0.30, Llama 3.3 70B fp8-fast $0.293/$2.253, Gemma 4 26B-A4B $0.10/$0.30, Qwen3-30B-A3B $0.051/$0.335, GLM-4.7-flash $0.06/$0.40, deepseek-v4.1-flash $0.30/$1.20 (paid-plan only); embeddings from $0.0017 (embeddinggemma-2) to $0.204 (bge-large) per MTok. The page names no model as supporting function calling and gives no numeric request limits — [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/). Free allowance in dollars: 10,000 x $0.011/1,000 = $0.11 per day.
- Groq (Developer plan base limits): openai/gpt-oss-120b and gpt-oss-20b 30 RPM, 1K RPD, 8K TPM, 200K TPD; qwen/qwen3.8-27b same; cached tokens do not count towards limits; Free-plan numbers were not extracted — [Groq rate limits](https://console.groq.com/docs/rate-limits).
- Cerebras Free Trial: gpt-oss-120b 5 RPM, 30K uncached TPM, 1M tokens/day; qwen-3.8-27b 300 RPM, 150K uncached TPM (750K total TPM, temporarily), no daily cap listed; every shared-catalog model available on the trial subject to limits — [Cerebras rate limits](https://inference-docs.cerebras.ai/support/rate-limits).
- OpenRouter `:free` models: 20 RPM; 50 requests/day if under $10 credits ever purchased, 1,000/day at 10+ credits; BYOK requests exempt from the daily cap — [OpenRouter limits](https://openrouter.ai/docs/api-reference/limits).
- Vercel AI Gateway: no markup; free monthly credit for a subset of models with lower per-model rate limits (credit amount not on the page); free credit ends once credits are purchased; BYOK needs purchased credits; budgets exclude BYOK spend; BYOK without fallback $0.20 per 1,000 requests — [Vercel AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing).
- GitHub Models: retired 2026-07-30 — [GitHub docs](https://docs.github.com/en/github-models/prototyping-with-ai-models).

### Inferences
- Haiku 5.5 and gpt-6-luna are priced identically ($0.10/$0.50, cache read $0.01); both are 10x cheaper than Haiku 4.5, so use the 5.5-generation models for anything bulk.
- Gemini free-tier data is used for training, so it is a poor fit for visitor-typed text; a paid Tier 1 key avoids that for pennies.
- Google's announced price rises (Dec 1 2026, Jan 1 2027) make Gemini less attractive for budgeting after January.

### Gaps
- Together AI and Fireworks pricing; Mistral Small/Medium/Codestral prices; Anthropic rate-limit tier values and spend limits; Gemini per-model free-tier limits (AI Studio only); Gemini embedding model prices; which Workers AI/Groq/Cerebras models are reliable at function calling.
- CORS support by OpenAI, Gemini, OpenRouter and others for browser calls: not verified.

## 7. Worked cost model (tool-using agent and batch summaries)

### Takeaway
At 1,000 visitor turns a month the cheapest tier costs about $2, the mid tier about $35-$45 and the top tier about $130-$180; 10,000 turns would eat $345-$450 on mid-tier and $1,300-$1,800 on top-tier, i.e. the whole shared credit. Pre-generating 20,000 short summaries via batch costs about $2.55 on Haiku 5.5 and about $51 on Sonnet 5.5.

### Cited Findings
Prices used (from section 6): Haiku 5.5 $0.10 in / $0.50 out / $0.01 cache read / $0.125 5-min write; Sonnet 5.5 $2 / $10 / $0.10 / $2.50; Fable 5.2 $8 / $40 / $0.20 / $10; batch Haiku 5.5 $0.05/$0.25 and Sonnet 5.5 $1/$5; gpt-6-luna as Haiku; DeepSeek flash off-peak $0.15 miss / $0.003 hit / $0.60 out; Gemini 3.5 Flash-Lite $0.30 / $0.03 / $2.50; Gemini 3.1 Flash-Lite batch $0.125/$0.75; gpt-5-nano batch $0.025/$0.20 — all from [Anthropic](https://platform.claude.com/docs/en/about-claude/pricing), [OpenAI](https://developers.openai.com/api/docs/pricing), [Gemini](https://aistudio.google.com/docs/pricing) and [DeepSeek](https://api-docs.deepseek.com/quick_start/pricing) pricing pages.

### Inferences (ESTIMATES with stated ASSUMPTIONS)
**Turn shape (ASSUMPTION):** cached prefix (system prompt + tool definitions) 4,500 tokens (middle of the 3,000-6,000 brief); 5 tool calls per turn = 6 model calls; user message 100 tokens; each tool call output 120 tokens; each tool result 600 tokens; final answer 300 tokens. The 286-token tool-use overhead is absorbed in the 4,500.
- Cached reads per turn: 6 x 4,500 = 27,000.
- Uncached input per turn (conversation history re-sent, conservatively not cached): call k sees 100 + (k-1) x 720 tokens, k=1..6 = 100, 820, 1,540, 2,260, 2,980, 3,700; sum = 11,400.
- Output per turn: 5 x 120 + 300 = 900.

Cost per turn, warm cache = 27,000 x cache_read + 11,400 x input + 900 x output (per 1M):
- Haiku 5.5: 27,000 x 0.01 = $0.00027; 11,400 x 0.10 = $0.00114; 900 x 0.50 = $0.00045; total **$0.00186**.
- Sonnet 5.5: 27,000 x 0.10 = $0.0027; 11,400 x 2 = $0.0228; 900 x 10 = $0.009; total **$0.0345**.
- Fable 5.2: 27,000 x 0.20 = $0.0054; 11,400 x 8 = $0.0912; 900 x 40 = $0.036; total **$0.1326**.
- Cheaper non-Anthropic references: gpt-6-luna equals Haiku ($0.00186); DeepSeek flash off-peak: 27,000 x 0.003 = $0.000081 + 11,400 x 0.15 = $0.00171 + 900 x 0.60 = $0.00054 = $0.00233 (double at peak); Gemini 3.5 Flash-Lite: $0.00081 + $0.00342 + $0.00225 = $0.00648.
- Cold-cache surcharge (when no request in the last 5 min, the 4,500-token prefix is written, not read): extra = 4,500 x (write - read): Haiku +$0.00052, Sonnet +$0.0108, Fable +$0.0441 per turn.

Monthly cost (warm / fully cold):
| Visitor turns | Haiku 5.5 | Sonnet 5.5 | Fable 5.2 |
|---|---|---|---|
| 100 | $0.19 / $0.24 | $3.45 / $4.53 | $13.26 / $17.67 |
| 1,000 | $1.86 / $2.38 | $34.50 / $45.30 | $132.60 / $176.70 |
| 10,000 | $18.60 / $23.80 | $345 / $453 | $1,326 / $1,767 |
(Example: Sonnet at 1,000 turns warm = 1,000 x 0.0345 = $34.50; cold = 1,000 x (0.0345 + 0.0108) = $45.30. At 100 turns/month the cache will almost always be cold, so use the right-hand figure there; at 10,000 turns/month (about 0.23/min) it will be mostly cold, so the cold column is the safer bound.) Models 4.7+ produce about 30% more tokens for the same text; if the real counts are 30% higher, scale the figures up by about 1.3.

**Pre-generating 20,000 grounded summaries by batch (ASSUMPTION: 1,500 tokens of grounding facts + 300 tokens instruction per protein = 1,800 input; 150 output):**
- Totals: input 20,000 x 1,800 = 36M tokens; output 20,000 x 150 = 3M tokens.
- Haiku 5.5 batch ($0.05/$0.25): 36 x 0.05 = $1.80 + 3 x 0.25 = $0.75 = **$2.55**. Same for gpt-6-luna batch.
- gpt-5-nano batch ($0.025/$0.20): 0.90 + 0.60 = $1.50.
- Gemini 3.1 Flash-Lite batch ($0.125/$0.75): 4.50 + 2.25 = $6.75.
- DeepSeek flash off-peak, no batch ($0.15/$0.60): 5.40 + 1.80 = $7.20.
- Haiku 4.5 batch ($0.50/$2.50): 18 + 7.5 = $25.50.
- Sonnet 5.5 batch ($1/$5): 36 + 15 = **$51.00**.
- Scaling to 570,000 proteins x 28.5: Haiku 5.5 batch $72.7; to 2.3M proteins x 115: $293.
- Caching the 300-token instruction would save under $0.15 at Haiku batch rates (6M tokens x ($0.05 - $0.005) = $0.27 at the most), so it is not worth complexity at this scale.

Budget reading: against the $200-$300/month shared credit, 1,000 turns on Sonnet-class use about 15% of $300; replayed/cached demos should absorb most visitors. The summary job on Haiku 5.5 is a rounding error; a one-off Sonnet 5.5 pass ($51) is affordable if quality demands.

### Gaps
- Real tokens per turn depend on the final tool schema and result sizes; instrument a few real sessions with Anthropic's token counting endpoint before fixing the budget.
- Quality of Haiku 5.5 versus Sonnet 5.5 on grounded protein summaries and on reliable tool calling is not evaluated here.

## 8. Bring-your-own-key best practice

### Takeaway
I found little sourced material; the one verified fact is that Anthropic's browser access is an explicit opt-in header. The recommendations below are inference, not researched guidance, and should be validated against OWASP/provider docs before adoption.

### Cited Findings
- Anthropic added CORS support via the header `anthropic-dangerous-direct-browser-access: true`; without it, browser requests fail with an authentication_error saying CORS requests must set that header; developers note the guard exists for shared keys and is less relevant when users bring their own key, but keys typed into a browser are visible in devtools — [Simon Willison, 2024](https://simonwillison.net/2024/Aug/23/anthropic-dangerous-direct-browser-access) and search-result threads (e.g. [obsidian-copilot issue](https://github.com/logancyang/obsidian-copilot/issues/677)). Not re-verified against current Anthropic docs.
- Vercel AI Gateway budgets exclude BYOK spend, so provider-side spend limits are needed — [Vercel AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing).
- Examples of apps that accept user keys were not retrieved (NextChat and Obsidian Copilot appear in the search results as BYOK clients using the Anthropic header — [NextChat issue](https://github.com/ChatGPTNextWeb/NextChat/issues/5452)).

### Inferences
- Keep the key only in memory or `sessionStorage` (not `localStorage`, not cookies, not server logs); call the provider directly from the browser where CORS is supported so the owner's server never sees it; if a proxy is needed (providers without CORS), make it stateless, pass the key in a header, disable request-body logging and never persist it.
- Main threat is XSS: lock down with a strict Content Security Policy (script-src self, no inline, `connect-src` listing only the provider hosts), no third-party script tags, and render model output as text/sanitised markdown.
- Tell users to create a provider key with a low spend cap or a dedicated workspace.

### Gaps
- CORS support by provider (OpenAI, Gemini, OpenRouter, Groq, Mistral) and examples of well-regarded BYOK apps: not researched. Security guidance was not sourced.

## 9. Cost-control strategies for public AI demos

### Takeaway
No sourced study was retrieved. The provider mechanisms that exist and were verified are hard-ish spend limits (Gemini billing-tier caps, Anthropic Console workspace/spend limits, Vercel AI Gateway budgets) and routing through a gateway.

### Cited Findings
- Gemini billing tiers carry monthly spend caps (Tier 1 $250, Tier 2 $2,000, Tier 3 $20,000+) and a 10-minute rolling spend limit (Tier 1 $10) returning 429 `RESOURCE_EXHAUSTED` — [Gemini rate limits](https://aistudio.google.com/docs/rate-limits).
- Anthropic offers workspaces to separate and control spend by use case, plus Console spend limits — [Anthropic API overview](https://platform.claude.com/docs/en/api/overview).
- Vercel AI Gateway supports budgets per team, project, API key or member, and charges no markup — [Vercel AI Gateway pricing](https://vercel.com/docs/ai-gateway/pricing).
- Prompt caching reads cost 0.025x-0.1x of input and batch gives 50% off — [Anthropic pricing](https://platform.claude.com/docs/en/about-claude/pricing).

### Inferences
- Layered design that the numbers support: (1) serve pre-generated/replayed sessions by default (zero marginal cost); (2) in-browser model or Prompt API where available; (3) free third-party tiers only for non-sensitive content (Gemini free tier data is used for training); (4) BYOK for the full agent; (5) owner-paid live turns on Haiku 5.5-class only, behind per-IP rate limits and a daily budget counter that flips the UI to replay mode; (6) a dedicated Anthropic workspace with a hard monthly limit so a runaway cannot touch the shared $200-$300.
- With Haiku 5.5-class at $0.00186/turn, a $5/month cap pays for about 2,700 owner-funded visitor turns (5/0.00186 = 2,688); on Sonnet 5.5-class the same $5 buys about 145 turns (5/0.0345).

### Gaps
- Semantic caching, challenge-page (e.g. Turnstile) and per-IP rate-limit services, and real-world examples of public AI demos were not researched; Cloudflare Turnstile/Rate Limiting free-tier terms not fetched.
