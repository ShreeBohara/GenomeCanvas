# 10. Licensing: Apache-2.0 for code, CC BY 4.0 for the dataset

Status: Accepted. The owner approved publishing under this licence on 2026-11-25.

## Context

The repository has been public since 14 March 2026 with no licence, so nobody may
legally reuse it. Code and data have different needs, and some sources are
share-alike (plan section 4.4; `docs/licensing.md`).

## Decision

- **Code:** Apache-2.0, in `LICENSE`, with a `NOTICE` file.
- **Dataset:** CC BY 4.0, so it can be reused and cited with attribution.
- **Share-alike data** (anything taken directly from ChEMBL, CC BY-SA 3.0) goes
  in a separate layer with its own licence file, never in the main dataset.
- Every source is recorded in `forge/sources.yaml`, and no source may be used
  until its licence has been read and the row verified.

## Alternatives rejected

- **MIT for code.** Equally permissive but carries no patent grant.
- **AGPL for code.** Would deter some adopters, for a tool meant to be reused.
- **CC BY-SA or CC0 for the dataset.** Share-alike would bind every user of the
  whole dataset; CC0 would drop the attribution that makes it citable.
- **Mixing share-alike rows into the main dataset.** Would make all of it
  share-alike.

## Consequences

- The owner confirmed this before the first push. Changing the licence later needs the same.
- DisGeNET, AlphaFold 3 outputs, OMIM, DrugBank and PhosphoSitePlus stay out.
