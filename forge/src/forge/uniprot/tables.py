"""The UniProt tables: one declaration per table, the single source of their meaning."""

from __future__ import annotations

from typing import Final

from forge.pipeline.schema import Column, TableSchema

SOURCE: Final = ("uniprot",)

# Every phrase `proteins.gaps` may hold. "non-standard residues: " is followed
# by the letters found, for example "non-standard residues: U".
GAP_PHRASES: Final = (
    "no recommended name",
    "no gene symbol",
    "no Ensembl cross-reference",
    "no HGNC cross-reference",
    "non-standard residues: ",
    "sequence is a fragment",
    "no annotation score",
)

_ACCESSION = Column(
    "accession",
    "string",
    "The protein's primary UniProtKB accession, for example P38398.",
    "identifier",
)
_ORDINAL = Column(
    "ordinal",
    "int32",
    "Position of this row's element within its UniProt entry, from 0. Keeps "
    "UniProt's own order and makes the row unique.",
    "pipeline",
)
_EVIDENCE = Column(
    "evidence",
    "list<evidence>",
    "UniProt's evidence for this row: each item an ECO code and, where UniProt "
    "gives one, its source such as PubMed:10500182. Empty when UniProt attaches none.",
    "curated",
)
_EVIDENCE_KIND = Column(
    "evidence_kind",
    "string",
    "Proposed kind of this row (measured, curated or predicted) from its evidence "
    "codes, by the mapping in the table evidence_codes. Not yet reviewed by a "
    "biologist. Null when the row has no evidence code.",
    "pipeline",
    nullable=True,
)

PROTEINS: Final = TableSchema(
    name="proteins",
    description="One row per reviewed human protein in UniProtKB/Swiss-Prot.",
    sources=SOURCE,
    key=("accession",),
    columns=(
        _ACCESSION,
        Column(
            "entry_name", "string", "UniProt entry name, for example BRCA1_HUMAN.", "identifier"
        ),
        Column(
            "secondary_accessions",
            "list<string>",
            "Older accessions merged into this entry, in UniProt's order.",
            "identifier",
        ),
        Column(
            "protein_name",
            "string",
            "UniProt's recommended full name for the protein. Null when the entry has "
            "none (listed in gaps).",
            "curated",
            nullable=True,
        ),
        Column(
            "alternative_names",
            "list<string>",
            "Other full and short names UniProt records, in its order.",
            "curated",
        ),
        Column(
            "ec_numbers", "list<string>", "Enzyme Commission numbers of the protein.", "curated"
        ),
        Column(
            "gene_symbol",
            "string",
            "The primary name of the entry's first gene, as UniProt gives it. Null when "
            "the entry names no gene or only ORF names (listed in gaps). The approved "
            "HGNC symbol is in the crosswalk table.",
            "curated",
            nullable=True,
        ),
        Column(
            "gene_count",
            "int32",
            "How many genes UniProt says encode this protein (histone H4 has 14).",
            "curated",
        ),
        Column("length", "int32", "Length of the canonical sequence, in residues.", "curated"),
        Column(
            "mass_da",
            "int32",
            "Molecular mass of the canonical sequence in daltons, as UniProt computes it.",
            "curated",
        ),
        Column(
            "annotation_score",
            "int8",
            "UniProt's annotation score from 1 (basic) to 5 (best annotated), a measure "
            "of how much is recorded, not of how true it is. Null when the score file "
            "lacks the accession (listed in gaps).",
            "curated",
            nullable=True,
        ),
        Column(
            "protein_existence_level",
            "int8",
            "UniProt's protein existence level: 1 evidence at protein level, 2 at "
            "transcript level, 3 inferred from homology, 4 predicted, 5 uncertain.",
            "curated",
        ),
        Column(
            "protein_existence",
            "string",
            "The same level in UniProt's words, for example 'evidence at protein level'.",
            "curated",
        ),
        Column(
            "is_fragment",
            "bool",
            "True when UniProt marks the sequence as a fragment.",
            "curated",
        ),
        Column("organism_taxon", "string", "NCBI Taxonomy identifier; 9606 is human.", "curated"),
        Column("reviewed", "bool", "True for a reviewed (Swiss-Prot) entry.", "curated"),
        Column(
            "created", "string", "Date the entry was created in UniProt (YYYY-MM-DD).", "curated"
        ),
        Column("modified", "string", "Date the entry was last changed (YYYY-MM-DD).", "curated"),
        Column("entry_version", "int32", "Version of the entry.", "curated"),
        Column("sequence_version", "int32", "Version of the canonical sequence.", "curated"),
        Column(
            "gaps",
            "list<string>",
            "What this protein lacks that a reader might expect, in plain words, for "
            "example 'no gene symbol'. Empty when nothing is missing. A protein with a "
            "gap is kept, never dropped.",
            "pipeline",
        ),
    ),
)

