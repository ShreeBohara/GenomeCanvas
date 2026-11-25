# Sample snapshots

These files feed the Forge's `sample` profile, which CI builds on every push
without touching the network. They are exact subsets of the pinned full
downloads named in [`../downloads.lock.json`](../downloads.lock.json), which
also pins each file here by size and SHA-256.

| File | What it is | Cut from |
|---|---|---|
| `sample-accessions.tsv` | The 200 accessions in the sample, each with the rule that chose it | Chosen by `python -m forge sample select` from a full build |
| `uniprot_sprot_human.sample.xml.gz` | Those 200 entries, byte for byte, with the file's own header and footer | `uniprot_sprot_human.xml.gz`, UniProtKB/Swiss-Prot release 2026_04 |
| `uniprot_annotation_scores.sample.tsv.gz` | Their annotation scores | UniProt REST API, release 2026_04 |
| `hgnc_complete_set.sample.tsv.gz` | HGNC rows that name one of the 200 or are cross-referenced by one | HGNC complete set, monthly archive of 2026-10-06 |

To regenerate them after refreshing the lock (both commands read the cached
full downloads and change nothing else):

```bash
uv run python -m forge build --profile full --out ../build/tables/full
uv run python -m forge sample select --release ../build/tables/full
uv run python -m forge sample cut
```

The only changes made to the source data are the selection of entries or rows
and gzip compression with no timestamp.

## Attribution and licences

- **UniProt.** Data from UniProtKB/Swiss-Prot release 2026_04 (4 November 2026),
  The UniProt Consortium, [www.uniprot.org](https://www.uniprot.org), licensed
  under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
  ([licence page](https://www.uniprot.org/help/license)). UniProt makes no
  warranty about the correctness of the data.
- **HGNC.** HGNC complete set, monthly archive of 6 October 2026, HUGO Gene
  Nomenclature Committee, [www.genenames.org](https://www.genenames.org),
  released under [CC0](https://www.genenames.org/about/license/). Attribution is
  not required; HGNC asks for it.
