# Competitive landscape and prior art: interactive protein/genome exploration and AI-assisted biology (state as of 25 November 2026)

**How to read these notes.** Every finding carries an evidence tag:

- **[V]** = verified in this session by opening the primary or official page (tool site, release notes, docs, company page, GitHub API, the Hacker News thread itself).
- **[S]** = taken from a search-result summary of the linked page; the page itself was not opened (or could not be opened), so treat as probable, not confirmed.
- **[2nd]** = opened, but the page is a secondary source (press, analyst write-up, vendor claim about itself). Vendor performance claims are marked as such.
- Anything in an *Inferences* block is my reasoning, not a sourced fact.

**Method caveat.** The shared web-search budget for this research run was exhausted roughly a third of the way through my work. After that point I could only open URLs I already knew (official sites, release notes, docs, GitHub, specific Hacker News threads). Consequences: community sentiment on Reddit, Biostars, X and Bluesky is thin (those sites also refused automated fetches); several JavaScript-only apps (ESM Atlas explorer, Protein Universe Atlas, Foldseek server, ProtSpace, MaveDB, G2P portal) could not be rendered, so their interaction models are described from documentation rather than hands-on use. These limits are repeated in the relevant *Gaps* blocks.

**Quotation policy.** Source text is paraphrased throughout; product and feature names in quotation marks are names, not quotations.

---

## 1. Public and academic tools: what each does well and badly in 2026, UI quality, and 2025–2026 additions (including AI assistants)

### Takeaway
During 2026 nearly every major public protein resource shipped some AI surface — a chat assistant (Human Protein Atlas, cBioPortal, and a "STRING chat" entry on STRING), semantic search (ProtVar), a documentation bot (InterPro, RCSB depositors) or an MCP server from the provider (Open Targets, InterPro, cBioPortal, and registry listings for PDBe, STRING and GWAS Catalog) — and most now show AlphaFold-derived structures next to their own data. "An AI assistant on top of a protein database" is therefore no longer novel; what the incumbents still do not offer is a single spatial overview across resources, a narrative layer, or an assistant whose output is a reusable visual walkthrough rather than text, links or tables.

### Cited Findings

