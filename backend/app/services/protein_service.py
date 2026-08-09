from __future__ import annotations

import math

from app.core.text import overlap_score, tokenize
from app.models.schemas import (
    ProteinDetail,
    ProteinSearchResult,
    ProteinSummary,
    ProteinStructureAsset,
    ProteinUniverseAsset,
    SimilarProteinResult,
    UniverseAssetTier,
)
from app.repositories.fixture_repository import FixtureRepository


class ProteinService:
    def __init__(self, repository: FixtureRepository):
        self.repository = repository

    def get_universe(self) -> list[ProteinSummary]:
        proteins = sorted(self.repository.list_proteins(), key=lambda item: item.gene_name)
        return [ProteinSummary.model_validate(self._with_visual_metadata(protein)) for protein in proteins]

    def get_protein(self, uniprot_id: str) -> ProteinDetail | None:
        protein = self.repository.get_protein(uniprot_id)
        if protein is None:
            return None
        return ProteinDetail.model_validate(self._with_visual_metadata(protein))

    def get_universe_assets(self, tier: UniverseAssetTier = "all") -> list[ProteinUniverseAsset]:
        """Universe-tier traces, optionally restricted to one LOD.

        The tiers are disjoint so a client can request them separately without
        paying for the same bytes twice: `low` paints the first frame, `mid`
        backfills the geometry used on hover and selection.
        """
        assets = sorted(
            self.repository.structure_assets_by_id.values(),
            key=lambda asset: asset.uniprot_id,
        )
        include_low = tier in ("low", "all")
        include_mid = tier in ("mid", "all")
        return [
            ProteinUniverseAsset.model_validate(
                {
                    "uniprot_id": asset.uniprot_id,
                    "cluster_id": asset.cluster_id,
                    "halo_color": asset.halo_color,
                    "lod_key": asset.lod_key,
                    "bounds_radius": asset.bounds_radius,
                    "low_trace": asset.low_trace.model_dump() if include_low else None,
                    "mid_trace": asset.mid_trace.model_dump() if include_mid else None,
                }
            )
            for asset in assets
        ]

    def get_structure_asset(self, uniprot_id: str) -> ProteinStructureAsset | None:
        """Focus-tier asset for one protein.

        low_trace and mid_trace are deliberately omitted: any client asking for
        a focus asset has already loaded the universe tiers, and re-sending them
        was a third of this response for no new information.

        similar_ids is likewise dropped. Populating it re-ran the full ranking a
        second time per request -- the client calls /similar for that -- and no
        caller ever read the field.
        """
        asset = self.repository.get_structure_asset(uniprot_id)
        if asset is None:
            return None

        payload = asset.model_dump()
        payload["low_trace"] = None
        payload["mid_trace"] = None
        payload["similar_ids"] = []
        return ProteinStructureAsset.model_validate(payload)

    def search(self, query: str, limit: int) -> list[ProteinSearchResult]:
        proteins = self.repository.list_proteins()
        if not query.strip():
            return [
                ProteinSearchResult.model_validate(
                    {
                        **self._with_visual_metadata(protein),
                        "match_reason": "catalog sample",
                        "score": 0.0,
                    }
                )
                for protein in sorted(proteins, key=lambda item: item.gene_name)[:limit]
            ]

        query_lower = query.lower().strip()
        ranked: list[tuple[float, str, ProteinDetail]] = []
        for protein in proteins:
            score, reason = self._score_match(query_lower, protein)
            if score > 0:
                ranked.append((score, reason, protein))

        ranked.sort(key=lambda item: (-item[0], item[2].gene_name))
        return [
            ProteinSearchResult.model_validate(
                {
                    **self._with_visual_metadata(protein),
                    "match_reason": reason,
                    "score": round(score, 3),
                }
            )
            for score, reason, protein in ranked[:limit]
        ]

    def similar(self, uniprot_id: str, limit: int) -> list[SimilarProteinResult]:
        target = self.repository.get_protein(uniprot_id)
        if target is None:
            return []

        ranked: list[tuple[float, ProteinDetail]] = []
        for protein in self.repository.list_proteins():
            if protein.uniprot_id == target.uniprot_id:
                continue
            distance = math.dist(
                [target.umap_x, target.umap_y, target.umap_z],
                [protein.umap_x, protein.umap_y, protein.umap_z],
            )
            similarity = 1 / (1 + distance)
            ranked.append((similarity, protein))

        ranked.sort(key=lambda item: (-item[0], item[1].gene_name))
        return [
            SimilarProteinResult.model_validate(
                {
                    **self._with_visual_metadata(protein),
                    "similarity_score": round(score, 4),
                }
            )
            for score, protein in ranked[:limit]
        ]

    def proteins_for_disease(self, query: str, limit: int = 8) -> list[ProteinDetail]:
        generic_tokens = {"disease", "syndrome", "cancer", "disorder", "type"}
        significant_tokens = {
            token for token in tokenize(query) if token not in generic_tokens and len(token) > 2
        }
        matches: list[tuple[float, ProteinDetail]] = []
        for protein in self.repository.list_proteins():
            best = 0.0
            for disease in protein.diseases:
                disease_name = disease.name.lower()
                if query.lower() in disease_name or disease_name in query.lower():
                    best = max(best, 1.0)
                    continue

                token_hits = sum(1 for token in significant_tokens if token in disease_name)
                if token_hits:
                    best = max(best, min(0.9, 0.6 + (0.1 * token_hits)))
                    continue

                best = max(best, overlap_score(query, disease.name) * 0.5)
            if best >= 0.6:
                matches.append((best, protein))
        matches.sort(key=lambda item: (-item[0], item[1].gene_name))
        return [protein for _, protein in matches[:limit]]

    def _score_match(self, query: str, protein: ProteinDetail) -> tuple[float, str]:
        score = 0.0
        reason = ""

        if query == protein.uniprot_id.lower():
            return 1.0, "UniProt ID"
        if query == protein.gene_name.lower():
            return 0.99, "Gene symbol"

        candidates = [
            (protein.gene_name, 0.95, "Gene symbol"),
            (protein.name, 0.9, "Protein name"),
            (protein.function_description, 0.6, "Function description"),
            (" ".join(disease.name for disease in protein.diseases), 0.72, "Associated disease"),
            (" ".join(drug.name for drug in protein.drugs), 0.68, "Associated drug"),
        ]

        for candidate, base_score, label in candidates:
            candidate_lower = candidate.lower()
            if query in candidate_lower:
                candidate_score = base_score
            else:
                candidate_score = base_score * overlap_score(query, candidate_lower)
            if candidate_score > score:
                score = candidate_score
                reason = label

        return score, reason

    def _with_visual_metadata(self, protein: ProteinDetail) -> dict[str, object]:
        payload = protein.model_dump()
        asset = self.repository.get_structure_asset(protein.uniprot_id)
        payload["cluster_id"] = protein.function_category
        payload["halo_color"] = asset.halo_color if asset else "#7de7dc"
        payload["lod_key"] = protein.uniprot_id
        payload["bounds_radius"] = asset.bounds_radius if asset else round(max(protein.sequence_length / 120.0, 1.0), 3)
        return payload
