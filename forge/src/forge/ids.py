"""Identifier rules shared with `packages/protocol`.

Both languages test against `packages/protocol/vectors/uniprot-accessions.json`,
so a change to the pattern here must be made there too or a test goes red.
"""

from __future__ import annotations

import re
from typing import Final

# UniProt's published pattern (https://www.uniprot.org/help/accession_numbers),
# anchored with \A and \Z rather than ^ and $, because $ also matches before a
# trailing newline and "P38398\n" is not an accession.
UNIPROT_ACCESSION: Final = re.compile(
    r"\A(?:[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9](?:[A-Z][A-Z0-9]{2}[0-9]){1,2})\Z"
)


def is_uniprot_accession(value: str) -> bool:
    return UNIPROT_ACCESSION.match(value) is not None
