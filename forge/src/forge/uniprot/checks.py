"""Data checks for the UniProt tables. Each says what it protects against."""

from __future__ import annotations

from collections.abc import Callable
from typing import Final

from forge.ids import is_uniprot_accession
from forge.pipeline import sql
from forge.pipeline.stage import Check, CheckContext, CheckOutcome, Severity, failing, passing
from forge.uniprot.crc64 import crc64
from forge.uniprot.evidence import KIND_BY_CODE
from forge.uniprot.xml_parse import PROTEIN_EXISTENCE_LEVELS

XML_ARTIFACT: Final = "uniprot_human_xml"

# Every feature type UniProt used in release 2026_04. A new type fails the
# build so that someone decides how to show it, rather than it appearing
# unexamined.
FEATURE_TYPES: Final = frozenset(
    {
        "active site", "binding site", "chain", "coiled-coil region",
        "compositionally biased region", "cross-link", "disulfide bond", "DNA-binding region",
        "domain", "glycosylation site", "helix", "initiator methionine", "intramembrane region",
        "lipid moiety-binding region", "modified residue", "mutagenesis site",
        "non-standard amino acid", "non-terminal residue", "peptide", "propeptide",
        "region of interest", "repeat", "sequence conflict", "sequence variant",
        "short sequence motif", "signal peptide", "site", "splice variant", "strand",
        "topological domain", "transit peptide", "transmembrane region", "turn",
        "zinc finger region",
    }
)  # fmt: skip
SEQUENCE_ALPHABET: Final = frozenset("ACDEFGHIKLMNPQRSTVWYUOXBZ")
# Daltons per residue. Glycine (57) and tryptophan (186) bound any real
# sequence; a mean outside 70..170 means mass or length was misread.
MASS_PER_RESIDUE: Final = (70.0, 170.0)
_EVIDENCE_TABLES: Final = (
    "features",
    "gene_names",
    "comments",
    "subcellular_locations",
    "diseases",
    "keywords",
)


def _check(
    name: str, table: str, protects: str, severity: Severity = "error"
) -> Callable[[Callable[[CheckContext], CheckOutcome]], Check]:
    def wrap(run: Callable[[CheckContext], CheckOutcome]) -> Check:
        return Check(name=name, table=table, protects=protects, severity=severity, run=run)

    return wrap


def _orphans(child: str) -> Check:
    def run(context: CheckContext) -> CheckOutcome:
        tables = {child: context.table(child), "proteins": context.table("proteins")}
        found = sql.rows(
            tables,
            f"select distinct accession from {child} anti join proteins using (accession) "
            f""
            "order by accession limit 5",
        )
        if found:
            return failing(
                f"{child} has rows for accessions not in proteins", [r[0] for r in found]
            )
        rows = context.table(child).num_rows
        return passing(f"all {rows} rows belong to a protein")

    return Check(
        name=f"{child}: every row belongs to a protein",
        table=child,
        protects=f"Rows in {child} that point at a protein the release does not contain.",
        severity="error",
        run=run,
    )


@_check(
    "proteins: accession is unique",
    "proteins",
    "Two rows for one protein, which would double it on the map and in every count.",
)
def _unique_accession(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"proteins": context.table("proteins")},
        "select accession from proteins group by accession having count(*) > 1 order by 1 limit 5",
    )
    if found:
        return failing("duplicate accessions", [r[0] for r in found])
    return passing(f"{context.table('proteins').num_rows} distinct accessions")


@_check(
    "proteins: accession has UniProt's format",
    "proteins",
    "A misparsed or truncated identifier entering every link to other sources.",
)
def _accession_format(context: CheckContext) -> CheckOutcome:
    bad = [
        a for a in context.table("proteins").column("accession") if not is_uniprot_accession(str(a))
    ]
    if bad:
        return failing(f"{len(bad)} accession(s) break UniProt's pattern", bad)
    return passing("every accession matches UniProt's published pattern")


@_check(
    "proteins: count equals what UniProt reports for the release",
    "proteins",
    "Entries silently lost or duplicated between UniProt's own count and the table.",
)
def _count_matches(context: CheckContext) -> CheckOutcome:
    variant = context.variants[XML_ARTIFACT]
    rows = context.table("proteins").num_rows
    if variant.reported_records is None:
        return failing("the lock records no count to compare with")
    if rows != variant.reported_records:
        return failing(
            f"{rows} proteins, but {variant.reported_by} reports {variant.reported_records}"
        )
    return passing(f"{rows} proteins, as {variant.reported_by} reports")