**AlphaFold Protein Structure Database (EMBL-EBI / Google DeepMind)**
- [V] Scale: database v6 (21 Oct 2025) is synced to UniProt 2025_03 and holds 241,070,489 predictions including 40,054 isoforms; relative to v4, about 65.7M were added, 39.3M removed and 276,539 changed. The website serves only current models (older versions are FTP-only), and multiple-sequence alignments are on entry pages but not in bulk — [EBI release notes](https://www.ebi.ac.uk/pdbe/news/alphafold-database-release-notes).
- [V] The homepage in November 2026 advertises over 260 million predictions, offers thematic browse collections (pandemic preparedness, antimicrobial resistance, neglected tropical diseases, WHO global-health proteomes) and credits third-party datasets (kinetoplastid, AllTheBacteria, BFVD, Viro3D and others). It mentions no chat assistant and no MCP server — [AlphaFold DB home](https://alphafold.ebi.ac.uk/).
- [V] 2025 interface changes: domain tracks on entry pages and bulk download from search and Foldseek tables (Mar 2025); predicted-aligned-error shown as a heatmap (Apr 2025); server-side rendering (Jun 2025); redesigned, tabbed entry pages (5 Aug 2025); a custom-annotation track for user data (11 Nov 2025) — [AFDB release notes](https://alphafold.ebi.ac.uk/release-notes).
- [V] 2026 changes: community/third-party dataset release (17 Feb); first protein complexes — homodimers (16 Mar) then heterodimers (28 May), both labelled as NVIDIA release phases; a "Portal View", a pandemic-preparedness theme and an added dataset labelled "VAd" (24 Sep) — [AFDB release notes](https://alphafold.ebi.ac.uk/release-notes).
- [V] Complexes detail: roughly 1.7M high-confidence homodimers on the site (about 18M lower-confidence ones as bulk download); almost 80,000 high-confidence heterodimers added by 19 May 2026 (about 8.1M lower-confidence in bulk); coverage is 20 heavily studied species plus WHO priority pathogens; about 30M complexes were computed in total. EMBL states the database has more than 3.4 million users in 190 countries — [EMBL news](https://www.embl.org/news/?p=78875).
- [V] October 2026 addition: AI-derived residue-level annotations that link residues in predicted structures to literature (a named-entity model finds residues and point mutations in papers; annotations are transferred from experimental PDB structures) — [AlphaFold DB home](https://alphafold.ebi.ac.uk/).
- [S] An October 2026 announcement says the database now covers more than 2,800 viruses including viral protein complexes — [University of Glasgow](https://www.gla.ac.uk/research/az/cvr/engage/news/headline_1296637_en.html).
- [S] The database-issue paper describing the redesigned entry page (interactive 3D viewer, annotations, summary tabs) could not be opened (bot check) — [PMC12807749](https://pmc.ncbi.nlm.nih.gov/articles/PMC12807749/).

**UniProt**
- [V] Release 2026_04 (4 Nov 2026) has 154,222,205 UniProtKB entries, of which 576,073 are reviewed Swiss-Prot and 153,646,132 unreviewed TrEMBL; UniRef50 has 41.2M clusters — [UniProt release notes](https://ftp.uniprot.org/pub/databases/uniprot/current_release/relnotes.txt).
- [V] UniProt keeps every historical version of an entry: the p53 entry (P04637) has 316 versions from 1 Nov 1988 to 4 Nov 2026, each stamped with release and date — [UniSave API](https://rest.uniprot.org/unisave/P04637?format=json).
- [V] The public website is a JavaScript application that returns only a fallback message to non-browser clients (observed when requesting a help page) — [UniProt help URL](https://www.uniprot.org/help/entry_history).
- [S] A search for 2026 UniProt news found no official UniProt chat assistant, AI summary feature or official MCP server; it found several third-party UniProt MCP servers — [PyPI: uniprot-mcp-server](https://pypi.org/project/uniprot-mcp-server).
- [V] A SPARQL-based MCP server from the SIB ("ExpasyGPT") covering UniProt, Bgee, Rhea and Cellosaurus is listed in the BioContextAI registry — [BioContextAI registry](https://biocontext.ai/registry).
- [S] The 2025 database-issue paper reports website updates including a new tab linking proteins to genomic information — [PubMed 39552041](https://pubmed.ncbi.nlm.nih.gov/39552041/).

**RCSB PDB**
- [V] 2025 usage: about 6.3 million unique clients and roughly 34 million sessions on RCSB.org; about 3.3 billion files downloaded or viewed — [RCSB newsletter 2026 Q2](https://cdn.rcsb.org/rcsb-pdb/general_information/news_publications/newsletters/2026q2/query.html).
- [V] 2026 features: redesigned Advanced Search; 3D-motif queries built by selecting residues, chains or assemblies directly in Mol* (for PDB entries, computed structure models and uploaded files); chemical similarity search with a drawing tool; a redesigned 3D structure-similarity search that uses machine-learned structure embeddings in a vector database; computed structure models from AlphaFold DB and ModelArchive shown alongside experimental structures — [RCSB newsletter 2026 Q2](https://cdn.rcsb.org/rcsb-pdb/general_information/news_publications/newsletters/2026q2/query.html).
- [V] A chatbot for depositors (deposition, biocuration, validation, policy questions) launched 7 Apr 2026; it is a help bot, not an exploration assistant — [PDB-101 news](https://pdb101.rcsb.org/news/69d41be26c4fcd38cafe9460).
- [V] Immersive AR/VR viewing inside the Mol* viewer on RCSB.org was announced 14 Apr 2026 — [PDB-101 news](https://pdb101.rcsb.org/news/69d516bd6c4fcd38cafe9461).
- [V] A Sequence Annotations Viewer maps annotations from multiple resources onto sequences and highlights the matching location in the 3D view — [PDB-101 news](https://pdb101.rcsb.org/news/6a57a94b9504907d174d33e0).

**PDBe and PDBe-KB (Mol*)**
- [V] New PDBe entry pages (19 Sep 2025): 3D viewer brought to the foreground, AI-mined residue-level text annotations, upload of the user's own annotations, citation views, mobile-ready layout; the team says the redesign was built on extensive user and expert feedback — [EMBL-EBI news](https://www.ebi.ac.uk/about/news/updates-from-data-resources/pdbe-entry-pages).
- [V] PDBe-KB offers per-protein aggregated views (keyed on UniProt accession) with superposition of all chains and ligands, comparison with AlphaFold models, partner-supplied residue annotations, some complex pages, a graph database and the 3D-Beacons network; data are CC BY 4.0 — [PDBe-KB](https://www.ebi.ac.uk/pdbe/pdbe-kb/).
- [V] Mol* itself is used by PDBe, PDBe-KB, AlphaFold DB and RCSB; it supports cell-scale models with tens of millions of atoms, a Mesoscale Explorer, MolViewSpec, MolViewStories and AR/VR. The Mol* site mentions no AI/LLM/MCP integration — [molstar.org](https://molstar.org/).

**InterPro**
- [V] InterPro 110.0 (23 Sep 2026) added: an official MCP server with 13 tools at ebi.ac.uk/interpro/mcp (no account or key); "DocBot", a chat button on every page that answers from InterPro documentation with citations to the sections used; InterPro-N (a Google DeepMind deep-learning annotator) run inside InterProScan 6, raising annotated UniProtKB coverage from 85.1% to 90.5%; and an interactive Pfam clan network viewer — [EMBL-EBI news](https://www.ebi.ac.uk/about/news/updates-from-data-resources/interpro-110-0-and-interproscan-6-a-re-engineered-pipeline-and-ai-ready-access-to-the-protein-universe/).

**Open Targets Platform**
- [V] Quarterly releases through 26.09 (24 Sep 2026). Notable UI additions: variant, study and credible-set pages (25.03); a missense-variant viewer showing AlphaFold position and AlphaMissense scores (25.06); a variant structure viewer with confidence/domain/hydrophobicity colouring (25.09); redesigned clinical widgets (26.03); association-page URLs that preserve filters and open widgets (26.06); redesigned profile navigation with shareable links to individual widgets and a Metrics page (26.09). None of the release notes describes a chat assistant — [Open Targets release notes](https://platform-docs.opentargets.org/release-notes).
- [V] An official MCP server was released 12 Jan 2026; the team's internal benchmark of 140 question–answer pairs found that generic API wrappers struggle with aggregations, multi-entity queries and result interpretation — [Open Targets blog](https://blog.opentargets.org/official-open-targets-mcp/).
- [V] LLM-based extraction is used behind the scenes for clinical-evidence mining (26.06) — [Open Targets release notes](https://platform-docs.opentargets.org/release-notes).

**STRING**
- [V] Version 12.5 covers 12,535 organisms, 59.3 million proteins and more than 20 billion interactions; the homepage menu includes a "STRING chat" option whose behaviour is not described on the page — [STRING home](https://string-db.org/).
- [V] 12.5 added a directed regulatory network mode; literature relations are extracted by a fine-tuned language model (reported F1 73.5%); the text-mining evidence viewer shows an LLM-generated summary of excerpts; clusters get automatic names; network and ProtT5 sequence embeddings are downloadable — [STRING 2025 paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC11701646/).
- [V] STRING's access page explicitly permits use of its outputs in AI applications (MCP servers, retrieval-augmented generation, agent tools) with attribution — [STRING versions/access page](https://string-db.org/cgi/access?footer_active_subpage=whatsnew). (That page dates the switch to 12.5 as September 2026, which conflicts with the 2025 paper already describing 12.5; unresolved.)
- [V] A "STRING MCP Server" is listed in the BioContextAI registry; that it is maintained by the STRING group is inferred from the maintainer listing, not stated — [BioContextAI registry](https://biocontext.ai/registry).

**Human Protein Atlas (HPA)**
- [V] Version 26.0 (11 Nov 2026) added four resources (Metabolic, Isoform, Evolutionary, Immune Cell), "AtlasAI" (a multi-agent assistant), AI-generated gene infographics, post-translational-modification display in the Structure resource and RoseTTAFold2-PPI predictions in Interaction. Version 25 (Nov 2025) had added AlphaFold 3 structures for 22,979 interactions and AlphaFold 2 structures for 83,795 isoforms; 25.1 (May 2026) added Deep Visual Proteomics data — [HPA release history](https://www.proteinatlas.org/about/releases).
- [V] AtlasAI is a beta sidebar inside the atlas with four agents (search, data extraction, documentation reader, and an orchestrator that runs whole studies with 13 analytical tools); the documentation stresses that filters are verified before a search runs and that every reported number is checked against the table cells it cites; figures, datasets and studies are downloadable. Gene infographics are produced by a two-step Gemini text-then-image pipeline — [HPA: AI implementations](https://www.proteinatlas.org/learn/ai).
- [V] The site lists 13 resources and about 10 million annotated images — [HPA home](https://www.proteinatlas.org/), [HPA news](https://www.proteinatlas.org/news).

**ProtVar (EMBL-EBI)**
- [V] The 9 Jun 2026 update repositions ProtVar from annotation lookup to discovery: annotations for more than 500 million possible human missense variants; an experimental AI semantic search that maps plain-language queries (disease, phenotype, drug response, pathway) to variants using embedding models; filters for PTMs, active sites, ligand binding, disease association and interfaces; structure views of a variant relative to functional sites. The team notes that some users want to browse the database rather than only look up their own variants, and warns that AI-enabled search can be inaccurate — [EMBL-EBI news](https://www.ebi.ac.uk/about/news/announcements/protvar-update-a-discovery-engine-for-genetic-missense-variation/).

**DECIPHER**
- [V] v11.34 (11 Sep 2025) added mitochondrial gene constraint scores, links from its protein browser to ProtVar (pockets and interfaces relative to a variant), and clearer ClinGen recommendations — [EMBL-EBI news](https://www.ebi.ac.uk/about/news/updates-from-data-resources/decipher-v11-34-released/).
- [S] AlphaMissense scores were integrated into DECIPHER, Ensembl, UniProt and AlphaFold DB — [EMBL-EBI news](https://www.ebi.ac.uk/about/news/technology-and-innovation/alphamissense-data-integration/).

**MaveDB**
- [S] The most recent update paper (Genome Biology, Jan 2025) reports over 7 million variant-effect measurements across 1,884 datasets (Nov 2024), new automatically generated visualisations, improved search and APIs — [Genome Biology](https://link.springer.com/article/10.1186/s13059-025-03476-y).

**cBioPortal**
- [V] 14 Aug 2026: "cBioPortalChat" (natural-language questions about studies, mutations, clinical attributes and cohorts, answered with links back into portal views) plus an MCP server for bring-your-own-LLM use; v7.0.0 (26 May 2026) moved the backend to ClickHouse — [cBioPortal news](https://docs.cbioportal.org/news/).
- [V] The chat runs on Claude Sonnet via Amazon Bedrock, requires Google sign-in, returns links rather than controlling the interface, cannot compute statistical tests, and stores full conversation text indefinitely (readable by the team) — [cBioPortal chat docs](https://docs.cbioportal.org/ai-integrations/chat-interface/).

**Foldseek server and structure-similarity search**
- [S] Foldseek release 9 brought Foldseek-Multimer (complex search) and structure-based sequence search to the public web server, which searches AlphaFold DB and PDB plus clustered databases — [Foldseek releases](https://www.github.com/steineggerlab/foldseek/releases).
- [V] Foldseek is GPL-3.0, 1,333 stars, pushed 18 Nov 2026 — [GitHub](https://github.com/steineggerlab/foldseek).
- [V] Companion cluster-browsing sites exist for AlphaFold DB clusters and for combined AlphaFold/ESM clusters (only page titles were readable) — [AFDB Clusters](https://cluster.foldseek.com/), [AFESM Clusters](https://afesm.foldseek.com/).
- [V] Structure-similarity search is also built into AlphaFold DB entry pages (Foldseek table with bulk download) and RCSB (embedding-based) — [AFDB release notes](https://alphafold.ebi.ac.uk/release-notes), [RCSB newsletter](https://cdn.rcsb.org/rcsb-pdb/general_information/news_publications/newsletters/2026q2/query.html).

**Cross-cutting: official machine access for agents**
- [V] The BioContextAI registry lists 77 biomedical MCP servers (about 3,199 tools; 17 remotely hosted). Entries include Open Targets, InterPro, STRING, GWAS Catalog, the EBI Ontology Lookup Service, SIB resources and "PDBe MCP Servers" (PDBe API and graph database), alongside community servers for UniProt, Ensembl, Reactome, ChEMBL, PubChem and others; which entries are provider-run is not labelled and is partly inferred from maintainer names — [BioContextAI](https://www.biocontext.ai/), [registry p1](https://biocontext.ai/registry), [p2](https://biocontext.ai/registry?page=2), [p3](https://biocontext.ai/registry?page=3), [p4](https://biocontext.ai/registry?page=4), [p5](https://biocontext.ai/registry?page=5).
- [V] Across all five registry pages the only servers that control a viewer are one for PyMOL and one for the napari microscopy viewer; there is none for Mol*, MolViewSpec, ChimeraX, NGL or 3Dmol — [registry p1](https://biocontext.ai/registry), [p2](https://biocontext.ai/registry?page=2), [p3](https://biocontext.ai/registry?page=3), [p4](https://biocontext.ai/registry?page=4), [p5](https://biocontext.ai/registry?page=5).
- [V] In December 2025 EMBL-EBI described MCP provision as something it was exploring across services and noted that most servers were then third-party — [EMBL-EBI perspective](https://www.ebi.ac.uk/about/news/perspectives/connecting-ai-to-biology-model-context-protocol/).

**What changed in 2026 (launched / shut down / changed), summary**
- [V] Launched: AFDB complexes (Mar/May) and AI residue annotations (Oct) — [AFDB release notes](https://alphafold.ebi.ac.uk/release-notes), [AFDB home](https://alphafold.ebi.ac.uk/); Open Targets MCP (Jan) — [blog](https://blog.opentargets.org/official-open-targets-mcp/); RCSB depositor chatbot and AR/VR (Apr) — [chatbot](https://pdb101.rcsb.org/news/69d41be26c4fcd38cafe9460), [AR/VR](https://pdb101.rcsb.org/news/69d516bd6c4fcd38cafe9461); ProtVar semantic search (Jun) — [EMBL-EBI](https://www.ebi.ac.uk/about/news/announcements/protvar-update-a-discovery-engine-for-genetic-missense-variation/); cBioPortalChat and MCP (Aug) — [cBioPortal news](https://docs.cbioportal.org/news/); InterPro DocBot and MCP (Sep) — [EMBL-EBI](https://www.ebi.ac.uk/about/news/updates-from-data-resources/interpro-110-0-and-interproscan-6-a-re-engineered-pipeline-and-ai-ready-access-to-the-protein-universe/); HPA AtlasAI and infographics (Nov) — [HPA releases](https://www.proteinatlas.org/about/releases).
- [V] Changed: AFDB old API fields scheduled to be retired on 25 Jun 2026 — [EBI release notes](https://www.ebi.ac.uk/pdbe/news/alphafold-database-release-notes); cBioPortal dropped MySQL — [cBioPortal news](https://docs.cbioportal.org/news/); UniProtKB is now about 154M entries — [UniProt release notes](https://ftp.uniprot.org/pub/databases/uniprot/current_release/relnotes.txt).
- No shutdown of any of the listed public tools was found in the pages read; the nearest case in this space is the uncertain status of Meta's original ESM atlas site (section 2) — [esmatlas.com](https://esmatlas.com/).

### Inferences
- **Strengths (inferred from the documented features):** depth and authority of data; stable identifiers; free, no-login access for the core sites (the one exception seen is cBioPortalChat's Google sign-in); Mol* as a de facto shared viewer; rapid 2026 adoption of AI access layers.
- **Weaknesses (inferred):** each site is organised around one entity type and a page-with-tabs layout; none offers a proteome-level spatial overview; cross-resource reasoning is delegated to external agents via MCP; the assistants that exist return text, tables or links (cBioPortal explicitly) rather than a guided visual sequence; none is aimed at students or non-specialists; several (UniProt, AFDB, Foldseek, MaveDB) are JavaScript apps that expose little to crawlers or to simple deep links.
- The incumbents' own framing confirms a shift toward browsing and approachability: ProtVar's team says users want to browse, PDBe moved the 3D viewer to the foreground on user feedback, and HPA now generates infographic summaries. An approachable exploration layer is a direction incumbents are already moving in, so a newcomer cannot rely on them standing still.
- AtlasAI's stated practice of checking every number against the table cell it cites, and Open Targets' benchmark finding that generic API wrappers fail on aggregation, both point the same way: grounded, deterministic tool layers under the LLM are now the expected standard, not a differentiator.

### Gaps
- UI quality was not assessed hands-on: the fetch tool cannot render JavaScript apps, so judgements about visual and interaction quality are inferred from documentation and release notes.
- UniProt: no 2026 database-issue paper or news page could be opened; whether UniProt has added AI summaries, chat or an official MCP server in 2026 is unconfirmed (search suggested not).
- STRING: what "STRING chat" does, when it launched and how it is powered was not confirmed.
- DECIPHER and MaveDB: nothing newer than Sep 2025 (DECIPHER) and Jan 2025 (MaveDB) was confirmed; the "MaveMD" name in the brief could not be verified.
- Foldseek server: the 2026 database list and limits were not readable (JavaScript app).
- The Broad "Genomics 2 Proteins" portal exists (page title only) but could not be read — [G2P](https://g2p.broadinstitute.org/).
- No user-satisfaction data (surveys, usability studies) for any of these tools was found.

---

## 2. "Map of protein space" projects: scale, interaction model, limitations

### Takeaway
Maps of protein space already exist at every scale from one family (ProteinCartography, ProtSpace) to all known proteins (Protein Universe Atlas at about 53 million; Biohub's 2026 ESM Atlas at 6.8 billion sequences with natural-language search and an agent). The evidence on reception is discouraging for a map as the headline: the academic tools have tiny followings, their own authors warn that 2D distances are not quantitative, and a comparable "interactive atlas" launch on Hacker News was praised as fun while commenters questioned its use and its creator called the map the least important part.

### Cited Findings

**Protein Universe Atlas (University of Basel / SIB, 2023)**
- [S] An interactive sequence-similarity network built from AlphaFold DB v4 entries with pLDDT above 90 (press materials: about 53 million proteins) using all-against-all MMseqs2; exploration led to 290 putative new families and a new fold — [Nature paper (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10584680), [EurekAlert](https://www.eurekalert.org/news-releases/1002140).
- [V] Maintained by the SIB computational structural biology group, CC BY 4.0, presented as highlighting poorly annotated regions of sequence space; no update date or status note is given — [Expasy](https://www.expasy.org/resources/protein-universe-atlas).
- [V] The site still responds in November 2026 (title and loading message returned); the dataset in the URL is still the AFDB v4-based "AFDB90v4" — [Protein Universe Atlas](https://uniprot3d.org/atlas/AFDB90v4).

**ESM Metagenomic Atlas (Meta, 2022) and its 2026 successor**
- [S] After Meta cut the team in 2023, community groups pinned about 17 TB of the atlas to IPFS because it was at risk of disappearing — [LabDAO](https://medium.com/@labdao/how-to-save-20-terabytes-of-scientific-public-goods-23151d24c6b2).
- [V] esmatlas.com still returns a page titled as Meta AI's ESM Metagenomic Atlas; whether the explorer and API still function could not be determined — [esmatlas.com](https://esmatlas.com/).
- [S] The EvolutionaryScale team joined Biohub (Chan Zuckerberg Initiative) in a transaction dated November 2025 — [Gunderson](https://www.gunder.com/en/news-insights/client-news/gunderson-client-evolutionaryscale-team-joins-biohub-in-strategic-transaction-with-chan-zuckerberg-initiative).
- [V] EvolutionaryScale's Forge address now redirects to the Biohub platform — [forge.evolutionaryscale.ai](https://forge.evolutionaryscale.ai/).
- [V] Meta's original ESM code repository now lives under Biohub's GitHub organisation as an archived repository (4,175 stars, last pushed Feb 2024) — [Biohub/esm-archive](https://github.com/Biohub/esm-archive).
- [V] Biohub's new ESM Atlas (announced 27 May 2026): 6.8 billion protein sequences, 1.1 billion ESMFold2 structures, organised by features learned by the ESMC model and extracted with sparse autoencoders rather than by homology or curated labels — [Biohub](https://biohub.org/?p=42052), [Biohub announcement email](https://info.biohub.org/launching-a-world-model-of-protein-biology-esmf).
- [V] Data: sparse-autoencoder features for about 6.8B proteins, structures for about 1.1B, 7.7 million clusters by feature similarity; CC BY 4.0 (third-party sequence subsets CC BY-SA); open S3 bucket needing no AWS account; companion explorer at biohub.ai/esmc/atlas — [AWS Open Data registry](https://registry.opendata.aws/biohub-esm-atlas/).
- [V] Interaction model as documented: the Atlas tool searches by sequence or natural language; an "Atlas agent" is promoted; docs describe looking up proteins and clusters, browsing features and finding similar proteins; a Biohub MCP server lets external AI clients explore related proteins and view 3D structures; the companion Fold app is free and needs no account, while API use needs a key and credits — [Biohub platform](https://biohub.ai/), [ESM page](https://biohub.ai/esm/protein/about), [Biohub docs](https://docs.biohub.ai/), [Biohub llms.txt](https://biohub.ai/llms.txt).
- [V] Reception: independent scientists called it an extraordinary resource but said predictions need evaluation; one questioned accuracy on proteins unlike known ones (metagenomic data); another sees it as a supplement to AlphaFold DB — [Scientific American / Nature](https://www.scientificamerican.com/article/new-protein-folding-ai-vastly-expands-on-alphafolds-efforts/).
- [V] Models are MIT-licensed for commercial and non-commercial use — [GEN](https://www.genengnews.com/topics/artificial-intelligence/biohub-releases-protein-biology-world-model-to-address-disease/).
- [V] On Hacker News the two launch submissions drew 3 and 2 points and no comments — [HN search API result](https://hn.algolia.com/api/v1/search?query=ESM%20protein%20biohub&tags=story&numericFilters=created_at_i%3E1735689600&hitsPerPage=30).

**ProtSpace (Rost lab)**
- [V] Python package plus browser explorer for protein-language-model embeddings: PCA/UMAP/t-SNE projections, annotation overlays from UniProt, InterPro, taxonomy and TED domains, annotation transfer from nearest neighbours, integrated structure view, export to PNG/PDF/SVG/HTML; data are parsed in the browser and not uploaded; MIT; version 4.20.0 released 22 Nov 2026 — [PyPI](https://pypi.org/project/protspace/).
- [V] 19 GitHub stars despite active development — [GitHub](https://github.com/tsenoner/protspace).
- [S] Published in the Journal of Molecular Biology (2025); structure viewing used NGL — [bioRxiv](https://www.biorxiv.org/content/10.1101/2024.11.30.626168.full.pdf).
- Limitation [V]: it is a bring-your-own-dataset tool; no scale limits or public whole-proteome maps are documented — [PyPI](https://pypi.org/project/protspace/).

**ProteinCartography (Arcadia Science)**
- [V] A per-query pipeline: BLAST (default 3,000 hits) and Foldseek (up to 1,000 per database) around an input protein, all-against-all structural comparison, Leiden clustering, then Plotly HTML scatter plots (UMAP and t-SNE) with colour overlays and hover tooltips; 30–90 minutes per small protein — [Arcadia pub](https://thestacks.org/publications/resource-protein-cartography).
- [V] Stated caveats: 2D distances must not be read quantitatively; depends on AlphaFold DB coverage (viral proteins absent at the time); rigid-body comparison handles flexible multi-domain proteins poorly; low-confidence proteins cluster badly. The publication is tagged as not actively updating and shows zero comments — [Arcadia pub](https://thestacks.org/publications/resource-protein-cartography).
- [V] 49 GitHub stars, MIT, last push Aug 2026 — [GitHub](https://github.com/Arcadia-Science/ProteinCartography).

**Nomic Atlas and Apple Embedding Atlas**
- [V] The one Nomic Atlas protein map found is a hobby dataset of reviewed Swiss-Prot proteins embedded with ProteinCLIP/ESM2, last updated about two years ago — [Hugging Face: DS569k](https://huggingface.co/datasets/donnyb/DS569k/blob/main/README.md).
- [V] Nomic's open renderer (deepscatter: quadtree tiles, claims over a billion points) is under a non-commercial licence and was last pushed in May 2025 — [GitHub](https://github.com/nomic-ai/deepscatter).
- [V] Apple's Embedding Atlas (2025): WebGPU rendering of up to a few million points with density contours, automatic clustering and labels, real-time and nearest-neighbour search, linked cross-filtered charts, and an MCP interface so agents can query and chart; MIT; 5,047 stars — [project site](https://apple.github.io/embedding-atlas/), [paper](https://arxiv.org/abs/2505.06386), [GitHub](https://github.com/apple/embedding-atlas).
- [S] No published use of Embedding Atlas on protein embeddings was found — [InfoQ](https://www.infoq.com/news/2025/11/embedding-atlas).

**2025–2026 newcomers and adjacent items**
- [S] PLVis (RSC Digital Discovery, 2026): interactive maps of protein relationships from pre-trained protein-language-model embeddings across full reference proteomes — [RSC](https://pubs.rsc.org/en/content/articlehtml/2026/dd/d5dd00472a) (page refused automated access).
- [V] Microsoft's Dayhoff Atlas (Jul 2025) is a dataset-and-model collection (3.34 billion sequences), not an interactive map — [Microsoft Research](https://www.microsoft.com/en-us/research/articles/the-dayhoff-atlas/).
- [V] A 2026 hobby post, "Exploring the protein zoo", is a 3Dmol.js viewer with about 35 curated examples, not a map — [blog](https://jordanshivers.github.io/blog/2026/exploring-the-protein-zoo).
- [V] Adjacent launch: an interactive atlas of 8.5 million research papers reached 85 points on Hacker News (Jul 2026). Commenters enjoyed exploring it, but some could not see a use beyond its looks, one noted that layout tuning is as much art as science, and the creator agreed the map was the least important of the product's four parts — [HN thread](https://news.ycombinator.com/item?id=48840207).

### Inferences
- No existing map combines (a) a single organism's whole proteome, (b) continuous zoom from overview down to an individual structure and residue, and (c) curated biomedical overlays (disease, drug, variant, localisation). The universe-scale maps (Protein Universe Atlas, ESM Atlas) are organised around clusters or network components; the family-scale tools are scatter plots with a structure pane. This is a real gap, but it is a gap in presentation, not in data or method.
- Competing on scale is pointless for a solo developer: Biohub's atlas is three orders of magnitude beyond the whole AlphaFold DB and already has natural-language search, an agent and an MCP server.
- A map is a navigation device, not a product. The reception evidence (tiny star counts for ProtSpace and ProteinCartography; near-zero Hacker News interest in the ESM launch; comments on the paper atlas questioning its use beyond its looks) suggests leading with a task or a story and using the map as the way in.
- Sustainability is a known failure mode for atlas explorers: Meta's atlas needed a community rescue, and ProteinCartography is no longer actively updated. A static, pre-computed design that costs nothing to keep online is a defensible answer to that.
- The repeated caveat that UMAP distances are not quantitative means a 2.0 map should either use a layout with defensible semantics (for example, a similarity network or labelled neighbourhoods) or say plainly what proximity does and does not mean.

### Gaps
- The interaction models of the Protein Universe Atlas and the Biohub ESM Atlas explorer could not be observed (JavaScript apps); descriptions come from docs and press. Whether the ESM Atlas explorer shows a 2D/3D map at all, or only search and cluster pages, is unconfirmed.
- PLVis details (scale, URL, licence, limitations) are unverified.
- Whether Meta's original ESM Metagenomic Atlas explorer and API still work is unverified.
- Nomic Atlas's current product status and pricing could not be read.
- InterPLM (an explorer of protein-language-model features) could not be opened (expired certificate) — [interplm.ai](https://interplm.ai/).
- No usage numbers were found for any map project.

---

## 3. Narrative and educational experiences: what made the best ones work

### Takeaway
The most durable educational asset in the field is a 26-year-old monthly illustrated column (PDB-101's Molecule of the Month, now at 323 instalments), and the newest tooling (MolViewStories, 2025) turns that format into interactive scenes — but stories are hand-coded and only a handful exist. No standout interactive "explorable explanation" about proteins from 2024–2026 was found; the pieces that drew attention were long-form explainers with strong diagrams, or a game.

### Cited Findings

**PDB-101 Molecule of the Month**
- [V] The series has run monthly since January 2000 (first article: myoglobin) and reached number 323 in November 2026 — [PDB-101 archive](https://pdb101.rcsb.org/motm/motm-by-date), [MolViewStories examples](https://molstar.org/mol-view-stories/docs/example-stories/index.html).
- [V] The 300th instalment (bacterial flagellar motor, December 2024) was rebuilt as an interactive story: four guided scenes plus a conclusion, assembled from six-plus experimental structures, with highlights and camera moves triggered from links in the text, pulse animations, motion slowed a thousand-fold, and optional narration (drafted with a chatbot and voiced with text-to-speech). The write-up credits progressive disclosure — adding detail and motion as the narrative advances — and shared setup code for consistency — [Making of MoM 300](https://molstar.org/mol-view-stories/docs/example-stories/making-of-mom300.html).

**MolViewStories and MolViewSpec (Mol* team)**
- [V] MolViewStories is a free browser app for building multi-scene molecular stories: each scene has camera focus, labels, tooltips and geometric primitives; stories are authored in a builder-style code syntax; they can be saved privately, published to a public link, or exported as a self-contained offline HTML file. Limits: 50 MB per session and 100 stored items; the docs warn that too many representations slow rendering — [core features](https://molstar.org/mol-view-stories/docs/core-features.html).
- [V] The repository was created 27 May 2025, is MIT-licensed and has 23 stars; the docs list four example stories — [GitHub](https://github.com/molstar/mol-view-stories), [examples](https://molstar.org/mol-view-stories/docs/example-stories/index.html).
- [V] MolViewSpec is a viewer-independent, declarative tree describing a scene (download, parse, component selection, representation, colour, labels, camera, annotations, primitives, multiple states and animations), with JSON and zipped encodings and Python and TypeScript bindings; Mol* is currently the only viewer that implements it; the docs mention no AI or agent use — [MolViewSpec docs](https://molstar.org/mol-view-spec-docs/).
- [V] PDB-101 promoted MolViewSpec in September 2025 for describing, sharing, reproducing and automating molecular scenes — [PDB-101 news](https://pdb101.rcsb.org/news/687681fa3b59581b68019797).
- [V] The Mol* GitHub organisation has no repository for MCP, LLM or agent integration (23 repositories inspected) — [molstar repositories](https://github.com/orgs/molstar/repositories).

**Mol* Mesoscale Explorer**
- [V] A beta app for integrative models of viruses, bacteria and organelles with guided tours; large models can exhaust browser memory and a desktop GPU is recommended; described in Protein Science (2024) — [Mesoscale Explorer](https://molstar.org/me/).

**Foldit**
- [V] Still running after 18 years (birthday post 8 May 2026); 2026 news shows ongoing drug-target puzzle rounds, a new engine prototype (Jul 2026) and recovery from a major outage at its host university (Oct 2026) — [fold.it](https://fold.it/).

**Explainers and playful formats, 2024–2026**
- [V] "The Illustrated AlphaFold" walks through AlphaFold 3 in data-flow order with many static diagrams, a clickable architecture figure used as a table of contents, tensor shapes tracked at each step, and the author's interpretations kept separate from what the paper states — [article](https://elanapearl.github.io/blog/2024/the-illustrated-alphafold/).
- [V] Quanta Magazine's June 2024 feature on AI and protein science is a three-part narrative with custom explanatory diagrams (in mobile and desktop versions), built around researchers' stories, analogies and an open question about what counts as understanding; it is not interactive — [Quanta](https://www.quantamagazine.org/how-ai-revolutionized-protein-science-but-didnt-end-it-20240626/).
- [V] GeneGuessr (Dec 2025) is a free, no-login daily puzzle: identify a human gene from its 3D structure using similarity clues. It reached 88 points on Hacker News; commenters praised the polish and taste but said it was close to impossible for non-specialists and asked for easier modes, sequence display and confidence shading — [HN thread](https://news.ycombinator.com/item?id=46363870).
- [V] One prominent author of interactive explainers has published nothing on biology and nothing since December 2024 (titles cover physics and engineering topics) — [ciechanow.ski archive](https://ciechanow.ski/archives/).

### Inferences
- What made the strong pieces work, taken together: one molecule or mechanism per piece; a fixed sequence the author controls; progressive disclosure (start simple, add detail and motion); the visual tied to the sentence being read (text links that move the camera or highlight parts); honest treatment of uncertainty; and a human or historical frame. None of them asks the reader to operate a general-purpose viewer.
- Authoring cost is the bottleneck. Molecule of the Month depends on one expert illustrator's monthly effort; MolViewStories requires writing builder code per scene, and only four official examples exist eighteen months after launch. A tool that lowers the cost of producing a correct, sourced, scene-by-scene story would address the actual constraint.
- MolViewSpec is a ready-made, MIT-licensed target format for machine-generated scenes, and the Mol* organisation has not built an agent layer for it. Generating MolViewSpec states from a grounded agent, then letting a human edit them, is technically adjacent to what the project already does with typed interface commands.
- GeneGuessr shows that playful protein content can travel beyond specialists, and that difficulty calibration for non-experts is the unsolved part.

### Gaps
- Proteopedia could not be read (pages returned empty), so its current size, viewer technology and activity are unverified.
- The catalogue of explorable explanations did not load, and with search unavailable I could not sweep for 2025–2026 interactive articles; "none found" here means none found among known candidates, not proof of absence.
- No readership figures for Molecule of the Month or usage figures for MolViewStories were found.
- Whether any published MolViewStories exist beyond the four official examples is unknown.

---

## 4. AI-for-biology products and startups with exploration or agent interfaces (2025–2026)

### Takeaway
The agent layer over public biology data is crowded and well funded: frontier labs ship science workbenches with 60-plus built-in database connectors and native structure rendering, open skills libraries make any coding agent "biology-aware" for free, and autonomous "AI scientist" products are priced for institutions. Nearly all of it targets working scientists and paying organisations and uses a chat-plus-report paradigm; almost none is free without login, and none is built for learners.

### Cited Findings

**Frontier-lab offerings**
- **Claude Science (Anthropic)** — [V] Launched in beta 30 Jun 2026 as an "AI workbench": chat with a coordinating agent that has over 60 curated skills and connectors; natively renders 3D protein structures, genome-browser tracks and chemical structures as artifacts; each figure carries the exact code and environment plus message history; sessions can be forked to compare approaches; a reviewer agent checks citations and calculations; runs on macOS/Linux, HPC login nodes or on-demand GPUs. Available on paid plans (Pro, Max, Team, Enterprise) with an academic discount for teams; no free tier is mentioned — [Anthropic](https://www.anthropic.com/news/claude-science-ai-workbench). [V] Built-in read-only connectors need no account and cover UniProt, InterPro, Pfam, Human Protein Atlas, STRING, PDB, AlphaFold, gnomAD, ClinVar, Open Targets, cBioPortal and more; skills cover AlphaFold2, Boltz-2, Chai-1, ESMFold2, OpenFold3, ProteinMPNN and others — [Claude Science docs](https://claude.com/docs/claude-science/connectors-and-skills.md). [S] It succeeded "Claude for Life Sciences" (Oct 2025; expanded Jan 2026) — [Anthropic](https://www.anthropic.com/news/claude-for-life-sciences).
- **GPT-Rosalind (OpenAI)** — [V] A life-sciences reasoning model launched 16 Apr 2026 under a trusted-access programme for vetted enterprise customers; out of research preview 11 Sep 2026 with published pricing from 5 Oct 2026. A free "Life Sciences research plugin" for Codex is on GitHub with modular skills (genetics, functional genomics, protein structure, clinical evidence) and access to more than 50 public databases and tools, usable with mainline models. Benchmark claims are vendor-reported — [OpenAI](https://openai.com/index/introducing-gpt-rosalind/).
- **Google Co-Scientist / Gemini for Science** — [V] Co-Scientist (multi-agent hypothesis generation with an idea "tournament") was published in Nature on 19 May 2026 and offered to individual researchers as an experimental "Hypothesis Generation" tool via registration of interest; enterprise version in preview. Stated as a partner, not a replacement — [Google DeepMind](https://deepmind.google/blog/co-scientist-a-multi-agent-ai-partner-to-accelerate-research/). [V] Gemini for Science also includes Computational Discovery, Literature Insights and "Science Skills" bundling over 30 life-science databases and tools (AlphaFold DB, AlphaGenome, UniProt, InterPro) for agent platforms; no pricing given — [Google blog](https://blog.google/innovation-and-ai/models-and-research/google-research/gemini-for-science-io-2026/). [V] The skills are open source (Apache-2.0, 3.5k stars) and Google offers free top-tier access to 10,000 scientists by application — [GitHub](https://github.com/google-deepmind/science-skills), [Antigravity](https://antigravity.google/use-cases/science).
- **NVIDIA BioNeMo Agent Toolkit** — [V] Announced 23 Jun 2026: agent-callable skills for structure prediction, docking, generative chemistry, genomics and protein design, plus NIM microservices and blueprints; integrators include Anthropic, OpenAI, Edison Scientific, Owkin, Benchling and many others; no UI — [NVIDIA](https://nvidianews.nvidia.com/news/nvidia-launches-bionemo-agent-toolkit-giving-ai-agents-the-tools-to-accelerate-scientific-discovery). [V] Repository: 513 stars, Apache-2.0 code; hosted skills need an NVIDIA API key — [GitHub](https://github.com/NVIDIA-BioNeMo/bionemo-agent-toolkit).
- **Microsoft Discovery** — [S] An enterprise R&D platform on Azure billed per user message plus underlying Azure usage; general-availability status and rates were not confirmed — [Azure pricing](https://azure.microsoft.com/en-us/pricing/details/microsoft-discovery/).

**Non-profit / institute platforms**
- **Biohub platform (Chan Zuckerberg)** — [V] Hosts ESMC, ESMFold2, ESM3, the ESM Atlas (sequence and natural-language search, an Atlas agent), a free no-account Fold app, a developer console with API keys and credits, and an MCP server for external AI clients — [Biohub platform](https://biohub.ai/), [docs](https://docs.biohub.ai/), [llms.txt](https://biohub.ai/llms.txt). [V] EvolutionaryScale's Forge now redirects there — [Forge](https://forge.evolutionaryscale.ai/).
- **Virtual cells platform (Biohub)** — [V] Models with quick-start notebooks, standardised datasets, benchmarks, a CLI and beta no-code tools (embedding, UMAP plots); sign-in is offered; no pricing — [Virtual Cells Platform](https://virtualcellmodels.cziscience.com/). [S] A five-year, $500M Virtual Biology Initiative was announced 29 Apr 2026, with further partner funding reported in October — [Axios](https://www.axios.com/2026/10/07/zuckerberg-biohub-ai-biology-data).
- **Arc Virtual Cell Atlas** — [V] Over 600 million cells (Tahoe-100M drug perturbations; scBaseCount, curated by an AI-agent workflow, over 500 million cells); CC0; access through scripts on GitHub, with no interactive explorer — [Arc Institute](https://arcinstitute.org/tools/virtualcellatlas).

**"AI scientist" and research-agent companies**
- **Biomni / Phylo** — [V] Open-source agent (Apache-2.0, 4,110 stars) from Stanford; the company Phylo launched the commercial "Biomni Lab" on 3 Feb 2026 with a $13.5M seed round; it is described as a shared workspace where scientists orchestrate agents, with 300+ integrated tools and databases — [SynBioBeta](https://www.synbiobeta.com/read/phylo-launches-biomni-lab-and-secures-13.5m-seed-round), [GitHub](https://github.com/snap-stanford/Biomni). [V] The company site emphasises clarifying questions, knowledge-graph checks, traceable references, 100+ prebuilt workflows; no public prices — [Phylo](https://phylo.bio/). [V] Stanford reports over 15,000 scientists and about 100,000 workflows in the open-source project's first nine months, an academic programme, and that the agent still struggles with nuanced clinical judgement, novel experimental reasoning and deep synthesis — [Stanford HAI](https://hai.stanford.edu/news/stanford-scientists-build-an-ai-lab-partner). [V] Published in Science on 9 Jul 2026; authors note the evaluated tasks are a subset of the field — [EurekAlert](https://www.eurekalert.org/news-releases/1134718). [S] A free academic version exists with paid higher tiers — [GenomeWeb](https://www.genomeweb.com/node/655366).
- **Edison Scientific (Kosmos), spun out of FutureHouse** — [V] Kosmos launched 5 Nov 2025 as a deep-research-style system, not a chatbot: a run reads about 1,500 papers and executes about 42,000 lines of analysis code and returns a report in which each conclusion traces to code or literature; launch price $200 per run with some free academic use; the company reports 79.4% of conclusions accurate and admits it often chases statistically significant but irrelevant findings and has a rough UI — [Edison](https://edisonscientific.com/news/announcing-kosmos). [V] In 2026 the site positions Kosmos for pharma R&D (working through Slack, Teams and email, with forward-deployed scientists) and lists agreements with Pfizer (Oct 2026), Springer Nature (Sep 2026) and Incyte — [Edison](https://edisonscientific.com/). [2nd] An independent write-up collects scientists' reactions: one says an error rate of about one in five is too high and the output should be treated like a well-read colleague's opinion; another worries researchers will stop reading what they cite; one runs most of his datasets through it to check his own findings — [analysis](https://rywalker.com/research/kosmos). [V] FutureHouse's open components remain on GitHub (paper-qa 9,662 stars; Robin 764, last pushed Apr 2026) — [paper-qa](https://github.com/Future-House/paper-qa), [Robin](https://github.com/Future-House/robin).
- **Potato** — [V] Now positioned as software that turns a biological goal into experiment designs, plate maps and robot scripts ("The Optimizer", early access) — [Potato](https://www.potato.ai/). [S] $4.5M seed (Apr 2025) — [GeekWire](https://geekwire.com/2025/startup-aiming-to-revolutionize-research-with-fully-automated-science-experimentation-lands-4-5m/). [2nd] A market analysis argues that protocol and literature assistants lack an urgent pain point and that companies in this group pivoted toward lab-automation translation, where the problem is expensive — [Scaling Biotech](https://scalingbiotech.substack.com/p/is-it-an-ai-scientist-or-a-potato).
- **Owkin K Pro** — [V] Launched 16 Oct 2025 as an agentic co-pilot for biopharma built on Owkin's biological LLM and patient-data network; natural-language interface; no public pricing — [Owkin](https://www.owkin.com/newsfeed/owkin-launches-k-pro-the-first-agentic-ai-co-pilot-for-biopharma-powered-by-biological-reasoning-models). [S] 2026 licences with AstraZeneca, Sanofi, Boehringer Ingelheim and Servier — [Owkin](https://owkin.com/newsfeed/owkin-to-license-k-pro-ai-scientist-and-multimodal-oncology-and-immunology-data-to-boehringer-ingelheim).
- **Causaly** — [S] Agentic research platform (Sep 2025) and multi-agent "Scientific Workflows" (28 May 2026); demo-request sales — [Causaly](https://www.causaly.com/news/causaly-introduces-first-agentic-ai-platform-built-for-life-sciences-research-and-development).
- **Elicit** — [V] Free tier (unlimited search over 138M papers and chat with papers; capped agent and report use); Pro $49/month; Scale $229/month with live collaboration; enterprise custom — [Elicit pricing](https://elicit.com/pricing).
- **Amass** — [V] A verifiable "scientific intelligence layer" linking papers, trials, drugs, genes, patents and regulatory records with record identifiers; delivered as an app, an MCP connector for assistants and an API; free plan available — [Amass](https://www.amass.tech/).
- **Benchling AI** — [V] Generally available 10 Feb 2026 inside the Benchling platform: agents (Ask, Compose, Deep Research, Data Entry) and built-in models (AlphaFold 2, Chai-1, Boltz-2); the company reports use at 500 biotech companies; testimonials stress hours saved on documentation — [Benchling](https://www.benchling.com/blog/benchling-ai-now-generally-available).

**Protein design and modelling platforms**
- **Tamarind Bio** — [V] No-code access to protein-design and structure tools; free tier with all models, quote-based Premium/Enterprise, academic add-on; an MCP server is linked — [Tamarind pricing](https://tamarind.bio/pricing). [S] A search summary of the same page gave the free tier as 10 jobs per month; that figure was not visible when the page was opened — [Tamarind pricing](https://tamarind.bio/pricing).
- **Neurosnap** — [S] Free academic plan (3 credits a month, limited models), commercial use by quote; one Reddit user found the free limits too tight for real work — [Neurosnap](https://neurosnap.ai/) (the academic-plan page named in search results returned "not found" when opened directly, so these terms are unconfirmed).
- **Rowan** — [V] Free tier with 20 credits a week plus 500 on signup and free API access; credits 4 cents each; academic tiers; an "agentic science" offering connects external agents to its compute — [Rowan pricing](https://rowansci.com/pricing).
- **OpenProtein.AI** — [V] No-code front end plus APIs for protein engineering; free for academic scientists — [MIT News](https://news.mit.edu/2026/bringing-ai-driven-protein-design-tools-everywhere-0417).
- **310.ai** — [V] Homepage presents a text-to-protein model (MP4); no pricing shown — [310.ai](https://310.ai/). [S] A chat "Copilot" with design, search, visualisation and pipeline actions — [startup profile](https://startup-seeker.com/company/310~ai).
- **Cradle** — [V] Point-and-click web app plus API for iterative protein engineering on the customer's own assay data; licence-based, contact sales, no free tier shown — [Cradle](https://cradle.bio/).
- **Chai Discovery** — [S] $130M Series B (Dec 2025) and $400M Series C at $3.8B (Jul 2026); sells platform access to pharma — [SiliconANGLE](https://siliconangle.com/2026/07/14/chai-discovery-nabs-400m-series-c-ai-designed-antibodies-reach-big-pharma/).
- **Latent Labs** — [V] Latent-X1/X2 design models, "Latent-Y" (a drug-design agent) and a researcher tier, all behind early-access sign-up — [Latent Labs](https://www.latentlabs.com/). [S] A free tier was reported at the 2025 launch — [BiopharmaTrend](https://www.biopharmatrend.com/post/1317-latent-labs-launches-web-based-ai-tool-for-custom-protein-generation).
- **Converge Bio** — [V] $25M Series A (Jan 2026); packaged generative systems for antibody design, yield optimisation and target discovery; the article notes more than 200 startups in the space — [TechCrunch](https://techcrunch.com/?p=3081727).
- **Synthesize Bio** — [V] Generative expression models and a trial-outcome predictor with a form-style interface; pricing not stated — [Synthesize Bio](https://www.synthesize.bio/).

**Closest prior art to "an LLM drives a molecular interface"**
- **PlayMolecule AI, "Speak to a Protein" (Acellera)** — [V] Free web app (Oct 2025): chat panel on the right, Mol*-based 3D viewer on the left, console underneath; natural-language requests become tool calls (via MCP) that run Python inside the viewer; tools for literature, UniProt, ChEMBL and PDB; model was GPT-4.1 at publication. Reported failure modes: several structures failed to load, calls to missing functions, residue-numbering mismatches between tools, context-window strain, viewer slowdowns; evaluation was by case study only — [arXiv](https://arxiv.org/html/2510.17826v1), [Acellera](https://www.acellera.com/blog/speak-to-a-protein).
- **ChimeraX MCP** — [V] Since Dec 2025 ChimeraX has an `mcp` command exposing 14 tools so a desktop assistant can issue commands; the maintainer's page says it suits newcomers, the assistant often makes mistakes, does not remember them between conversations, and experienced users are faster by hand — [UCSF RBVI](https://www.rbvi.ucsf.edu/chimerax/data/claude-dec2025/claude_mcp.html).
- **ChatMol and PyMOL MCP servers** — [V] ChatMol (natural-language PyMOL control; MIT) has 376 stars and was last pushed Mar 2026; its MCP companion has 97 stars and was last pushed Apr 2025 — [ChatMol](https://github.com/ChatMol/ChatMol), [molecule-mcp](https://github.com/ChatMol/molecule-mcp).
- **Incumbent assistants** — [V] HPA AtlasAI (sidebar agents) — [HPA](https://www.proteinatlas.org/learn/ai); cBioPortalChat (links into views) — [cBioPortal docs](https://docs.cbioportal.org/ai-integrations/chat-interface/); Biohub Atlas agent and MCP server — [ESM page](https://biohub.ai/esm/protein/about), [Biohub docs](https://docs.biohub.ai/). Details are in sections 1 and 2.
- **Registry check** — [V] Among 77 registered biomedical MCP servers, viewer control exists only for PyMOL and a microscopy viewer — [BioContextAI registry](https://biocontext.ai/registry?page=2).

**Open skills libraries (the commoditising layer)**
- [V] K-Dense "scientific-agent-skills": 177 skills, claims use by 250,000+ scientists, 58,453 stars, MIT, installs into Claude Code, Codex, Gemini CLI, Cursor and others — [GitHub](https://github.com/K-Dense-AI/scientific-agent-skills).
- [V] ToolUniverse (Harvard): 1,810 stars, Apache-2.0; listed in the MCP registry with 2,600+ tools — [GitHub](https://github.com/mims-harvard/ToolUniverse), [BioContextAI registry](https://biocontext.ai/registry).

**Evidence on reliability**
- [V] An Anthropic study (8 Jun 2026) found agents retrieving viral sequence sets scored 16.9%–91.3% mean accuracy without a dedicated tool and varied between identical runs, changing downstream conclusions; with a deterministic retrieval tool all agents exceeded 90% and differences between models narrowed — [Anthropic research](https://www.anthropic.com/research/agents-in-biology).
- [V] A cancer-research society review (18 Jun 2026) lists creator-acknowledged limits: incomplete tool coverage and limited deep biological reasoning (Biomni), intrinsic hallucination risk (Co-Scientist), inability to produce executable protocols and need for expert prompting (Robin) — [AACR](https://www.aacr.org/blog/2026/06/18/eye-on-ai-agentic-ai-brings-bots-to-the-bench/).

**What changed in 2026**
- [V] Launched: Biomni Lab (Feb) — [SynBioBeta](https://www.synbiobeta.com/read/phylo-launches-biomni-lab-and-secures-13.5m-seed-round); Benchling AI general availability (Feb) — [Benchling](https://www.benchling.com/blog/benchling-ai-now-generally-available); GPT-Rosalind (Apr) — [OpenAI](https://openai.com/index/introducing-gpt-rosalind/); Co-Scientist public route and Gemini for Science (May) — [Google DeepMind](https://deepmind.google/blog/co-scientist-a-multi-agent-ai-partner-to-accelerate-research/); Biohub ESM Atlas (May) — [Biohub](https://biohub.org/?p=42052); BioNeMo Agent Toolkit (Jun) — [NVIDIA](https://nvidianews.nvidia.com/news/nvidia-launches-bionemo-agent-toolkit-giving-ai-agents-the-tools-to-accelerate-scientific-discovery); Claude Science (Jun) — [Anthropic](https://www.anthropic.com/news/claude-science-ai-workbench); cBioPortalChat (Aug) — [cBioPortal news](https://docs.cbioportal.org/news/); HPA AtlasAI (Nov) — [HPA releases](https://www.proteinatlas.org/about/releases).
- [V] Absorbed: EvolutionaryScale Forge now redirects to Biohub — [Forge](https://forge.evolutionaryscale.ai/).
- No outright shutdown among the named companies was confirmed in the pages read; the nearest case is Forge being folded into Biohub — [Forge](https://forge.evolutionaryscale.ai/).

### Inferences
- Interface paradigms cluster into four: (1) chat that returns a long cited report (Kosmos, Co-Scientist, Elicit, Causaly); (2) workbench/notebook with rendered artifacts (Claude Science, Biomni Lab, Benchling); (3) form-based job runners (Tamarind, Neurosnap, Rowan, Cradle, OpenProtein, Latent); (4) headless skills/MCP for someone else's agent (K-Dense, Google, OpenAI plugin, BioNeMo, official database MCPs). A spatial canvas or map as the primary surface is absent from all four.
- Access is the common weakness for a public-good project to exploit: the strongest agents are paid, gated or enterprise-only, and the free ones require sign-in or API keys. Free, no-login, zero-setup use is rare (Biohub Fold, PlayMolecule's open app, the public databases themselves).
- The same fact cuts the other way: a curious engineer with a coding agent can already install a free skills library and query every database this project would wrap. A 2.0 whose value is "an LLM that can look things up in protein databases" would be competing with free, better-resourced defaults.
- Reported weaknesses are consistent across products: error rates that require verification, run-to-run variability, and brittleness when the model writes free-form code against tools. A small, typed, validated command vocabulary is a sound engineering response, but users will experience it as reliability, not as a feature.
- Users praise time saved on tedious, verifiable work (documentation, data wrangling, literature triage) and traceability; they distrust synthesis and unsupervised conclusions.

### Gaps
- Public pricing was not confirmed for Biomni Lab, Kosmos (2026), Owkin, Causaly, Cradle, Chai, Latent, Synthesize, Microsoft Discovery or 310.ai.
- Independent user reviews (as opposed to vendor testimonials) were found only for Kosmos (secondary) and one Reddit remark on Neurosnap; no systematic user-sentiment data exists in what I could reach.
- The repository name and licence of OpenAI's Codex life-sciences plugin were not verified.
- Whether Microsoft Discovery is generally available, and Google Co-Scientist's exact access state in November 2026, are unconfirmed (sources conflict).
- The Tater agent, Amass funding and the FutureHouse platform's current state were not verified.

---

## 5. Open-source GitHub projects worth integrating or learning from

### Takeaway
The building blocks for a 2.0 are mature, permissively licensed and actively maintained (Mol*, MolViewSpec, Embedding Atlas, graph and genome components, MCP servers). The star counts also tell a story about attention: agent skills and generic infrastructure attract tens of thousands of stars, while protein-specific explorers and "talk to a viewer" projects attract tens to a few hundred.

### Cited Findings
All rows are **[V]**: stars, licence (as classified by GitHub; "unclassified" means GitHub could not map the licence file to a standard identifier) and last push were read from the GitHub REST API on 25 Nov 2026; links go to the repositories.

**Molecular viewers and extensions**

| Repository | Stars | Licence | Last push | Why it matters |
|---|---|---|---|---|
| [molstar/molstar](https://github.com/molstar/molstar) | 1,046 | MIT | 2026-11-25 | The standard web viewer (PDBe, RCSB, AlphaFold DB); WebXR support |
| [molstar/mol-view-spec](https://github.com/molstar/mol-view-spec) | 67 | MIT | 2026-09-22 | Declarative scene format; natural target for machine-generated views |
| [molstar/mol-view-stories](https://github.com/molstar/mol-view-stories) | 23 | MIT | 2026-10-28 | Story web app (created May 2025) |
| [3dmol/3Dmol.js](https://github.com/3dmol/3Dmol.js) | 1,038 | unclassified | 2026-11-23 | Lightweight WebGL viewer; also powers py3Dmol |
| [nglviewer/ngl](https://github.com/nglviewer/ngl) | 736 | MIT | 2026-09-03 | Older WebGL viewer, still maintained |
| [nglviewer/nglview](https://github.com/nglviewer/nglview) | 931 | unclassified | 2026-02-02 | Jupyter widget |
| [ncbi/icn3d](https://github.com/ncbi/icn3d) | 178 | unclassified | 2026-11-13 | NCBI's web viewer with analysis features |
| [sokrypton/py2Dmol](https://github.com/sokrypton/py2Dmol) | 117 | unclassified | 2026-11-17 | New (Oct 2025) lightweight notebook viewer |
| [BradyAJohnston/MolecularNodes](https://github.com/BradyAJohnston/MolecularNodes) | 1,423 | GPL-3.0 | 2026-11-24 | Blender molecular animation; most-starred protein-visualisation project here |
| [ebi-webcomponents/nightingale](https://github.com/ebi-webcomponents/nightingale) | 151 | MIT | 2026-11-04 | Sequence-feature track web components used by EBI sites |

Additional viewer-ecosystem facts [V] from the Mol* organisation page: pdbe-molstar 142 stars, VSCoding-Sequence (VS Code structure viewer) 130, ipymolstar (Mol* as a notebook widget) 55, last updated Oct 2025 — [molstar repositories](https://github.com/orgs/molstar/repositories).

**Agents, skills and MCP servers**

| Repository | Stars | Licence | Last push | Why it matters |
|---|---|---|---|---|
| [K-Dense-AI/scientific-agent-skills](https://github.com/K-Dense-AI/scientific-agent-skills) | 58,453 | MIT | 2026-11-23 | 177 science skills for any coding agent |
| [Future-House/paper-qa](https://github.com/Future-House/paper-qa) | 9,662 | Apache-2.0 | 2026-11-16 | Cited question answering over papers |
| [snap-stanford/Biomni](https://github.com/snap-stanford/Biomni) | 4,110 | Apache-2.0 | 2026-11-23 | General biomedical agent |
| [Biohub/esm](https://github.com/Biohub/esm) | 3,032 | unclassified | 2026-11-20 | ESMC / ESMFold2 / ESM3 code (formerly EvolutionaryScale) |
| [mims-harvard/ToolUniverse](https://github.com/mims-harvard/ToolUniverse) | 1,810 | Apache-2.0 | 2026-11-25 | Large tool collection exposed over MCP |
| [Future-House/robin](https://github.com/Future-House/robin) | 764 | Apache-2.0 | 2026-04-21 | Multi-agent discovery system (quiet since April) |
| [genomoncology/biomcp](https://github.com/genomoncology/biomcp) | 685 | MIT | 2026-11-10 | Biomedical MCP server |
| [anthropics/life-sciences](https://github.com/anthropics/life-sciences) | 657 | none stated | 2026-11-20 | Marketplace manifest for Claude life-science plugins |
| [ChatMol/ChatMol](https://github.com/ChatMol/ChatMol) | 376 | MIT | 2026-03-16 | Natural-language PyMOL control |
| [ChatMol/molecule-mcp](https://github.com/ChatMol/molecule-mcp) | 97 | MIT | 2025-04-20 | MCP for PyMOL/ChimeraX/GROMACS (stale) |
| [opentargets/platform-mcp](https://github.com/opentargets/platform-mcp) | 37 | Apache-2.0 | 2026-10-06 | Official Open Targets MCP |
| [biocontext-ai/knowledgebase-mcp](https://github.com/biocontext-ai/knowledgebase-mcp) | 33 | Apache-2.0 | 2026-10-12 | Aggregated knowledge-base MCP |
| [Augmented-Nature UniProt MCP](https://github.com/Augmented-Nature/Augmented-Nature-UniProt-MCP-Server) | 21 | unclassified | 2025-12-21 | Community UniProt MCP |

Also [V]: google-deepmind/science-skills 3.5k stars, Apache-2.0 — [GitHub](https://github.com/google-deepmind/science-skills); NVIDIA-BioNeMo/bionemo-agent-toolkit 513 stars, Apache-2.0 code — [GitHub](https://github.com/NVIDIA-BioNeMo/bionemo-agent-toolkit).

**Knowledge graphs and graph rendering**

| Repository | Stars | Licence | Last push | Why it matters |
|---|---|---|---|---|
| [jacomyal/sigma.js](https://github.com/jacomyal/sigma.js) | 12,251 | MIT | 2026-11-10 | WebGL graph rendering for thousands of nodes |
| [vasturiano/react-force-graph](https://github.com/vasturiano/react-force-graph) | 3,377 | MIT | 2026-09-29 | 2D/3D/VR force graphs (the current app's graph library family) |
| [cosmosgl/graph](https://github.com/cosmosgl/graph) | 1,312 | MIT | 2026-11-25 | GPU force layout for very large graphs |
| [mims-harvard/PrimeKG](https://github.com/mims-harvard/PrimeKG) | 844 | MIT | 2026-06-30 | Precision-medicine knowledge graph |
| [biocypher/biocypher](https://github.com/biocypher/biocypher) | 348 | Apache-2.0 | 2026-11-10 | Framework for building biomedical knowledge graphs |

**Variant and genome viewers**

| Repository | Stars | Licence | Last push | Why it matters |
|---|---|---|---|---|
| [igvteam/igv.js](https://github.com/igvteam/igv.js) | 738 | MIT | 2026-11-25 | Embeddable genome browser |
| [GMOD/jbrowse-components](https://github.com/GMOD/jbrowse-components) | 299 | Apache-2.0 | 2026-11-25 | JBrowse 2 |
| [gosling-lang/gosling.js](https://github.com/gosling-lang/gosling.js) | 197 | MIT | 2026-10-29 | Grammar for multiscale linked genomics views |
| [stjude/proteinpaint](https://github.com/stjude/proteinpaint) | 59 | unclassified | 2026-11-25 | Lollipop/variant-on-protein views |

**Embedding-map viewers**

| Repository | Stars | Licence | Last push | Why it matters |
|---|---|---|---|---|
| [apple/embedding-atlas](https://github.com/apple/embedding-atlas) | 5,047 | MIT | 2026-11-21 | WebGPU map with auto-labels, search, cross-filter, MCP |
| [nomic-ai/deepscatter](https://github.com/nomic-ai/deepscatter) | 1,161 | non-commercial (per README) | 2025-05-29 | Tiled billion-point scatter; stale; licence unsuitable |
| [TutteInstitute/datamapplot](https://github.com/TutteInstitute/datamapplot) | 1,034 | MIT | 2026-11-19 | Labelled static/interactive data maps |
| [flekschas/jupyter-scatter](https://github.com/flekschas/jupyter-scatter) | 475 | Apache-2.0 | 2026-11-11 | Notebook scatter for millions of points |
| [flekschas/regl-scatterplot](https://github.com/flekschas/regl-scatterplot) | 241 | MIT | 2026-10-23 | Small, fast WebGL scatter library |
| [Arcadia-Science/ProteinCartography](https://github.com/Arcadia-Science/ProteinCartography) | 49 | MIT | 2026-08-18 | Per-family structure maps |
| [tsenoner/protspace](https://github.com/tsenoner/protspace) | 19 | MIT | 2026-11-22 | Protein embedding explorer |

**Canvas, collaboration, storytelling and replay (general-purpose)**

| Repository | Stars | Licence | Last push | Why it matters |
|---|---|---|---|---|
| [excalidraw/excalidraw](https://github.com/excalidraw/excalidraw) | 136,294 | MIT | 2026-11-25 | Whiteboard canvas under a permissive licence |
| [tldraw/tldraw](https://github.com/tldraw/tldraw) | 51,587 | custom (see section 7) | 2026-11-25 | Infinite-canvas SDK; production use needs a licence key |
| [xyflow/xyflow](https://github.com/xyflow/xyflow) | 39,153 | MIT | 2026-11-23 | Node-based canvases (React Flow) |
| [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) | 33,934 | MIT | 2026-10-21 | React renderer for three.js (the current app's 3D stack) |
| [marimo-team/marimo](https://github.com/marimo-team/marimo) | 23,742 | Apache-2.0 | 2026-11-25 | Reactive notebook that deploys as an app |
| [yjs/yjs](https://github.com/yjs/yjs) | 23,112 | unclassified | 2026-11-23 | Shared data types for multiplayer editing |
| [rrweb-io/rrweb](https://github.com/rrweb-io/rrweb) | 20,505 | MIT | 2026-11-25 | Record and replay of web sessions |
| [automerge/automerge](https://github.com/automerge/automerge) | 6,755 | MIT | 2026-11-25 | Alternative shared-state library |
| [russellsamora/scrollama](https://github.com/russellsamora/scrollama) | 6,013 | MIT | 2025-11-13 | Scroll-triggered storytelling |
| [manzt/anywidget](https://github.com/manzt/anywidget) | 951 | MIT | 2026-11-06 | Portable notebook widgets (how ipymolstar is packaged) |

**Large-data map and graph infrastructure**

| Repository | Stars | Licence | Last push | Why it matters |
|---|---|---|---|---|
| [visgl/deck.gl](https://github.com/visgl/deck.gl) | 14,822 | MIT | 2026-11-25 | WebGL2 layers for large point and tile data |
| [cytoscape/cytoscape.js](https://github.com/cytoscape/cytoscape.js) | 11,307 | MIT | 2026-11-10 | Graph analysis and rendering |
| [vasturiano/3d-force-graph](https://github.com/vasturiano/3d-force-graph) | 6,594 | MIT | 2026-11-05 | 3D force-directed graphs |
| [protomaps/PMTiles](https://github.com/protomaps/PMTiles) | 3,287 | unclassified | 2026-09-16 | Tile pyramids in one file on static storage |
| [duckdb/duckdb-wasm](https://github.com/duckdb/duckdb-wasm) | 2,174 | MIT | 2026-11-25 | In-browser SQL over columnar files |
| [uwdata/mosaic](https://github.com/uwdata/mosaic) | 1,410 | unclassified | 2026-11-24 | Linked, cross-filtered views over a database |
| [enjalot/latent-scope](https://github.com/enjalot/latent-scope) | 799 | MIT | 2026-08-21 | Latent-space exploration workflow |
| [poloclub/wizmap](https://github.com/poloclub/wizmap) | 540 | MIT | 2026-01-22 | Embedding map with multi-scale summaries |
| [higlass/higlass](https://github.com/higlass/higlass) | 345 | MIT | 2026-11-07 | Multiscale, tile-based genome browser |

**Structure prediction, search and representation code (offline pipeline or reference)**

| Repository | Stars | Licence | Last push | Note |
|---|---|---|---|---|
| [google-deepmind/alphafold3](https://github.com/google-deepmind/alphafold3) | 8,814 | Apache-2.0 as classified by GitHub (weights terms not checked) | 2026-11-19 | Inference pipeline |
| [jwohlwend/boltz](https://github.com/jwohlwend/boltz) | 4,343 | MIT | 2026-05-29 | Open structure/affinity models |
| [Biohub/esm-archive](https://github.com/Biohub/esm-archive) | 4,175 | MIT | 2024-02-07 (archived) | Meta's original ESM repository, now archived under Biohub |
| [sokrypton/ColabFold](https://github.com/sokrypton/ColabFold) | 2,998 | MIT | 2026-11-19 | Accessible folding |
| [google-deepmind/alphagenome](https://github.com/google-deepmind/alphagenome) | 2,255 | Apache-2.0 | 2026-11-24 | API client for the genome model |
| [soedinglab/MMseqs2](https://github.com/soedinglab/MMseqs2) | 2,177 | MIT | 2026-11-23 | Sequence search and clustering |
| [chaidiscovery/chai-lab](https://github.com/chaidiscovery/chai-lab) | 2,018 | Apache-2.0 | 2026-11-19 | Chai-1 |
| [agemagician/ProtTrans](https://github.com/agemagician/ProtTrans) | 1,323 | MIT | 2025-05-22 | Protein language models (ProtT5) |
| [biotite-dev/biotite](https://github.com/biotite-dev/biotite) | 989 | BSD-3-Clause | 2026-11-24 | Python structure/sequence toolkit |
| [aqlaboratory/openfold-3](https://github.com/aqlaboratory/openfold-3) | 930 | Apache-2.0 | 2026-11-25 | Open AlphaFold 3-class model |
| [ElanaPearl/InterPLM](https://github.com/ElanaPearl/InterPLM) | 317 | MIT | 2025-10-31 | Interpretable features in protein language models |

**Desktop viewers, agent bridges and agent frameworks**

| Repository | Stars | Licence | Last push | Note |
|---|---|---|---|---|
| [schrodinger/pymol-open-source](https://github.com/schrodinger/pymol-open-source) | 1,786 | unclassified | 2026-11-24 | Open-source PyMOL |
| [zou-group/virtual-lab](https://github.com/zou-group/virtual-lab) | 775 | MIT | 2025-12-31 | Team-of-agents research framework |
| [RBVI/ChimeraX](https://github.com/RBVI/ChimeraX) | 294 | unclassified | 2026-11-24 | ChimeraX source |
| [Future-House/aviary](https://github.com/Future-House/aviary) | 291 | Apache-2.0 | 2026-11-23 | Agent gym for scientific tasks |
| [Acellera/moleculekit](https://github.com/Acellera/moleculekit) | 250 | unclassified | 2026-10-30 | Library behind PlayMolecule |
| [biocypher/biochatter](https://github.com/biocypher/biochatter) | 224 | Apache-2.0 | 2026-07-31 | Conversational-AI backend for biomedicine |
| [vrtejus/pymol-mcp](https://github.com/vrtejus/pymol-mcp) | 69 | MIT | 2025-03-18 | Created and last pushed the same day |
| [Augmented-Nature/AlphaFold-MCP-Server](https://github.com/Augmented-Nature/AlphaFold-MCP-Server) | 38 | unclassified | 2025-12-21 | Community AlphaFold DB MCP |
| [chemrich/MCPymol](https://github.com/chemrich/MCPymol) | 17 | MIT | 2026-11-22 | Conversational protein display via PyMOL |
| [josefdc/Uniprot-MCP](https://github.com/josefdc/Uniprot-MCP) | 2 | MIT | 2026-03-02 | Community UniProt MCP |

**Database front ends (reference implementations)**

| Repository | Stars | Licence | Last push | Note |
|---|---|---|---|---|
| [cBioPortal/cbioportal](https://github.com/cBioPortal/cbioportal) | 1,069 | Apache-2.0 | 2026-11-24 | Portal backend |
| [plotly/dash-bio](https://github.com/plotly/dash-bio) | 575 | MIT | 2026-11-13 | Bioinformatics UI components |
| [hetio/hetionet](https://github.com/hetio/hetionet) | 367 | none stated | 2023-04-03 | Knowledge graph, dormant |
| [cBioPortal/cbioportal-frontend](https://github.com/cBioPortal/cbioportal-frontend) | 154 | Apache-2.0 | 2026-11-25 | React front end |
| [broadinstitute/gnomad-browser](https://github.com/broadinstitute/gnomad-browser) | 92 | MIT | 2026-11-20 | Variant browser |
| [rcsb/rcsb-saguaro](https://github.com/rcsb/rcsb-saguaro) | 57 | MIT | 2026-07-02 | 1D feature viewer |
| [monarch-initiative/monarch-app](https://github.com/monarch-initiative/monarch-app) | 40 | BSD-3-Clause | 2026-11-18 | Disease/phenotype knowledge-graph site |
| [ebi-webcomponents/protvista](https://github.com/ebi-webcomponents/protvista) | 24 | MIT | 2026-11-23 | Protein feature viewer |
| [opentargets/platform-webapp](https://github.com/opentargets/platform-webapp) | 13 | Apache-2.0 | 2026-11-25 | Open Targets Platform front end |
| [VariantEffect/mavedb-ui](https://github.com/VariantEffect/mavedb-ui) | 4 | AGPL-3.0 | 2026-11-25 | MaveDB front end |

### Inferences
- **Integrate:** Mol* with MolViewSpec as the scene format (and as the vocabulary an agent emits); nightingale for sequence/feature tracks; Embedding Atlas or regl-scatterplot for the map layer; sigma.js or cosmos.gl if the graph grows beyond what a force-directed canvas handles; official MCP servers (Open Targets, InterPro, STRING) as data tools.
- **Learn from, do not depend on:** deepscatter's tiled loading idea (licence is non-commercial and it is stale); tldraw's canvas interactions (licence restricts production use); PlayMolecule's architecture and published failure modes; ChimeraX's candid assessment of when an assistant helps.
- **Attention signal:** by stars, the centre of gravity is agent tooling (58k for a skills library, 9.7k for paper QA, 5k for a generic embedding viewer) rather than protein-specific explorers (19 and 49 stars) or LLM-controlled viewers (376, 97, 69 and 17). A project that publishes a reusable component in the high-attention category (for example, a MolViewSpec-emitting skill or MCP tool) is more likely to be adopted than another stand-alone explorer.
- **Caveat on that signal:** the front ends of heavily used institutional sites also have almost no stars (Open Targets web app 13, MaveDB UI 4, gnomAD browser 92), so a low count shows a lack of developer attention, not a lack of users. For a portfolio project, however, developer attention is part of the goal, so the signal still matters.
- Community "talk to PyMOL" bridges tend to be abandoned quickly (one was created and last touched on the same day; another has been idle since April 2025), which suggests the idea is easy to demo and hard to make durable.
- For any canvas or pinboard feature, permissively licensed options exist (Excalidraw and React Flow are MIT), so the licence restriction on tldraw is avoidable.
- GPL-3.0 and AGPL-3.0 components (Foldseek, MolecularNodes, the MaveDB front end) are fine as offline pipeline tools or references but should not be linked into a permissively licensed web app.

### Gaps
- Stars measure attention, not use; no download or deployment figures were collected.
- "Unclassified" licences were not individually read (3Dmol.js, nglview, iCn3D, py2Dmol, Biohub/esm, proteinpaint); check each before integrating.
- Notebook widgets beyond nglview, py2Dmol and ipymolstar, and biology MCP servers beyond those listed, were not swept (search unavailable).

---

## 6. Community sentiment: pain points and reception of comparable launches

### Takeaway
The reachable evidence says protein-visualisation launches get little attention outside the field: on Hacker News since 2024, stand-alone protein viewers scored between 2 and 32 points, the ESM "world model" launch scored 3, and the only protein-themed hits were a game (88 points) and model implementations. Practitioners' recurring concerns about AI assistants are accuracy, reproducibility and whether the assistant is faster than doing it by hand. Reddit, Biostars, X and Bluesky could not be read, so this picture is partial.

### Cited Findings

**Hacker News, "Show HN" posts mentioning protein, Jan 2024 – Nov 2026** ([V], from the site's search API and the threads themselves — [API query](https://hn.algolia.com/api/v1/search?query=protein&tags=show_hn&numericFilters=created_at_i%3E1704067200&hitsPerPage=50))
- Open-source AlphaFold 3 implementation: 314 points, 37 comments (Sep 2024) — [thread](https://news.ycombinator.com/item?id=41448439).
- GeneGuessr daily protein puzzle: 88 points, 20 comments (Dec 2025) — [thread](https://news.ycombinator.com/item?id=46363870).
- Interactive atlas of 8.5M research papers (adjacent): 85 points, 28 comments (Jul 2026) — [thread](https://news.ycombinator.com/item?id=48840207).
- Open-source protein and ligand viewer (desktop, Rust): 32 points, 13 comments (May 2025) — [thread](https://news.ycombinator.com/item?id=44072929).
- Other protein viewers and tools: a Rust visualisation engine (4 and 2 points), structures as pixel art (4), terminal viewers (2), in-browser drug screening (3), browser ML tools (2), a contact-conservation explorer over 70k structures (1), a protein-design API service (1), a compound-target predictor (1) — [API query](https://hn.algolia.com/api/v1/search?query=protein&tags=show_hn&numericFilters=created_at_i%3E1704067200&hitsPerPage=50).
- Protein folding on a laptop: 11 points; a protein-language-model release: 11 points — [API query](https://hn.algolia.com/api/v1/search?query=protein&tags=show_hn&numericFilters=created_at_i%3E1704067200&hitsPerPage=50).

**What commenters said**
- [V] On the desktop viewer: thanks for building something they considered badly needed; the requests were for plugin and scripting support (cited as the reason PyMOL stays dominant), docking integration, standard mouse controls and colouring conventions; a structural biologist could not rotate the model or open a local file — [thread](https://news.ycombinator.com/item?id=44072929).
- [V] On the paper atlas: fun to explore, but several could not name a use beyond looking good; requests were for filtering by search term, author and institution; a commenter warned that layout tuning is endless; the creator agreed the map was the least important component — [thread](https://news.ycombinator.com/item?id=48840207).
- [V] On GeneGuessr: admired for polish; too hard even for biologists; requests for easier modes, sequence display, confidence shading and candidate sorting — [thread](https://news.ycombinator.com/item?id=46363870).
- [V] The ESM world-model launch (6.8B-protein atlas) drew 3 and 2 points with no comments — [API result](https://hn.algolia.com/api/v1/search?query=ESM%20protein%20biohub&tags=story&numericFilters=created_at_i%3E1735689600&hitsPerPage=30).

**Practitioner views on AI assistants and agents**
- [V] The ChimeraX maintainer's guidance: natural-language control helps newcomers, works best for specific requests, makes frequent mistakes, forgets them between sessions, and is slower than direct control for experienced users — [UCSF RBVI](https://www.rbvi.ucsf.edu/chimerax/data/claude-dec2025/claude_mcp.html).
- [2nd] Scientists quoted on Kosmos: about one conclusion in five being wrong is too many for unsupervised use; treat it as a colleague's opinion; use but verify; risk of citing unread papers — [analysis](https://rywalker.com/research/kosmos).
- [V] Kosmos's makers themselves say it often pursues irrelevant but statistically significant findings and that they rerun it several times — [Edison](https://edisonscientific.com/news/announcing-kosmos).
- [V] Biomni's GitHub users reported problems from formatting to weak memory across sessions, according to a society review — [AACR](https://www.aacr.org/blog/2026/06/18/eye-on-ai-agentic-ai-brings-bots-to-the-bench/).
- [V] Agents without deterministic retrieval tools gave different answers on identical prompts, enough to change scientific conclusions — [Anthropic research](https://www.anthropic.com/research/agents-in-biology).
- [2nd] A life-science-software analyst argues scientists resist handing over literature review because it is part of their professional identity, and that tools must be an order of magnitude better than spreadsheets and email to be adopted — [Scaling Biotech](https://scalingbiotech.substack.com/p/is-it-an-ai-scientist-or-a-potato).
- [S] A PhD student on r/bioinformatics (Apr 2025) found a hosted modelling platform's free tier usable but too limited for the analyses needed — [Reddit thread via search](https://redlib.cypherpunktools.com/r/bioinformatics/comments/1jql76a/seeking_user_experiences_with_neurosnap_is_the).

**Signals from the tool builders about what users want**
- [V] ProtVar: users want to browse, not only look up — [EMBL-EBI](https://www.ebi.ac.uk/about/news/announcements/protvar-update-a-discovery-engine-for-genetic-missense-variation/).
- [V] PDBe: user feedback led to putting the 3D viewer first, easier interpretation and letting researchers add their own data — [EMBL-EBI](https://www.ebi.ac.uk/about/news/updates-from-data-resources/pdbe-entry-pages).
- [V] ProteinCartography's publication has no reader comments — [Arcadia pub](https://thestacks.org/publications/resource-protein-cartography).
- [V] Privacy is a live issue for hosted chat: cBioPortal's assistant stores conversations indefinitely and requires sign-in — [cBioPortal docs](https://docs.cbioportal.org/ai-integrations/chat-interface/).

### Inferences
- What got attention: things people can use immediately without domain knowledge (a game), things that confer capability (run AlphaFold 3 yourself), and broad "map of everything" visualisations — the last with the caveat that interest was shallow.
- What was ignored: yet another viewer; anything requiring the visitor to already care about a specific protein; institutional launches with no hands-on hook.
- Expert users judge viewers by extensibility and workflow fit, and they will not switch from PyMOL/ChimeraX for a web toy. Targeting them as primary users is a losing position; treating them as occasional sharers of links and stories is more realistic.
- For AI features the bar users set is verifiability and being faster than the manual route; a guide that shows its evidence and manipulates the view for a newcomer fits the one niche where practitioners agree assistants help (onboarding).

### Gaps
- Reddit (r/bioinformatics and others), Biostars, X and Bluesky could not be searched or fetched; the single Reddit item above is from a search summary. Sentiment on UniProt, AlphaFold DB, RCSB and STRING interfaces specifically was not found.
- Hacker News coverage is limited to one keyword query ("protein", Show HN) plus one query on the ESM launch; threads on AlphaFold DB, Claude Science, Biomni or "chat with a protein" launches were not retrieved.
- No evidence was collected on reception among students or educators.

---

## 7. Adjacent-domain interaction ideas not yet applied to protein exploration

### Takeaway
The pieces for map-style semantic zoom, story playback, session forking and versioned knowledge all exist in adjacent tools or in the protein databases' own archives, but no protein explorer combines them; multiplayer and infinite-canvas research boards are absent from the field entirely. Several are cheap for one developer (static tiles, a declarative scene/command log, a free-tier real-time relay); others carry licensing or demand risk.

### Cited Findings

**Map-style semantic zoom**
- [V] Tiled, level-of-detail loading for point maps is proven beyond a billion points (quadtree tiles in Arrow format, only tiles for the current view are fetched), and a million-point map can be hosted as static files — [deepscatter](https://github.com/nomic-ai/deepscatter).
- [V] Density contours plus automatic cluster labels that change with zoom are available off the shelf under MIT, with WebGPU rendering of a few million points — [Embedding Atlas](https://apple.github.io/embedding-atlas/).
- [V] In molecular graphics, level-of-detail rendering already spans atoms to whole organelles — [Mesoscale Explorer](https://molstar.org/me/), [molstar.org](https://molstar.org/).
- [V] The 300th Molecule of the Month story uses level-of-detail settings within a narrative — [Making of MoM 300](https://molstar.org/mol-view-stories/docs/example-stories/making-of-mom300.html).

**Multiplayer (shared cursors and views)**
- [V, absence in the pages read] None of the pages read for the public protein tools in section 1 documents live multi-user sessions; the closest "collaboration" features found are in literature and agent products (a paid tier with live collaboration; a commercial workspace described as collaborative) — [Elicit pricing](https://elicit.com/pricing), [Phylo](https://phylo.bio/).
- [V] A real-time relay can run on a free tier: SQLite-backed Durable Objects on the Workers Free plan allow 100,000 requests and 13,000 GB-seconds per day; the paid plan has a $5/month minimum — [Cloudflare pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/).

**Spatial research boards and infinite canvases**
- [V] The leading canvas SDK is source-available rather than open source: development use is free, production use requires a trial or commercial licence key enforced in the software — [tldraw licence](https://raw.githubusercontent.com/tldraw/tldraw/main/LICENSE.md).
- [V] It has 51,587 stars, so the interaction vocabulary (pan, zoom, arrange, annotate) is widely understood — [GitHub](https://github.com/tldraw/tldraw).
- [V] Permissively licensed alternatives are larger still: Excalidraw (MIT, 136,294 stars) and React Flow (MIT, 39,153 stars) — [Excalidraw](https://github.com/excalidraw/excalidraw), [xyflow](https://github.com/xyflow/xyflow).
- [V] Building blocks for shared state and for session recording are mature and open: Yjs (23,112 stars), Automerge (MIT, 6,755), rrweb (MIT, 20,505); a scroll-driven storytelling helper is MIT with 6,013 stars — [Yjs](https://github.com/yjs/yjs), [Automerge](https://github.com/automerge/automerge), [rrweb](https://github.com/rrweb-io/rrweb), [scrollama](https://github.com/russellsamora/scrollama).

**Scrollytelling and guided stories**
- [V] MolViewStories already provides scene-by-scene molecular stories with text-triggered camera moves and offline HTML export; authoring is by code — [core features](https://molstar.org/mol-view-stories/docs/core-features.html).

**Replayable and forkable agent sessions**
- [V] Session forking, and figures that carry their generating code, environment and message history, shipped in a general science workbench in 2026 — [Claude Science](https://www.anthropic.com/news/claude-science-ai-workbench).
- [V] Report conclusions traceable to code or literature — [Kosmos](https://edisonscientific.com/news/announcing-kosmos); numbers verified against cited table cells and downloadable studies — [HPA AtlasAI](https://www.proteinatlas.org/learn/ai).
- [V] A declarative, viewer-independent state that reproduces a molecular scene exists and supports multiple states and animations — [MolViewSpec](https://molstar.org/mol-view-spec-docs/).
- [V] Sharable deep links to individual widgets and preserved filter state arrived in Open Targets in 2026 — [release notes](https://platform-docs.opentargets.org/release-notes).

**"Time machine" views of how knowledge changed**
- [V] The raw material exists: UniProt stores 316 dated versions of the p53 entry going back to 1988 — [UniSave](https://rest.uniprot.org/unisave/P04637?format=json); AlphaFold DB publishes counts of models added, removed and changed between versions — [EBI release notes](https://www.ebi.ac.uk/pdbe/news/alphafold-database-release-notes); STRING lists every version since 2003 with protein and interaction counts — [STRING versions](https://string-db.org/cgi/access?footer_active_subpage=whatsnew); HPA documents each release — [HPA releases](https://www.proteinatlas.org/about/releases).
- [S] Archived versions of the HPA site remain online at versioned addresses — [HPA v19 mirror](https://v19.proteinatlas.org/news/2025-11-11/a-new-version-25-of-the-human-protein-atlas-has-been-released-at-the-hupo-meeting-in-toronto-canada).

**Agents driving a visual tool through a protocol**
- [V] A general embedding viewer exposes its interface to agents over MCP — [Embedding Atlas](https://apple.github.io/embedding-atlas/); a desktop molecular viewer does the same — [ChimeraX](https://www.rbvi.ucsf.edu/chimerax/data/claude-dec2025/claude_mcp.html); Biohub's MCP server lets external assistants view 3D structures — [Biohub docs](https://docs.biohub.ai/).
- [V] In the 77-server biomedical MCP registry, viewer control exists only for PyMOL and a microscopy viewer; no entry targets the web viewer Mol* or its scene format — [registry p2](https://biocontext.ai/registry?page=2) (other pages checked: [p1](https://biocontext.ai/registry), [p3](https://biocontext.ai/registry?page=3), [p4](https://biocontext.ai/registry?page=4), [p5](https://biocontext.ai/registry?page=5)).

**Immersive viewing**
- [V] AR/VR is already in Mol* on RCSB.org — [PDB-101 news](https://pdb101.rcsb.org/news/69d516bd6c4fcd38cafe9461).

### Inferences
- **Semantic zoom** is the best fit for the existing "universe" concept and is cheap: about 20,000 human protein-coding genes (the Human Protein Atlas lists structures for about 84,000 isoforms) is far below the scale where tiling is even necessary, so effort can go into what each zoom level *means* (proteome → neighbourhood → protein → domain → residue/variant) rather than into rendering.
- **Replayable sessions** are the idea with the most leverage for a zero-budget public app: if the guide's output is a typed command log, a finished session is a static file that can be replayed, shared, forked and embedded with no model call. That converts LLM spend from per-visitor to per-story, which is what makes "free without login" compatible with a $20/month budget.
- **Time-machine views** are novel in this field — I found the data but no interface — and are tractable for a bounded set (human proteome, a few data sources). Value is highest for teaching ("what did we know about this protein in 2005 versus now?") and for showing uncertainty.
- **Multiplayer** is technically cheap but I found no evidence of demand in this domain; it is a classroom or journal-club feature at best and should follow, not lead.
- **Infinite-canvas boards** risk scope creep into a general research tool (and, with one popular SDK, a licensing dependency that MIT-licensed alternatives avoid); a constrained "pinboard" of saved views built on the app's own state is safer.
- **Agent-drivable UI over MCP** inverts the cost problem: the visitor's own assistant drives the atlas. Precedents exist for desktop and generic viewers; I found no web protein explorer that exposes its *interface state* (as opposed to its data) this way, though Biohub's MCP comes close.
- **AR/VR** is already served by the incumbent viewer and is not a differentiator.

### Gaps
- Observable's canvas product could not be read (rate-limited), so its interaction model, launch date and pricing are unverified.
- No protein- or genome-specific precedent for multiplayer exploration was found; absence was checked only against the tools in section 1 and may miss smaller projects.
- Whether Biohub's MCP renders an interactive structure view inside the assistant or returns files is unverified.
- No user research on whether learners or researchers want replay, forking or history views was found.

---

## 8. White space: feasible differentiators ranked, and attractive ideas that are already served or likely to fail

### Takeaway
The original pitch — a protein universe plus an LLM guide — is no longer distinctive: both halves shipped elsewhere by late 2026, at scales and budgets a solo developer cannot match. The combination that still does not exist is a free, no-login, human-proteome atlas whose AI guide produces *replayable, sourced, editable visual walkthroughs* (a typed command log over map, structure, variant and evidence views) aimed at learners and occasional users; the evidence supports sharpening the idea toward that, and against leading with the map, the chat or the knowledge graph.

### Cited Findings

**Evidence against the current idea as pitched**
- [V] Whole-protein-universe maps exist at 53 million and 6.8 billion proteins, the latter with natural-language search, an agent and an MCP server — [Expasy](https://www.expasy.org/resources/protein-universe-atlas), [Biohub](https://biohub.ai/), [AWS registry](https://registry.opendata.aws/biohub-esm-atlas/).
- [V] A free web app that pairs a chat panel with a Mol* viewer and has the model manipulate the view has existed since October 2025 — [arXiv](https://arxiv.org/html/2510.17826v1).
- [V] Incumbent databases added their own assistants and agent endpoints during 2026 — [HPA](https://www.proteinatlas.org/learn/ai), [cBioPortal](https://docs.cbioportal.org/news/), [InterPro](https://www.ebi.ac.uk/about/news/updates-from-data-resources/interpro-110-0-and-interproscan-6-a-re-engineered-pipeline-and-ai-ready-access-to-the-protein-universe/), [ProtVar](https://www.ebi.ac.uk/about/news/announcements/protvar-update-a-discovery-engine-for-genetic-missense-variation/), [Open Targets](https://blog.opentargets.org/official-open-targets-mcp/), [STRING](https://string-db.org/), [Biohub](https://biohub.ai/).
- [V] Free, open skills give any coding agent access to the same databases (58k-star library; Google's and OpenAI's free plugins) — [K-Dense](https://github.com/K-Dense-AI/scientific-agent-skills), [Google](https://github.com/google-deepmind/science-skills), [OpenAI](https://openai.com/index/introducing-gpt-rosalind/).
- [V] Comparable explorers attracted little following (19 and 49 stars; zero comments; one no longer updated) and comparable launches little attention (2–32 points for viewers; 3 for the ESM atlas) — [ProtSpace](https://github.com/tsenoner/protspace), [ProteinCartography](https://thestacks.org/publications/resource-protein-cartography), [HN query](https://hn.algolia.com/api/v1/search?query=protein&tags=show_hn&numericFilters=created_at_i%3E1704067200&hitsPerPage=50).
- [V] Viewer experts ask for plugins, scripting and docking, and their own tool's maintainer says assistants are slower than experts — [HN thread](https://news.ycombinator.com/item?id=44072929), [UCSF RBVI](https://www.rbvi.ucsf.edu/chimerax/data/claude-dec2025/claude_mcp.html).
- [V] Knowledge graphs linking targets, diseases and drugs are a mature, institutionally maintained category — [Open Targets](https://platform-docs.opentargets.org/release-notes), [STRING](https://string-db.org/), [PrimeKG](https://github.com/mims-harvard/PrimeKG).

**Evidence that specific combinations are missing**
- [V] Incumbent assistants return text, tables or links rather than a reusable visual sequence (cBioPortal's is explicit about links; AtlasAI is a sidebar producing analyses and downloads) — [cBioPortal docs](https://docs.cbioportal.org/ai-integrations/chat-interface/), [HPA](https://www.proteinatlas.org/learn/ai).
- [V] The story format exists but is hand-coded, with four official examples, and its maintainers have no agent layer — [MolViewStories examples](https://molstar.org/mol-view-stories/docs/example-stories/index.html), [molstar repositories](https://github.com/orgs/molstar/repositories).
- [V] The community MCP registry (77 servers) has no server for Mol* or MolViewSpec; viewer control is limited to PyMOL and a microscopy viewer — [BioContextAI registry](https://biocontext.ai/registry?page=2).
- [V] The one LLM-driven web viewer drives the view with free-form generated code and reports load failures, missing functions and numbering mismatches — [arXiv](https://arxiv.org/html/2510.17826v1).
- [V] The strongest agent products are paid, gated or sign-in-only — [Anthropic](https://www.anthropic.com/news/claude-science-ai-workbench), [OpenAI](https://openai.com/index/introducing-gpt-rosalind/), [Edison](https://edisonscientific.com/news/announcing-kosmos), [cBioPortal docs](https://docs.cbioportal.org/ai-integrations/chat-interface/).
- [V] Version histories exist as data, with no visual interface found in the pages read — [UniSave](https://rest.uniprot.org/unisave/P04637?format=json), [AFDB version deltas](https://www.ebi.ac.uk/pdbe/news/alphafold-database-release-notes), [STRING versions](https://string-db.org/cgi/access?footer_active_subpage=whatsnew), [HPA releases](https://www.proteinatlas.org/about/releases).
- [V] Playful protein content reached a general technical audience but was judged too hard for non-specialists — [HN thread](https://news.ycombinator.com/item?id=46363870).
- [V] Deterministic tool layers make agent output reliable and reduce dependence on the model used — [Anthropic research](https://www.anthropic.com/research/agents-in-biology).

### Inferences

**Ranked differentiators (value × defensibility × feasibility for one developer on ≤$20/month).** These rankings are my judgement from the evidence above.

1. **Replayable, sourced "guided explorations" as the core artifact.** The guide's typed interface commands become a saved, shareable, forkable walkthrough (camera, highlights, overlays, evidence cards), exportable to MolViewSpec so it also plays in Mol*. *Value:* high for students, educators and anyone explaining a protein; matches the one niche where practitioners say assistants help. *Why nobody has it:* assistants elsewhere emit prose or links; the story tool requires hand-coding; the LLM-driven viewer uses unreplayable free-form code. *Defensibility:* medium — the format is copyable, but a growing library of vetted walkthroughs plus an editor is a content moat, and compatibility with the standard viewer makes it a contribution rather than a silo. *Feasibility:* high — the project already has the command channel; playback costs nothing to serve.
2. **A human-proteome atlas with meaningful semantic zoom.** One organism, about 20,000 proteins, every zoom level defined (proteome neighbourhoods → protein → domains → residues and variants), with trustworthy overlays (model confidence, variant effect scores, disease and drug evidence, localisation). *Value:* medium-high as orientation and as the stage for item 1. *Why nobody has it:* existing maps are universe-scale cluster views or per-family scatter plots without curated biomedical overlays. *Defensibility:* low-medium (design craft, not data). *Feasibility:* high as static pre-computed assets. *Caution:* treat as navigation; explain what proximity means.
3. **"Bring your own assistant": expose the atlas's interface as agent tools.** Let a visitor's own assistant drive the same typed commands. *Value:* medium (rides the strongest attention trend; removes LLM cost). *Novelty:* partial — precedents for desktop and generic viewers and for Biohub's data; none found for a web protein explorer's interface state. *Defensibility:* low alone, but it makes item 1's command vocabulary a reusable, adoptable component. *Feasibility:* medium (needs a small relay between browser session and assistant).
4. **Time-machine view of a protein.** Scrub through how annotations, structures and interaction evidence accumulated. *Value:* medium, strongest for teaching and for conveying uncertainty. *Novelty:* high (no interface found). *Defensibility:* medium (data wrangling is tedious). *Feasibility:* medium for a bounded protein set; not for all sources.
5. **Evidence-first answer design** (every sentence tied to a record; deterministic tools before prose). *Value:* high but it is now table stakes — the incumbents advertise it. Necessary, not differentiating.
6. **Layperson-calibrated play** (daily puzzle or challenges that teach). *Value:* attention and onboarding. *Evidence:* the one protein launch that travelled. *Defensibility:* low. *Feasibility:* high. A side door, not the product.
7. **Shared sessions** (classroom or journal club). Cheap to build on a free tier; no demand evidence. Defer.

**Combinations I could not find in any existing tool (stated plainly):**
- Free + no login + AI-authored + *replayable visual walkthrough* over real structures and evidence.
- Single-organism proteome map + continuous zoom to residue/variant + curated disease/drug overlays in one surface.
- A typed, validated UI-command vocabulary for molecular exploration that is also an open scene format (MolViewSpec-compatible) and agent-callable.
- Version-history ("what changed, and when") views across UniProt, AlphaFold DB and interaction evidence.
- Any protein explorer designed first for learners rather than specialists, with an assistant.

**Attractive but already well served or likely to fail:**
- **A universe-scale map of all proteins** — done at 6.8 billion with institutional backing; little public interest; sustainability failures on record.
- **Generic "chat with protein databases"** — commoditised by official assistants, MCP servers and free skills.
- **An autonomous AI scientist / research agent** — heavily funded field; accuracy complaints even for the leaders.
- **Hosted structure prediction or design** — free tiers exist at several platforms and a free no-account folding app; compute does not fit the budget.
- **Replacing desktop viewers for experts** — they want plugins, scripting and docking.
- **A bigger knowledge graph as the headline** — institutional resources dominate; a graph is useful only in service of a question.
- **Natural-language control of a viewer as the headline** — exists, modest adoption, experts find it slower.
- **Variant-to-structure lookup for clinicians and researchers** — ProtVar, Open Targets' missense viewer and DECIPHER cover it with authority.
- **AR/VR** — already in the standard viewer.
- **An infinite-canvas research board** — no domain precedent and high scope risk (licensing is avoidable with MIT-licensed canvases).

**Honest overall read.** The evidence does not support "this has not been done"; it supports "the two headline halves have been done, mostly for experts, mostly behind accounts, and mostly as text". The defensible position is narrower and more educational than the current pitch: the atlas is the stage, the replayable walkthrough is the product, the open command/scene format is the reusable contribution, and researchers are secondary users who share links rather than primary users who switch tools. Risks that remain even then: incumbents are moving toward approachability (infographics, browse-first redesigns, assistants), a frontier workbench could add shareable walkthroughs quickly, and I found no direct evidence of demand from students or educators — that would need testing before committing.

### Gaps
- Absence claims ("nobody offers X") rest on the tools and repositories I could open; with search cut off part-way, smaller or newer projects may exist. The claims most at risk: no web protein explorer exposing its UI over MCP; no version-history interface; no agent layer for MolViewSpec. The last is supported by two direct checks (the Mol* GitHub organisation and all five pages of the 77-server community MCP registry) but unregistered third-party projects could exist.
- No demand-side evidence (interviews, surveys, usage data) for learners, educators or curious engineers was found; the ranking weighs supply-side gaps and scattered reception signals.
- Feasibility judgements about hosting and LLM cost are outside this note's scope and are asserted only at the level supported by the cited free-tier and licence facts.
- Hands-on comparison of interaction quality against AtlasAI, the ESM Atlas explorer and PlayMolecule was not possible in this session and should be done by a person before the design is fixed.
