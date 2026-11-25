"""Choose the sample profile's proteins and cut its snapshots from the full downloads.

The sample is about 200 accessions picked by rule, so that the awkward cases
are always in it: the longest and shortest proteins, BRCA2 and others over
2,700 residues, selenoproteins, proteins with no gene symbol, many isoforms or
several genes, ambiguous and missing identity mappings, and the 54 proteins of
version 1. The rest are filled by a fixed hash order, so the choice never
depends on a random seed or on the machine.

Snapshots are byte-for-byte copies of the chosen entries from the pinned
files, gzipped with no timestamp, so the same inputs always give the same
snapshot.
"""

from __future__ import annotations

import gzip
import hashlib
import io
import json
from collections.abc import Iterable, Mapping, Sequence
from pathlib import Path
from typing import Final

from forge.pipeline import sql
from forge.pipeline.arrow import Table

TARGET_SIZE: Final = 200
V1_FIXTURE: Final = Path(__file__).resolve().parents[2] / "fixtures" / "v1" / "proteins.json"


def _add(chosen: dict[str, list[str]], accessions: Iterable[object], reason: str) -> None:
    for accession in accessions:
        chosen.setdefault(str(accession), [])
        if reason not in chosen[str(accession)]:
            chosen[str(accession)].append(reason)