@_check(
    "proteins: every protein is human",
    "proteins",
    "A protein from another organism mixed into the human proteome.",
)
def _human(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"proteins": context.table("proteins")},
        "select accession || ' (taxon ' || organism_taxon || ')' from proteins "
        "where organism_taxon <> '9606' order by accession limit 5",
    )
    if found:
        return failing("proteins from another organism", [r[0] for r in found])
    return passing("every protein has NCBI taxon 9606")


@_check(
    "proteins: every protein is reviewed",
    "proteins",
    "Unreviewed (TrEMBL) entries entering a release that promises reviewed proteins only.",
)
def _reviewed(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"proteins": context.table("proteins")},
        "select accession from proteins where not reviewed order by accession limit 5",
    )
    if found:
        return failing("unreviewed entries", [r[0] for r in found])
    return passing("every entry is from Swiss-Prot")


@_check(
    "proteins: entry name ends in _HUMAN",
    "proteins",
    "Entry names and organisms disagreeing, a sign of a misread entry.",
)
def _entry_name(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"proteins": context.table("proteins")},
        "select entry_name from proteins where not ends_with(entry_name, '_HUMAN') order by 1 "
        "limit 5",
    )
    if found:
        return failing("entry names without _HUMAN", [r[0] for r in found])
    return passing("every entry name ends in _HUMAN")


@_check(
    "proteins: existence level agrees with its words",
    "proteins",
    "A protein existence level outside 1 to 5, or a number that contradicts UniProt's words.",
)
def _existence(context: CheckContext) -> CheckOutcome:
    table = context.table("proteins")
    pairs = zip(
        table.column("protein_existence_level"), table.column("protein_existence"), strict=True
    )
    bad = [
        f"{level} {words!r}"
        for level, words in pairs
        if PROTEIN_EXISTENCE_LEVELS.get(str(words)) != level
    ]
    if bad:
        return failing(f"{len(bad)} protein(s) with a contradictory existence level", bad)
    return passing("every level is 1 to 5 and matches its words")


@_check(
    "proteins: mass per residue is plausible",
    "proteins",
    "Mass or length read from the wrong attribute or truncated.",
)
def _mass(context: CheckContext) -> CheckOutcome:
    low, high = MASS_PER_RESIDUE
    found = sql.rows(
        {"proteins": context.table("proteins")},
        "select accession || ': ' || round(mass_da / length, 1) from proteins "
        "where length <= 0 or mass_da <= 0 or mass_da / length not between ? and ? "
        "order by accession limit 5",
        [low, high],
    )
    if found:
        return failing(f"mass per residue outside {low}..{high} Da", [r[0] for r in found])
    value = sql.scalar(
        {"proteins": context.table("proteins")},
        "select round(min(mass_da / length), 1) || '..' || round(max(mass_da / length), 1) from "
        "proteins",
    )
    return passing(f"mass per residue within {value} Da")


@_check(
    "proteins: a missing gene symbol is recorded as a gap",
    "proteins",
    "A protein with no gene symbol passing silently, or a gap recorded for one that has a symbol.",
)
def _symbol_gap(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"proteins": context.table("proteins")},
        "select accession from proteins where (gene_symbol is null) <> list_contains(gaps, 'no "
        "gene symbol') "
        "order by accession limit 5",
    )
    if found:
        return failing("gene symbol and gaps disagree", [r[0] for r in found])
    missing = sql.count(
        {"proteins": context.table("proteins")},
        "select count(*) from proteins where gene_symbol is null",
    )
    return passing(f"{missing} protein(s) without a gene symbol, each recorded as a gap")


@_check(
    "proteins: every protein has an annotation score",
    "proteins",
    "The pinned score file falling out of step with the entries (a warning: the gap is recorded).",
    severity="warning",
)
def _scores(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"proteins": context.table("proteins")},
        "select accession from proteins where annotation_score is null order by 1 limit 5",
    )
    if found:
        return failing("proteins without an annotation score", [r[0] for r in found])
    return passing("every protein has a score from 1 to 5")


@_check(
    "sequences: one sequence for every protein",
    "sequences",
    "A protein without a sequence, or a sequence without a protein.",
)
def _one_sequence(context: CheckContext) -> CheckOutcome:
    tables = {"proteins": context.table("proteins"), "sequences": context.table("sequences")}
    found = sql.rows(
        tables,
        "select coalesce(p.accession, s.accession) from proteins p full join sequences s using "
        "(accession) "
        "where p.accession is null or s.accession is null order by 1 limit 5",
    )
    if found:
        return failing("proteins and sequences do not pair up", [r[0] for r in found])
    return passing("proteins and sequences pair one to one")


