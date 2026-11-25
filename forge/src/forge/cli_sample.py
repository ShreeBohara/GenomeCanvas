"""`python -m forge sample`: choose the sample proteins, and cut their snapshots."""

from __future__ import annotations

import gzip
import json
import re
import sys
from dataclasses import replace
from pathlib import Path
from typing import Final

from forge.pipeline.arrow import decode_parquet
from forge.pipeline.lock import (
    DEFAULT_LOCK,
    FORGE_ROOT,
    Lock,
    Variant,
    format_lock,
    read_lock,
    sha256_file,
)
from forge.sample import (
    cut_hgnc,
    cut_tsv,
    cut_uniprot_xml,
    format_accession_list,
    gzip_bytes,
    parse_accession_list,
    read_lines,
    select_sample,
    v1_accessions,
    write_if_changed,
)
from forge.stages import STAGES

SNAPSHOTS: Final = FORGE_ROOT / "snapshots"
ACCESSION_LIST: Final = SNAPSHOTS / "sample-accessions.tsv"
SNAPSHOT_FILES: Final = {
    "uniprot_human_xml": "snapshots/uniprot_sprot_human.sample.xml.gz",
    "uniprot_human_annotation_scores": "snapshots/uniprot_annotation_scores.sample.tsv.gz",
    "hgnc_complete_set": "snapshots/hgnc_complete_set.sample.tsv.gz",
}
_HGNC_REF: Final = re.compile(rb'<dbReference type="HGNC" id="(HGNC:[0-9]+)"')
_NEEDED: Final = ("proteins", "sequences", "isoforms", "features", "cross_references", "crosswalk")


def select(release: Path) -> int:
    manifest = json.loads((release / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("profile") != "full":
        print("choose the sample from a full release", file=sys.stderr)
        return 1
    schemas = {s.name: s for stage in STAGES for s in stage.outputs}
    tables = {
        name: decode_parquet(
            (release / manifest["tables"][name]["path"]).read_bytes(), schemas[name]
        )
        for name in _NEEDED
    }
    chosen = select_sample(tables, v1_accessions())
    changed = write_if_changed(ACCESSION_LIST, format_accession_list(chosen).encode("utf-8"))
    print(
        f"{len(chosen)} accessions {'written to' if changed else 'unchanged in'} "
        f"{ACCESSION_LIST.name}"
    )
    return 0


def cut(cache: Path) -> int:
    lock = read_lock()
    accessions = parse_accession_list(ACCESSION_LIST.read_text(encoding="utf-8"))
    wanted = set(accessions)

    def full_path(artifact_id: str) -> Path:
        path = cache / "downloads" / lock.artifact(artifact_id).variant("full").sha256
        if not path.is_file():
            raise SystemExit(f"{artifact_id} is not in the download cache; run a full build first")
        return path

    xml, found = cut_uniprot_xml(read_lines(full_path("uniprot_human_xml")), wanted)
    missing = sorted(wanted - set(found))
    if missing:
        print(
            f"{len(missing)} sampled accession(s) are not in the pinned XML: {missing[:5]}",
            file=sys.stderr,
        )
        return 1
    scores = gzip.decompress(full_path("uniprot_human_annotation_scores").read_bytes()).decode(
        "utf-8"
    )
    hgnc_ids = {m.decode("ascii") for m in _HGNC_REF.findall(xml)}
    hgnc = cut_hgnc(full_path("hgnc_complete_set").read_text(encoding="utf-8"), wanted, hgnc_ids)
    contents = {
        "uniprot_human_xml": gzip_bytes(xml),
        "uniprot_human_annotation_scores": gzip_bytes(cut_tsv(scores, wanted).encode("utf-8")),
        "hgnc_complete_set": gzip_bytes(hgnc.encode("utf-8")),
    }
    artifacts = dict(lock.artifacts)
    for artifact_id, data in contents.items():
        relative = SNAPSHOT_FILES[artifact_id]
        write_if_changed(FORGE_ROOT / relative, data)
        size, digest = sha256_file(FORGE_ROOT / relative)
        counted = artifact_id != "hgnc_complete_set"
        sample = Variant(
            bytes=size,
            sha256=digest,
            url=None,
            path=relative,
            reported_records=len(accessions) if counted else None,
            reported_by="the sample accession list, snapshots/sample-accessions.tsv"
            if counted
            else None,
        )
        artifacts[artifact_id] = replace(
            artifacts[artifact_id], variants={**artifacts[artifact_id].variants, "sample": sample}
        )
        print(f"{relative}: {size} bytes, SHA-256 {digest}")
    DEFAULT_LOCK.write_text(format_lock(Lock(artifacts)), encoding="utf-8")
    print(f"wrote {DEFAULT_LOCK.name}")
    return 0
