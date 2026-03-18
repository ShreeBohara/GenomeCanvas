from __future__ import annotations

import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.core.config import get_settings
from app.repositories.fixture_builder import write_fixture_bundle
from app.repositories.structure_asset_builder import write_structure_assets


if __name__ == "__main__":
    bundle = write_fixture_bundle(get_settings().data_dir)
    structure_assets = write_structure_assets(get_settings().data_dir)
    print(
        "wrote "
        f"{len(bundle.proteins)} proteins, "
        f"{len(bundle.graph['nodes'])} graph nodes, and "
        f"{len(structure_assets['proteins'])} structure assets"
    )
