from __future__ import annotations

import json
import os
from typing import Any

from app.models.schemas import ChatEnvelope


SYSTEM_PROMPT = """You are GenomeCanvas AI, an expert molecular biologist and bioinformatics guide.

You will receive grounded data retrieved from the local application state. Use only the provided facts.
Return JSON with this exact shape:
{
  "response": "2 short paragraphs of plain text",
  "commands": [{"type": "highlight", "target_id": "...", "target_ids": [], "query": null, "viewport": null, "metadata": {}}],
  "sources": [{"id": "...", "label": "...", "type": "...", "url": "..."}]
}

Do not wrap the JSON in markdown. If the supplied data is incomplete, say so plainly without inventing facts."""


class LLMNarrator:
    def __init__(self, model_name: str):
        self.model_name = model_name

    async def narrate(self, payload: dict[str, Any]) -> ChatEnvelope | None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            return None

        try:
            import anthropic

            client = anthropic.AsyncAnthropic(api_key=api_key)
            response = await client.messages.create(
                model=self.model_name,
                max_tokens=900,
                system=SYSTEM_PROMPT,
                messages=[
                    {
                        "role": "user",
                        "content": json.dumps(payload, ensure_ascii=False),
                    }
                ],
            )
            text = "".join(
                block.text for block in response.content if getattr(block, "type", None) == "text"
            )
            data = self._extract_json(text)
            if data is None:
                return None
            return ChatEnvelope.model_validate(data)
        except Exception:
            return None

    def _extract_json(self, value: str) -> dict[str, Any] | None:
        start = value.find("{")
        end = value.rfind("}")
        if start == -1 or end == -1 or end < start:
            return None
        try:
            return json.loads(value[start : end + 1])
        except json.JSONDecodeError:
            return None