SEQUENCES: Final = TableSchema(
    name="sequences",
    description="The canonical amino-acid sequence of each protein.",
    sources=SOURCE,
    key=("accession",),
    columns=(
        _ACCESSION,
        Column(
            "sequence",
            "string",
            "Canonical sequence in one-letter codes, as UniProt displays it.",
            "curated",
        ),
        Column("length", "int32", "Number of residues.", "curated"),
        Column(
            "crc64",
            "string",
            "UniProt's CRC64 checksum of the sequence, 16 hexadecimal digits.",
            "curated",
        ),
        Column(
            "sha256",
            "string",
            "SHA-256 of the sequence as ASCII, computed by the Forge, to compare "
            "sequences across sources.",
            "pipeline",
        ),
        Column(
            "nonstandard_residues",
            "list<string>",
            "Letters in the sequence outside the 20 standard amino acids, for example "
            "U for selenocysteine. Empty for most proteins.",
            "pipeline",
        ),
    ),
)

ISOFORMS: Final = TableSchema(
    name="isoforms",
    description=(
        "Isoforms UniProt lists for each protein. Only the canonical (displayed) "
        "isoform's sequence is in this release; the others are described, not spelled out."
    ),
    sources=SOURCE,
    key=("accession", "isoform_id"),
    columns=(
        _ACCESSION,
        Column("isoform_id", "string", "Isoform identifier, for example P38398-1.", "identifier"),
        Column("names", "list<string>", "Names UniProt gives the isoform.", "curated"),
        Column(
            "sequence_status",
            "string",
            "How UniProt gives the sequence: 'displayed' (the canonical sequence), "
            "'described' (by changes to it), 'external' or 'not described'.",
            "curated",
        ),
        Column(
            "is_canonical",
            "bool",
            "True for the isoform whose sequence is the entry's canonical sequence.",
            "curated",
        ),
        Column(
            "variant_refs",
            "list<string>",
            "Identifiers of the splice-variant features (VSP_...) that describe this "
            "isoform's differences from the canonical one.",
            "identifier",
        ),
    ),
)

GENE_NAMES: Final = TableSchema(
    name="gene_names",
    description="Every gene name and synonym UniProt records for each protein.",
    sources=SOURCE,
    key=("accession", "gene_index", "name_index"),
    columns=(
        _ACCESSION,
        Column(
            "gene_index",
            "int32",
            "Which of the entry's genes, from 0, in UniProt's order.",
            "pipeline",
        ),
        Column("name_index", "int32", "Order of this name within its gene, from 0.", "pipeline"),
        Column("name", "string", "The gene name.", "curated"),
        Column(
            "name_type",
            "string",
            "UniProt's type for the name: primary, synonym, ORF or ordered locus.",
            "curated",
        ),
        _EVIDENCE,
        _EVIDENCE_KIND,
    ),
)

CROSS_REFERENCES: Final = TableSchema(
    name="cross_references",
    description=(
        "Links from each protein to records in other databases, as UniProt gives them "
        "(Ensembl, HGNC, AlphaFoldDB, PDB, Reactome, ChEMBL, OpenTargets and about 130 "
        "more). Gene Ontology links are in go_annotations instead."
    ),
    sources=SOURCE,
    key=("accession", "database", "id", "ordinal"),
    columns=(
        _ACCESSION,
        Column(
            "database", "string", "Name of the other database as UniProt spells it.", "identifier"
        ),
        Column("id", "string", "Identifier of the record in that database.", "identifier"),
        _ORDINAL,
        Column(
            "molecule",
            "string",
            "The isoform this link is about, when UniProt says (for example P38398-1).",
            "identifier",
            nullable=True,
        ),
        Column(
            "properties",
            "list<property>",
            "UniProt's extra fields for the link, as key and value, for example the "
            "Ensembl gene ID of a transcript or the method and resolution of a PDB entry.",
            "curated",
        ),
    ),
)

