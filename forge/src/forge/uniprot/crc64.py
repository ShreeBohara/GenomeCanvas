"""UniProt's sequence checksum: CRC-64 with the ISO 3309 polynomial.

UniProt prints it as 16 upper-case hexadecimal digits beside every sequence.
Recomputing it is how the Forge knows a sequence arrived exactly as UniProt
published it, letter for letter.
"""

from __future__ import annotations

from typing import Final

# x^64 + x^4 + x^3 + x + 1, bit-reversed, as in SWISS-PROT's original code.
_POLYNOMIAL: Final = 0xD800000000000000


def _table() -> tuple[int, ...]:
    table: list[int] = []
    for byte in range(256):
        value = byte
        for _ in range(8):
            value = (value >> 1) ^ _POLYNOMIAL if value & 1 else value >> 1
        table.append(value)
    return tuple(table)


_TABLE: Final = _table()


def crc64(sequence: str) -> str:
    crc = 0
    for byte in sequence.encode("ascii"):
        crc = _TABLE[(crc ^ byte) & 0xFF] ^ (crc >> 8)
    return f"{crc:016X}"
