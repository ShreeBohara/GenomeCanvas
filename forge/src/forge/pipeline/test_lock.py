from __future__ import annotations

import hashlib
import json
from pathlib import Path

import pytest

from forge.pipeline.lock import (
    DEFAULT_LOCK,
    FORGE_ROOT,
    LockError,
    format_lock,
    parse_lock,
    read_lock,
    verify_file,
)

SHA = "a" * 64


def _document(**full: object) -> str:
    return json.dumps(
        {
            "format": "forge-lock/1",
            "artifacts": {
                "thing": {
                    "source": "uniprot",
                    "release": "2026_04",
                    "description": "A file.",
                    "full": {"bytes": 10, "sha256": SHA, "url": "https://example.org/x", **full},
                    "sample": {"bytes": 5, "sha256": SHA, "path": "snapshots/x"},
                }
            },
        }
    )


def test_a_valid_lock_round_trips_through_its_canonical_text() -> None:
    lock = parse_lock(_document())
    assert parse_lock(format_lock(lock)) == lock


def test_the_committed_lock_is_valid_and_canonical() -> None:
    text = DEFAULT_LOCK.read_text(encoding="utf-8")
    assert format_lock(parse_lock(text)) == text


def test_plain_http_is_refused() -> None:
    with pytest.raises(LockError, match="https url"):
        parse_lock(_document(url="http://example.org/x"))


def test_a_count_needs_to_say_who_reported_it() -> None:
    with pytest.raises(LockError, match="go together"):
        parse_lock(_document(reported_records=3))


def test_a_file_with_other_bytes_is_refused(tmp_path: Path) -> None:
    path = tmp_path / "x"
    path.write_bytes(b"0123456789")
    variant = parse_lock(_document()).artifact("thing").variant("full")
    with pytest.raises(LockError, match="the lock names 10 bytes"):
        verify_file(path, variant, "thing")


def test_committed_snapshots_match_the_lock() -> None:
    for artifact in read_lock().artifacts.values():
        variant = artifact.variant("sample")
        data = (FORGE_ROOT / str(variant.path)).read_bytes()
        assert (len(data), hashlib.sha256(data).hexdigest()) == (variant.bytes, variant.sha256)
