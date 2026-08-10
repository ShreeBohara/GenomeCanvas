from __future__ import annotations

from collections import defaultdict
import json
from pathlib import Path
from typing import Iterable

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
        self.structural_neighbours: dict[str, list[dict]] = {}
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
            # Precomputed at build time from the backbone traces. Empty for
            # proteins with no AlphaFold model, and absent entirely for asset
            # files written before version 2.
            self.structural_neighbours = payload.get("structural_neighbours", {})
        else:
            self.structure_assets_by_id = {}
            self.structural_neighbours = {}

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

    # ------------------------------------------------------------------
    # The methods below exist so callers never touch the backing dicts.
    #
    # Services used to reach in for `nodes_by_id` and `proteins_by_id`
    # directly. That works against an in-memory store and nothing else: a
    # database-backed repository cannot hand out a dict of every node without
    # materialising the whole graph, which is the opposite of why you would
    # use one. Every access is expressed here as a question that any backing
    # store can answer -- does this node exist, give me these nodes, how many
    # are there -- so the implementation can change without touching a service.
    # ------------------------------------------------------------------

    def has_node(self, node_id: str) -> bool:
        return node_id in self.nodes_by_id

    def get_nodes(self, node_ids: Iterable[str]) -> list[GraphNode]:
        """Nodes for the given ids, skipping any that do not resolve.

        Batched deliberately: this is the call that becomes one round trip
        against a real database, where a per-id loop would become N.
        """
        resolved = (self.nodes_by_id.get(node_id) for node_id in node_ids)
        return [node for node in resolved if node is not None]

    def list_structure_assets(self) -> list[ProteinStructureAsset]:
        return list(self.structure_assets_by_id.values())

    def get_structural_neighbours(self, uniprot_id: str) -> list[dict]:
        """Precomputed shape-distance ranking for one protein.

        Empty for the two proteins with no AlphaFold model, and empty for every
        protein when reading an asset file written before the table existed.
        """
        return self.structural_neighbours.get(uniprot_id.upper(), [])

    def count_proteins(self) -> int:
        return len(self.proteins_by_id)

    def count_nodes(self) -> int:
        return len(self.nodes_by_id)
