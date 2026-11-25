"""Read UniProt's XML one entry at a time and turn each entry into table rows.

The input is UniProt's own XML format (https://www.uniprot.org/docs/uniprot.xsd),
read as a stream so that the whole human proteome never sits in memory. Each
entry becomes plain rows for the tables in `forge.uniprot.tables`. Anything the
parser does not take is counted in `ParseReport`, never discarded unnoticed.

The file is a pinned download whose SHA-256 is checked before it is read.
ElementTree never resolves external entities, and expat 2.4 and later limit
entity expansion, so a hostile file cannot reach the network or exhaust memory
that way.
"""

from __future__ import annotations

import hashlib
import xml.etree.ElementTree as ET
from collections import Counter
from collections.abc import Iterator
from dataclasses import dataclass, field
from typing import Final, Protocol

from forge.uniprot.evidence import kind_of, text_kind_of

NS: Final = "{https://uniprot.org/uniprot}"
STANDARD_RESIDUES: Final = frozenset("ACDEFGHIKLMNPQRSTVWY")

PROTEIN_EXISTENCE_LEVELS: Final = {
    "evidence at protein level": 1,
    "evidence at transcript level": 2,
    "inferred from homology": 3,
    "predicted": 4,
    "uncertain": 5,
}
GO_ASPECTS: Final = {
    "C": "cellular component",
    "F": "molecular function",
    "P": "biological process",
}

# Comment types whose content goes to tables other than `comments`, or that a
# later step owns. Their text, if any, still goes to `comments`.
_STRUCTURED_ELSEWHERE: Final = frozenset(
    {"subcellular location", "disease", "alternative products"}
)


class Readable(Protocol):
    def read(self, size: int = -1, /) -> bytes: ...


Row = dict[str, object]
Evidence = dict[str, str | None]


@dataclass
class ParseReport:
    """What the parser saw and what it left for later steps, by name and count."""

    entries: int = 0
    # Comments with no text at all and no table of their own in this step,
    # for example 'interaction' (owned by the knowledge graph, step 2C).
    comments_without_text: Counter[str] = field(default_factory=Counter)
    unknown_evidence_keys: int = 0

    def as_dict(self) -> dict[str, object]:
        return {
            "entries": self.entries,
            "comments_not_taken_in_this_step": dict(sorted(self.comments_without_text.items())),
            "unknown_evidence_keys": self.unknown_evidence_keys,
        }


@dataclass
class EntryRows:
    accession: str
    tables: dict[str, list[Row]]


def _q(tag: str) -> str:
    return NS + tag


def _text(element: ET.Element | None) -> str | None:
    if element is None or element.text is None:
        return None
    return element.text


def _required_text(element: ET.Element | None, what: str, accession: str) -> str:
    value = _text(element)
    if value is None:
        raise ValueError(f"{accession}: entry has no {what}")
    return value


def _evidence_map(entry: ET.Element) -> dict[str, Evidence]:
    found: dict[str, Evidence] = {}
    for element in entry.findall(_q("evidence")):
        key = element.get("key")
        code = element.get("type")
        if key is None or code is None:
            continue
        reference = element.find(f"{_q('source')}/{_q('dbReference')}")
        source = None
        if reference is not None and reference.get("type") and reference.get("id"):
            source = f"{reference.get('type')}:{reference.get('id')}"
        found[key] = {"code": code, "source": source}
    return found


class _EvidenceResolver:
    def __init__(self, evidence: dict[str, Evidence], report: ParseReport) -> None:
        self._evidence = evidence
        self._report = report

    def resolve(self, *elements: ET.Element | None) -> list[Evidence]:
        """Evidence of the elements, de-duplicated, in the order UniProt lists it."""
        seen: set[str] = set()
        resolved: list[Evidence] = []
        for element in elements:
            if element is None:
                continue
            for key in (element.get("evidence") or "").split():
                if key in seen:
                    continue
                seen.add(key)
                item = self._evidence.get(key)
                if item is None:
                    self._report.unknown_evidence_keys += 1
                    continue
                resolved.append(item)
        return resolved


def _codes(evidence: list[Evidence]) -> list[str]:
    return [str(e["code"]) for e in evidence]


def _int(value: str | None) -> int | None:
    return int(value) if value is not None else None


