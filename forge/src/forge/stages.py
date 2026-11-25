"""Every stage of the Forge, in the order they are declared.

A new source plugs in by adding its stage here; the runner works out the
order to run them in from what each reads.
"""

from __future__ import annotations

from typing import Final

from forge.identity.stage import CROSSWALK_STAGE, HGNC_STAGE
from forge.pipeline.stage import Stage
from forge.uniprot.stage import EVIDENCE_STAGE, UNIPROT_STAGE

STAGES: Final[tuple[Stage, ...]] = (UNIPROT_STAGE, EVIDENCE_STAGE, HGNC_STAGE, CROSSWALK_STAGE)
