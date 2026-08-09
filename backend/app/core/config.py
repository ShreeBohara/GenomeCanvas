from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


# Anchor the fixture directory to the `app` package, not to the repository root.
#
# The previous form walked up to the repo root and back down through `backend/`,
# which only resolves when the package sits at `<repo>/backend/app/`. The container
# copies `app/` to `/srv/app/`, so that walk landed on `/backend/app/data` and the
# API failed to start. Resolving relative to the package is correct under both
# layouts, and under any other one.
PACKAGE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = PACKAGE_DIR / "data"


@dataclass(frozen=True)
class Settings:
    api_title: str
    api_version: str
    cors_origins: tuple[str, ...]
    data_dir: Path
    chat_model: str


def _parse_origins(value: str | None) -> tuple[str, ...]:
    if not value:
        return ("http://localhost:3000", "http://localhost:3001")
    return tuple(origin.strip() for origin in value.split(",") if origin.strip())


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings(
        api_title="GenomeCanvas API",
        api_version="2.0.0",
        cors_origins=_parse_origins(os.getenv("GENOMECANVAS_CORS_ORIGINS")),
        # Overridable so a deployment can mount fixtures instead of using the
        # copy baked into the image.
        data_dir=Path(os.getenv("GENOMECANVAS_DATA_DIR") or DATA_DIR),
        chat_model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5"),
    )
