from __future__ import annotations

from forge.uniprot.crc64 import crc64


def test_matches_uniprot_for_a_real_sequence() -> None:
    # Insulin (P01308), checksum as printed by UniProt.
    insulin = (
        "MALWMRLLPLLALLALWGPDPAAAFVNQHLCGSHLVEALYLVCGERGFFYTPKTRREAEDLQVGQVELGGGPGAGSLQ"
        "PLALEGSLQKRGIVEQCCTSICSLYQLENYCN"
    )
    assert crc64(insulin) == "C2C3B23B85E520E5"


def test_one_letter_changes_the_checksum() -> None:
    assert crc64("MKTAYIAKQR") != crc64("MKTAYIAKQK")


def test_empty_sequence() -> None:
    assert crc64("") == "0000000000000000"