def v1_accessions(path: Path = V1_FIXTURE) -> list[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return sorted(str(item["uniprot_id"]) for item in data)


def select_sample(
    tables: Mapping[str, Table], v1: Sequence[str], target: int = TARGET_SIZE
) -> dict[str, list[str]]:
    """Accession to the reasons it is in the sample, in the order the rules ran."""
    chosen: dict[str, list[str]] = {}

    def pick(sql_text: str, reason: str) -> None:
        _add(chosen, (r[0] for r in sql.rows(tables, sql_text)), reason)

    known = {str(a) for a in tables["proteins"].column("accession")}
    _add(chosen, [a for a in v1 if a in known], "one of the 54 proteins of version 1")
    pick(
        "select accession from proteins order by length desc, accession limit 5",
        "among the five longest",
    )
    pick(
        "select accession from proteins where length > 12000 order by accession",
        "longer than 12,000 residues",
    )
    pick(
        "select accession from proteins where gene_symbol in ('BRCA2', 'ATM') order by 1",
        "over 2,700 residues, named in the plan",
    )
    pick(
        "select accession from proteins where length > 2700 order by accession limit 5",
        "over 2,700 residues",
    )
    pick(
        "select accession from proteins order by length, accession limit 5",
        "among the five shortest",
    )
    pick(
        "select accession from sequences where list_contains(nonstandard_residues, 'U') order by "
        "accession limit 5",
        "a selenoprotein",
    )
    pick(
        "select accession from proteins where gene_count = 0 order by accession limit 3",
        "names no gene",
    )
    pick(
        "select accession from proteins where gene_count > 0 and gene_symbol is null order by "
        "accession limit 3",
        "has only ORF gene names, no symbol",
    )
    pick(
        "select accession from isoforms group by accession order by count(*) desc, accession "
        "limit 5",
        "among those with the most isoforms",
    )
    pick(
        "select accession from proteins order by gene_count desc, accession limit 3",
        "encoded by several genes",
    )
    pick(
        "select accession from proteins where is_fragment order by accession",
        "its sequence is a fragment",
    )
    pick(
        "select accession from proteins where protein_existence_level >= 4 "
        "order by protein_existence_level desc, accession limit 4",
        "protein existence predicted or uncertain",
    )
    pick(
        "select accession from proteins where annotation_score = 1 order by accession limit 2",
        "annotation score 1",
    )
    pick(
        'select distinct accession from features where begin is null or "end" is null '
        "order by 1 limit 3",
        "has a feature with an unknown position",
    )
    pick(
        "select distinct accession from features where location_sequence is not null order by 1 "
        "limit 2",
        "has a feature placed on an isoform",
    )
    pick(
        "select accession from proteins anti join (select accession from cross_references "
        "where database = 'AlphaFoldDB') using (accession) order by accession limit 3",
        "no AlphaFold DB link",
    )
    if "crosswalk" in tables:
        for status in ("ambiguous", "missing"):
            pick(
                f"select accession from crosswalk where ensembl_status = '{status}' "
                f""
                "order by accession limit 5",
                f"Ensembl gene mapping {status}",
            )
            pick(
                f"select accession from crosswalk where hgnc_status = '{status}' "
                "order by accession limit 5",
                f"HGNC mapping {status}",
            )
        pick(
            "select accession from crosswalk where ensembl_reason like '%HGNC links%' order by "
            "accession limit 3",
            "Ensembl gene settled by HGNC",
        )
        pick(
            "select accession from crosswalk where symbol_agrees = false order by accession limit "
            "3",
            "UniProt's symbol differs from HGNC's",
        )
    remaining = sorted(known - set(chosen), key=lambda a: hashlib.sha256(a.encode()).hexdigest())
    _add(chosen, remaining[: max(0, target - len(chosen))], "filler, by fixed hash order")
    return chosen


def format_accession_list(chosen: Mapping[str, list[str]]) -> str:
    lines = ["accession\treasons"]
    lines.extend(f"{a}\t{'; '.join(r)}" for a, r in sorted(chosen.items()))
    return "\n".join(lines) + "\n"


def parse_accession_list(text: str) -> list[str]:
    lines = text.splitlines()
    if not lines or lines[0] != "accession\treasons":
        raise ValueError("the sample list must start with the header 'accession<TAB>reasons'")
    return [line.split("\t", 1)[0] for line in lines[1:] if line]


def gzip_bytes(data: bytes) -> bytes:
    """gzip with no file name and no timestamp, so equal input gives equal output."""
    buffer = io.BytesIO()
    with gzip.GzipFile(fileobj=buffer, mode="wb", compresslevel=9, mtime=0, filename="") as handle:
        handle.write(data)
    return buffer.getvalue()


def cut_uniprot_xml(lines: Iterable[bytes], accessions: set[str]) -> tuple[bytes, list[str]]:
    """The chosen entries of a UniProt XML file, with the file's own header and footer.

    UniProt writes each <entry> starting on its own line and ending with a
    </entry> line, which this relies on and checks. Returns the bytes and the
    accessions found, in file order.
    """
    header: list[bytes] = []
    footer: list[bytes] = []
    out: list[bytes] = []
    found: list[str] = []
    entry: list[bytes] | None = None
    primary: str | None = None
    seen_entry = False
    for line in lines:
        if entry is None:
            if line.startswith(b"<entry "):
                entry = [line]
                primary = None
                seen_entry = True
            elif seen_entry:
                footer.append(line)
            else:
                header.append(line)
            continue
        entry.append(line)
        stripped = line.strip()
        if primary is None and stripped.startswith(b"<accession>"):
            primary = stripped[len(b"<accession>") : -len(b"</accession>")].decode("ascii")
        if line.startswith(b"</entry>"):
            if primary in accessions:
                out.extend(entry)
                found.append(primary)
            entry = None
    if entry is not None:
        raise ValueError("the file ends inside an entry")
    return b"".join(header + out + footer), found


def cut_tsv(text: str, keep: Iterable[str], column: int = 0) -> str:
    """Header plus the rows whose given column is in `keep`."""
    wanted = set(keep)
    lines = text.splitlines(keepends=True)
    return "".join(lines[:1] + [line for line in lines[1:] if line.split("\t")[column] in wanted])


def cut_hgnc(text: str, accessions: set[str], hgnc_ids: set[str]) -> str:
    """HGNC rows that name a sampled accession or are cross-referenced by one."""
    lines = text.splitlines(keepends=True)
    header = lines[0].rstrip("\n").split("\t")
    id_column = header.index("hgnc_id")
    uniprot_column = header.index("uniprot_ids")
    kept = [lines[0]]
    for line in lines[1:]:
        fields = line.rstrip("\n").split("\t")
        listed = set(fields[uniprot_column].strip('"').split("|"))
        if fields[id_column] in hgnc_ids or listed & accessions:
            kept.append(line)
    return "".join(kept)


def read_lines(path: Path) -> Iterable[bytes]:
    with gzip.open(path, "rb") as handle:
        yield from handle


def write_if_changed(path: Path, data: bytes) -> bool:
    if path.exists() and path.read_bytes() == data:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return True
