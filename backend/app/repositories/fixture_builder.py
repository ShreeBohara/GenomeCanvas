from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.core.text import slugify


RawDict = dict[str, Any]


CURATED_EXTRA_PROTEINS: list[RawDict] = [
    {
        "uniprot_id": "P05067",
        "name": "Amyloid-beta precursor protein",
        "gene_name": "APP",
        "organism": "Homo sapiens",
        "function_description": "Membrane protein that is cleaved to generate amyloid-beta peptides and participates in neuronal growth and synaptic signaling.",
        "function_category": "signaling",
        "sequence_length": 770,
        "subcellular_location": "Cell membrane, Golgi apparatus",
        "alphafold_url": "https://alphafold.ebi.ac.uk/api/prediction/P05067",
        "umap_x": -2.1,
        "umap_y": 6.4,
        "umap_z": 2.2,
        "diseases": [
            {"name": "Alzheimer's disease", "association_score": 0.96},
            {"name": "Cerebral amyloid angiopathy", "association_score": 0.77},
        ],
        "drugs": [{"name": "Lecanemab", "mechanism": "Amyloid-beta targeting antibody", "max_phase": 4}],
        "go_terms": [
            {"id": "GO:0005509", "term": "calcium ion binding", "category": "molecular_function"},
            {"id": "GO:0042987", "term": "amyloid precursor protein catabolic process", "category": "biological_process"},
        ],
    },
    {
        "uniprot_id": "P49768",
        "name": "Presenilin-1",
        "gene_name": "PSEN1",
        "organism": "Homo sapiens",
        "function_description": "Catalytic core component of gamma-secretase that cleaves APP and multiple signaling receptors.",
        "function_category": "enzyme",
        "sequence_length": 467,
        "subcellular_location": "Endoplasmic reticulum, Golgi apparatus, Cell membrane",
        "alphafold_url": "https://alphafold.ebi.ac.uk/api/prediction/P49768",
        "umap_x": -1.4,
        "umap_y": 5.2,
        "umap_z": 2.8,
        "diseases": [
            {"name": "Alzheimer's disease", "association_score": 0.95},
            {"name": "Familial Alzheimer disease", "association_score": 0.99},
        ],
        "drugs": [],
        "go_terms": [
            {"id": "GO:0004222", "term": "metalloendopeptidase activity", "category": "molecular_function"},
            {"id": "GO:0007219", "term": "Notch signaling pathway", "category": "biological_process"},
        ],
    },
    {
        "uniprot_id": "P10636",
        "name": "Microtubule-associated protein tau",
        "gene_name": "MAPT",
        "organism": "Homo sapiens",
        "function_description": "Axonal microtubule-stabilizing protein that forms neurofibrillary tangles when hyperphosphorylated.",
        "function_category": "structural",
        "sequence_length": 758,
        "subcellular_location": "Cytoplasm, Axon",
        "alphafold_url": "https://alphafold.ebi.ac.uk/api/prediction/P10636",
        "umap_x": -3.8,
        "umap_y": 7.0,
        "umap_z": 1.8,
        "diseases": [
            {"name": "Alzheimer's disease", "association_score": 0.93},
            {"name": "Frontotemporal dementia", "association_score": 0.88},
        ],
        "drugs": [],
        "go_terms": [
            {"id": "GO:0008017", "term": "microtubule binding", "category": "molecular_function"},
            {"id": "GO:0042552", "term": "myelination", "category": "biological_process"},
        ],
    },
    {
        "uniprot_id": "P02649",
        "name": "Apolipoprotein E",
        "gene_name": "APOE",
        "organism": "Homo sapiens",
        "function_description": "Lipid transport protein involved in neuronal maintenance, amyloid clearance, and late-onset Alzheimer risk.",
        "function_category": "transporter",
        "sequence_length": 317,
        "subcellular_location": "Secreted",
        "alphafold_url": "https://alphafold.ebi.ac.uk/api/prediction/P02649",
        "umap_x": -4.6,
        "umap_y": 5.9,
        "umap_z": 2.5,
        "diseases": [
            {"name": "Alzheimer's disease", "association_score": 0.94},
            {"name": "Hyperlipoproteinemia type III", "association_score": 0.83},
        ],
        "drugs": [],
        "go_terms": [
            {"id": "GO:0006869", "term": "lipid transport", "category": "biological_process"},
            {"id": "GO:0008201", "term": "heparin binding", "category": "molecular_function"},
        ],
    },
]

CURATED_EXTRA_GRAPH_EDGES: list[RawDict] = [
    {"source": "P05067", "target": "P49768", "label": "INTERACTS_WITH", "properties": {"evidence": "Gamma-secretase processing"}},
    {"source": "P02649", "target": "P05067", "label": "INTERACTS_WITH", "properties": {"evidence": "Amyloid clearance biology"}},
    {"source": "P10636", "target": "P05067", "label": "INTERACTS_WITH", "properties": {"evidence": "Shared Alzheimer pathology"}},
]


@dataclass(frozen=True)
class FixtureBundle:
    proteins: list[RawDict]
    graph: RawDict


def _load_json(path: Path) -> Any:
    with path.open() as handle:
        return json.load(handle)


def _write_json(path: Path, payload: Any) -> None:
    with path.open("w") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")


def _trial_id(label: str, existing_id: str) -> str:
    match = re.search(r"NCT\d+", existing_id.upper()) or re.search(r"NCT\d+", label.upper())
    if match:
        return f"trial:{match.group(0).lower()}"
    return f"trial:{slugify(label)}"


