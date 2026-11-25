"""The lock file: every upstream file a build may read, pinned by size and SHA-256.

`forge/downloads.lock.json` names each artifact once, with two variants: `full`,
a URL to download, and `sample`, a small snapshot committed to the repository.
A build reads exactly the bytes the lock names and stops if they differ.
Changing the lock is a separate command (`python -m forge lock refresh`).
"""

from __future__ import annotations

import hashlib
import json
from collections.abc import Mapping
from dataclasses import dataclass
from pathlib import Path
from typing import Final, Literal

LOCK_FORMAT: Final = "forge-lock/1"
FORGE_ROOT: Final = Path(__file__).resolve().parents[3]
DEFAULT_LOCK: Final = FORGE_ROOT / "downloads.lock.json"

Profile = Literal["sample", "full"]
PROFILES: Final[tuple[Profile, ...]] = ("sample", "full")


class LockError(ValueError):
    """The lock file is malformed, or a file does not match it."""


@dataclass(frozen=True, slots=True)
class Variant:
    bytes: int
    sha256: str
    # Exactly one of these: a URL for `full`, a path under forge/ for `sample`.
    url: str | None
    path: str | None
    # How many records the file holds, as the upstream source itself reports
    # (for UniProt, the API's count for the pinned release). Checks compare
    # the parsed table with it. None where the source reports no count.
    reported_records: int | None
    reported_by: str | None


@dataclass(frozen=True, slots=True)
class Artifact:
    id: str
    source: str
    release: str
    description: str
    variants: Mapping[Profile, Variant]

    def variant(self, profile: Profile) -> Variant:
        return self.variants[profile]


@dataclass(frozen=True, slots=True)
class Lock:
    artifacts: Mapping[str, Artifact]

    def artifact(self, artifact_id: str) -> Artifact:
        if artifact_id not in self.artifacts:
            raise LockError(f"no artifact {artifact_id!r} in the lock file")
        return self.artifacts[artifact_id]


def _sha(value: object, where: str) -> str:
    if (
        not isinstance(value, str)
        or len(value) != 64
        or any(c not in "0123456789abcdef" for c in value)
    ):
        raise LockError(f"{where}: sha256 must be 64 lower-case hexadecimal digits")
    return value


def _variant(raw: object, profile: Profile, where: str) -> Variant:
    if not isinstance(raw, dict):
        raise LockError(f"{where}: must be an object")
    size = raw.get("bytes")
    if not isinstance(size, int) or isinstance(size, bool) or size <= 0:
        raise LockError(f"{where}: bytes must be a positive whole number")
    url = raw.get("url")
    path = raw.get("path")
    if profile == "full" and (not isinstance(url, str) or not url.startswith("https://") or path):
        raise LockError(f"{where}: a full variant needs an https url and no path")
    if profile == "sample" and (
        not isinstance(path, str) or url or path.startswith("/") or ".." in path
    ):
        raise LockError(f"{where}: a sample variant needs a relative path inside forge/ and no url")
    records = raw.get("reported_records")
    if records is not None and (not isinstance(records, int) or isinstance(records, bool)):
        raise LockError(f"{where}: reported_records must be a whole number or absent")
    reported_by = raw.get("reported_by")
    if (records is None) != (reported_by is None):
        raise LockError(f"{where}: reported_records and reported_by go together")
    unknown = sorted(
        set(raw) - {"bytes", "sha256", "url", "path", "reported_records", "reported_by"}
    )
    if unknown:
        raise LockError(f"{where}: unknown field(s) {', '.join(unknown)}")
    return Variant(
        bytes=size,
        sha256=_sha(raw.get("sha256"), where),
        url=url if isinstance(url, str) else None,
        path=path if isinstance(path, str) else None,
        reported_records=records,
        reported_by=reported_by if isinstance(reported_by, str) else None,
    )


def parse_lock(text: str) -> Lock:
    try:
        data = json.loads(text)
    except json.JSONDecodeError as error:
        raise LockError(f"the lock file is not valid JSON: {error}") from error
    if not isinstance(data, dict) or data.get("format") != LOCK_FORMAT:
        raise LockError(f"the lock file must be an object with format {LOCK_FORMAT!r}")
    raw_artifacts = data.get("artifacts")
    if not isinstance(raw_artifacts, dict) or not raw_artifacts:
        raise LockError("the lock file names no artifacts")
    artifacts: dict[str, Artifact] = {}
    for artifact_id, raw in raw_artifacts.items():
        where = f"artifact {artifact_id}"
        if not isinstance(raw, dict):
            raise LockError(f"{where}: must be an object")
        for key in ("source", "release", "description"):
            if not isinstance(raw.get(key), str) or not raw[key]:
                raise LockError(f"{where}: {key} must be non-empty text")
        variants: dict[Profile, Variant] = {}
        for profile in PROFILES:
            if profile not in raw:
                raise LockError(f"{where}: no {profile} variant")
            variants[profile] = _variant(raw[profile], profile, f"{where}, {profile}")
        unknown = sorted(set(raw) - {"source", "release", "description", *PROFILES})
        if unknown:
            raise LockError(f"{where}: unknown field(s) {', '.join(unknown)}")
        artifacts[artifact_id] = Artifact(
            id=artifact_id,
            source=raw["source"],
            release=raw["release"],
            description=raw["description"],
            variants=variants,
        )
    return Lock(artifacts)


def read_lock(path: Path = DEFAULT_LOCK) -> Lock:
    return parse_lock(path.read_text(encoding="utf-8"))


def _variant_document(variant: Variant) -> dict[str, object]:
    document: dict[str, object] = {"bytes": variant.bytes, "sha256": variant.sha256}
    if variant.url is not None:
        document["url"] = variant.url
    if variant.path is not None:
        document["path"] = variant.path
    if variant.reported_records is not None:
        document["reported_records"] = variant.reported_records
        document["reported_by"] = variant.reported_by
    return document


def format_lock(lock: Lock) -> str:
    """Canonical text for the lock file: sorted keys, two-space indent, final newline."""
    document = {
        "artifacts": {
            a.id: {
                "description": a.description,
                "release": a.release,
                "source": a.source,
                **{p: _variant_document(a.variant(p)) for p in PROFILES},
            }
            for a in lock.artifacts.values()
        },
        "format": LOCK_FORMAT,
    }
    return json.dumps(document, indent=2, sort_keys=True, ensure_ascii=False) + "\n"


def sha256_file(path: Path) -> tuple[int, str]:
    """Size and SHA-256 of a file, read in pieces."""
    digest = hashlib.sha256()
    size = 0
    with path.open("rb") as handle:
        while chunk := handle.read(1 << 20):
            digest.update(chunk)
            size += len(chunk)
    return size, digest.hexdigest()


def verify_file(path: Path, variant: Variant, label: str) -> None:
    """Raise LockError unless the file has exactly the size and SHA-256 the lock names."""
    size, digest = sha256_file(path)
    if size != variant.bytes or digest != variant.sha256:
        raise LockError(
            f"{label}: {path.name} is {size} bytes with SHA-256 {digest}, but the lock "
            f"names {variant.bytes} bytes with SHA-256 {variant.sha256}. The build reads "
            "only the pinned bytes; refresh the lock on purpose if upstream has changed."
        )
