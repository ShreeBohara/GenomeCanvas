"""Regression tests for chat entity resolution.

Each test here pins a bug that shipped a confidently wrong answer to the user.
They are grouped separately from test_services.py because they are adversarial
probes, not behavior specs — the inputs are chosen to be hostile.
"""

from __future__ import annotations

import asyncio
import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import get_settings
from app.core.text import chunk_text, contains_term, overlap_score, significant_tokens
from app.models.schemas import ChatContext
from app.repositories.fixture_repository import FixtureRepository
from app.services.chat_service import ChatService
from app.services.graph_service import GraphService
from app.services.llm_service import LLMNarrator
from app.services.protein_service import ProteinService


class TextScoringTests(unittest.TestCase):
    def test_stopword_only_overlap_scores_zero(self) -> None:
        # "the" is the only shared token, and it used to score 0.2.
        self.assertEqual(
            overlap_score(
                "what are the parameters here",
                "Congenital bilateral absence of the vas deferens",
            ),
            0.0,
        )

    def test_significant_tokens_drop_function_words_and_single_chars(self) -> None:
        self.assertEqual(significant_tokens("show me the app"), ["app"])
        self.assertEqual(significant_tokens("the a of and"), [])

    def test_contains_term_requires_whole_term(self) -> None:
        self.assertTrue(contains_term("tell me about the APP protein", "APP"))
        self.assertFalse(contains_term("show me the application logs", "APP"))
        self.assertFalse(contains_term("describe the appearance", "DES"))
        # Alphanumeric gene symbols must not match inside a longer run.
        self.assertTrue(contains_term("what does BRCA1 do?", "BRCA1"))
        self.assertFalse(contains_term("the BRCA12 variant", "BRCA1"))


class ChunkingTests(unittest.TestCase):
    def test_chunks_carry_their_paragraph_index(self) -> None:
        chunks = chunk_text("Para one sentence.\n\nPara two sentence.")
        self.assertEqual([chunk.paragraph for chunk in chunks], [0, 1])
        self.assertEqual([chunk.text for chunk in chunks], ["Para one sentence.", "Para two sentence."])

    def test_long_paragraph_splits_but_keeps_one_index(self) -> None:
        chunks = chunk_text(" ".join(["word"] * 120), max_len=40)
        self.assertGreater(len(chunks), 1)
        self.assertEqual({chunk.paragraph for chunk in chunks}, {0})


class ResolutionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        repository = FixtureRepository(get_settings().data_dir)
        protein_service = ProteinService(repository)
        graph_service = GraphService(repository)
        cls.graph_service = graph_service
        cls.chat_service = ChatService(
            repository, protein_service, graph_service, LLMNarrator("unset")
        )

    def _respond(self, message: str) -> str:
        envelope = asyncio.run(self.chat_service.build_response(message, ChatContext()))
        return envelope.response

    def test_stopword_query_returns_no_graph_nodes(self) -> None:
        # "the" is a substring of the property value "Therapeutic", which used to
        # score 1.0 and return unrelated drugs.
        self.assertEqual(self.graph_service.search_nodes("the"), [])
        self.assertEqual(self.graph_service.search_nodes("show me"), [])

    def test_named_protein_outranks_disease_phrasing(self) -> None:
        # Regression: this answered about "Congenital bilateral absence of the
        # vas deferens" because "show" triggered the disease branch and the only
        # shared token with that label was "the".
        response = self._respond("show me the app")
        self.assertIn("APP", response)
        self.assertNotIn("vas deferens", response)

    def test_english_words_do_not_resolve_to_gene_symbols(self) -> None:
        self.assertIsNone(self.chat_service._protein_named_in("show me the application logs"))
        self.assertIsNone(self.chat_service._protein_named_in("describe the appearance"))

    def test_disease_flow_still_resolves(self) -> None:
        response = self._respond("Show me proteins involved in Alzheimer's disease")
        self.assertIn("Alzheimer", response)

    def test_protein_and_drug_flows_still_resolve(self) -> None:
        self.assertIn("BRCA1", self._respond("What does BRCA1 do?"))
        self.assertIn("EGFR", self._respond("Find drugs targeting EGFR"))

    def test_typeahead_prefix_still_matches(self) -> None:
        labels = [node.label for node in self.graph_service.search_nodes("alzh", limit=5)]
        self.assertTrue(any("Alzheimer" in label for label in labels), labels)


if __name__ == "__main__":
    unittest.main()
