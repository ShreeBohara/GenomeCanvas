from __future__ import annotations

import re
from dataclasses import dataclass


NON_ALNUM_RE = re.compile(r"[^a-z0-9]+")
MULTISPACE_RE = re.compile(r"\s+")


# Function words carry no retrieval signal but do produce spurious token overlap.
# Without this set, "show me the app" shares the token "the" with
# "Congenital bilateral absence of the vas deferens" and scores 0.2, which was
# enough to win when nothing better matched. Domain nouns (disease, protein,
# cancer, drug) are deliberately NOT listed here — callers that need to drop
# those strip them themselves, because they are meaningful in other contexts.
STOPWORDS = frozenset(
    """
    a about above after all also am an and any are as at be because been before being
    between both but by can could did do does doing down during each few find for from
    further get give had has have having he her here hers him his how i if in into is it
    its just like look me more most my need no nor not now of off on once only or other
    our out over own please same see she should show so some such tell than that the
    their them then there these they this those through to too under until up us very
    want was we were what when where which while who why will with would you your
    """.split()
)


@dataclass(frozen=True)
class TextChunk:
    """A streamed slice of an assistant response.

    `paragraph` is the zero-based index of the source paragraph. The frontend uses
    it to rebuild paragraph breaks: chunks sharing an index are joined with a
    space, and a change in index emits a blank line. Before this existed,
    chunk_text discarded newlines and the client joined everything with " ", so
    the deliberately two-paragraph responses in ChatService rendered as one.
    """

    paragraph: int
    text: str


def slugify(value: str) -> str:
    normalized = NON_ALNUM_RE.sub("_", value.strip().lower())
    return normalized.strip("_")


def tokenize(value: str) -> list[str]:
    cleaned = MULTISPACE_RE.sub(" ", value.lower())
    return [token for token in NON_ALNUM_RE.sub(" ", cleaned).split() if token]


def significant_tokens(value: str) -> list[str]:
    """Tokens worth scoring on: no stopwords, no single characters."""
    return [token for token in tokenize(value) if token not in STOPWORDS and len(token) > 1]


def contains_term(haystack: str, needle: str) -> bool:
    """Whole-term containment.

    `contains_term("the app crashed", "app")` is True;
    `contains_term("the application", "app")` is False.

    Plain `in` was matching gene APP inside "application" and gene DES inside
    "describe", which routed chat questions to the wrong protein. Lookarounds are
    used instead of \\b because gene symbols are alphanumeric (BRCA1, AKT1) and
    must not match inside a longer alphanumeric run (BRCA12).
    """
    term = needle.strip().lower()
    if not term:
        return False
    pattern = rf"(?<![a-z0-9]){re.escape(term)}(?![a-z0-9])"
    return re.search(pattern, haystack.lower()) is not None


def starts_term(haystack: str, needle: str) -> bool:
    """Prefix-of-a-word containment, for type-ahead ("alzh" -> "Alzheimer's disease")."""
    term = needle.strip().lower()
    if not term:
        return False
    pattern = rf"(?<![a-z0-9]){re.escape(term)}"
    return re.search(pattern, haystack.lower()) is not None


def overlap_score(query: str, candidate: str) -> float:
    """Fraction of the query's significant tokens present in the candidate."""
    query_tokens = set(significant_tokens(query))
    candidate_tokens = set(significant_tokens(candidate))
    if not query_tokens or not candidate_tokens:
        return 0.0
    return len(query_tokens & candidate_tokens) / len(query_tokens)


def chunk_text(value: str, max_len: int = 140) -> list[TextChunk]:
    """Split a response into word-boundary chunks that remember their paragraph."""
    if not value:
        return []

    chunks: list[TextChunk] = []
    paragraph_index = 0

    for raw_paragraph in value.split("\n"):
        paragraph = raw_paragraph.strip()
        if not paragraph:
            continue

        current: list[str] = []
        current_length = 0
        for word in paragraph.split():
            added = len(word) + (1 if current else 0)
            if current and current_length + added > max_len:
                chunks.append(TextChunk(paragraph=paragraph_index, text=" ".join(current)))
                current = [word]
                current_length = len(word)
            else:
                current.append(word)
                current_length += added

        if current:
            chunks.append(TextChunk(paragraph=paragraph_index, text=" ".join(current)))
        paragraph_index += 1

    return chunks
