# Portfolio signal and open-source launch/publication playbook (as of 2026-11-25)

Method note: about 30 search/fetch calls; no project-specific terms were used in queries. Many career-advice sources are blogs and vendor content. Where a claim is not from a primary or named-author source, it is marked "weak source". Official journal and conference pages are primary.

## 1. Hiring signal: what differentiates a side project now, and how "built with AI agents" is perceived

### Takeaway
Named hiring-side voices converge on judgment, verification and the ability to explain and defend decisions, not volume of code. Being unable to explain AI-produced code is the main red flag. Evidence from named senior practitioners is thin; much of the rest is low-quality career blogging.

### Cited Findings
- CTO coach Stephan Schmidt (June 27, 2026) lists what he looks for when AI writes the code: "taste and judgment, ahead of everything"; ownership "when no one is checking"; knowing what to ask the AI for and noticing wrong answers; verifying AI output (security, edge cases, requirements match); product sense; enough fundamentals to judge architecture. Red flags: shipping AI output unread, deploying unverified code, accepting suggestions reflexively, missing security/architecture/edge-case risks. He says algorithm puzzles no longer predict useful work. (Single author, opinion.) — [AmazingCTO](https://www.amazingcto.com/hiring-developers-when-ai-writes-code/)
- Pragmatic Engineer survey (Dec 3, 2024, n=49: 65% hiring managers, 35% engineers; older than the 2025-26 window): cover letters widely seen as AI-written ("Easily 90%" per one Big Tech group PM); GenAI-polished CVs look alike; keyword matching less useful; recruiters lean on pedigree to cope with volume; live discussion of a candidate's deliverable is valued more than the code itself; interviewers shifting toward code review and system design. Part of the article is paywalled, and it does not discuss side projects directly. — [Pragmatic Engineer](https://newsletter.pragmaticengineer.com/p/how-genai-changes-tech-hiring)
- Aggregated 2026 career-blog consensus (weak source; blogs/vendor content): hiring managers want production signals (failure handling, state, shipped working software) over notebooks or one-shot demos; 2-4 polished, deployed, well-documented projects beat a long list of unfinished ones; be explicit about which parts were AI-generated and why AI was used; some filter out "vibe coders" who treat AI as a black box. The "80% of hiring managers" statistic in one guide has no primary source and should not be used. — [DEV: AI portfolio projects 2026](https://dev.to/klement_gunndu/5-ai-portfolio-projects-that-actually-get-you-hired-in-2026-5bpl), [The New Stack: how AI changes developer portfolios](https://thenewstack.io/how-ai-changes-developer-portfolios/) (page returned 403 on fetch; only the search snippet was seen), [Fueler](https://fueler.io/blog/resumes-are-dead-for-ai-engineers-how-to-show-true-proof-of-work-in-the-age-of-vibe-coding), [DEV: Portfolio strategy 2026](https://dev.to/pickuma/portfolio-strategy-for-2026-surviving-the-ai-generated-noise-filter-4oj3) (fetch 404; snippet only)
- Interview trend: inability to explain AI-assisted solutions is cited as a red flag by engineering leaders; some teams hand candidates AI-written code to critique ("audit" interviews). Strongest sources in that result set were LeadDev, Pragmatic Engineer and Built In; one blog was low quality. — [Built In](https://builtin.com/articles/audit-interview-scorecard), [LeadDev](https://leaddev.com/ai/why-expect-candidates-ai-hiring-process)
- Hacker News moderator dang says Show HN is flooded with "generated" projects with nothing more than a generated repo and generated README; high-effort projects "sail through", low-effort or account-walled ones get a chance to "apply more polish and try again". This is a community-thread paraphrase, not an official rule. — [HN thread mirror](https://hn.svelte.dev/item/47213630), [overview](https://dev.to/madsendev/i-built-something-good-with-ai-now-some-developer-communities-dont-want-to-see-it-20mo)

### Inferences
- Differentiators that agents cannot fake cheaply: (a) a live deployment that works without login, (b) written evaluation of the AI guide with named metrics and failure cases, (c) a design-decision log (ADRs) showing choices and rejected alternatives, (d) real external users or feedback from named practitioners, (e) depth in one hard problem (e.g. grounded tool-use evaluation, large-structure rendering performance).
- Because interviewers probe explanation, the developer should be able to walk through every module and trade-off without the agent. Disclosing agent use plainly, paired with evidence of verification (tests, evals, reviews), matches what Schmidt and the blogs reward.
- Pedigree matters more as volume rises (Pragmatic Engineer), so an early-career candidate needs externally verifiable signals (a published paper or JOSS-style review, a named domain advisor, merged PRs in a known project) to substitute for pedigree.
- Anti-patterns to avoid, as consistent with the above: undeployed projects, notebook-only AI demos, keyword-driven stacks, unverifiable metrics, generic AI-sounding READMEs.

### Gaps
- No first-hand 2025-26 statements from named engineers at top AI or technology companies about side projects were found; the evidence is mostly secondary blogs. Recruiter-survey data specific to open-source portfolio projects was not found.
- Pragmatic Engineer take-home/projects section is paywalled.
- Where the AI-disclosure norm conflicts: blogs say disclose; HN moderators are wary of generated Show HNs. Resolution: disclose, and show effort and verification.

## 2. Presenting a biology project as a non-biologist

### Takeaway
Credibility comes from named domain advisors, sourced claims, explicit limitations and open feedback loops, plus the AI-in-biology critiques that experts already voice (benchmarks overstate understanding). Few sources address the non-biologist case directly.

### Cited Findings
- Critics argue high benchmark scores in genomics and protein models do not show the models learned biology; one 2025 report found gene-expression prediction AI no better than a simple baseline; a NeurIPS 2026 paper argues indiscriminate scaling of foundation models cannot solve biology. Several of these items are commentary or LinkedIn posts. — [NeurIPS 2026 poster](https://neurips.cc/virtual/2026/poster/140123), [search result summary of critique sources](https://acribbs.substack.com/p/can-ai-agents-actually-do-bioinformatics)
- A bioinformatics-agent analysis (Substack, weak source) says workflow planning is largely solved but interpretation is not; agents often choose the right tools but give answers the data do not support. — [Substack](https://acribbs.substack.com/p/can-ai-agents-actually-do-bioinformatics)
- EMBL-EBI argues standardised benchmarks (CASP as the exemplar) are required to compare models, reproduce findings and judge whether predictions reflect biological insight. — [EMBL](https://www.embl.org/news/science-technology/benchmarking-the-foundation-of-reliable-ai-in-biomedicine/)
- Reporting on a 2025-26 Anthropic discovery claim notes other researchers called "autonomous AI discovery" talk hype running ahead of the science. Secondhand news report. — [CTV News](https://www.ctvnews.ca/sci-tech/article/anthropics-announcement-of-a-claude-led-crispr-like-discovery-is-sparking-controversy-heres-why/)
- BOSC requires submitters to disclose AI use in the research and write abstracts by hand; Bioinformatics requires AI use disclosure in the cover letter and Methods. These norms signal that domain venues expect transparency. — [BOSC 2026 submit](https://www.open-bio.org/events/bosc-2026/submit/), [Bioinformatics guidelines](https://academic.oup.com/bioinformatics/pages/author-guidelines)

### Inferences
- Recommended presentation (opinion, derived from the above): state in the README what is real (AlphaFold structures, pLDDT values) versus derived (UMAP layout, knowledge-graph edges, LLM text); show provenance per claim (database, version, date); put a "Limitations" section first-class (UMAP axes are not biological distances; pLDDT is confidence not accuracy; LLM answers can be wrong); label the AI guide's answers with citations; recruit 2-3 named practitioner reviewers or an advisor and credit them with permission.
- Present the project as a visualisation and exploration tool, not as discovery, to avoid the overclaiming that experts criticise.

### Gaps
- No source found specifically on how non-biologist developers earn expert trust; the above is inference. Advisor-recruitment tactics (cold emails to PIs, EMBL-EBI/RCSB outreach) were not researched.

## 3. Case studies of solo/small open-source projects

### Takeaway
Verifiable case studies are mostly self-reported blog posts. No documented case was found of a launch directly producing a job offer; closer evidence is that sustained open-source contribution led to hiring, and that launches led to feedback, contributors, or investor interest.

### Cited Findings
- A solo-built open-source investment tracker reached the HN front page and GitHub trending in September 2024; the creator reported a surge of feature requests and outside contributions, "exciting and overwhelming" (self-reported). — [DEV: viral open-source app](https://dev.to/afadil/how-i-built-an-open-source-app-that-went-viral-160p)
- Snowpack creator Fred K. Schott (older, ~2020): not hitting the HN front page on day one is fine; early users and fast bug fixes matter more. — [DEV](https://dev.to/fredkschott/5-things-i-learned-while-building-snowpack-to-20-000-stars-b9d)
- A five-month solo PHP dev-tool write-up: two HN posts failed (new account, low recognition); same-day replies produced the first ten external contributors. — [HackerNoon](https://hackernoon.com/five-months-of-building-an-open-source-php-dev-tool-what-grew-what-failed-and-what-surprised-me)
- Logdy (solo dev tool): posted to HN with low expectations, reached 400 GitHub stars in two days, and within two months a VC firm asked about full-time work. Self-reported. — [DEV](https://dev.to/piotrkulpinski/growing-a-side-project-to-100k-unique-visitors-in-one-week-29mf)
- A developer reported being hired by Camunda after about 14 months of GitHub open-source contributions to the company's project. — [DEV: jwulf](https://dev.to/jwulf/how-to-get-a-job-through-doing-open-source-1a17)
- anywidget (Trevor Manz, a visualization researcher building tools for computational biologists): released February 2023; about 100 widgets created or ported by October 2024; integrated into Altair, Plotly and others; published in JOSS (10.21105/joss.06939). This is the best-documented example of a small scientific-visualisation tool gaining adoption through a framework/ecosystem route rather than a standalone app. The adoption numbers come from the authors' own paper. — [JOSS paper](https://joss.theoj.org/papers/10.21105/joss.06939), [SciPy 2023 paper](https://proceedings.scipy.org/articles/NRPV2311)

### Inferences
- Common pattern: a narrow, clear problem; a demo anyone can try instantly; honest launch write-up; same-day responsiveness to issues; integration into an existing ecosystem (anywidget lesson: ship a component others embed).
- Treat "launch -> job offer" as unproven; the more credible path is that visible quality and a paper/JOSS credential make interviewers engage.

### Gaps
- Could not verify star histories or the dates for these case studies independently; none involves a protein/AlphaFold viewer. Candidates worth a later check (not researched): Mol* (molstar), py3Dmol, nglview, Nextstrain, marimo, Foldseek web server.
- No case study of a 2025-26 solo "built with agents" science project with a documented outcome was found.

## 4. Scientific-software adoption and publication routes (requirements, deadlines)

### Takeaway
JOSS is the lowest-friction credible route but requires six months of public history and evidence of impact, which is incompatible with an immediate post-launch submission. The NAR Web Server Issue is the best fit for a login-free web tool, with proposals open from November 2026. ISMB/BOSC 2027 abstract deadlines are not yet published; the 2026 cycle's pattern suggests early April.

### Cited Findings

#### JOSS
- Scope: research software only; thin API clients, minor utilities and single-function packages are not accepted; pre-trained ML models and notebooks out of scope. Repository must have been public more than six months before submission with active development; commits concentrated in the weeks before submission are a failure signal; OSI-approved licence; open issue tracker; automated tests; documentation; short `paper.md` in the repo; free to submit. — [JOSS submitting](https://joss.readthedocs.io/en/latest/submitting.html), [JOSS review criteria](https://joss.readthedocs.io/en/latest/review_criteria.html)
- Substantial effort is assessed through scope, history and authorship; no line-count threshold is given on the current criteria page. A single author can qualify if the paper documents community use. Required paper sections: Statement of need, State of the field (with "build vs. contribute" justification), and a Research impact statement (realized impact such as outside adoption, or credible near-term significance such as benchmarks, reproducible materials, conference presentations). — [JOSS review criteria](https://joss.readthedocs.io/en/latest/review_criteria.html)
- AI policy: authors may use generative AI but must include an AI usage disclosure covering tools and versions, where used (code, paper, docs), scope, and confirmation that humans reviewed and validated outputs and made core design decisions. Incomplete disclosure may be treated as an ethical breach; AI not allowed in author-editor/reviewer communication except translation. — [JOSS submitting](https://joss.readthedocs.io/en/latest/submitting.html)
- Timing: authors asked to reply within about 2 weeks and finish changes in 4-6 weeks. Historical: first-year median 32 days submission to publication; by 2023, average time in review was approaching four months. No current median found. — [JOSS first-year review](https://peerj.com/articles/cs-147), [JOSS 2000th paper post](https://blog.joss.theoj.org/2023/05/JOSS-publishing-2000th-paper) (URL as returned in search: https://blog.joss.theoj.org/2023/05/JOSS-publishes-2000th-paper)

#### Nucleic Acids Research Web Server Issue
- Published normally in July. Proposals are accepted "at any time (starting in November 2026)"; manuscript deadline is "2 months after the date of the approval email". The page does not name the issue year (the 2027 issue is the natural inference). Proposal = one-page summary (input, output, method, prior PubMed IDs, 2-4 keywords). — [NAR Web Server submission page](https://academic.oup.com/nar/pages/submission_webserver)
- Requirements: no login, registration or email address (guest logins not approved) unless handling sensitive human data; standard licence (e.g. CC BY-SA) shown on landing page; fully functional and extensively tested at submission; sample-data mechanism and sample output linked from help pages; HTTPS on 443; cookie consent if permanent cookies are used and no third-party/tracking cookies; results bookmarkable; maintained at least five years; broad interest and "simple to use"; not single-disease/single-species (except human and common model organisms); typically 4-5 pages with use cases and comparison to existing methods; six suggested referees, cover letter listing similar sites, Key Points, graphical abstract; resubmission after rejection not within 6 months. — [NAR Web Server submission page](https://academic.oup.com/nar/pages/submission_webserver)
- Conflicting/older info: a search-snippet of an undated version said manuscripts were due "3 weeks after approval or 15 January, whichever later" with a maximum of three proposals, and a January 2025 editorial gave a 20 December proposal deadline for the 2025 cycle. The fetched current page uses the "2 months" rule; prefer the current page. — [mirror of older page](https://dbpia.nl.go.kr/nar/pages/Submission_Webserver), [TOC mirror](https://evol.mcmaster.ca/brian/journals//Nucleic_Acids_Research_6_January_2025_53:)

#### Bioinformatics (Application Note)
- Up to 4 pages (about 2,600 words, or 2,000 words plus one figure); novel software, databases or web servers; trivial utilities and heavy-install tools not accepted; software free for non-commercial users and available for two years after publication; web servers without login, HTTPS, test data, help/tutorial, supported at least three years; source at stable URLs and version/test data archived (e.g. Zenodo); ML papers must describe training data and validation. — [Bioinformatics author guidelines](https://academic.oup.com/bioinformatics/pages/author-guidelines)
- AI policy: grammar, translation, code assistance and documentation allowed; drafting papers from a prompt not acceptable; disclose in cover letter and Methods/Acknowledgements; cannot list LLM as author. Preprints allowed. May offer transfer to Bioinformatics Advances. APC amount not found. — [Bioinformatics author guidelines](https://academic.oup.com/bioinformatics/pages/author-guidelines)

#### ISMB/ECCB 2027 and BOSC
- ISMB/ECCB 2027: July 18-22, 2027, Bella Center, Copenhagen, with virtual participation. Call for submissions covers Proceedings, Tech Track and Tutorials; the official key-dates page lists categories (Abstracts, Proceedings, Tech Track, Tutorials, Registration, Fellowships, Student Council Symposium) but with no dates visible. A third-party listing gives a proceedings full-paper deadline of January 14, 2027 (unverified). — [ISCB ISMB/ECCB 2027](https://www.iscb.org/ismbeccb2027), [key dates](https://www.iscb.org/ismbeccb2027/key-dates), [Pubrica listing](https://pubrica.com/insights/calls-and-conferences/ismb-eccb-2027-intelligent-systems-for-molecular-biology-european-conf/)
- BOSC 2027: no call found. Last cycle (BOSC 2026, July 14-15 within ISMB, Washington DC): abstract deadline April 9, 2026 via ISMB EasyChair; acceptance notifications May 5; late poster deadline May 7; OBF event award deadline April 1. 250-word short abstract for all; 1-2 page long abstract for talk consideration; talks 16+4 min, lightning 5 min; everything not selected for a talk is considered for a poster. Code and data must be available at the URL at review; software needs an OSI-style licence; non-software materials need an open licence (CC0, CC-BY, etc.); abstracts must be human-written (LLMs allowed for spell check, translation, code support) and AI use disclosed. Fee waiver can be requested. — [BOSC 2026 submit](https://www.open-bio.org/events/bosc-2026/submit/), [ISMB 2026 abstract-deadline note](https://groups.google.com/g/biohackathon/c/ZMyQ_IKTd8Q)
- Related ISCB announcement states ISMB 2026 abstracts closed in early April 2026. — [ISCB](https://www.iscb.org/about-iscb/society-communications/announcements/april-2-2026-ismb-2026-abstract-submissions-close-next-thursday)

#### Preprints, distribution and citation
- bioRxiv accepts bioinformatics subject matter; a posted preprint cannot be removed; Bioinformatics allows preprints and wants the preprint updated with the final DOI. bioRxiv's own tool-specific rules were not retrieved. — [Wikipedia: bioRxiv](https://en.wikipedia.org/wiki/BioRxiv), [PLOS Comp Bio preprint policy](https://journals.plos.org/ploscompbiol/s/preprints)
- Citation hygiene: add `CITATION.cff` (GitHub shows a "Cite this repository" prompt); Zenodo's GitHub integration mints a DOI per release plus a concept DOI for all versions; a `.zenodo.json` file overrides CITATION.cff in Zenodo; cite the specific version. — [Zenodo help](https://help.zenodo.org/docs/github/describe-software/citation-file/), [GitHub docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-citation-files), [Turing Way](https://book.the-turing-way.org/communication/citable/citable-cff/)
- anywidget: authoring framework for notebook widgets that works in Jupyter, Colab, VS Code and marimo; about 100 widgets by October 2024 (authors' figure). — [anywidget JOSS](https://joss.theoj.org/papers/10.21105/joss.06939), [PyPI](https://pypi.org/project/anywidget/0.10.0/)

### Inferences
- Candidate sequence for a developer who relaunches in early 2027: (1) NAR proposal soon after the site is stable (proposals are open now and approval starts a 2-month manuscript clock; target the 2027 July issue only if the proposal is accepted and timing allows, otherwise the next cycle), (2) bioRxiv preprint at the same time, (3) BOSC/ISMB poster or short talk abstract in early April 2027 (inferred from last year's April 9; verify), (4) JOSS only after six months of public history with tagged releases and some external users; so a JOSS submission would be mid-2027 at the earliest if the repo is public from relaunch.
- The NAR "five-year maintenance" and "no login" rules are strong constraints for a project with a paid LLM backend on a $20/month budget; the AI guide would need to be optional, rate-limited or bring-your-own-key, with the core tool free of login.
- Both JOSS and Bioinformatics require AI use disclosure, so the "built with agents" statement should be written once and reused. Note the conflicting rules: Bioinformatics bans prompt-drafted papers, JOSS tolerates AI for most aspects with disclosure, BOSC requires human-written abstracts. Write the papers by hand.
- The "Bioinformatics application note" is probably a stretch without users or a novel contribution; NAR Web Server and BOSC are better first venues.

### Gaps
- Actual 2027 Web Server Issue proposal and manuscript deadlines: not published as a dated deadline; the page only says proposals are open from November 2026 and manuscripts are due 2 months after approval. Last cycle's date was a 20 December proposal deadline for the 2025 issue (older; not confirmed for 2027).
- ISMB/ECCB 2027 abstract and poster dates and BOSC 2027 call: not retrieved.
- JOSS current median review time, Bioinformatics APC amount, bioRxiv tool-specific policy, Galaxy and bioconda requirements, and ML-for-biology/visualisation workshops (e.g. MLCB, NeurIPS/ICML bio workshops, VIS, BioVis/VIZBI): not researched or not found.

## 5. Community channels and norms

### Takeaway
Show HN rewards a working, no-signup, personally built project with a how-and-why write-up; low-effort AI-generated projects are being triaged out. r/bioinformatics appears to remove self-promotion of one's own software.

### Cited Findings
- Show HN official rules: title begins "Show HN"; project must be something people can run; non-trivial and personally built so you can discuss it in the thread; early-stage is fine; "quickly generated one-off projects" and work not ready for users do not qualify; blog posts, sign-up pages and landing pages do not qualify; make it easy to try without signup or email; explain how and why you built it; do not ask friends to upvote; point releases and routine features do not qualify, but a major overhaul may. — [Show HN rules](https://news.ycombinator.com/showhn.html)
- HN guidelines prohibit AI-generated or AI-edited comments. A developer reported temporary restrictions on newer accounts' Show HN submissions (unconfirmed). — [HN guidelines](https://news.ycombinator.com/newsguidelines.html), [dev.to](https://dev.to/madsendev/i-built-something-good-with-ai-now-some-developer-communities-dont-want-to-see-it-20mo)
- r/bioinformatics: a mirrored copy of the pinned rules post says posts about monetised content, own blog/YouTube/courses, and self-promoting software you built are removed; a separate tools subreddit created December 2024 had no posted rules per a 2026 guide. Only mirrors were seen; verify on the live subreddit. — [mirror](https://redlib.cypherpunktools.com/r/bioinformatics), [2026 guide](https://www.acgt.me/blog/2026/7/26/bioinformatics-and-genomics-resources-on-reddit)
- Responsiveness lessons from self-reported write-ups: reply same day, expect HN to fail the first time, build trust before promoting; one founder's Reddit post was removed after adding a payment link early. — [HackerNoon](https://hackernoon.com/five-months-of-building-an-open-source-php-dev-tool-what-grew-what-failed-and-what-surprised-me), [Indie Hackers](https://www.indiehackers.com/post/day-4-of-building-in-public-honest-numbers-what-actually-got-traction-and-what-flopped-d2b4d8411b)

### Inferences
- Launch order: soft launch to advisors and a few practitioners; fix issues; then Show HN with a working no-login demo and an honest "built with agents; here is how I verified it" paragraph; prefer to ask for feedback in biology communities (Biostars, a Bluesky science thread) rather than posting a promotional Reddit thread.
- Show HN timing and weekday effects, Product Hunt relevance, LinkedIn, X, Bluesky, newsletters and podcasts: not researched; treat as unverified.

### Gaps
- Biostars rules, Bluesky/X science community norms, Product Hunt relevance, relevant newsletters/podcasts, and best Show HN posting times were not researched.

## 6. Presentation: README, demo, docs, writing

### Takeaway
The only evidence gathered is Show HN's "try it without signup" rule, NAR/Bioinformatics requirements for sample data and help pages, and a rough comparison of docs frameworks.

### Cited Findings
- NAR requires a mechanism to try sample data, sample output linked in help pages, and help pages explaining how to interpret results; Bioinformatics requires test data, help pages and a tutorial. — [NAR](https://academic.oup.com/nar/pages/submission_webserver), [Bioinformatics](https://academic.oup.com/bioinformatics/pages/author-guidelines)
- Docs frameworks (aggregator/opinion): Starlight (Astro, static, low JS), Fumadocs (Next.js, high control; leading downloads per one unverified aggregator), Nextra (Next.js, simpler start), Mintlify (hosted, not fully free; restructured tiers around June 2026). — [Fumadocs comparisons](https://fumadocs.dev/docs/comparisons), [toolquestor](https://toolquestor.com/vs/astro-starlight-vs-fumadocs), [skillbench](https://skillbench.vercel.app/problems/documentation)

### Inferences
- Because the app is Next.js, Fumadocs integrates naturally; Starlight is the lighter, cheaper choice for a static site. Either fits the $20/month budget (static hosting). Mintlify's hosting and pricing introduce cost and lock-in for little benefit.
- A "try this example" button preloading a known protein (such as a well-studied one) satisfies both Show HN and NAR sample-data expectations.

### Gaps
- No evidence gathered on README conversion, GIF/video best practice, or engineering blog series impact; those recommendations would be opinion.

## 7. Open-source hygiene, metrics, themes, education

### Takeaway
Most hygiene items were not researched. JOSS and BOSC criteria give authoritative minimums; hype themes in AI-for-biology are documented in critiques above.

### Cited Findings
- JOSS expects OSI licence, tests/CI, docs, CONTRIBUTING file, releases and community engagement beyond the authors. — [JOSS submitting](https://joss.readthedocs.io/en/latest/submitting.html)
- BOSC wants a recognised open-source licence for software and an open licence (CC0, CC-BY, CC-BY-SA, Unlicense) for data, documentation and non-software materials. NAR wants a standard licence such as CC BY-SA on the landing page. — [BOSC 2026](https://www.open-bio.org/events/bosc-2026/submit/), [NAR](https://academic.oup.com/nar/pages/submission_webserver)
- NAR forbids tracking and third-party cookies on the web server (affects analytics choice). — [NAR](https://academic.oup.com/nar/pages/submission_webserver)
- Themes: EMBL-EBI and critics push benchmarked, reproducible AI claims; agents' interpretation of biological data is weak (see section 2 sources).

### Inferences
- Licence: separate code and data licences (code MIT or Apache-2.0; derived data CC BY 4.0 or CC BY-SA, respecting AlphaFold DB's licence and other sources' terms, which were not checked). AGPL would deter some adopters; none of the sources compared licences.
- Metrics that can be honestly claimed and instrumented without third-party cookies: cookie-free analytics (e.g. self-hosted or privacy-friendly), GitHub stars/forks (weak), PyPI/npm downloads (inflated by mirrors/CI), citations, latency percentiles, Lighthouse, evaluation scores for the AI guide on a published question set, and cost per request. Publish methodology and the raw eval set.
- Themes likely to feel current to biologists and engineers: grounded and citation-linked LLM answers with evaluation; reproducibility and benchmarking; confidence-aware structure display. Avoid "autonomous discovery" or "AI scientist" framing given the criticism above.

### Gaps
- Not researched: semantic versioning/changelog/ADR/security-policy norms, privacy-friendly analytics products, accessibility standards (WCAG) for interactive 3D/graph tools, how teachers and course designers adopt interactive science tools, Galaxy/bioconda requirements. Provide as open items for the report writer.
