from __future__ import annotations

import re


NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")
MULTISPACE_RE = re.compile(r"\s+")


def slugify(value: str) -> str:
    normalized = NON_ALNUM_RE.sub("_", value.strip().lower())
    return normalized.strip("_")


def tokenize(value: str) -> list[str]:
    cleaned = MULTISPACE_RE.sub(" ", value.lower())
    return [token for token in NON_ALNUM_RE.sub(" ", cleaned).split() if token]


def overlap_score(query: str, candidate: str) -> float:
    query_tokens = set(tokenize(query))
    candidate_tokens = set(tokenize(candidate))
    if not query_tokens or not candidate_tokens:
        return 0.0
    return len(query_tokens & candidate_tokens) / len(query_tokens)


def chunk_text(value: str, max_len: int = 140) -> list[str]:
    if not value:
        return []

    chunks: list[str] = []
    for paragraph in value.split("\n"):
        paragraph = paragraph.strip()
        if not paragraph:
            continue

        current: list[str] = []
        current_length = 0
        for word in paragraph.split():
            added = len(word) + (1 if current else 0)
            if current and current_length + added > max_len:
                chunks.append(" ".join(current))
                current = [word]
                current_length = len(word)
            else:
                current.append(word)
                current_length += added

        if current:
            chunks.append(" ".join(current))

    return chunks
