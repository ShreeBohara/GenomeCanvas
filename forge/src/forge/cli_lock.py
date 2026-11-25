"""`python -m forge lock`: verify the committed snapshots, or pin newer upstream files.

Refreshing is the one place the lock changes, and it is never part of a build.
It asks upstream what the current release is and how many records it holds,
and downloads a file only when it may have changed (its release or size
differs from the lock), so checking for a new release costs a few requests.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.parse
from dataclasses import replace
from pathlib import Path
from typing import Final

from forge.pipeline import fetch
from forge.pipeline.lock import (
    DEFAULT_LOCK,
    FORGE_ROOT,
    Artifact,
    Lock,
    LockError,
    Variant,
    format_lock,
    read_lock,
    verify_file,
)

UNIPROT_DIVISION: Final = "https://ftp.uniprot.org/pub/databases/uniprot/current_release/knowledgebase/taxonomic_divisions/"
UNIPROT_XML_URL: Final = UNIPROT_DIVISION + "uniprot_sprot_human.xml.gz"
UNIPROT_RELDATE_URL: Final = UNIPROT_DIVISION + "reldate.txt"
UNIPROT_QUERY: Final = "(organism_id:9606) AND (reviewed:true)"
UNIPROT_COUNT_URL: Final = "https://rest.uniprot.org/uniprotkb/search?" + urllib.parse.urlencode(
    {"query": UNIPROT_QUERY, "size": "1", "format": "list"}
)
UNIPROT_SCORES_URL: Final = "https://rest.uniprot.org/uniprotkb/stream?" + urllib.parse.urlencode(
    {
        "compressed": "true",
        "fields": "accession,annotation_score",
        "format": "tsv",
        "query": UNIPROT_QUERY,
        "sort": "accession asc",
    }
)
HGNC_LISTING_URL: Final = (
    "https://storage.googleapis.com/storage/v1/b/public-download-files/o?"
    "prefix=hgnc/archive/archive/monthly/tsv/hgnc_complete_set_&fields=items(name,size)"
)
HGNC_FILE_URL: Final = "https://storage.googleapis.com/public-download-files/"
REFRESHERS: Final = ("uniprot", "hgnc")

_RELEASE: Final = re.compile(r"UniProtKB/Swiss-Prot Release (\d{4}_\d{2}) of")
_HGNC_NAME: Final = re.compile(
    r"\Ahgnc/archive/archive/monthly/tsv/hgnc_complete_set_(\d{4}-\d{2}-\d{2})\.tsv\Z"
)


def parse_reldate(text: str) -> str:
    """The Swiss-Prot release named in UniProt's reldate.txt, for example 2026_04."""
    match = _RELEASE.search(text)
    if match is None:
        raise LockError("reldate.txt names no Swiss-Prot release")
    return match.group(1)


def latest_hgnc(listing: object) -> tuple[str, str, int]:
    """The newest monthly HGNC archive: (date, object name, size)."""
    items = listing.get("items", []) if isinstance(listing, dict) else []
    found: list[tuple[str, str, int]] = []
    for item in items:
        if not isinstance(item, dict):
            continue
        match = _HGNC_NAME.match(str(item.get("name", "")))
        if match:
            found.append((match.group(1), str(item["name"]), int(item.get("size", 0))))
    if not found:
        raise LockError("HGNC's archive lists no monthly complete set")
    return max(found)


def verify() -> int:
    lock = read_lock()
    problems = 0
    for artifact in lock.artifacts.values():
        variant = artifact.variant("sample")
        path = FORGE_ROOT / str(variant.path)
        try:
            verify_file(path, variant, f"{artifact.id} (sample)")
            print(f"ok       {artifact.id}: {variant.path}, {variant.bytes} bytes")
        except (LockError, OSError) as error:
            problems += 1
            print(f"MISMATCH {artifact.id}: {error}", file=sys.stderr)
    return 1 if problems else 0


def _pin(
    artifact: Artifact,
    url: str,
    cache: Path,
    release: str,
    records: int | None,
    reported_by: str | None,
) -> Artifact:
    staging = cache / "downloads" / "incoming" / f"refresh-{artifact.id}"
    fetched = fetch.fetch_unpinned(url, staging)
    target = cache / "downloads" / fetched.sha256
    staging.replace(target)
    print(f"  downloaded {fetched.bytes} bytes, SHA-256 {fetched.sha256}")
    full = Variant(
        bytes=fetched.bytes,
        sha256=fetched.sha256,
        url=url,
        path=None,
        reported_records=records,
        reported_by=reported_by,
    )
    return replace(artifact, release=release, variants={**artifact.variants, "full": full})


def _write(lock: Lock, changed: dict[str, Artifact]) -> None:
    updated = Lock({**lock.artifacts, **changed})
    DEFAULT_LOCK.write_text(format_lock(updated), encoding="utf-8")
    print(f"wrote {DEFAULT_LOCK.name}; re-cut the sample snapshots if the release changed")


def refresh(source: str, cache: Path) -> int:
    lock = read_lock()
    changed: dict[str, Artifact] = {}
    if source == "uniprot":
        with fetch._open(UNIPROT_RELDATE_URL) as response:
            release = parse_reldate(response.read().decode("utf-8"))
        headers = fetch.head(UNIPROT_COUNT_URL)
        api_release = headers.get("x-uniprot-release")
        if api_release != release:
            print(
                f"the FTP site has {release} and the API {api_release}; try again later",
                file=sys.stderr,
            )
            return 1
        count = int(headers["x-total-results"])
        reported_by = f"UniProt REST API, X-Total-Results for {UNIPROT_QUERY}, release {release}"
        xml = lock.artifact("uniprot_human_xml")
        size = int(fetch.head(UNIPROT_XML_URL).get("content-length", "0"))
        print(f"UniProt {release}: {count} reviewed human entries; XML is {size} bytes")
        if xml.release == release and xml.variant("full").bytes == size:
            print("  unchanged since the lock was written; nothing downloaded")
            return 0
        changed[xml.id] = _pin(xml, UNIPROT_XML_URL, cache, release, count, reported_by)
        scores = lock.artifact("uniprot_human_annotation_scores")
        changed[scores.id] = _pin(scores, UNIPROT_SCORES_URL, cache, release, count, reported_by)
    else:
        with fetch._open(HGNC_LISTING_URL) as response:
            day, name, size = latest_hgnc(json.loads(response.read()))
        hgnc = lock.artifact("hgnc_complete_set")
        print(f"HGNC: newest monthly archive {day}, {size} bytes")
        if hgnc.release == day:
            print("  unchanged since the lock was written; nothing downloaded")
            return 0
        changed[hgnc.id] = _pin(hgnc, HGNC_FILE_URL + name, cache, day, None, None)
    _write(lock, changed)
    return 0
