from __future__ import annotations

from fastapi import Request

from app.repositories.fixture_repository import FixtureRepository
from app.services.chat_service import ChatService
from app.services.graph_service import GraphService
from app.services.protein_service import ProteinService


def get_repository(request: Request) -> FixtureRepository:
    return request.app.state.fixture_repository


def get_protein_service(request: Request) -> ProteinService:
    return request.app.state.protein_service


def get_graph_service(request: Request) -> GraphService:
    return request.app.state.graph_service


def get_chat_service(request: Request) -> ChatService:
    return request.app.state.chat_service
