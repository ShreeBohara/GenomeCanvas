from __future__ import annotations

import json

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.core.text import chunk_text
from app.dependencies import get_chat_service
from app.models.schemas import ChatRequest
from app.services.chat_service import ChatService

router = APIRouter()


def _event(name: str, payload: object) -> str:
    return f"event: {name}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


@router.post("/message")
async def chat_message(
    msg: ChatRequest,
    chat_service: ChatService = Depends(get_chat_service),
):
    async def stream():
        try:
            envelope = await chat_service.build_response(msg.message, msg.context)
            yield _event("sources", [source.model_dump() for source in envelope.sources])
            for command in envelope.commands:
                yield _event("command", command.model_dump())
            for chunk in chunk_text(envelope.response):
                yield _event("chunk", {"text": chunk})
            yield _event("done", {"status": "ok"})
        except Exception as exc:
            yield _event("error", {"detail": str(exc)})

    headers = {
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    }
    return StreamingResponse(stream(), media_type="text/event-stream", headers=headers)
