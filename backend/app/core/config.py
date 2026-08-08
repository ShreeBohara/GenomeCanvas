from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[3]
BACKEND_DIR = ROOT_DIR / "backend"
DATA_DIR = BACKEND_DIR / "app" / "data"


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
        data_dir=DATA_DIR,
        chat_model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5"),
    )
