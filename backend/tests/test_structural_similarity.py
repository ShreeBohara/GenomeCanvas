from __future__ import annotations

import math
import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import get_settings
from app.repositories.fixture_repository import FixtureRepository
from app.repositories.structural_similarity import (
    shape_rmsd,
    similarity_from_rmsd,
    traces_from_assets,
)


def _rotate(points, ax: float, ay: float, az: float):
    ca, sa = math.cos(ax), math.sin(ax)
    cb, sb = math.cos(ay), math.sin(ay)
    cc, sc = math.cos(az), math.sin(az)
    rotated = []
    for x, y, z in points:
        y, z = ca * y - sa * z, sa * y + ca * z
        x, z = cb * x + sb * z, -sb * x + cb * z
        x, y = cc * x - sc * y, sc * x + cc * y
        rotated.append([x, y, z])
    return rotated


class ShapeRmsdTests(unittest.TestCase):
    """Properties the superposition must satisfy to be a metric at all."""

    @classmethod
    def setUpClass(cls) -> None:
        repo = FixtureRepository(get_settings().data_dir)
        cls.traces = traces_from_assets(
            a.model_dump() for a in repo.structure_assets_by_id.values()
        )

    def test_identical_traces_score_zero(self) -> None:
        trace = self.traces["P38398"]
        self.assertAlmostEqual(shape_rmsd(trace, trace), 0.0, places=6)

    def test_rotation_is_removed_by_the_superposition(self) -> None:
        """The point of Kabsch: orientation must not affect the distance."""
        trace = self.traces["P38398"]
        rotated = _rotate(trace, 0.7, -1.3, 2.1)
        self.assertAlmostEqual(shape_rmsd(trace, rotated), 0.0, places=6)

    def test_distance_is_symmetric(self) -> None:
        a, b = self.traces["P38398"], self.traces["P00533"]
        self.assertAlmostEqual(shape_rmsd(a, b), shape_rmsd(b, a), places=9)

    def test_distinct_structures_are_separated(self) -> None:
        self.assertGreater(shape_rmsd(self.traces["P38398"], self.traces["P00533"]), 0.1)

    def test_mismatched_lengths_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            shape_rmsd([[0.0, 0.0, 0.0]], [[0.0, 0.0, 0.0], [1.0, 0.0, 0.0]])

    def test_empty_traces_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            shape_rmsd([], [])

    def test_similarity_mapping_is_bounded_and_decreasing(self) -> None:
        self.assertEqual(similarity_from_rmsd(0.0), 1.0)
        self.assertGreater(similarity_from_rmsd(0.2), similarity_from_rmsd(0.9))
        self.assertGreater(similarity_from_rmsd(50.0), 0.0)

    def test_procedural_traces_are_excluded_from_the_table(self) -> None:
        for uniprot_id in ("P51587", "Q13315"):
            self.assertNotIn(uniprot_id, self.traces)
        self.assertEqual(len(self.traces), 52)


if __name__ == "__main__":
    unittest.main()
