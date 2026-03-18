from __future__ import annotations

from app.core.config import get_settings
from app.repositories.fixture_builder import build_fixture_bundle


def load_protein_data() -> dict:
    bundle = build_fixture_bundle(get_settings().data_dir)
    return {protein["uniprot_id"]: protein for protein in bundle.proteins}
