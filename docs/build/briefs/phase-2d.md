# Work order 2D: embeddings, the similarity map, and how far to trust it

**Phase 2, step D.** Step 2A brought in every reviewed human protein from UniProt. This step gives each of them a place on a map and produces the files the atlas needs to draw the real proteome. Step 2E then changes the app to read them. Steps 2B (structures) and 2C (the knowledge graph) are waiting on the owner's permission for large downloads and come later; nothing here depends on them.

## Goal

A position for every reviewed human protein on a **similarity map computed from real embeddings**, a **published measure of how far that map can be trusted**, and a small **atlas release**: positions, a colour category taken from curated annotations, cluster labels, compact vectors for in-browser search, and an index of names.

Version 1's coordinates were typed by hand. The point of this step is that nothing on the map is.

## Read first

1. `CLAUDE.md`. Rules 6 and 7 are the ones this step lives by.
2. `docs/build/STATUS.md`, and `docs/build/reports/phase-2a.md` in full: its "What the data taught us" section is input to this step.
3. In `Documents/genomecanvas-2.0-plan.md`: sections 4.4 (the release table), 4.8 (rows A and B, and "Known risks"), 4.10, and Phase 2 in section 5.
4. Decision records 5 and 8, `docs/data/dictionary.md`, `docs/formats/points-v0.md`.
5. The frame in `forge/src/forge/pipeline/`. New stages plug into it; do not build a second one.

## What to build

### A. Embeddings

1. **UniProt publishes ProtT5 embeddings for the human proteome as one file, about 47 MB.** Pin it in the lock like any other download. It is part of the `uniprot` ledger row; confirm on UniProt's embeddings page which model produced it, the dimension and the precision, and record them.
2. **Measure coverage against the 20,429 proteins.** The research says the file omits sequences over 12,000 residues, which would be titin, mucin-16 and MUC3B. Find out what is actually missing and why. **A protein without an embedding is not placed on the similarity map.** It is listed with the reason, in the tables and in the release, and nothing invents a position for it.
3. **Compact vectors for the browser:** reduce the dimension and quantise to one byte per value (the plan suggests 256 dimensions; choose with evidence). Write the file format down in `docs/formats/`, as the points format was. **Measure what the compression costs:** for each protein, how many of its ten nearest neighbours by exact cosine similarity on the original vectors are still in its ten nearest after reduction, and after quantisation. Report both recalls. If quantised recall is below 0.9, change the settings and say what you changed.

### B. The similarity map

1. A two-dimensional layout from the embeddings. Try at least three settings or methods and choose with numbers: neighbour preservation between the original space and the map, trustworthiness and continuity, at stated neighbourhood sizes. Put the comparison table in the report. Do not choose by appearance alone.
2. **This computation will not be bit-reproducible across machines.** So the chosen layout is a **pinned artifact**, like a download: computed once by an explicit command, committed or pinned by hash with its provenance (the method, parameters, seed, library versions, the hash of its inputs), and then only read by the build. The ordinary build must stay byte-identical on macOS and on the Linux runner, as step 2A's is. Record this as a new decision record: derived artifacts that cannot be reproduced bit for bit are pinned.
3. Write a short page, `docs/data/reading-the-map.md`, in plain words for a visitor: what a position means, what nearness means, and what it does not mean. Distances between far-apart groups are not meaningful and the page must say so. This text will appear in the app.

### C. Does the map mean anything? One honest test

**Function transfer.** Hide a protein's GO terms, predict them from its nearest neighbours in embedding space, and score the prediction the way the CAFA challenge does (F-max, separately for the three GO aspects). Compare against a naive predictor that ignores the protein and predicts the most common terms. Use the annotations from step 2A and say exactly which evidence you counted as ground truth.

State the limits in the report: neighbours that are close relatives make this look better than a real prediction task, and this is a sanity check on the map, not a claim to predict function. Report the numbers whatever they are.

### D. Groups and labels

