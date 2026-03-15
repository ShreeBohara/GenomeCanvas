from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.models.schemas import ChatMessage
from app.services.llm_service import generate_response

router = APIRouter()


@router.post("/message")
async def chat_message(msg: ChatMessage):
    async def stream():
        async for chunk in generate_response(msg.message, msg.context):
            yield chunk

    return StreamingResponse(stream(), media_type="text/plain")
