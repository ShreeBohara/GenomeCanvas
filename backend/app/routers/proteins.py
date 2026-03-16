from fastapi import APIRouter, Request, HTTPException

router = APIRouter()


@router.get("/universe")
async def get_universe(request: Request):
    proteins = request.app.state.protein_data
    return [
        {
            "uniprot_id": p["uniprot_id"],
            "name": p["name"],
            "gene_name": p["gene_name"],
            "function_category": p["function_category"],
            "umap_x": p["umap_x"],
            "umap_y": p["umap_y"],
            "umap_z": p["umap_z"],
        }
        for p in proteins.values()
    ]


@router.get("/search")
async def search_proteins(request: Request, q: str = ""):
    proteins = request.app.state.protein_data
    if not q:
        return list(proteins.values())[:20]
    q_lower = q.lower()
    results = [
        p
        for p in proteins.values()
        if q_lower in p["name"].lower()
        or q_lower in p["gene_name"].lower()
        or q_lower in p.get("function_description", "").lower()
    ]
    return results[:20]


@router.get("/{uniprot_id}")
async def get_protein(uniprot_id: str, request: Request):
    proteins = request.app.state.protein_data
    if uniprot_id not in proteins:
        raise HTTPException(status_code=404, detail="Protein not found")
    return proteins[uniprot_id]


@router.get("/{uniprot_id}/similar")
async def get_similar(uniprot_id: str, request: Request):
    proteins = request.app.state.protein_data
    if uniprot_id not in proteins:
        raise HTTPException(status_code=404, detail="Protein not found")
    target = proteins[uniprot_id]
    # Simple similarity by function category
    similar = [
        p
        for pid, p in proteins.items()
        if pid != uniprot_id and p["function_category"] == target["function_category"]
    ]
    return similar[:10]
