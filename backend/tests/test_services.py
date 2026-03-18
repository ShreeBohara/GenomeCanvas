from __future__ import annotations

import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import get_settings
from app.repositories.fixture_repository import FixtureRepository
from app.services.graph_service import GraphService
from app.services.protein_service import ProteinService


class ServiceBehaviorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        repository = FixtureRepository(get_settings().data_dir)
        cls.protein_service = ProteinService(repository)
        cls.graph_service = GraphService(repository)

    def test_disease_lookup_returns_expected_alzheimer_proteins(self) -> None:
        proteins = self.protein_service.proteins_for_disease("Alzheimer's disease")
        ids = {protein.uniprot_id for protein in proteins}
        self.assertTrue({"P02649", "P05067", "P10636", "P49768"}.issubset(ids))

    def test_similarity_is_distance_based(self) -> None:
        results = self.protein_service.similar("P38398", limit=5)
        self.assertEqual(len(results), 5)
        self.assertGreaterEqual(results[0].similarity_score, results[-1].similarity_score)

    def test_structure_asset_service_returns_traces_and_fallbacks(self) -> None:
        asset = self.protein_service.get_structure_asset("P38398")
        self.assertIsNotNone(asset)
        assert asset is not None
        self.assertTrue(asset.low_trace.points)
        self.assertTrue(asset.focus_trace.points)

        fallback = self.protein_service.get_structure_asset("P51587")
        self.assertIsNotNone(fallback)
        assert fallback is not None
        self.assertEqual(fallback.structure_source, "procedural")

    def test_graph_path_finds_direct_drug_target_link(self) -> None:
        result = self.graph_service.find_path("P00533", "drug:osimertinib")
        self.assertEqual(result.path_ids[0], "P00533")
        self.assertEqual(result.path_ids[-1], "drug:osimertinib")

    def test_graph_search_finds_alzheimer_node(self) -> None:
        matches = self.graph_service.search_nodes("alzheimer", node_type="disease", limit=5)
        self.assertEqual(matches[0].id, "disease:alzheimer_s_disease")


if __name__ == "__main__":
    unittest.main()
