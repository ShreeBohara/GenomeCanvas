from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_graph_service
from app.models.schemas import ErrorResponse, GraphData, GraphPathResponse, GraphQueryRequest, GraphNode
from app.services.graph_service import GraphService

router = APIRouter()


@router.get(
    "/neighborhood/{node_id}",
    response_model=GraphData,
    responses={404: {"model": ErrorResponse}},
)
async def get_neighborhood(
    node_id: str,
    hops: int = Query(default=1, ge=1, le=2),
    graph_service: GraphService = Depends(get_graph_service),
) -> GraphData:
    result = graph_service.get_neighborhood(node_id, hops)
    if not result.nodes:
        raise HTTPException(status_code=404, detail="Node not found")
    return result


@router.get("/search", response_model=list[GraphNode])
async def search_graph(
    q: str = Query(default=""),
    node_type: str | None = Query(default=None, alias="type"),
    limit: int = Query(default=20, ge=1, le=50),
    graph_service: GraphService = Depends(get_graph_service),
) -> list[GraphNode]:
    return graph_service.search_nodes(q, node_type=node_type, limit=limit)


@router.get(
    "/path",
    response_model=GraphPathResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_path(
    from_id: str = Query(alias="from"),
    to_id: str = Query(alias="to"),
    graph_service: GraphService = Depends(get_graph_service),
) -> GraphPathResponse:
    result = graph_service.find_path(from_id, to_id)
    if not result.path_ids:
        raise HTTPException(status_code=404, detail="Path not found")
    return result


@router.post("/query", response_model=GraphData)
async def query_graph(
    request: GraphQueryRequest,
    graph_service: GraphService = Depends(get_graph_service),
) -> GraphData:
    return graph_service.query(request)
