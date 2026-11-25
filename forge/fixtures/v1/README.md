# Version 1 fixtures

These two files are copied unchanged from tag `v1.0.0`, where they lived in
`backend/app/data/`. They exist only to feed the step 1B walking skeleton and
are replaced by the Forge's real release in Phase 2.

**They must never be presented to a user as real data.**

| File | What it is | Provenance |
|---|---|---|
| `protein_structure_assets.json` | Alpha-carbon backbone traces at three levels of detail for 54 proteins | **52 of 54 are real AlphaFold DB data.** Two, `P51587` (BRCA2) and `Q13315` (ATM), are procedural helices that version 1 generated after the AlphaFold DB API returned 404; their `structure_source` field says `procedural`. |
| `proteins.json` | Names, descriptions, coordinates and other fields for 54 proteins | **Hand-written illustrative data. Not sourced.** No field in it comes from a cited release. |

SHA-256 at the time of copying:

```
b018fbd9ec108b3af97d81e78ec75d0fdb5d829c86b340b38052f2d22f3cc5a3  protein_structure_assets.json
4118139af79a504709c0b9a05ee4167bbf56e14dac683891e983999f753dff1c  proteins.json
```

AlphaFold DB's licence is not yet verified in `forge/sources.yaml`. Before
anything derived from these traces is served from a public URL, that row must be
verified.
