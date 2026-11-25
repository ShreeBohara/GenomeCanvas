"""The points format, version 0. The specification is `docs/formats/points-v0.md`.

Little-endian throughout:

    offset  size  field
    0       4     magic, the ASCII bytes "GCPT"
    4       2     format version, uint16, 0
    6       2     header length in bytes, uint16, 16
    8       4     row count n, uint32
    12      4     reserved, uint32, 0
    16      4n    x, float32 per row
    16+4n   4n    y, float32 per row
    16+8n   n     category, uint8 per row
"""

from __future__ import annotations

import math
import struct
from collections.abc import Sequence
from dataclasses import dataclass
from typing import Final

MAGIC: Final = b"GCPT"
VERSION: Final = 0
HEADER_LENGTH: Final = 16
FORMAT_NAME: Final = "points/0"
# The category byte is an index into the manifest's category list.
MAX_CATEGORIES: Final = 256
# A float32 that overflows becomes infinity, which the decoder rejects; refuse it here first.
FLOAT32_MAX: Final = 3.4028234663852886e38

_HEADER: Final = struct.Struct("<4sHHII")


class PointsEncodingError(ValueError):
    """Raised when rows cannot be written as points version 0."""


@dataclass(frozen=True, slots=True)
class Point:
    x: float
    y: float
    category: int


def encoded_length(row_count: int) -> int:
    return HEADER_LENGTH + 9 * row_count


def encode_points(points: Sequence[Point]) -> bytes:
    n = len(points)
    for i, p in enumerate(points):
        for axis, value in (("x", p.x), ("y", p.y)):
            if not math.isfinite(value) or abs(value) > FLOAT32_MAX:
                raise PointsEncodingError(f"row {i}: {axis} = {value!r} is not a finite float32")
        if not 0 <= p.category < MAX_CATEGORIES:
            raise PointsEncodingError(f"row {i}: category {p.category} does not fit in one byte")

    header = _HEADER.pack(MAGIC, VERSION, HEADER_LENGTH, n, 0)
    xs = struct.pack(f"<{n}f", *(p.x for p in points))
    ys = struct.pack(f"<{n}f", *(p.y for p in points))
    categories = bytes(p.category for p in points)
    out = header + xs + ys + categories
    assert len(out) == encoded_length(n)  # noqa: S101 -- an internal invariant, not input checking
    return out
