# Licensing

GenomeCanvas has three kinds of material, and each has its own terms. This is the
intended scheme (decision record [10](adr/0010-licensing.md)); the owner confirms
it before the first push.

| Material | Licence | Where |
|---|---|---|
| Source code in this repository | Apache-2.0 | [`LICENSE`](../LICENSE), [`NOTICE`](../NOTICE) |
| The released dataset | CC BY 4.0 (intended) | Each release's manifest, from Phase 2 |
| A separate share-alike layer | The share-alike licence of its sources, for example CC BY-SA 3.0 for ChEMBL | Its own folder and licence file, from Phase 2 |

## Why the share-alike layer is separate

Share-alike terms pass on to anything built from the data. If share-alike rows
were mixed into the main dataset, the whole dataset would become share-alike.
Data that reaches GenomeCanvas through Open Targets is covered by Open Targets'
CC0 release; anything taken from ChEMBL directly goes in the separate layer.

## The licence ledger

Every source is recorded in [`forge/sources.yaml`](../forge/sources.yaml): its
version, URL, licence, licence URL, the date the licence was read, and the
attribution it requires. A licence counts as verified only when someone has read
the licence page or file; until then the ledger says the licence is unknown and
the source may not be used.

Check it with:

```bash
corepack pnpm check:py
```

or on its own, from `forge/`:

```bash
uv run python -m forge.ledger check
```

The check fails if a verified licence was last read more than 180 days ago, or if
a source marked as in use is not verified. Each release will embed the ledger in
its manifest, and the app's Sources page will be rendered from it.

## Left out for licence reasons

DisGeNET (non-commercial, share-alike, paid for products), AlphaFold 3 outputs
(non-commercial, share-alike), OMIM, DrugBank and PhosphoSitePlus.