@_check(
    "sequences: checksum matches UniProt's CRC64",
    "sequences",
    "A sequence altered by a single letter anywhere between UniProt and the release.",
)
def _crc(context: CheckContext) -> CheckOutcome:
    table = context.table("sequences")
    rows = zip(
        table.column("accession"), table.column("sequence"), table.column("crc64"), strict=True
    )
    bad = [f"{a}: {c} != {crc64(str(s))}" for a, s, c in rows if crc64(str(s)) != c]
    if bad:
        return failing(f"{len(bad)} sequence(s) whose checksum differs from UniProt's", bad)
    return passing(f"all {table.num_rows} checksums recomputed and equal")


@_check(
    "sequences: only amino-acid letters",
    "sequences",
    "Whitespace, digits or lower case left in a sequence by a parsing mistake.",
)
def _alphabet(context: CheckContext) -> CheckOutcome:
    table = context.table("sequences")
    bad = [
        f"{a}: {''.join(sorted(set(str(s)) - SEQUENCE_ALPHABET))!r}"
        for a, s in zip(table.column("accession"), table.column("sequence"), strict=True)
        if set(str(s)) - SEQUENCE_ALPHABET
    ]
    if bad:
        return failing(
            f"{len(bad)} sequence(s) with characters outside the amino-acid alphabet", bad
        )
    return passing("every character is an amino-acid letter")


@_check(
    "sequences: length agrees with the sequence and the protein",
    "sequences",
    "A declared length that disagrees with the sequence itself, which would misplace every "
    "feature.",
)
def _length(context: CheckContext) -> CheckOutcome:
    tables = {"proteins": context.table("proteins"), "sequences": context.table("sequences")}
    found = sql.rows(
        tables,
        "select s.accession || ': ' || length(s.sequence) || ' / ' || s.length || ' / ' || "
        "p.length "
        "from sequences s join proteins p using (accession) "
        "where length(s.sequence) <> s.length or s.length <> p.length order by 1 limit 5",
    )
    if found:
        return failing("lengths disagree (sequence / declared / protein)", [r[0] for r in found])
    return passing("the three lengths agree for every protein")


@_check(
    "features: positions lie within the sequence",
    "features",
    "A feature placed past the end of its protein, or ending before it begins.",
)
def _positions(context: CheckContext) -> CheckOutcome:
    tables = {"features": context.table("features"), "proteins": context.table("proteins")}
    found = sql.rows(
        tables,
        "select f.accession || " + "' #' || f.ordinal || ' ' || f.type || ' ' || "
        "coalesce(f.begin::varchar, '?') || '-' || coalesce(f.\"end\"::varchar, '?') || "
        "' of ' || p.length "
        "from features f join proteins p using (accession) where f.location_sequence is null and ("
        'f.begin < 1 or f."end" > p.length or f.begin > f."end" '
        'or f.begin > p.length or f."end" < 1) '
        "order by f.accession, f.ordinal limit 5",
    )
    if found:
        return failing("features outside their sequence", [r[0] for r in found])
    unknown = sql.count(
        {"features": context.table("features")},
        'select count(*) from features where begin is null or "end" is null',
    )
    return passing(
        f"every known position is inside its sequence; {unknown} position(s) are unknown in UniProt"
    )


@_check(
    "features: original residues match the sequence",
    "features",
    "Positions counted from the wrong origin, or a sequence and its variants from different "
    "versions.",
)
def _originals(context: CheckContext) -> CheckOutcome:
    tables = {"features": context.table("features"), "sequences": context.table("sequences")}
    where = (
        "f.original is not null and f.location_sequence is null and f.begin is not null "
        "and f.\"end\" is not null and f.begin_status = 'certain' and f.end_status = 'certain'"
    )
    found = sql.rows(
        tables,
        "select f.accession || ' ' || f.type || ' ' || f.begin || ': ' || f.original || ' vs ' || "
        'substr(s.sequence, f.begin, f."end" - f.begin + 1) '
        f"from features f join sequences s using (accession) where {where} and "
        'substr(s.sequence, f.begin, f."end" - f.begin + 1) <> f.original order by 1 limit 5',
    )
    total = sql.count(
        tables,
        f"select count(*) from features f join sequences s using (accession) where {where}",
    )
    if found:
        return failing(f"original residues differ from the sequence (of {total} checked)", found)
    return passing(f"{total} variant, mutagenesis and conflict positions match the sequence")