def _canonical_node_id(node_type: str, label: str, existing_id: str = "") -> str:
    if node_type == "protein":
        return existing_id or label
    if node_type == "trial":
        return _trial_id(label, existing_id)
    return f"{node_type}:{slugify(label or existing_id)}"


def _merge_properties(original: RawDict, updates: RawDict) -> RawDict:
    merged = dict(original)
    for key, value in updates.items():
        if value not in (None, "", [], {}):
            merged[key] = value
    return merged


def build_fixture_bundle(data_dir: Path) -> FixtureBundle:
    raw_proteins = _load_json(data_dir / "proteins.json")
    raw_graph = _load_json(data_dir / "knowledge_graph.json")

    proteins_by_id: dict[str, RawDict] = {item["uniprot_id"]: dict(item) for item in raw_proteins}
    for extra in CURATED_EXTRA_PROTEINS:
        proteins_by_id.setdefault(extra["uniprot_id"], extra)

    nodes_by_id: dict[str, RawDict] = {}
    id_map: dict[str, str] = {}

    def register_node(node_type: str, label: str, properties: RawDict | None = None, existing_id: str = "") -> str:
        canonical_id = _canonical_node_id(node_type, label, existing_id)
        current = nodes_by_id.get(canonical_id, {"id": canonical_id, "label": label, "type": node_type, "properties": {}})
        current["label"] = label
        current["type"] = node_type
        current["properties"] = _merge_properties(current.get("properties", {}), properties or {})
        nodes_by_id[canonical_id] = current
        if existing_id:
            id_map[existing_id] = canonical_id
        return canonical_id

    normalized_proteins: list[RawDict] = []
    for protein in proteins_by_id.values():
        protein_id = protein["uniprot_id"].upper()
        diseases: list[RawDict] = []
        for disease in protein.get("diseases", []):
            disease_id = register_node(
                "disease",
                disease["name"],
                {"source": disease.get("source", "fixture")},
                disease.get("id", ""),
            )
            diseases.append(
                {
                    "id": disease_id,
                    "name": disease["name"],
                    "association_score": disease.get("association_score"),
                }
            )

        drugs: list[RawDict] = []
        for drug in protein.get("drugs", []):
            drug_id = register_node(
                "drug",
                drug["name"],
                {
                    "drug_type": drug.get("drug_type", "Therapeutic"),
                    "max_phase": drug.get("max_phase"),
                },
                drug.get("id", ""),
            )
            drugs.append(
                {
                    "id": drug_id,
                    "name": drug["name"],
                    "mechanism": drug.get("mechanism"),
                    "max_phase": drug.get("max_phase"),
                    "drug_type": drug.get("drug_type", "Therapeutic"),
                }
            )

        normalized_proteins.append(
            {
                **protein,
                "uniprot_id": protein_id,
                "diseases": diseases,
                "drugs": drugs,
            }
        )

        register_node(
            "protein",
            protein["gene_name"],
            {
                "gene_name": protein["gene_name"],
                "name": protein["name"],
                "organism": protein["organism"],
                "function_category": protein["function_category"],
            },
            protein_id,
        )

    for node in raw_graph.get("nodes", []):
        node_type = node["type"]
        canonical_id = register_node(node_type, node["label"], node.get("properties", {}), node["id"])
        if node_type == "trial":
            nodes_by_id[canonical_id]["properties"] = _merge_properties(
                nodes_by_id[canonical_id]["properties"],
                {"nct_id": canonical_id.split(":", 1)[1].upper()},
            )

    edge_registry: dict[tuple[str, str, str], RawDict] = {}

    def register_edge(source: str, target: str, label: str, properties: RawDict | None = None) -> None:
        key = (source, target, label)
        current = edge_registry.get(key, {"source": source, "target": target, "label": label, "properties": {}})
        current["properties"] = _merge_properties(current.get("properties", {}), properties or {})
        edge_registry[key] = current

    for edge in raw_graph.get("edges", []):
        source = id_map.get(edge["source"], edge["source"])
        target = id_map.get(edge["target"], edge["target"])
        register_edge(source, target, edge["label"], edge.get("properties", {}))

    for extra_edge in CURATED_EXTRA_GRAPH_EDGES:
        register_edge(extra_edge["source"], extra_edge["target"], extra_edge["label"], extra_edge.get("properties", {}))

    for protein in normalized_proteins:
        protein_id = protein["uniprot_id"]
        for disease in protein["diseases"]:
            register_edge(
                protein_id,
                disease["id"],
                "ASSOCIATED_WITH",
                {"score": disease.get("association_score"), "source": "fixture"},
            )
        for drug in protein["drugs"]:
            register_edge(
                drug["id"],
                protein_id,
                "TARGETS",
                {
                    "mechanism": drug.get("mechanism"),
                    "max_phase": drug.get("max_phase"),
                    "source": "fixture",
                },
            )

    proteins_payload = sorted(normalized_proteins, key=lambda item: item["gene_name"])
    nodes_payload = sorted(nodes_by_id.values(), key=lambda item: (item["type"], item["label"]))
    edges_payload = sorted(
        edge_registry.values(),
        key=lambda item: (item["label"], item["source"], item["target"]),
    )

    return FixtureBundle(
        proteins=proteins_payload,
        graph={"nodes": nodes_payload, "edges": edges_payload},
    )


def write_fixture_bundle(data_dir: Path) -> FixtureBundle:
    bundle = build_fixture_bundle(data_dir)
    _write_json(data_dir / "proteins.json", bundle.proteins)
    _write_json(data_dir / "knowledge_graph.json", bundle.graph)
    return bundle