1. Group the proteins by neighbourhood in embedding space, with a deterministic method or a pinned result.
2. Label each group by the annotations that are over-represented in it (UniProt keywords, GO terms or families), with a stated statistical test and a correction for multiple testing. A group with nothing significantly over-represented gets no label, not a vague one.
3. A sanity check a biologist would recognise: look for the families that should appear (kinases, olfactory receptors, zinc-finger proteins, ribosomal proteins, histones, immunoglobulin segments) and report whether each did, with its size. If a well-known family is split or missing, say so.

### E. A colour category from curated data

The atlas colours each point by one category. Derive it from UniProt's curated keywords, into at most eight classes plus "other" and "not classified", using a written rule. You may pin UniProt's keyword list for the keyword categories. The grouping is this project's own proposal on top of curated data: record it as such, give the counts per class, and mark it as needing review.

### F. The atlas release

An `atlas-sample` and an `atlas-full` release, in the same family as Phase 1's sample release so that the Worker route and the shared naming rule apply unchanged:

- a manifest, with `sample` false for the full profile, the sources and licences, the layout's provenance, and the quality numbers from B and C;
- points for the similarity layout. The existing points format has no way to say "this protein has no position". Extend it or add a companion file, keep one row order shared by every file in the release, write the format down, and keep version 0 readable;
- the index of proteins in the same row order: accession, gene symbol, protein name, class, annotation score, length;
- the groups: label, size, centre, the terms behind the label;
- the compact vectors;
- the list of proteins not placed, with reasons.

Report every file's size. The plan's target is that the first paint of the whole proteome needs at most 200 KB of data; say how close the points file is.

### G. The sample profile, CI and documents

1. Extend the 200-protein sample: a snapshot of exactly those proteins' embeddings and a pinned layout for them, both small and committed. CI builds `atlas-sample` offline and byte-identically.
2. Heavy libraries used only to compute a layout or run the evaluation go in an optional dependency group, so the ordinary build and CI stay light.
3. The manual full workflow also builds `atlas-full` and keeps it as an artifact.
4. Update the data dictionary, the README, the Commands section of `CLAUDE.md`, the repository map and the ledger.

## Constraints

- **Downloads in this step: UniProt only, under 100 MB in total.** No AlphaFold DB, no Open Targets, no Ensembl. The genome layout comes in step 2C.
- No GPU and no model inference. The embeddings are downloaded, not computed.
- This step does not touch `apps/` or `packages/`, apart from shared test vectors and format documentation. If the TypeScript decoder must change to read the new points file, leave that to step 2E and say exactly what it needs.
- Never place a protein that has no embedding, and never present a number that was not measured.

## Not in scope

Structures, structural neighbours, the knowledge graph, other layouts, any change to the app, and publishing.

## Done when

Give the command and the last lines of its output for each.

1. In a fresh clone: install, then `corepack pnpm check:all`, exit 0, with `atlas-sample` built offline as part of it.
2. Two `atlas-sample` builds are byte-identical, and the `atlas-full` built on this machine is byte-identical to the one the GitHub runner builds. Give the hashes and the run ID.
3. Coverage: how many of the 20,429 have an embedding, and every one that does not, with its reason.
4. The compression measurement: both recalls, for the settings chosen and at least one alternative.
5. The layout comparison table and the choice, with the pinned artifact's provenance.
6. The function-transfer result for each GO aspect, beside the naive baseline, with the protocol and its limits.
7. The groups: how many, how many labelled, the table of the largest thirty, and the result of the family sanity check.
8. The colour classes with counts.
9. Every file in `atlas-full` with its size, and the first-paint figure against the 200 KB target.
10. Three mutations, each seen to fail and then restored: one in the compression, one in the layout pinning (a pinned layout that does not match its inputs must be refused), one in the labelling statistics.
11. The new decision record, the reading-the-map page, the format documents and the dictionary are written.
12. The tree is clean, the commits are small, and CI is green for your last pushed commit. Give its run ID.

## How to work

Decide and document; do not stop to ask. Where the data disagrees with the plan or with this order, the data wins: say what you found. If something needs the owner, mark that one item blocked, write the exact commands, and finish the rest.

## Report

Write `docs/build/reports/phase-2d.md` in the same format as the earlier reports, with a "What the data taught us" section, commit it, push, and reply with the same text. The first line is `STATUS: DONE`, `STATUS: PARTIAL` or `STATUS: BLOCKED`.
