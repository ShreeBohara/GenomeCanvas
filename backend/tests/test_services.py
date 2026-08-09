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

    def test_similarity_is_ordered_and_carries_the_raw_distance(self) -> None:
        results = self.protein_service.similar("P38398", limit=5)
        self.assertEqual(len(results), 5)
        self.assertGreaterEqual(results[0].similarity_score, results[-1].similarity_score)
        # The mapped score is monotonic in the underlying RMSD, so the raw
        # quantity must move the opposite way.
        self.assertIsNotNone(results[0].shape_rmsd)
        assert results[0].shape_rmsd is not None and results[-1].shape_rmsd is not None
        self.assertLessEqual(results[0].shape_rmsd, results[-1].shape_rmsd)

    def test_similarity_ranks_a_known_homolog_first(self) -> None:
        """KRAS and NRAS are RAS-family homologs with near-identical folds.

        This is the test that distinguishes a real structural metric from the
        coordinate-proximity one it replaced: under the old implementation the
        answer was whatever the hand-authored layout happened to place nearby.
        """
        results = self.protein_service.similar("P01116", limit=3)  # KRAS
        self.assertTrue(results, "KRAS should have structural neighbours")
        self.assertEqual(results[0].gene_name, "NRAS")
        # Well clear of the ~0.47 median for unrelated pairs in this set.
        self.assertGreater(results[0].similarity_score, 0.8)

    def test_similarity_is_empty_for_substituted_structures(self) -> None:
        """A procedural trace is a seeded sine curve, so any neighbour computed
        from it would describe the generator rather than the protein."""
        for uniprot_id in ("P51587", "Q13315"):  # BRCA2, ATM
            self.assertEqual(self.protein_service.similar(uniprot_id, limit=5), [])

    def test_similarity_never_returns_the_query_protein(self) -> None:
        for uniprot_id in ("P38398", "P01116", "P00533"):
            returned = {r.uniprot_id for r in self.protein_service.similar(uniprot_id, 10)}
            self.assertNotIn(uniprot_id, returned)

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


class StructureIntegrityTests(unittest.TestCase):
    """A substituted structure must be distinguishable from a real one.

    The builder falls back to a procedural trace when AlphaFold has no model.
    That fallback is correct -- AlphaFold DB publishes no single full-length
    model above 2,700 residues, so BRCA2 and ATM legitimately 404 -- but it used
    to be silent, and the synthetic curve's values were reported as pLDDT.
    """

    @classmethod
    def setUpClass(cls) -> None:
        cls.service = ProteinService(FixtureRepository(get_settings().data_dir))

    def test_procedural_assets_report_no_confidence(self) -> None:
        asset = self.service.get_structure_asset("P51587")  # BRCA2, 3418 aa
        assert asset is not None
        self.assertEqual(asset.structure_source, "procedural")
        self.assertIsNone(
            asset.confidence_palette,
            "a synthetic trace must not report a pLDDT palette",
        )

    def test_procedural_assets_record_why_they_were_substituted(self) -> None:
        for uniprot_id in ("P51587", "Q13315"):
            asset = self.service.get_structure_asset(uniprot_id)
            assert asset is not None
            self.assertIsNotNone(asset.structure_error)
            self.assertIn("404", asset.structure_error or "")

    def test_alphafold_assets_still_report_confidence(self) -> None:
        asset = self.service.get_structure_asset("P38398")  # BRCA1
        assert asset is not None
        self.assertEqual(asset.structure_source, "alphafold")
        self.assertIsNotNone(asset.confidence_palette)
        assert asset.confidence_palette is not None
        self.assertGreater(asset.confidence_palette.average, 0)
        self.assertIsNone(asset.structure_error)

    def test_substitution_count_is_pinned(self) -> None:
        """Guards the silent-fabrication failure mode: if a future rebuild starts
        substituting more proteins, this fails instead of quietly shipping them."""
        repo = FixtureRepository(get_settings().data_dir)
        substituted = [
            a.uniprot_id
            for a in repo.structure_assets_by_id.values()
            if a.structure_source != "alphafold"
        ]
        self.assertEqual(sorted(substituted), ["P51587", "Q13315"])


if __name__ == "__main__":
    unittest.main()
