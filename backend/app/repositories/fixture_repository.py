from __future__ import annotations

from collections import defaultdict
import json
from pathlib import Path

from app.models.schemas import GraphEdge, GraphNode, ProteinDetail, ProteinStructureAsset
from app.repositories.fixture_builder import build_fixture_bundle
from app.repositories.structure_asset_builder import ASSET_FILE_NAME


class FixtureRepository:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.proteins_by_id: dict[str, ProteinDetail] = {}
        self.nodes_by_id: dict[str, GraphNode] = {}
        self.edges: list[GraphEdge] = []
        self.adjacency: dict[str, list[tuple[str, GraphEdge]]] = defaultdict(list)
        self.structure_assets_by_id: dict[str, ProteinStructureAsset] = {}
        self.refresh()

    def refresh(self) -> None:
        bundle = build_fixture_bundle(self.data_dir)
        self.proteins_by_id = {
            protein["uniprot_id"]: ProteinDetail.model_validate(protein)
            for protein in bundle.proteins
        }
        self.nodes_by_id = {
            node["id"]: GraphNode.model_validate(node) for node in bundle.graph["nodes"]
        }
        self.edges = [GraphEdge.model_validate(edge) for edge in bundle.graph["edges"]]

        adjacency: dict[str, list[tuple[str, GraphEdge]]] = defaultdict(list)
        for edge in self.edges:
            adjacency[edge.source].append((edge.target, edge))
            adjacency[edge.target].append((edge.source, edge))
        self.adjacency = adjacency

        structure_asset_path = self.data_dir / ASSET_FILE_NAME
        if structure_asset_path.exists():
            with structure_asset_path.open() as handle:
                payload = json.load(handle)
            self.structure_assets_by_id = {
                uniprot_id: ProteinStructureAsset.model_validate(asset)
                for uniprot_id, asset in payload.get("proteins", {}).items()
            }
        else:
            self.structure_assets_by_id = {}

    def list_proteins(self) -> list[ProteinDetail]:
        return list(self.proteins_by_id.values())

    def get_protein(self, uniprot_id: str) -> ProteinDetail | None:
        return self.proteins_by_id.get(uniprot_id.upper())

    def get_structure_asset(self, uniprot_id: str) -> ProteinStructureAsset | None:
        return self.structure_assets_by_id.get(uniprot_id.upper())

    def list_nodes(self) -> list[GraphNode]:
        return list(self.nodes_by_id.values())

    def list_nodes_by_type(self, node_type: str) -> list[GraphNode]:
        return [node for node in self.nodes_by_id.values() if node.type == node_type]

    def get_node(self, node_id: str) -> GraphNode | None:
        return self.nodes_by_id.get(node_id)

    def neighbors(self, node_id: str) -> list[tuple[str, GraphEdge]]:
        return list(self.adjacency.get(node_id, []))
