"""A PROPOSED mapping from UniProt's evidence codes to the plan's four kinds.

This mapping needs review by a biologist before anything shown to a reader
depends on it. It is written as a table so the review can be done line by line.

UniProt tags statements with codes from the Evidence and Conclusion Ontology
(ECO); each code combines the type of evidence with whether a person or a
program made the assertion. Plan section 4.10 asks every value to say whether
it is measured (someone observed it), curated (an expert database asserts it),
predicted (a model computed it) or generated (a language model wrote it).
UniProt evidence never means "generated".

Labels are from UniProt's help page on evidences
(https://www.uniprot.org/help/evidences, last modified 2025-11-26, read
2026-11-25), which also lists each GO evidence code's ECO equivalent.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from typing import Final, Literal

EvidenceKind = Literal["measured", "curated", "predicted"]

REVIEW_STATUS: Final = "proposed; needs review by a biologist"

# Rank used when a row carries several codes: the row takes the most direct
# kind among them. Proposed, like the mapping.
_RANK: Final[Mapping[EvidenceKind, int]] = {"measured": 0, "curated": 1, "predicted": 2}


@dataclass(frozen=True, slots=True)
class EvidenceCode:
    code: str
    label: str
    go_code: str | None
    assertion: Literal["manual", "automatic"]
    kind: EvidenceKind
    rationale: str


EVIDENCE_CODES: Final[tuple[EvidenceCode, ...]] = (
    EvidenceCode(
        "ECO:0000269",
        "Experimental evidence used in manual assertion",
        "EXP",
        "manual",
        "measured",
        "A curator cites a published experiment that observed it.",
    ),
    EvidenceCode(
        "ECO:0000314",
        "Direct assay evidence used in manual assertion",
        "IDA",
        "manual",
        "measured",
        "A direct assay observed it.",
    ),
    EvidenceCode(
        "ECO:0000315",
        "Mutant phenotype evidence used in manual assertion",
        "IMP",
        "manual",
        "measured",
        "Observed as a change when the gene product was altered.",
    ),
    EvidenceCode(
        "ECO:0000316",
        "Genetic interaction evidence used in manual assertion",
        "IGI",
        "manual",
        "measured",
        "Observed in a genetic interaction experiment.",
    ),
    EvidenceCode(
        "ECO:0000353",
        "Physical interaction evidence used in manual assertion",
        "IPI",
        "manual",
        "measured",
        "Observed as a physical interaction.",
    ),
    EvidenceCode(
        "ECO:0000270",
        "Expression pattern evidence used in manual assertion",
        "IEP",
        "manual",
        "measured",
        "Inferred from where or when the gene is expressed, which was observed. "
        "Arguably curated, since the link from expression to function is an inference.",
    ),
    EvidenceCode(
        "ECO:0006056",
        "High throughput evidence used in manual assertion",
        "HTP",
        "manual",
        "measured",
        "Observed in a high-throughput experiment.",
    ),
    EvidenceCode(
        "ECO:0007005",
        "High throughput direct assay evidence used in manual assertion",
        "HDA",
        "manual",
        "measured",
        "Observed in a high-throughput direct assay.",
    ),
    EvidenceCode(
        "ECO:0007001",
        "High throughput mutant phenotype evidence used in manual assertion",
        "HMP",
        "manual",
        "measured",
        "Observed in a high-throughput mutant screen.",
    ),
    EvidenceCode(
        "ECO:0007007",
        "High throughput expression pattern evidence used in manual assertion",
        "HEP",
        "manual",
        "measured",
        "Observed expression pattern from a high-throughput study; the same caveat as IEP.",
    ),
    EvidenceCode(
        "ECO:0007744",
        "Combinatorial computational and experimental evidence used in manual assertion",
        None,
        "manual",
        "measured",
        "Large-scale experiments, mostly proteomics, analysed computationally and "
        "checked by a curator. Could be argued curated.",
    ),
    EvidenceCode(
        "ECO:0007829",
        "Combinatorial computational and experimental evidence used in automatic assertion",
        None,
        "automatic",
        "measured",
        "Mostly secondary structure (helix, strand, turn) read from an experimental "
        "structure in the PDB by a program. The structure was observed; the reading "
        "of it was automatic.",
    ),
    EvidenceCode(
        "ECO:0000303",
        "Non-traceable author statement used in manual assertion",
        "NAS",
        "manual",
        "curated",
        "An author's statement without experimental support, recorded by a curator.",
    ),
    EvidenceCode(
        "ECO:0000304",
        "Traceable author statement used in manual assertion",
        "TAS",
        "manual",
        "curated",
        "A statement from a review or textbook, recorded by a curator.",
    ),
    EvidenceCode(
        "ECO:0000305",
        "Curator inference used in manual assertion",
        "IC",
        "manual",
        "curated",
        "Inferred by a curator from their knowledge or an article.",
    ),
    EvidenceCode(
        "ECO:0000312",
        "Imported information used in manual assertion",
        None,
        "manual",
        "curated",
        "Taken from another database record and accepted by a curator.",
    ),
    EvidenceCode(
        "ECO:0000250",
        "Sequence similarity evidence used in manual assertion",
        "ISS",
        "manual",
        "curated",
        "A curator transferred it from a similar, characterised protein. An inference, "
        "but made and checked by a person, so not 'a model computed it'. A reviewer "
        "may prefer predicted.",
    ),
    EvidenceCode(
        "ECO:0000266",
        "Sequence orthology evidence used in manual assertion",
        "ISO",
        "manual",
        "curated",
        "Transferred from an experimentally characterised orthologue by a curator; "
        "the same reasoning as ISS.",
    ),
    EvidenceCode(
        "ECO:0000247",
        "Sequence alignment evidence used in manual assertion",
        "ISA",
        "manual",
        "curated",
        "Inferred from an alignment and asserted by a curator; the same reasoning as ISS.",
    ),
    EvidenceCode(
        "ECO:0000318",
        "Biological aspect of ancestor evidence used in manual assertion",
        "IBA",
        "manual",
        "predicted",
        "Phylogenetic inference (GO's PAINT project): computed from a gene tree, then "
        "reviewed. Could be argued curated.",
    ),
    EvidenceCode(
        "ECO:0000255",
        "Match to sequence model evidence used in manual assertion",
        "ISM",
        "manual",
        "predicted",
        "A sequence model (for example a PROSITE or HMM profile) computed it and a "
        "curator accepted it. Could be argued curated.",
    ),
    EvidenceCode(
        "ECO:0000256",
        "Match to sequence model evidence used in automatic assertion",
        None,
        "automatic",
        "predicted",
        "A sequence model computed it and no person checked it.",
    ),
    EvidenceCode(
        "ECO:0000501",
        "Evidence used in automatic assertion",
        "IEA",
        "automatic",
        "predicted",
        "Assigned by a program without review (GO's IEA).",
    ),
)

KIND_BY_CODE: Final[Mapping[str, EvidenceKind]] = {e.code: e.kind for e in EVIDENCE_CODES}


def kind_of(codes: Iterable[str]) -> EvidenceKind | None:
    """The proposed kind for a row with these codes, or None if it has none.

    A code with no proposed kind gives None as well; the check
    `every evidence code has a proposed kind` then fails the build, so an
    unmapped code never passes silently as some other kind.
    """
    kinds: list[EvidenceKind] = []
    for code in codes:
        kind = KIND_BY_CODE.get(code)
        if kind is None:
            return None
        kinds.append(kind)
    if not kinds:
        return None
    return min(kinds, key=lambda k: _RANK[k])


def text_kind_of(codes: Iterable[str]) -> EvidenceKind | None:
    """Like `kind_of`, for free text a curator wrote: never more than curated.

    The text summarising an experiment is the curator's wording, so the plan's
    own example puts UniProt function text under curated even when the cited
    evidence is experimental.
    """
    kind = kind_of(codes)
    return "curated" if kind == "measured" else kind