@_check(
    "features: every feature type is known",
    "features",
    "A new UniProt feature type reaching readers before anyone has decided how to show it.",
)
def _feature_types(context: CheckContext) -> CheckOutcome:
    types = {str(t) for t in context.table("features").column("type")}
    new = sorted(types - FEATURE_TYPES)
    if new:
        return failing(f"{len(new)} feature type(s) not seen before", new)
    return passing(f"{len(types)} feature types, all known")


@_check(
    "go_annotations: identifiers and aspects are well formed",
    "go_annotations",
    "A malformed GO identifier or an aspect outside the three GO namespaces.",
)
def _go(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"go_annotations": context.table("go_annotations")},
        "select accession || ' ' || go_id || ' ' || aspect from go_annotations "
        "where not regexp_full_match(go_id, 'GO:[0-9]{7}') or aspect not in "
        "('molecular function', 'biological process', 'cellular component') or term = '' "
        "order by 1 limit 5",
    )
    if found:
        return failing("malformed GO annotations", [r[0] for r in found])
    return passing(f"{context.table('go_annotations').num_rows} annotations well formed")


@_check(
    "cross_references: Ensembl and HGNC identifiers are well formed",
    "cross_references",
    "Identifiers the crosswalk would join on being misread, so a gene silently fails to match.",
)
def _xref_ids(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"cross_references": context.table("cross_references")},
        "select accession || ' ' || database || ' ' || id from cross_references "
        "where (database = 'HGNC' and not regexp_full_match(id, 'HGNC:[0-9]+')) "
        "or (database = 'Ensembl' and not regexp_full_match(id, 'ENST[0-9]{11}\\.[0-9]+')) "
        "or (database = 'Ensembl' and not list_contains(list_transform(properties, lambda p: "
        "p.key = 'gene ID' and regexp_full_match(p.value, 'ENSG[0-9]{11}\\.[0-9]+')), true)) "
        "order by 1 limit 5",
    )
    if found:
        return failing("malformed Ensembl or HGNC cross-references", [r[0] for r in found])
    return passing("every HGNC id, Ensembl transcript and its gene id is well formed")


@_check(
    "cross_references: AlphaFold DB links name the protein's own accession",
    "cross_references",
    "A predicted structure attached to the wrong protein when step 2B follows these links.",
)
def _alphafold(context: CheckContext) -> CheckOutcome:
    tables = {
        "cross_references": context.table("cross_references"),
        "proteins": context.table("proteins"),
    }
    found = sql.rows(
        tables,
        "select accession || ' -> ' || id from cross_references "
        "where database = 'AlphaFoldDB' and id <> accession order by 1 limit 5",
    )
    if found:
        return failing("AlphaFold DB links to another accession", [r[0] for r in found])
    without = sql.count(
        tables,
        "select count(*) from proteins anti join "
        "(select accession from cross_references where database = 'AlphaFoldDB') using (accession)",
    )
    return passing(
        f"every AlphaFold DB link names its own protein; {without} protein(s) have no link, "
        "listed in the stage report for step 2B"
    )


@_check(
    "keywords: identifiers are well formed",
    "keywords",
    "A misread keyword identifier breaking keyword search and term enrichment.",
)
def _keywords(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"keywords": context.table("keywords")},
        "select accession || ' ' || keyword_id from keywords "
        "where not regexp_full_match(keyword_id, 'KW-[0-9]{4}') or keyword = '' order by 1 limit 5",
    )
    if found:
        return failing("malformed keywords", [r[0] for r in found])
    return passing(f"{context.table('keywords').num_rows} keywords well formed")


@_check(
    "gene_names: the protein's gene symbol is a primary gene name",
    "gene_names",
    "The symbol on the protein row drifting from the gene names it was taken from.",
)
def _primary(context: CheckContext) -> CheckOutcome:
    tables = {"gene_names": context.table("gene_names"), "proteins": context.table("proteins")}
    found = sql.rows(
        tables,
        "select p.accession from proteins p where p.gene_symbol is not null and not exists ("
        "select 1 from gene_names g where g.accession = p.accession and g.gene_index = 0 "
        "and g.name_type = 'primary' and g.name = p.gene_symbol) order by 1 limit 5",
    )
    if found:
        return failing("gene symbols not found among primary gene names", [r[0] for r in found])
    return passing("every gene symbol is its entry's first primary gene name")


