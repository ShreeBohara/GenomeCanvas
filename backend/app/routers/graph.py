from fastapi import APIRouter, HTTPException
from app.services.graph_service import graph_service

router = APIRouter()


@router.get("/neighborhood/{node_id}")
async def get_neighborhood(node_id: str, hops: int = 1):
    result = graph_service.get_neighborhood(node_id, min(hops, 3))
    if not result["nodes"]:
        raise HTTPException(status_code=404, detail="Node not found")
    return result


@router.get("/search")
async def search_graph(q: str = "", type: str = None):
    results = graph_service.search_nodes(q, type)
    return results