FEATURES: Final = TableSchema(
    name="features",
    description=(
        "Sequence features with positions: domains, regions, sites, modified residues, "
        "signal and transmembrane segments, natural variants, secondary structure and "
        "every other feature type UniProt records."
    ),
    sources=SOURCE,
    key=("accession", "ordinal"),
    columns=(
        _ACCESSION,
        _ORDINAL,
        Column("type", "string", "UniProt's feature type, for example 'domain'.", "curated"),
        Column(
            "feature_id",
            "string",
            "UniProt's identifier for the feature (VAR_, PRO_, VSP_ and so on) where it has one.",
            "identifier",
            nullable=True,
        ),
        Column("description", "string", "UniProt's description.", "curated", nullable=True),
        Column(
            "begin",
            "int32",
            "First residue, counted from 1 on the sequence named in location_sequence "
            "(the canonical one when that is null). Null when UniProt gives no position.",
            "curated",
            nullable=True,
        ),
        Column(
            "end",
            "int32",
            "Last residue, inclusive. Equal to begin for a single position. Null when "
            "UniProt gives no position.",
            "curated",
            nullable=True,
        ),
        Column(
            "begin_status",
            "string",
            "How certain the first position is: certain, uncertain, less than, greater "
            "than or unknown.",
            "curated",
        ),
        Column("end_status", "string", "How certain the last position is.", "curated"),
        Column(
            "location_sequence",
            "string",
            "The isoform the positions refer to, when it is not the canonical sequence.",
            "identifier",
            nullable=True,
        ),
        Column(
            "original",
            "string",
            "For variants and conflicts: the residues in the canonical sequence.",
            "curated",
            nullable=True,
        ),
        Column(
            "variation",
            "list<string>",
            "For variants and conflicts: the residues seen instead. Empty for a deletion "
            "or for other feature types.",
            "curated",
        ),
        Column(
            "ligand_name",
            "string",
            "For binding sites: the ligand's name.",
            "curated",
            nullable=True,
        ),
        Column(
            "ligand_id",
            "string",
            "For binding sites: the ligand's ChEBI identifier.",
            "identifier",
            nullable=True,
        ),
        Column(
            "ligand_label",
            "string",
            "For binding sites: UniProt's label distinguishing several ligands of one kind.",
            "curated",
            nullable=True,
        ),
        Column(
            "ligand_note",
            "string",
            "For binding sites: UniProt's note on the ligand.",
            "curated",
            nullable=True,
        ),
        Column(
            "ligand_part_name",
            "string",
            "For binding sites: the part of the ligand that binds, where UniProt names one.",
            "curated",
            nullable=True,
        ),
        Column(
            "ligand_part_id",
            "string",
            "ChEBI identifier of that part.",
            "identifier",
            nullable=True,
        ),
        _EVIDENCE,
        _EVIDENCE_KIND,
    ),
)

GO_ANNOTATIONS: Final = TableSchema(
    name="go_annotations",
    description="Gene Ontology terms UniProt assigns to each protein, with their evidence.",
    sources=SOURCE,
    key=("accession", "go_id", "ordinal"),
    columns=(
        _ACCESSION,
        Column(
            "go_id",
            "string",
            "Gene Ontology term identifier, for example GO:0005634.",
            "identifier",
        ),
        _ORDINAL,
        Column(
            "aspect",
            "string",
            "Which part of the ontology: molecular function, biological process or "
            "cellular component.",
            "curated",
        ),
        Column("term", "string", "The term's name as UniProt gives it.", "curated"),
        Column(
            "evidence_code",
            "string",
            "The annotation's ECO evidence code (the GO evidence code's ECO equivalent).",
            "curated",
        ),
        Column(
            "assigned_by",
            "string",
            "Who made the annotation, as UniProt records it, for example UniProtKB or GO_Central.",
            "curated",
        ),
        _EVIDENCE_KIND,
    ),
)

COMMENTS: Final = TableSchema(
    name="comments",
    description=(
        "Free text from UniProt's comments: function, subunit, tissue specificity, "
        "disease notes, catalytic activity and every other comment type that carries "
        "text. Structured parts of subcellular location and disease comments are also "
        "in their own tables."
    ),
    sources=SOURCE,
    key=("accession", "ordinal", "text_index"),
    columns=(
        _ACCESSION,
        Column(
            "ordinal",
            "int32",
            "Position of the comment within the entry, from 0.",
            "pipeline",
        ),
        Column(
            "text_index",
            "int32",
            "Position of this text within its comment, from 0.",
            "pipeline",
        ),
        Column("type", "string", "UniProt's comment type, for example 'function'.", "curated"),
        Column(
            "part",
            "string",
            "Where in the comment the text sits: 'text' for the comment's own text, or "
            "the element it belongs to, for example 'reaction' or 'kinetics'.",
            "pipeline",
        ),
        Column(
            "molecule",
            "string",
            "The isoform or chain the comment is about, when UniProt says.",
            "curated",
            nullable=True,
        ),
        Column("text", "string", "The text, as UniProt wrote it.", "curated"),
        _EVIDENCE,
        Column(
            "evidence_kind",
            "string",
            "Proposed kind, as in other tables, but never more than curated: the words "
            "are a curator's even when the evidence is an experiment. Not yet reviewed "
            "by a biologist. Null when the text has no evidence code.",
            "pipeline",
            nullable=True,
        ),
    ),
)

