from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app


class ApiContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.client_manager = TestClient(app)
        cls.client = cls.client_manager.__enter__()

    @classmethod
    def tearDownClass(cls) -> None:
        cls.client_manager.__exit__(None, None, None)

    def test_health_reports_loaded_counts(self) -> None:
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["status"], "ok")
        self.assertGreaterEqual(payload["proteins_loaded"], 54)
        self.assertGreater(payload["nodes_loaded"], payload["proteins_loaded"])

    def test_protein_search_supports_alzheimer_flow(self) -> None:
        response = self.client.get("/api/proteins/search?q=alzheimer&limit=4")
        self.assertEqual(response.status_code, 200)
        ids = [item["uniprot_id"] for item in response.json()]
        self.assertIn("P05067", ids)
        self.assertIn("P49768", ids)

    def test_graph_endpoints_expose_path_and_query(self) -> None:
        path_response = self.client.get("/api/graph/path", params={"from": "P38398", "to": "drug:olaparib"})
        self.assertEqual(path_response.status_code, 200)
        self.assertEqual(path_response.json()["path_ids"][0], "P38398")

        query_response = self.client.post(
            "/api/graph/query",
            json={"search": "alzheimer", "node_type": "disease", "hops": 1, "limit": 5},
        )
        self.assertEqual(query_response.status_code, 200)
        self.assertTrue(query_response.json()["nodes"])

    def test_chat_endpoint_streams_typed_sse_events(self) -> None:
        response = self.client.post(
            "/api/chat/message",
            json={"message": "What does BRCA1 do?", "context": {}},
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("text/event-stream", response.headers["content-type"])
        self.assertIn("event: sources", response.text)
        self.assertIn("event: command", response.text)
        self.assertIn("event: chunk", response.text)
        self.assertIn("event: done", response.text)

    def test_structure_asset_endpoints_expose_universe_traces(self) -> None:
        universe_response = self.client.get("/api/proteins/universe-assets")
        self.assertEqual(universe_response.status_code, 200)
        universe_assets = universe_response.json()
        self.assertGreaterEqual(len(universe_assets), 54)
        self.assertIn("low_trace", universe_assets[0])

        structure_response = self.client.get("/api/proteins/P38398/structure-asset")
        self.assertEqual(structure_response.status_code, 200)
        payload = structure_response.json()
        self.assertEqual(payload["uniprot_id"], "P38398")
        self.assertIn("focus_trace", payload)
        self.assertIn("confidence_palette", payload)

    def test_openapi_contains_typed_routes(self) -> None:
        response = self.client.get("/openapi.json")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertIn("/api/graph/path", payload["paths"])
        self.assertIn("/api/graph/query", payload["paths"])
        self.assertIn("/api/proteins/universe-assets", payload["paths"])


if __name__ == "__main__":
    unittest.main()
