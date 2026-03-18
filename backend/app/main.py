from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.models.schemas import HealthResponse
from app.repositories.fixture_repository import FixtureRepository
from app.routers import proteins, graph, chat
from app.services.chat_service import ChatService
from app.services.graph_service import GraphService
from app.services.llm_service import LLMNarrator
from app.services.protein_service import ProteinService


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    fixture_repository = FixtureRepository(settings.data_dir)
    protein_service = ProteinService(fixture_repository)
    graph_service = GraphService(fixture_repository)
    narrator = LLMNarrator(settings.chat_model)
    chat_service = ChatService(fixture_repository, protein_service, graph_service, narrator)

    app.state.fixture_repository = fixture_repository
    app.state.protein_service = protein_service
    app.state.graph_service = graph_service
    app.state.chat_service = chat_service
    yield


app = FastAPI(title=settings.api_title, version=settings.api_version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(proteins.router, prefix="/api/proteins", tags=["proteins"])
app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])


@app.get("/api/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    repository: FixtureRepository = app.state.fixture_repository
    return HealthResponse(
        status="ok",
        proteins_loaded=len(repository.proteins_by_id),
        nodes_loaded=len(repository.nodes_by_id),
    )
