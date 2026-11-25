"""The naming rule for files in a release, shared with `packages/protocol`.

The Worker decides how long a file may be cached from its name alone: a name
that carries a prefix of the file's SHA-256 never changes its bytes. Both
languages test against `packages/protocol/vectors/release-file-names.json`, so
a change here must be made there too or a test goes red.
"""

from __future__ import annotations

import re
from typing import Final

MANIFEST_FILE: Final = "manifest.json"
MAX_NAME_LENGTH: Final = 128
EXTENSIONS: Final = frozenset({"bin", "bcif", "json", "parquet"})

# \A and \Z, not ^ and $: Python's $ also matches before a trailing newline.
_SEGMENT: Final = re.compile(r"\A[a-z0-9]+(?:[._-][a-z0-9]+)*\Z")
_CONTENT_HASHED: Final = re.compile(r"\A[a-z0-9]+(?:[._-][a-z0-9]+)*\.[0-9a-f]{16}\.[a-z0-9]+\Z")


def is_release_name(value: str) -> bool:
    return len(value) <= MAX_NAME_LENGTH and _SEGMENT.match(value) is not None


def is_content_hashed(name: str) -> bool:
    return len(name) <= MAX_NAME_LENGTH and _CONTENT_HASHED.match(name) is not None


def is_servable(name: str) -> bool:
    """Whether a release may contain a file by this name: the manifest, or a hashed data file."""
    if len(name) > MAX_NAME_LENGTH or _SEGMENT.match(name) is None:
        return False
    if name.rsplit(".", 1)[-1] not in EXTENSIONS:
        return False
    return name == MANIFEST_FILE or is_content_hashed(name)
