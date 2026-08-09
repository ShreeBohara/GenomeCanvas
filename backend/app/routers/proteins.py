from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies import get_protein_service
from app.models.schemas import (
    ErrorResponse,
    ProteinDetail,
    ProteinSearchResult,
    ProteinStructureAsset,
    ProteinSummary,
    ProteinUniverseAsset,
    SimilarProteinResult,
    UniverseAssetTier,
)
from app.services.protein_service import ProteinService

router = APIRouter()


@router.get("/universe", response_model=list[ProteinSummary])
async def get_universe(
    protein_service: ProteinService = Depends(get_protein_service),
) -> list[ProteinSummary]:
    return protein_service.get_universe()


@router.get("/universe-assets", response_model=list[ProteinUniverseAsset])
async def get_universe_assets(
    tier: UniverseAssetTier = Query(
        default="all",
        description=(
            "Which LOD tier to return. 'low' is the 24-vertex trace used for the "
            "first paint; 'mid' is the 72-vertex trace used on hover and "
            "selection; 'all' returns both. The tiers are disjoint, so a client "
            "can request them separately without transferring the same bytes twice."
        ),
    ),
    protein_service: ProteinService = Depends(get_protein_service),
) -> list[ProteinUniverseAsset]:
    return protein_service.get_universe_assets(tier)


@router.get("/search", response_model=list[ProteinSearchResult])
async def search_proteins(
    q: str = Query(default=""),
    limit: int = Query(default=12, ge=1, le=50),
    protein_service: ProteinService = Depends(get_protein_service),
) -> list[ProteinSearchResult]:
    return protein_service.search(q, limit=limit)


@router.get(
    "/{uniprot_id}/structure-asset",
    response_model=ProteinStructureAsset,
    responses={404: {"model": ErrorResponse}},
)
async def get_structure_asset(
    uniprot_id: str,
    protein_service: ProteinService = Depends(get_protein_service),
) -> ProteinStructureAsset:
    asset = protein_service.get_structure_asset(uniprot_id)
    if asset is None:
        raise HTTPException(status_code=404, detail="Structure asset not found")
    return asset


@router.get(
    "/{uniprot_id}",
    response_model=ProteinDetail,
    responses={404: {"model": ErrorResponse}},
)
async def get_protein(
    uniprot_id: str,
    protein_service: ProteinService = Depends(get_protein_service),
) -> ProteinDetail:
    protein = protein_service.get_protein(uniprot_id)
    if protein is None:
        raise HTTPException(status_code=404, detail="Protein not found")
    return protein


@router.get(
    "/{uniprot_id}/similar",
    response_model=list[SimilarProteinResult],
    responses={404: {"model": ErrorResponse}},
)
async def get_similar(
    uniprot_id: str,
    limit: int = Query(default=8, ge=1, le=25),
    protein_service: ProteinService = Depends(get_protein_service),
) -> list[SimilarProteinResult]:
    protein = protein_service.get_protein(uniprot_id)
    if protein is None:
        raise HTTPException(status_code=404, detail="Protein not found")
    return protein_service.similar(uniprot_id, limit=limit)
