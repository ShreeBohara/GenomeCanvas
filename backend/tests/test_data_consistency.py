from __future__ import annotations

import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import get_settings
from app.repositories.fixture_builder import build_fixture_bundle


class FixtureConsistencyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.bundle = build_fixture_bundle(get_settings().data_dir)
        cls.node_ids = {node["id"] for node in cls.bundle.graph["nodes"]}

    def test_all_protein_references_resolve_to_graph_nodes(self) -> None:
        for protein in self.bundle.proteins:
            self.assertIn(protein["uniprot_id"], self.node_ids)
            for disease in protein["diseases"]:
                self.assertIn(disease["id"], self.node_ids)
            for drug in protein["drugs"]:
                self.assertIn(drug["id"], self.node_ids)

    def test_all_graph_edges_reference_known_nodes(self) -> None:
        for edge in self.bundle.graph["edges"]:
            self.assertIn(edge["source"], self.node_ids)
            self.assertIn(edge["target"], self.node_ids)

    def test_curated_alzheimer_fixture_exists(self) -> None:
        disease_ids = {
            disease["id"]
            for protein in self.bundle.proteins
            for disease in protein["diseases"]
        }
        self.assertIn("disease:alzheimer_s_disease", disease_ids)


if __name__ == "__main__":
    unittest.main()
