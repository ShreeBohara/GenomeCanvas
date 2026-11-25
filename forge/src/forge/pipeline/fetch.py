"""The only module in the Forge that opens a network connection.

It downloads a pinned file into the cache, hashing while it writes, and keeps
it only if the bytes are the ones the lock names. A file already in the cache
under its hash is never fetched again. `head` and `fetch_unpinned` exist for
refreshing the lock; a build never calls them.
"""

from __future__ import annotations

import hashlib
import urllib.request
from dataclasses import dataclass
from http.client import HTTPResponse
from pathlib import Path
from typing import Final

from forge.pipeline.lock import LockError, Variant

USER_AGENT: Final = "GenomeCanvas-Forge/0.1 (open-source data pipeline)"
TIMEOUT_SECONDS: Final = 120


@dataclass(frozen=True, slots=True)
class Fetched:
    path: Path
    bytes: int
    sha256: str
    headers: dict[str, str]


def _open(url: str, method: str = "GET") -> HTTPResponse:
    if not url.startswith("https://"):
        raise LockError(f"refusing to fetch {url}: only https URLs are allowed")
    request = urllib.request.Request(url, method=method, headers={"User-Agent": USER_AGENT})  # noqa: S310 - https only, checked above
    response: HTTPResponse = urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS)  # noqa: S310
    return response


def fetch_unpinned(url: str, destination: Path) -> Fetched:
    """Download a URL to `destination`, returning its size, hash and response headers."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    partial = destination.with_name(destination.name + ".partial")
    digest = hashlib.sha256()
    size = 0
    with _open(url) as response, partial.open("wb") as out:
        headers = {k.lower(): v for k, v in response.headers.items()}
        while chunk := response.read(1 << 20):
            digest.update(chunk)
            out.write(chunk)
            size += len(chunk)
    partial.replace(destination)
    return Fetched(destination, size, digest.hexdigest(), headers)


def fetch_pinned(variant: Variant, downloads: Path, label: str) -> Path:
    """The cached file for a pinned variant, downloading it first if it is not cached."""
    if variant.url is None:
        raise LockError(f"{label}: has no URL to download from")
    target = downloads / variant.sha256
    if target.exists():
        return target
    staging = downloads / "incoming" / variant.sha256
    fetched = fetch_unpinned(variant.url, staging)
    if fetched.bytes != variant.bytes or fetched.sha256 != variant.sha256:
        staging.unlink()
        raise LockError(
            f"{label}: {variant.url} served {fetched.bytes} bytes with SHA-256 "
            f"{fetched.sha256}, but the lock names {variant.bytes} bytes with SHA-256 "
            f"{variant.sha256}. Upstream has changed; nothing was kept."
        )
    staging.replace(target)
    return target


def head(url: str) -> dict[str, str]:
    with _open(url, method="HEAD") as response:
        return {k.lower(): v for k, v in response.headers.items()}
