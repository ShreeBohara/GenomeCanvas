"""Small hand-written inputs for unit tests. Not real data: see each docstring."""

from __future__ import annotations

from typing import Final

from forge.uniprot.crc64 import crc64

SEQ_A: Final = "MKTAYIAKQRQISFVKSHFSRQ"
SEQ_B: Final = "MUCWG"


def _entry_a(sequence: str = SEQ_A) -> str:
    return f"""<entry dataset="Swiss-Prot" created="2001-01-01" modified="2026-11-04" version="7" xmlns="https://uniprot.org/uniprot">
    <accession>P12345</accession>
    <accession>Q00001</accession>
    <name>TEST1_HUMAN</name>
    <protein>
        <recommendedName>
            <fullName evidence="1">Test protein one</fullName>
            <shortName>TP1</shortName>
            <ecNumber>1.2.3.4</ecNumber>
        </recommendedName>
        <alternativeName>
            <fullName>Other name</fullName>
        </alternativeName>
        <cdAntigenName>CD999</cdAntigenName>
    </protein>
    <gene>
        <name type="primary" evidence="2">TST1</name>
        <name type="synonym">TESTY</name>
    </gene>
    <organism>
        <name type="scientific">Homo sapiens</name>
        <dbReference type="NCBI Taxonomy" id="9606"/>
    </organism>
    <comment type="function">
        <text evidence="1 2">Does a test thing.</text>
    </comment>
    <comment type="interaction">
        <interactant intactId="EBI-1"><id>P12345</id></interactant>
    </comment>
    <comment type="subcellular location">
        <molecule>Isoform 2</molecule>
        <subcellularLocation>
            <location evidence="1">Cell membrane</location>
            <topology evidence="3">Single-pass membrane protein</topology>
        </subcellularLocation>
    </comment>
    <comment type="disease" evidence="1">
        <disease id="DI-00001">
            <name>Test disease</name>
            <acronym>TD</acronym>
            <description>A disease for tests.</description>
            <dbReference type="MIM" id="100000"/>
        </disease>
        <text evidence="1">The disease is caused by variants affecting the gene.</text>
    </comment>
    <comment type="alternative products">
        <event type="alternative splicing"/>
        <isoform>
            <id>P12345-1</id>
            <name>1</name>
            <sequence type="displayed"/>
        </isoform>
        <isoform>
            <id>P12345-2</id>
            <name>2</name>
            <sequence type="described" ref="VSP_000001"/>
        </isoform>
    </comment>
    <dbReference type="PDB" id="1ABC">
        <property type="method" value="X-ray"/>
    </dbReference>
    <dbReference type="AlphaFoldDB" id="P12345"/>
    <dbReference type="Ensembl" id="ENST00000000001.2">
        <molecule id="P12345-1"/>
        <property type="protein sequence ID" value="ENSP00000000001.2"/>
        <property type="gene ID" value="ENSG00000000001.5"/>
    </dbReference>
    <dbReference type="HGNC" id="HGNC:1">
        <property type="gene designation" value="TST1"/>
    </dbReference>
    <dbReference type="GO" id="GO:0005634">
        <property type="term" value="C:nucleus"/>
        <property type="evidence" value="ECO:0000314"/>
        <property type="project" value="UniProtKB"/>
    </dbReference>
    <proteinExistence type="evidence at protein level"/>
    <keyword id="KW-0002">3D-structure</keyword>
    <feature type="chain" id="PRO_0000000001" description="Test protein one">
        <location><begin position="1"/><end position="22"/></location>
    </feature>
    <feature type="sequence variant" id="VAR_000001" description="In TD" evidence="1">
        <original>K</original>
        <variation>E</variation>
        <location><position position="2"/></location>
    </feature>
    <feature type="binding site" evidence="3">
        <location><position position="5"/></location>
        <ligand><name>Zn(2+)</name><dbReference type="ChEBI" id="CHEBI:29105"/></ligand>
    </feature>
    <feature type="region of interest" description="Unknown start">
        <location><begin status="unknown"/><end position="10"/></location>
    </feature>
    <evidence type="ECO:0000269" key="1">
        <source><dbReference type="PubMed" id="11111111"/></source>
    </evidence>
    <evidence type="ECO:0000250" key="2">
        <source><dbReference type="UniProtKB" id="P99999"/></source>
    </evidence>
    <evidence type="ECO:0000255" key="3"/>
    <sequence length="{len(sequence)}" mass="2600" checksum="{crc64(sequence)}" modified="2001-01-01" version="1">{sequence}</sequence>
</entry>
"""


def _entry_b() -> str:
    return f"""<entry dataset="Swiss-Prot" created="2010-01-01" modified="2026-11-04" version="3" xmlns="https://uniprot.org/uniprot">
    <accession>Q99999</accession>
    <name>TEST2_HUMAN</name>
    <protein>
        <recommendedName><fullName>Test selenoprotein</fullName></recommendedName>
    </protein>
    <gene>
        <name type="ORF">ORF123</name>
    </gene>
    <organism>
        <name type="scientific">Homo sapiens</name>
        <dbReference type="NCBI Taxonomy" id="9606"/>
    </organism>
    <proteinExistence type="uncertain"/>
    <sequence length="5" mass="600" checksum="{crc64(SEQ_B)}" modified="2010-01-01" version="1" fragment="single">{SEQ_B}</sequence>
</entry>
"""


def uniprot_xml(sequence_a: str = SEQ_A, extra_entries: str = "") -> bytes:
    """Two made-up entries in UniProt's XML layout. P12345 is well annotated;
    Q99999 has only an ORF name, no cross-references, a selenocysteine and a
    fragment sequence."""
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<uniprot xmlns="https://uniprot.org/uniprot">\n'
        + _entry_a(sequence_a)
        + _entry_b()
        + extra_entries
        + "<copyright>Test data, not from UniProt.</copyright>\n</uniprot>\n"
    ).encode("utf-8")


SCORES_TSV: Final = "Entry\tAnnotation\nP12345\t5.0\nQ99999\t1.0\n"
