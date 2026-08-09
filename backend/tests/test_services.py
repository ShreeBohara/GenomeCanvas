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
        self.assertTrue(asset.focus_trace.points)

        fallback = self.protein_service.get_structure_asset("P51587")
        self.assertIsNotNone(fallback)
        assert fallback is not None
        self.assertEqual(fallback.structure_source, "procedural")

    def test_structure_asset_omits_tiers_the_client_already_has(self) -> None:
        """The focus asset carries focus-tier data only.

        low_trace and mid_trace come from /universe-assets and are already in
        the client's store by the time a focus asset is requested; re-sending
        them was a third of this response. similar_ids is dropped for a separate
        reason: populating it re-ran the full similarity ranking a second time
        per request, and nothing read the field.
        """
        asset = self.protein_service.get_structure_asset("P38398")
        assert asset is not None
        self.assertIsNone(asset.low_trace)
        self.assertIsNone(asset.mid_trace)
        self.assertEqual(asset.similar_ids, [])

    def test_universe_asset_tiers_are_disjoint(self) -> None:
        """Each tier ships only what was asked for, so a client fetching both
        never transfers the same trace twice."""
        low = self.protein_service.get_universe_assets("low")
        mid = self.protein_service.get_universe_assets("mid")
        every = self.protein_service.get_universe_assets("all")

        self.assertEqual(len(low), len(mid), len(every))
        self.assertTrue(all(a.low_trace is not None and a.mid_trace is None for a in low))
        self.assertTrue(all(a.mid_trace is not None and a.low_trace is None for a in mid))
        self.assertTrue(all(a.low_trace and a.mid_trace for a in every))

        self.assertTrue(all(len(a.low_trace.points) == 24 for a in low))
        self.assertTrue(all(len(a.mid_trace.points) == 72 for a in mid))

    def test_default_universe_tier_is_unchanged(self) -> None:
        """Omitting the tier keeps the original both-tiers response, so an
        existing client that never learned about the parameter is unaffected."""
        default = self.protein_service.get_universe_assets()
        self.assertTrue(all(a.low_trace and a.mid_trace for a in default))

    def test_graph_path_finds_direct_drug_target_link(self) -> None:
        result = self.graph_service.find_path("P00533", "drug:osimertinib")
        self.assertEqual(result.path_ids[0], "P00533")
        self.assertEqual(result.path_ids[-1], "drug:osimertinib")

    def test_graph_search_finds_alzheimer_node(self) -> None:
        matches = self.graph_service.search_nodes("alzheimer", node_type="disease", limit=5)
        self.assertEqual(matches[0].id, "disease:alzheimer_s_disease")


if __name__ == "__main__":
    unittest.main()
