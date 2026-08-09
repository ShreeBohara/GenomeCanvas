from __future__ import annotations

import os
import sys
import unittest
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.core import config
from app.core.config import DATA_DIR, PACKAGE_DIR, get_settings


class DataDirResolutionTests(unittest.TestCase):
    """The fixture path must resolve from the package, not the repository root.

    The container copies `app/` to `/srv/app/`, so any path that walks up to a
    repo root and back down through `backend/` resolves to a directory that does
    not exist there. That shipped once: the image built, started uvicorn, and
    died in the lifespan on a missing proteins.json. These tests fail on the
    layout assumption rather than on the symptom.
    """

    def test_data_dir_is_inside_the_app_package(self) -> None:
        self.assertEqual(DATA_DIR.parent, PACKAGE_DIR)
        self.assertEqual(DATA_DIR.name, "data")

    def test_data_dir_does_not_depend_on_a_backend_parent(self) -> None:
        # Relative to the package, the path must contain no ".." style detour
        # through a repository root. Recomputing from the module file directly
        # must land on the same directory.
        recomputed = Path(config.__file__).resolve().parents[1] / "data"
        self.assertEqual(recomputed, DATA_DIR)

    def test_fixture_files_are_present_at_the_resolved_path(self) -> None:
        for name in (
            "proteins.json",
            "knowledge_graph.json",
            "protein_structure_assets.json",
        ):
            self.assertTrue((DATA_DIR / name).is_file(), f"missing fixture: {name}")

    def test_data_dir_is_overridable_by_environment(self) -> None:
        get_settings.cache_clear()
        previous = os.environ.get("GENOMECANVAS_DATA_DIR")
        os.environ["GENOMECANVAS_DATA_DIR"] = "/tmp/genomecanvas-fixtures"
        try:
            self.assertEqual(
                get_settings().data_dir, Path("/tmp/genomecanvas-fixtures")
            )
        finally:
            if previous is None:
                os.environ.pop("GENOMECANVAS_DATA_DIR", None)
            else:
                os.environ["GENOMECANVAS_DATA_DIR"] = previous
            get_settings.cache_clear()

    def test_default_settings_point_at_real_fixtures(self) -> None:
        get_settings.cache_clear()
        os.environ.pop("GENOMECANVAS_DATA_DIR", None)
        try:
            self.assertTrue((get_settings().data_dir / "proteins.json").is_file())
        finally:
            get_settings.cache_clear()


if __name__ == "__main__":
    unittest.main()
