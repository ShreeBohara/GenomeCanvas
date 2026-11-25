# Open biomedical data sources and knowledge graphs for a human-proteome-scale protein exploration app (state as of 2026-11-25)

Scope note: research was capped at roughly 35 tool calls against a very wide brief. Resources not listed under Cited Findings were NOT verified this session and are listed under Gaps. Items in Gaps marked "background recollection" come from model training knowledge, are unverified, and must be checked on the resource's own licence page before being relied on. Many primary pages (UniProt, PubTator3, AFDB API docs) are JavaScript apps that returned no usable text to the fetch tool.

## 1. AlphaFold Protein Structure Database (AFDB)

### Takeaway
AFDB v6 (21 Oct 2025, synced to UniProt 2025_03) holds 241,070,489 predicted structures, is CC BY 4.0 for academic and commercial use, and in 2026 gained predicted protein complexes (March 2026 homodimers, May 2026 heterodimers, October 2026 viral complexes). The v6 API has a field sunset date of 25 June 2026 (already passed), so any code written against old fields must use the new ones.

### Cited Findings
- AFDB v6 was released 21 Oct 2025, synced to UniProt 2025_03: 241,070,489 predicted structures, including 40,054 isoforms (v4 had 214,683,829). v4 to v6: 65,711,653 files added, 39,324,993 removed, 276,539 changed (sequence changed), 175,082,297 unchanged (metadata updated, coordinates carried over). Per-accession lists are `diffs.ndjson.gz` and `Accession_ids.csv` on the FTP site. — [EMBL-EBI PDBe AFDB release notes](https://www.ebi.ac.uk/pdbe/news/alphafold-database-release-notes)
- API: a 9-month dual-support period with old and new prediction API fields; sunset of the old fields on 25-06-2026. New entry URL format `alphafold.com/entry/AF-[UniProt ID]-F1`; older versions remain on the FTP site. MSAs are on individual entry pages; bulk access not currently planned. — [EMBL-EBI PDBe AFDB release notes](https://www.ebi.ac.uk/pdbe/news/alphafold-database-release-notes)
- Bulk downloads: per-species .tar archives (each bundling gzipped PDB or mmCIF) for 48 organisms, global-health proteomes listed separately, and Swiss-Prot compressed prediction files; FTP root is https://ftp.ebi.ac.uk/pub/databases/alphafold. — [AFDB download page](https://alphafold.ebi.ac.uk/download)
- Proteins longer than 2,700 aa are split into overlapping 1,400 aa fragments and appear only in the human proteome archives. — [AFDB download page](https://alphafold.ebi.ac.uk/download)
- Licence, quoted: "Data is available for academic and commercial use, under a CC-BY-4.0 licence." AlphaMissense data requires its own citation; predictions are not validated for clinical use. — [AFDB download page](https://alphafold.ebi.ac.uk/download)
- Complexes: March 2026 release (EMBL-EBI, Google DeepMind, NVIDIA, Seoul National University) added 1.7 million high-confidence homodimer predictions out of 30 million complexes calculated; a preprint cites 1,754,242 high-confidence complexes for bulk download. — [Web search summary of EMBL-EBI/EMBL press items](https://www.ebi.ac.uk/about/news/tag/fair-data) and [EMBL news](https://www.embl.org/news/?p=78875)
- 19 May 2026: almost 80,000 high-confidence heterodimer predictions added. 9 Oct 2026: viral protein complexes added; the database is described as covering more than 260 million predicted protein and complex structures. — [Univ. of Glasgow CVR notice](https://www.gla.ac.uk/research/az/cvr/engage/news/headline_1296637_en.html)
- The AFDB download page lists Fleming et al. 2025 (new data and capabilities for AlphaFold DB and 3D-Beacons) as the citation. — [AFDB download page](https://alphafold.ebi.ac.uk/download)

### Inferences
- The 241M figure (v6) and the "260M+" figure (after complexes and viral additions) are different scopes, not a conflict.
- For a human-proteome app (~20k UniProt reviewed human entries, plus fragments for >2,700 aa proteins) the human proteome tar from FTP is the practical source; cluster representatives in the millions would need the separate cluster data (see Gaps).
- AFDB's CC BY 4.0 permits republishing derived datasets (e.g. per-residue pLDDT, CA traces) with attribution.

### Gaps
- Exact FTP file sizes for the human proteome tar, the per-file naming for v6, and the PAE/pLDDT JSON sizes: the download tables were empty in the fetched copy.
- API endpoint list and any rate limit: `/api-docs` returned only navigation text. Background recollection (unverified): `https://alphafold.ebi.ac.uk/api/prediction/{uniprot}` and an `api/annotations` AlphaMissense endpoint; no published hard rate limit.
- Foldcomp-compressed AFDB (background recollection: foldcomp databases for AFDB Swiss-Prot / proteomes / clusters hosted by Steinegger lab): not verified.
- AFDB cluster representatives (~2.3M, Barrio-Hernandez et al. 2023) and whether v6 changed them: not verified.
- Official AFDB-complexes file format, ipTM threshold, and licence of the complexes data (assumed CC BY 4.0, not confirmed).
- No single official 2026 changelog was found; counts come from press releases and a preprint.

## 2. UniProt

### Takeaway
UniProtKB/Swiss-Prot release 2026_04 has 576,073 entries (up 332 from 2026_03); the human reviewed count was not retrieved. Licence and REST/embedding details could not be fetched from uniprot.org (JS app).

### Cited Findings
- Expasy statistics for release 2026_04: 576,073 Swiss-Prot sequence entries, 209,202,719 amino acids, 14,947 species; 332 entries added since 2026_03. — [Expasy Swiss-Prot release statistics](https://web.expasy.org/docs/relnotes/relstat.html)
- Release 2026_01 listed 574,627 Swiss-Prot entries. — [DDBJ mirror of UniProt relnotes](https://ddbj.nig.ac.jp/public/mirror_database/uniprot/relnotes.txt)
- UniProt is also available on AWS Open Data. — [AWS Registry of Open Data: UniProt](https://registry.opendata.aws/uniprot/)

### Inferences
- Swiss-Prot grows roughly 300 entries per release; the "~570k" in the brief is stale by a few thousand.

### Gaps
- Reviewed human count (background recollection: ~20.4k, unverified), TrEMBL count, release date of 2026_04, release cadence (background recollection: 8 weeks, unverified).
- UniProt licence text (background recollection: CC BY 4.0, unverified), REST API rate limits, ID-mapping limits, and precomputed per-protein/per-residue embeddings downloads (background recollection: ProtT5 embeddings on the downloads page, unverified): uniprot.org pages returned only a fallback message.

## 3. Open Targets Platform

### Takeaway
Latest release is 26.09 (24 Sept 2026). Data are CC0 1.0, Parquet-only, available from EBI FTP, Google Cloud Storage and BigQuery. A documentation MCP server exists; no evidence found for a data-query official MCP.

### Cited Findings
- Release 26.09, 24 Sept 2026: molQTL credible sets +1.2M (3.24M total, incl. GTEx v10); GWAS Catalog +14,690 studies (163,181 total) and +44,859 credible sets; 10,611 new gene-burden records; genetic constraint updated to gnomAD v4.1.1 including chrX/chrY; 220,810 clinical reports; 1,706 duplicate disease terms merged. — [Open Targets release notes](https://platform-docs.opentargets.org/release-notes)
- Breaking changes in 26.09: `tep` removed from target output and API; `probeMinerScore` removed; `hasExpertReview` removed; `knownDrugs` replaced by `drugAndClinicalCandidates` in GraphQL; target dataset split into by-`targetId` datasets; `chemical_probes` renamed `chemical_probe`; 10 A/B columns dropped from interaction datasets. — [Open Targets release notes](https://platform-docs.opentargets.org/release-notes)
- Licence, quoted: "Open Targets Platform is marked with CC0 1.0." Code (pipelines, GraphQL API, React UI) is Apache 2.0. Third-party sources keep their own licences (e.g. CC BY-SA 3.0 for ChEMBL, CC BY 4.0 for Reactome) which the sources have agreed allow unrestricted use by Open Targets users. — [Open Targets licence page](https://platform-docs.opentargets.org/licence)
- Format and paths: Parquet only since 25.03 (no JSON). FTP `https://ftp.ebi.ac.uk/pub/databases/opentargets/platform/<release>/output/<dataset>`, rsync, and `gs://open-targets-data-releases/<release>/output/<dataset>`; BigQuery project `open-targets-prod` (first 1 TB/month free queries). Datasets named include `disease`, `evidence` (partitioned by `sourceId`), `association_by_datasource_direct`. — [Open Targets datasets docs](https://platform-docs.opentargets.org/data-access/datasets) and [search summary of access docs](https://platform-docs.opentargets.org/data-access)
- MCP: the documentation site exposes an MCP server (`https://platform-docs.opentargets.org/~gitbook/mcp`) for searching docs; the 26.03 notes mention an update to "the Open Targets MCP". — [Open Targets datasets docs](https://platform-docs.opentargets.org/data-access/datasets), [release notes](https://platform-docs.opentargets.org/release-notes)

### Inferences
- CC0 on the platform means a merged derived layer is not blocked by Open Targets itself, but rows sourced from ChEMBL (CC BY-SA 3.0) or others inside Open Targets files could still carry upstream terms; the Open Targets statement says those sources agreed to unrestricted use by its users, which is not the same as a legal grant to arbitrary redistributors (my reading; verify per source before relying).
- The `knownDrugs` to `drugAndClinicalCandidates` rename means any 2.0 code written against older schemas must be pinned to a release.

### Gaps
- Total download size of 26.09 (community forum thread exists but was not read), per-dataset sizes, association scoring method details, tractability/safety dataset names in 26.09, GraphQL API rate limits, and whether an official data-query MCP exists (the "Open Targets MCP" mentioned in 26.03 notes was not described in detail).

## 4. Variants (AlphaMissense, ClinVar, gnomAD, mapping tools, MaveDB)

### Takeaway
AlphaMissense predictions are CC BY 4.0 (verified from the repo README), which is more permissive than the CC BY-NC-SA often quoted; the repo was archived in May 2025. gnomAD v4.1.1 (30 March 2026) updated constraint metrics. ClinVar, ProtVar, PDBe-KB and MaveDB licences were not verified.

### Cited Findings
- AlphaMissense licence, quoted: "AlphaMissense predictions are licensed under the Creative Commons Attribution 4.0 International License (CC BY 4.0)"; code is Apache-2.0. Repo archived 16 May 2025, no further maintenance. Predictions for human major transcripts and isoforms are in GCS bucket `dm_alphamissense`. — [AlphaMissense GitHub README](https://github.com/google-deepmind/alphamissense)
- gnomAD v4.1.1 (30 Mar 2026): minor release updating gene constraint metrics (now all coding loci including X and Y, using allele number as coverage proxy; LOEUF moved from frequentist Poisson to Bayesian Gamma posterior), LOFTEE flags, GA4GH VRS IDs; recommends LOEUF < 0.45 for pLoF-constrained genes (replacing v2's 0.35). v4.1 has 730,947 exomes and 76,215 genomes. — [gnomAD v4.1.1 news](https://gnomad.broadinstitute.org/news/2026-03-gnomad-v4-1-1)
- AWS Open Data Registry lists gnomAD licence as MIT with terms of use text (secondary listing; the gnomAD news post itself states no licence). — [AWS registry gnomAD](https://registry.opendata.aws/broad-gnomad/)

### Inferences
- A per-protein summary (e.g. mean/max AlphaMissense pathogenicity per residue, LOEUF per gene) is a small derived table that can ship under CC BY 4.0 with attribution.

### Gaps
- ClinVar terms (NCBI public domain, background recollection, unverified), ProtVar / PDBe-KB / VEP / UniProt variant mapping licences and APIs, MaveDB licence (background recollection: CC0 default per score set, unverified; a search did not confirm), gnomAD's own licence statement (background recollection: CC0 for gnomAD data per its policies page, conflicts with the AWS listing; verify), AlphaMissense file sizes.

## 5. Interactions, pathways, domains, predicted interactomes

### Takeaway
STRING 12.5 (current since 29 Sept 2026) is CC BY 4.0; Reactome (v98, 27 Oct 2026) is CC0 for data; TED has ~365M domains on Zenodo. IntAct, BioGRID, InterPro, CATH, Predictomes, hu.MAP licences were not confirmed.

### Cited Findings
- STRING: current version 12.5 (since 29 Sept 2026); data and download files "freely available under the Creative Commons Attribution 4.0 (CC BY 4.0) license"; credit STRING and note changes; API for "limited or occasional" use, bulk via download page; no numeric rate limit given. — [STRING access page](https://string-db.org/cgi/access)
- Reactome: version 98 released 27 Oct 2026; CC0 applies to annotation files and derived data (identifier mappings, interactions); CC BY 4.0 applies to software and code. — [Reactome licence agreement](https://reactome.org/pages/about/license-agreement/) and [Reactome home](https://www.reactome.org/)
- TED: ~365M putative domains from >214M AFDB v4 sequences (~324M in TED100, ~40M in TED-redundant); v5 on Zenodo, 31 Oct 2024; v3 record marked restricted, v5 open; licence field not read. — [TED Zenodo v5](https://zenodo.org/record/13908086) and [UCL news](https://www.ucl.ac.uk/computer-science/news/2024/nov/ucl-led-research-reveals-new-protein-map-potential-transform-disease-research)
- InterPro releases are public every 8 weeks, one day after each UniProt release; official licence statement not found (a CASRAI guide lists CC BY 4.0, a secondary source); InterProScan is Apache 2.0. — [InterPro 2025 NAR summary](https://tagteam.harvard.edu/hub_feeds/4353/feed_items/14030377), [CASRAI InterPro guide](https://casrai.org/guides/interpro)
- IntAct page fetched shows only an EBI terms-of-use link, no explicit licence. — [IntAct page](https://www.ebi.ac.uk/intact/about/license)

### Inferences
- STRING being CC BY 4.0 (not share-alike or non-commercial) makes a derived human top-N-edges table redistributable under CC BY 4.0 with attribution.

### Gaps
- BioGRID licence (a search claimed build 5.0.263 in Nov 2026; MIT licence not confirmed), IntAct licence (background recollection: CC BY 4.0), CATH, Pfam (folded into InterPro), Predictomes, hu.MAP 3.0, proteome-wide AF-Multimer screens: not researched. STRING human file names and sizes not retrieved.

## 6. Drugs and trials

### Takeaway
ChEMBL 37 (May 2026) is under CC BY-SA 3.0, the main share-alike obstacle to a CC BY 4.0 or CC0 merged dataset. Other drug and trials sources were not verified.

### Cited Findings
- ChEMBL: latest release CHEMBL37, May 2026 (ChEMBL-RDF 37.0 also May 2026); formats SQLite, MySQL, PostgreSQL, SDF, FASTA, and Turtle for RDF; cite release by DOI. — [ChEMBL downloads docs](https://chembl.gitbook.io/chembl-interface-documentation/downloads)
- ChEMBL licence, quoted: "The ChEMBL data is made available on a Creative Commons Attribution-Share Alike 3.0 Unported License." — [ChEMBL about](https://chembl.gitbook.io/chembl-interface-documentation/about)
- DGIdb 5.0 replaced REST endpoints with a central GraphQL API. — [DGIdb 5.0 paper](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10767982/)
- Open Targets lists ChEMBL as CC BY-SA 3.0 within its own CC0 platform. — [Open Targets licence page](https://platform-docs.opentargets.org/licence)

### Inferences
- Share-alike (SA) implications of ChEMBL for a derived dataset: adapted material must be released under the same or a compatible licence (CC BY-SA 3.0 or later compatible). A merged table that incorporates ChEMBL rows cannot be CC BY 4.0 or CC0 as a whole. This is my reading of the licence; a legal check is advisable. The usual solution is to keep ChEMBL-derived tables in a separate layer under CC BY-SA, or download at build time.

### Gaps
- ChEMBL record counts, DrugCentral, DGIdb (licence), BindingDB (licence; background recollection: CC BY, but conflicting reports of CC BY-SA, unverified), ClinicalTrials.gov API v2 limits and terms, openFDA terms.

## 7. Gene-disease evidence and ontologies

### Takeaway
DisGeNET is CC BY-NC-SA 4.0 per its legal page and needs a commercial licence for any product use; it should be excluded from the open dataset. Open Targets (CC0) is the practical replacement.

### Cited Findings
- DisGeNET legal page states the database is under CC BY-NC-SA 4.0; intended only for academic, non-commercial research and education; commercial use (even a free product) needs a commercial licence; version number must be displayed when incorporated; downloads need a free account; the archived SQLite listed is "2020 - v7.0". No 2026 licence change found. — [DisGeNET legal notices](https://www.disgenet.org/legal), [DisGeNET FAQ on commercial use](https://support.disgenet.com/support/solutions/articles/202000087487-do-i-need-a-commercial-license-can-i-use-disgenet-data-in-my-product-), [downloads](https://www.disgenet.org/downloads)
- Open Targets 26.09 includes GWAS Catalog (163,181 studies), gene-burden evidence and clinical reports under its CC0 umbrella. — [Open Targets release notes](https://platform-docs.opentargets.org/release-notes)
- Every Cure lists Monarch Initiative as BSD-3-Clause in its sources table. — [Every Cure knowledge sources](https://docs.dev.everycure.org/releases/knowledge_sources/)

### Inferences
- Because Open Targets re-exposes EVA/ClinVar, GWAS Catalog, Orphanet etc. as CC0-marked data, it is the lowest-friction single source for gene-disease evidence.

### Gaps
- OMIM restrictions (background recollection: licence required for redistribution, unverified), HPO, Orphanet (background recollection: CC BY 4.0), ClinGen, MONDO (background recollection: CC BY 4.0), EFO (Apache 2.0): not verified.

## 8. Expression, localisation, essentiality

### Takeaway
HPA v25 (Nov 2025) and v25.1 (28 May 2026) exist; HPA licence is CC BY 4.0 per the licence page as fetched (twice), but a search snippet claimed CC BY-SA 4.0 and Open Targets lists CC BY-SA 3.0. Conflict is unresolved; verify before relying.

### Cited Findings
- HPA licence page as fetched: "The Human Protein Atlas is licensed under the Creative Commons Attribution 4.0 International License", no ShareAlike mentioned; third-party data may carry separate terms (e.g. AlphaFold 3 CC BY-NC-SA 4.0 and ProteinTalks-DB non-commercial). — [HPA licence page](https://www.proteinatlas.org/about/licence)
- Contradicting claims: a search summary of the same page said CC BY-SA 4.0; Open Targets lists HPA as CC BY-SA 3.0. — [Open Targets licence page](https://platform-docs.opentargets.org/licence)
- HPA v25 launched Nov 2025 at HUPO Toronto, covering all human protein-coding genes; v25.1 announced 28 May 2026 with first MS-based proteomic map at cell-type resolution. — [SciLifeLab news](https://www.scilifelab.se/news/human-protein-atlas-unveils-version-25-at-hupo-2025-in-toronto/)
- Open Targets lists GTEx as CC-BY 4.0 and DepMap as available for commercial use (secondary). — [Open Targets licence page](https://platform-docs.opentargets.org/licence)
- DepMap announced a 26Q1 release. — [DepMap forum](https://forum.depmap.org/t/announcing-the-26q1-release/4606)

### Gaps
- CELLxGENE Census licence (background recollection: CC BY 4.0 for most datasets, some CC0), GTEx and DepMap primary licence pages, HPA download file sizes: not verified. HPA licence conflict above.

## 9. Understudied proteins (Pharos / TCRD)

### Takeaway
Pharos 3.19.10 and TCRD 6.13.5 are current on the Pharos about page; TDL classes Tclin/Tchem/Tbio/Tdark persist. No explicit licence was found for Pharos itself; it defers to primary-source licences.

### Cited Findings
- Pharos version 3.19.10, TCRD 6.13.5; full SQL database downloadable (TCRD from UNM download page); CSV exports from list pages; data "publicly available from the primary sources" and users should respect their licences. — [Pharos about](https://pharos.nih.gov/about)
- Tdark was about 31% of manually curated human UniProt proteins at the time of the update paper; TDL has four levels. — [TCRD/Pharos NAR update (PMC9825581)](https://pmc.ncbi.nlm.nih.gov/articles/PMC9825581)

### Inferences
- A per-protein TDL label is a small fact but TCRD aggregates third-party sources; republishing only the TDL column plus attribution is low-risk, whole TCRD tables are not clearly clear (my judgment).

### Gaps
- Pharos/TCRD licence statement, release date, current Tdark count, "unknome" resource: not found.

## 10. Literature

### Takeaway
PubTator3 licence/limits and bulk terms not confirmed. OpenAlex is CC0 (per tool description) and was available as an MCP in this session.

### Cited Findings
- PubTator 3.0 downloads new articles weekly from the BioC PubMed API; NCBI E-utilities limit is 3 rps (10 rps with an API key). — [PubTator 3.0 paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC11223843), [NCBI E-utilities key page](https://eutilities.github.io/site/API_Key/usageandkey)
- Legacy PMC FTP service had a transition period Feb-Aug 2026 and decommissioning in August 2026 per a CRAN package note (secondary); PMC states only listed services may be used for bulk retrieval. — [PMC OAI page](https://pmc.ncbi.nlm.nih.gov/tools/oai), [CRAN puremoe news](https://cran.r-project.org/web/packages/puremoe/news/news.html)
- An unofficial mirror claims PubTator3 allows about 30 requests/minute; not official. — [BioMCP PubTator3 reference](https://glama.ai/mcp/servers/@genomoncology/biomcp/blob/117cbf50ecab72819025bb21cc6d6d20afec27d5/docs/backend-services-reference/06-pubtator3.md)

### Gaps
- PubTator3 official rate limit and licence, Europe PMC limits and licences (per-article licences restrict text reuse), Semantic Scholar terms, best method for per-protein publication counts by year (background suggestion, unverified: Europe PMC or OpenAlex counts, UniProt citation lists).

## 11. Structure-derived annotations

### Takeaway
Not researched beyond AFDB items above.

### Gaps
- PDB/PDBe/SIFTS, PDBe-KB, AlphaFill, P2Rank/PrankWeb, MobiDB, PTM data (PhosphoSitePlus is a known non-commercial/CC BY-NC-SA resource, background recollection, unverified): no sources fetched.

## 12. Integrated knowledge graphs and frameworks

### Takeaway
Every Cure's MATRIX KG is on Hugging Face as Parquet under CC BY 4.0 for their integration work, with upstream licences still applying. PrimeKG has 17,080 diseases and 4,050,249 relationships on Harvard Dataverse, licence not stated on the project page. SPOKE is not distributed.

### Cited Findings
- Every Cure KG public release: Parquet on Hugging Face (`everycure` org: kg-nodes, kg-edges, drug-list, disease-list; ~1,800 drugs, ~22,000 diseases lists); CC BY 4.0 for Every Cure's integration work; upstream source licences still apply; built from RTX-KG2 and ROBOKOP. — [Every Cure public data releases](https://docs.dev.everycure.org/releases/public_data_releases/)
- A 2026 preprint describes an Every Cure KG integrating RTX-KG2, ROBOKOP and PrimeKG with over 7 million nodes and 81 million edges from 95 primary sources. — [Sciety preprint record](https://sciety.org/articles/activity/10.64898/2026.08.26.747253)
- Every Cure docs: SPOKE is used but not distributed; contact data owners. — [Every Cure knowledge sources](https://docs.dev.everycure.org/releases/knowledge_sources/)
- PrimeKG: 20 resources, 17,080 diseases, 4,050,249 relationships; hosted at Harvard Dataverse https://doi.org/10.7910/DVN/IXA7BM; code at GitHub mims-harvard/PrimeKG; no licence on project page. — [PrimeKG project page](https://zitniklab.hms.harvard.edu/projects/PrimeKG)

### Inferences
- Because upstream licences carry through (including ChEMBL SA, DisGeNET NC and others inside PrimeKG/RTX-KG2), starting from an existing graph does not remove the licence audit; it hides it. For a small-budget, redistributable, protein-centric dataset, building from primary sources with an explicit per-layer licence manifest is cleaner; existing graphs are useful as evaluation or edge-prediction references and for drug-repurposing context.

### Gaps
- Hetionet, SPOKE size, Monarch KG current release, RTX-KG2 version, Clinical Knowledge Graph, PharMeBINet, OpenBioLink freshness and licences; BioCypher, Biolink Model and KGX versions: not researched.

## 13. Identifier crosswalk strategy

### Takeaway
Not verified from sources this session.

### Gaps
- Background suggestion (unverified): key the dataset on UniProt accession (canonical isoform) with HGNC ID and Ensembl gene ID as join columns; use UniProt ID-mapping, HGNC downloads, and ChEMBL/UniChem mappings; use MONDO and EFO IDs for diseases with the cross-references that Open Targets already harmonises (Open Targets merged 1,706 duplicate disease terms in 26.09 per [release notes](https://platform-docs.opentargets.org/release-notes)).

## 14. Licence compatibility matrix (for a merged derived dataset under CC BY 4.0 or CC0)

### Takeaway
Verified blockers: ChEMBL (CC BY-SA 3.0) blocks CC BY 4.0/CC0 for any merged layer containing its rows; DisGeNET (CC BY-NC-SA 4.0) is incompatible with any open release. Verified permissive: AFDB, AlphaMissense, STRING, HPA (as fetched), Open Targets (CC0, with caveats), Reactome (CC0), Every Cure integration (CC BY 4.0, upstream applies).

### Cited Findings
| Source | Licence (as verified) | Blocks CC BY 4.0 / CC0 merged release? | Source |
|---|---|---|---|
| AFDB (structures, complexes) | CC BY 4.0 | No (attribute) | [AFDB downloads](https://alphafold.ebi.ac.uk/download) |
| AlphaMissense | CC BY 4.0 | No (attribute) | [GitHub README](https://github.com/google-deepmind/alphamissense) |
| STRING 12.5 | CC BY 4.0 | No (attribute; note changes) | [STRING](https://string-db.org/cgi/access) |
| Reactome | CC0 (data), CC BY 4.0 (code) | No | [Reactome](https://reactome.org/pages/about/license-agreement/) |
| Open Targets Platform | CC0 1.0 (upstream sources keep own terms) | No for its own layer; check inherited rows | [Open Targets](https://platform-docs.opentargets.org/licence) |
| HPA | CC BY 4.0 per licence page (conflict: CC BY-SA 4.0 / 3.0 claims) | Possibly, if SA is right | [HPA](https://www.proteinatlas.org/about/licence) |
| ChEMBL 37 | CC BY-SA 3.0 | Yes for CC BY/CC0 (SA required) | [ChEMBL](https://chembl.gitbook.io/chembl-interface-documentation/about) |
| DisGeNET | CC BY-NC-SA 4.0 | Yes (non-commercial + SA) | [DisGeNET legal](https://www.disgenet.org/legal) |
| Every Cure KG | CC BY 4.0 for integration; upstream applies | Depends on upstream content | [Every Cure](https://docs.dev.everycure.org/releases/public_data_releases/) |
| Monarch Initiative | BSD-3-Clause (per Every Cure table) | No | [Every Cure sources](https://docs.dev.everycure.org/releases/knowledge_sources/) |
| AlphaFold 3 outputs | CC BY-NC-SA 4.0 (as noted on HPA page) | Yes | [HPA licence](https://www.proteinatlas.org/about/licence) |

### Inferences
- Common handling: separate layers per licence (permissive core published as CC BY 4.0/CC0; ChEMBL layer separately as CC BY-SA 3.0), a build script that downloads restricted sources at build time instead of redistributing them, and an ATTRIBUTION/LICENSES manifest listing each source, version and licence. Every Cure and Open Targets both follow the "own work permissive, upstream terms preserved" pattern (see sources above).

### Gaps
- All unlisted sources (ClinVar, gnomAD, MaveDB, IntAct, BioGRID, InterPro, TED, GTEx, CELLxGENE, DepMap, PubTator3, Europe PMC, PDBe, MobiDB, OMIM, Pharos, DrugCentral, DGIdb, BindingDB, ClinicalTrials.gov, openFDA) need primary-page verification before the matrix is final.

## 15. Rough size estimate of a full human-proteome dataset

### Takeaway
No source gave per-dataset sizes, so only a reasoned estimate is possible, flagged as inference.

### Cited Findings
- Swiss-Prot holds 209,202,719 amino acids across 576,073 entries, i.e. about 363 residues per entry on average. — [Expasy statistics](https://web.expasy.org/docs/relnotes/relstat.html)

### Inferences
- A human-proteome set of ~20k proteins at ~560 residues average (human proteins are longer than the Swiss-Prot mean; my assumption) is about 11M residues. CA-only traces at 3 floats plus pLDDT per residue (quantised to int16 or int8) would be roughly 40-100 MB uncompressed, well under 100 MB gzipped; per-residue AlphaMissense (19 substitutions x ~11M) is ~200M values, so storing only per-residue mean/max keeps it to tens of MB. Open Targets Parquet trimmed to human targets with associations and drug rows should be on the order of hundreds of MB to low GB; STRING top-confidence human edges are tens of MB. Total shippable processed layer: plausibly 0.3-2 GB, fitting free hosting on Hugging Face or Zenodo. These are estimates, not measurements.

### Gaps
- Real measured sizes of Open Targets 26.09, STRING human files, AlphaMissense TSV, AFDB human tar.

## Cross-cutting: recommendation (build vs reuse existing graph)

### Takeaway
Build from primary sources, with Open Targets Platform (CC0, Parquet, quarterly) as the backbone for disease/drug/genetics evidence, AFDB + AlphaMissense for structure, STRING and Reactome for interactions/pathways, and HPA for expression; keep ChEMBL-derived content in a separate CC BY-SA layer and exclude DisGeNET. Treat Every Cure/PrimeKG as reference or optional layer, since upstream licences still flow through.

### Inferences
- This is a judgment synthesised from the verified licence facts above; knowledge-graph frameworks (BioCypher, Biolink, KGX) were not evaluated and therefore are not recommended or ruled out here.

### Gaps
- Hosting-cost facts for Hugging Face/Zenodo/Cloudflare R2 free tiers were not researched ($20/month constraint unverified).