def _location(feature: ET.Element) -> Row:
    location = feature.find(_q("location"))
    if location is None:
        return {
            "begin": None,
            "end": None,
            "begin_status": "unknown",
            "end_status": "unknown",
            "location_sequence": None,
        }
    position = location.find(_q("position"))
    if position is not None:
        status = position.get("status", "certain")
        value = _int(position.get("position"))
        return {
            "begin": value,
            "end": value,
            "begin_status": status,
            "end_status": status,
            "location_sequence": location.get("sequence"),
        }
    begin = location.find(_q("begin"))
    end = location.find(_q("end"))
    return {
        "begin": _int(begin.get("position")) if begin is not None else None,
        "end": _int(end.get("position")) if end is not None else None,
        "begin_status": begin.get("status", "certain") if begin is not None else "unknown",
        "end_status": end.get("status", "certain") if end is not None else "unknown",
        "location_sequence": location.get("sequence"),
    }


def _ligand(element: ET.Element | None) -> tuple[str | None, str | None]:
    if element is None:
        return None, None
    reference = element.find(_q("dbReference"))
    ref_id = reference.get("id") if reference is not None else None
    return _text(element.find(_q("name"))), ref_id


def parse_entry(entry: ET.Element, report: ParseReport) -> EntryRows:
    """Turn one complete <entry> element into rows for every UniProt table."""
    accessions = [a.text for a in entry.findall(_q("accession")) if a.text]
    if not accessions:
        raise ValueError("an entry has no accession")
    accession = accessions[0]
    evidence = _EvidenceResolver(_evidence_map(entry), report)
    tables: dict[str, list[Row]] = {}

    # Names.
    protein = entry.find(_q("protein"))
    recommended = protein.find(_q("recommendedName")) if protein is not None else None
    protein_name = _text(recommended.find(_q("fullName"))) if recommended is not None else None
    alternative_names: list[str] = []
    ec_numbers: list[str] = []
    if protein is not None:
        for name_element in protein:
            if name_element.tag == _q("component") or name_element.tag == _q("domain"):
                continue
            if len(name_element) == 0:
                # allergenName, cdAntigenName and innName carry their text directly.
                if name_element.text and name_element.text.strip():
                    alternative_names.append(name_element.text)
                continue
            for child in name_element:
                value = _text(child)
                if value is None:
                    continue
                if child.tag == _q("ecNumber"):
                    ec_numbers.append(value)
                elif name_element is not recommended or child.tag != _q("fullName"):
                    alternative_names.append(value)

    # Genes.
    gene_rows: list[Row] = []
    genes = entry.findall(_q("gene"))
    gene_symbol: str | None = None
    for gene_index, gene in enumerate(genes):
        for name_index, name in enumerate(gene.findall(_q("name"))):
            value = _required_text(name, "gene name text", accession)
            name_type = name.get("type", "")
            if gene_index == 0 and name_type == "primary" and gene_symbol is None:
                gene_symbol = value
            ev = evidence.resolve(name)
            gene_rows.append(
                {
                    "accession": accession,
                    "gene_index": gene_index,
                    "name_index": name_index,
                    "name": value,
                    "name_type": name_type,
                    "evidence": ev,
                    "evidence_kind": kind_of(_codes(ev)),
                }
            )
    tables["gene_names"] = gene_rows

    # Organism and existence.
    taxon_element = entry.find(f"{_q('organism')}/{_q('dbReference')}")
    taxon = taxon_element.get("id", "") if taxon_element is not None else ""
    existence_element = entry.find(_q("proteinExistence"))
    existence = existence_element.get("type", "") if existence_element is not None else ""
    if existence not in PROTEIN_EXISTENCE_LEVELS:
        raise ValueError(f"{accession}: unknown protein existence {existence!r}")

    # Sequence.
    sequence_element = entry.find(_q("sequence"))
    if sequence_element is None or not sequence_element.text:
        raise ValueError(f"{accession}: entry has no sequence")
    sequence = "".join(sequence_element.text.split())
    nonstandard = sorted(set(sequence) - STANDARD_RESIDUES)
    tables["sequences"] = [
        {
            "accession": accession,
            "sequence": sequence,
            "length": int(sequence_element.get("length", "-1")),
            "crc64": sequence_element.get("checksum", ""),
            "sha256": hashlib.sha256(sequence.encode("ascii")).hexdigest(),
            "nonstandard_residues": nonstandard,
        }
    ]

    # Cross-references and GO.
    xref_rows: list[Row] = []
    go_rows: list[Row] = []
    for ordinal, reference in enumerate(entry.findall(_q("dbReference"))):
        database = reference.get("type", "")
        ref_id = reference.get("id", "")
        properties = [
            {"key": p.get("type", ""), "value": p.get("value", "")}
            for p in reference.findall(_q("property"))
        ]
        if database == "GO":
            values = {p["key"]: p["value"] for p in properties}
            term = values.get("term", "")
            aspect, _, term_name = term.partition(":")
            code = values.get("evidence", "")
            go_rows.append(
                {
                    "accession": accession,
                    "go_id": ref_id,
                    "ordinal": ordinal,
                    "aspect": GO_ASPECTS.get(aspect, aspect),
                    "term": term_name,
                    "evidence_code": code,
                    "assigned_by": values.get("project", ""),
                    "evidence_kind": kind_of([code]) if code else None,
                }
            )
            continue
        molecule = reference.find(_q("molecule"))
        xref_rows.append(
            {
                "accession": accession,
                "database": database,
                "id": ref_id,
                "ordinal": ordinal,
                "molecule": molecule.get("id") if molecule is not None else None,
                "properties": properties,
            }
        )
    tables["cross_references"] = xref_rows
    tables["go_annotations"] = go_rows

    # Features.
    feature_rows: list[Row] = []
    for ordinal, feature in enumerate(entry.findall(_q("feature"))):
        ev = evidence.resolve(feature)
        ligand_name, ligand_id = _ligand(feature.find(_q("ligand")))
        ligand = feature.find(_q("ligand"))
        part_name, part_id = _ligand(feature.find(_q("ligandPart")))
        row: Row = {
            "accession": accession,
            "ordinal": ordinal,
            "type": feature.get("type", ""),
            "feature_id": feature.get("id"),
            "description": feature.get("description"),
            "original": _text(feature.find(_q("original"))),
            "variation": [v.text or "" for v in feature.findall(_q("variation"))],
            "ligand_name": ligand_name,
            "ligand_id": ligand_id,
            "ligand_label": _text(ligand.find(_q("label"))) if ligand is not None else None,
            "ligand_note": _text(ligand.find(_q("note"))) if ligand is not None else None,
            "ligand_part_name": part_name,
            "ligand_part_id": part_id,
            "evidence": ev,
            "evidence_kind": kind_of(_codes(ev)),
        }
        row.update(_location(feature))
        feature_rows.append(row)
    tables["features"] = feature_rows

    # Comments, locations, diseases, isoforms.
    comment_rows: list[Row] = []
    location_rows: list[Row] = []
    disease_rows: list[Row] = []
    isoform_rows: list[Row] = []
    for ordinal, comment in enumerate(entry.findall(_q("comment"))):
        comment_type = comment.get("type", "")
        comment_molecule = _text(comment.find(_q("molecule")))
        texts: list[tuple[str, ET.Element]] = []
        for child in comment:
            if child.tag == _q("text"):
                texts.append(("text", child))
            else:
                for inner in child.findall(_q("text")):
                    texts.append((child.tag[len(NS) :], inner))
        for text_index, (part, text_element) in enumerate(texts):
            value = _text(text_element)
            if value is None:
                continue
            ev = evidence.resolve(text_element)
            comment_rows.append(
                {
                    "accession": accession,
                    "ordinal": ordinal,
                    "text_index": text_index,
                    "type": comment_type,
                    "part": part,
                    "molecule": comment_molecule,
                    "text": value,
                    "evidence": ev,
                    "evidence_kind": text_kind_of(_codes(ev)),
                }
            )
        if comment_type == "subcellular location":
            for group, place in enumerate(comment.findall(_q("subcellularLocation"))):
                locations = place.findall(_q("location"))
                topologies = place.findall(_q("topology"))
                orientations = place.findall(_q("orientation"))
                ev = evidence.resolve(*locations, *topologies, *orientations)
                location_rows.append(
                    {
                        "accession": accession,
                        "ordinal": ordinal,
                        "group": group,
                        "molecule": comment_molecule,
                        "locations": [e.text or "" for e in locations],
                        "topologies": [e.text or "" for e in topologies],
                        "orientations": [e.text or "" for e in orientations],
                        "evidence": ev,
                        "evidence_kind": kind_of(_codes(ev)),
                    }
                )
        elif comment_type == "disease":
            disease = comment.find(_q("disease"))
            note = comment.find(_q("text"))
            ev = evidence.resolve(note)
            mim = disease.find(_q("dbReference")) if disease is not None else None
            disease_rows.append(
                {
                    "accession": accession,
                    "ordinal": ordinal,
                    "disease_id": disease.get("id") if disease is not None else None,
                    "name": _text(disease.find(_q("name"))) if disease is not None else None,
                    "acronym": _text(disease.find(_q("acronym"))) if disease is not None else None,
                    "description": (
                        _text(disease.find(_q("description"))) if disease is not None else None
                    ),
                    "mim_id": mim.get("id") if mim is not None else None,
                    "note": _text(note),
                    "evidence": ev,
                    "evidence_kind": text_kind_of(_codes(ev)),
                }
            )
        elif comment_type == "alternative products":
            for isoform in comment.findall(_q("isoform")):
                isoform_id = _required_text(isoform.find(_q("id")), "isoform id", accession)
                sequence_info = isoform.find(_q("sequence"))
                status = sequence_info.get("type", "") if sequence_info is not None else ""
                refs = (sequence_info.get("ref") or "").split() if sequence_info is not None else []
                isoform_rows.append(
                    {
                        "accession": accession,
                        "isoform_id": isoform_id,
                        "names": [n.text or "" for n in isoform.findall(_q("name"))],
                        "sequence_status": status,
                        "is_canonical": status == "displayed",
                        "variant_refs": refs,
                    }
                )
        if not texts and comment_type not in _STRUCTURED_ELSEWHERE:
            report.comments_without_text[comment_type] += 1
    tables["comments"] = comment_rows
    tables["subcellular_locations"] = location_rows
    tables["diseases"] = disease_rows
    tables["isoforms"] = isoform_rows

    # Keywords.
    keyword_rows: list[Row] = []
    for keyword in entry.findall(_q("keyword")):
        ev = evidence.resolve(keyword)
        keyword_rows.append(
            {
                "accession": accession,
                "keyword_id": keyword.get("id", ""),
                "keyword": keyword.text or "",
                "evidence": ev,
                "evidence_kind": kind_of(_codes(ev)),
            }
        )
    tables["keywords"] = keyword_rows

    # The protein row last: its gaps depend on what was found above.
    databases = {r["database"] for r in xref_rows}
    gaps: list[str] = []
    if protein_name is None:
        gaps.append("no recommended name")
    if gene_symbol is None:
        gaps.append("no gene symbol")
    if "Ensembl" not in databases:
        gaps.append("no Ensembl cross-reference")
    if "HGNC" not in databases:
        gaps.append("no HGNC cross-reference")
    if nonstandard:
        gaps.append("non-standard residues: " + ", ".join(nonstandard))
    fragment = sequence_element.get("fragment") is not None
    if fragment:
        gaps.append("sequence is a fragment")
    tables["proteins"] = [
        {
            "accession": accession,
            "entry_name": _required_text(entry.find(_q("name")), "entry name", accession),
            "secondary_accessions": accessions[1:],
            "protein_name": protein_name,
            "alternative_names": alternative_names,
            "ec_numbers": ec_numbers,
            "gene_symbol": gene_symbol,
            "gene_count": len(genes),
            "length": int(sequence_element.get("length", "-1")),
            "mass_da": int(sequence_element.get("mass", "-1")),
            "annotation_score": None,
            "protein_existence_level": PROTEIN_EXISTENCE_LEVELS[existence],
            "protein_existence": existence,
            "is_fragment": fragment,
            "organism_taxon": taxon,
            "reviewed": entry.get("dataset") == "Swiss-Prot",
            "created": entry.get("created", ""),
            "modified": entry.get("modified", ""),
            "entry_version": int(entry.get("version", "0")),
            "sequence_version": int(sequence_element.get("version", "0")),
            "gaps": gaps,
        }
    ]
    return EntryRows(accession, tables)


def iter_entries(stream: Readable, report: ParseReport) -> Iterator[EntryRows]:
    """Yield each entry's rows in file order, freeing each entry once read."""
    parser = ET.iterparse(stream, events=("start", "end"))  # noqa: S314 - see the module docstring
    root: ET.Element | None = None
    for event, element in parser:
        if event == "start":
            if root is None:
                root = element
            continue
        if element.tag != _q("entry"):
            continue
        report.entries += 1
        yield parse_entry(element, report)
        element.clear()
        if root is not None:
            # Without this the root keeps a reference to every cleared entry.
            root.remove(element)