SUBCELLULAR_LOCATIONS: Final = TableSchema(
    name="subcellular_locations",
    description=(
        "Where in the cell each protein is found, from UniProt's subcellular location comments."
    ),
    sources=SOURCE,
    key=("accession", "ordinal", "group"),
    columns=(
        _ACCESSION,
        Column("ordinal", "int32", "Position of the comment within the entry, from 0.", "pipeline"),
        Column(
            "group", "int32", "Position of this location within its comment, from 0.", "pipeline"
        ),
        Column(
            "molecule",
            "string",
            "The isoform the location is about, when UniProt says.",
            "curated",
            nullable=True,
        ),
        Column(
            "locations",
            "list<string>",
            "The location and any more specific ones UniProt adds, in its order, for "
            "example ['Cell membrane'].",
            "curated",
        ),
        Column(
            "topologies",
            "list<string>",
            "Membrane topology, for example 'Single-pass type I membrane protein'.",
            "curated",
        ),
        Column(
            "orientations",
            "list<string>",
            "Which side of the membrane, for example 'Cytoplasmic side'.",
            "curated",
        ),
        _EVIDENCE,
        _EVIDENCE_KIND,
    ),
)

DISEASES: Final = TableSchema(
    name="diseases",
    description="Diseases UniProt records the protein as involved in.",
    sources=SOURCE,
    key=("accession", "ordinal"),
    columns=(
        _ACCESSION,
        Column("ordinal", "int32", "Position of the comment within the entry, from 0.", "pipeline"),
        Column(
            "disease_id",
            "string",
            "UniProt's disease identifier, for example DI-00570. Null for a disease "
            "comment that names no disease (text only).",
            "identifier",
            nullable=True,
        ),
        Column("name", "string", "The disease's name.", "curated", nullable=True),
        Column("acronym", "string", "The disease's acronym.", "curated", nullable=True),
        Column(
            "description",
            "string",
            "UniProt's description of the disease.",
            "curated",
            nullable=True,
        ),
        Column(
            "mim_id",
            "string",
            "The disease's MIM number, where UniProt gives one.",
            "identifier",
            nullable=True,
        ),
        Column(
            "note",
            "string",
            "UniProt's note on how the protein is involved.",
            "curated",
            nullable=True,
        ),
        _EVIDENCE,
        Column(
            "evidence_kind",
            "string",
            "Proposed kind of the involvement note, never more than curated (see "
            "comments). Not yet reviewed by a biologist.",
            "pipeline",
            nullable=True,
        ),
    ),
)

KEYWORDS: Final = TableSchema(
    name="keywords",
    description="UniProt keywords assigned to each protein.",
    sources=SOURCE,
    key=("accession", "keyword_id"),
    columns=(
        _ACCESSION,
        Column(
            "keyword_id", "string", "UniProt keyword identifier, for example KW-0002.", "identifier"
        ),
        Column("keyword", "string", "The keyword.", "curated"),
        _EVIDENCE,
        _EVIDENCE_KIND,
    ),
)

EVIDENCE_CODES: Final = TableSchema(
    name="evidence_codes",
    description=(
        "The proposed mapping from UniProt's evidence codes to the four kinds of "
        "value. Needs review by a biologist; not settled."
    ),
    sources=(),
    key=("code",),
    columns=(
        Column("code", "string", "ECO evidence code.", "identifier"),
        Column("label", "string", "What the code means, in UniProt's words.", "curated"),
        Column(
            "go_code",
            "string",
            "The Gene Ontology evidence code it stands for, where there is one.",
            "identifier",
            nullable=True,
        ),
        Column(
            "assertion",
            "string",
            "Whether a person (manual) or a program (automatic) made the assertion.",
            "curated",
        ),
        Column("kind", "string", "Proposed kind: measured, curated or predicted.", "pipeline"),
        Column("rationale", "string", "Why that kind is proposed.", "pipeline"),
        Column(
            "review_status", "string", "Whether a biologist has reviewed the mapping.", "pipeline"
        ),
    ),
)

UNIPROT_TABLES: Final = (
    PROTEINS,
    SEQUENCES,
    ISOFORMS,
    GENE_NAMES,
    CROSS_REFERENCES,
    FEATURES,
    GO_ANNOTATIONS,
    COMMENTS,
    SUBCELLULAR_LOCATIONS,
    DISEASES,
    KEYWORDS,
)