@_check(
    "diseases: identifiers are well formed",
    "diseases",
    "A misread disease identifier breaking links to UniProt's disease pages.",
)
def _diseases(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"diseases": context.table("diseases")},
        "select accession || ' ' || coalesce(disease_id, 'none') from diseases "
        "where disease_id is not null and not regexp_full_match(disease_id, 'DI-[0-9]{5}') order "
        "by 1 limit 5",
    )
    if found:
        return failing("malformed disease identifiers", [r[0] for r in found])
    named = sql.count(
        {"diseases": context.table("diseases")},
        "select count(*) from diseases where disease_id is not null",
    )
    return passing(
        f"{named} of {context.table('diseases').num_rows} disease comments name a disease"
    )


@_check(
    "isoforms: at most one canonical isoform per protein",
    "isoforms",
    "Two isoforms both claiming the canonical sequence, which would make the canonical choice in "
    "2B arbitrary.",
)
def _canonical(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"isoforms": context.table("isoforms")},
        "select accession from isoforms group by accession having count(*) filter (where "
        "is_canonical) <> 1 "
        "order by 1 limit 5",
    )
    if found:
        return failing(
            "proteins whose isoforms have no single canonical one", [r[0] for r in found]
        )
    proteins = sql.count(
        {"isoforms": context.table("isoforms")}, "select count(distinct accession) from isoforms"
    )
    return passing(f"{proteins} proteins list isoforms, each with exactly one canonical")


@_check(
    "comments: every text is non-empty",
    "comments",
    "Empty comment rows left by a parsing mistake.",
)
def _comment_text(context: CheckContext) -> CheckOutcome:
    found = sql.rows(
        {"comments": context.table("comments")},
        "select accession || ' ' || type from comments where trim(text) = '' order by 1 limit 5",
    )
    if found:
        return failing("empty comment texts", [r[0] for r in found])
    return passing(f"{context.table('comments').num_rows} texts, none empty")


@_check(
    "features: every evidence code has a proposed kind",
    "features",
    "An evidence code with no proposed kind passing silently as some other kind.",
)
def _evidence_codes(context: CheckContext) -> CheckOutcome:
    codes: set[str] = set()
    for name in _EVIDENCE_TABLES:
        found = sql.rows(
            {name: context.table(name)},
            f"select distinct e.code from {name}, unnest(evidence) as t(e)",
        )
        codes.update(str(r[0]) for r in found)
    found = sql.rows(
        {"go_annotations": context.table("go_annotations")},
        "select distinct evidence_code from go_annotations",
    )
    codes.update(str(r[0]) for r in found)
    unmapped = sorted(codes - set(KIND_BY_CODE))
    if unmapped:
        return failing(f"{len(unmapped)} evidence code(s) with no proposed kind", unmapped)
    return passing(f"{len(codes)} distinct codes in use, each with a proposed kind")


@_check(
    "evidence_codes: every kind is measured, curated or predicted",
    "evidence_codes",
    "A typo in the proposed mapping creating a fifth kind.",
)
def _kinds(context: CheckContext) -> CheckOutcome:
    kinds = {str(k) for k in context.table("evidence_codes").column("kind")}
    extra = sorted(kinds - {"measured", "curated", "predicted"})
    if extra:
        return failing("unknown kinds in the mapping", extra)
    return passing(f"{context.table('evidence_codes').num_rows} codes mapped to {len(kinds)} kinds")


UNIPROT_CHECKS: Final[tuple[Check, ...]] = (
    _unique_accession,
    _accession_format,
    _count_matches,
    _human,
    _reviewed,
    _entry_name,
    _existence,
    _mass,
    _symbol_gap,
    _scores,
    _one_sequence,
    _crc,
    _alphabet,
    _length,
    _positions,
    _originals,
    _feature_types,
    _go,
    _xref_ids,
    _alphafold,
    _keywords,
    _primary,
    _diseases,
    _canonical,
    _comment_text,
    _evidence_codes,
    *(
        _orphans(t)
        for t in (
            "sequences",
            "isoforms",
            "gene_names",
            "cross_references",
            "features",
            "go_annotations",
            "comments",
            "subcellular_locations",
            "diseases",
            "keywords",
        )
    ),
)
EVIDENCE_CHECKS: Final[tuple[Check, ...]] = (_kinds,)
