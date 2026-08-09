from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


GraphNodeType = Literal["protein", "disease", "drug", "trial", "go_term", "pathway"]
ViewportType = Literal["universe", "focus"]
UniverseAssetTier = Literal["low", "mid", "all"]
ChatCommandType = Literal[
    "highlight",
    "navigate",
    "filter_universe",
    "load_structure",
    "set_graph_root",
    "set_viewport",
]


class ErrorResponse(BaseModel):
    detail: str


class HealthResponse(BaseModel):
    status: str
    proteins_loaded: int
    nodes_loaded: int


class DiseaseReference(BaseModel):
    id: str
    name: str
    association_score: float | None = None


class DrugReference(BaseModel):
    id: str
    name: str
    mechanism: str | None = None
    max_phase: int | None = None
    drug_type: str | None = None


class GOTerm(BaseModel):
    id: str
    term: str
    category: str


class ProteinSummary(BaseModel):
    uniprot_id: str
    name: str
    gene_name: str
    organism: str
    function_category: str
    umap_x: float
    umap_y: float
    umap_z: float
    cluster_id: str
    halo_color: str
    lod_key: str
    bounds_radius: float


class ProteinSearchResult(ProteinSummary):
    match_reason: str
    score: float


class SimilarProteinResult(ProteinSummary):
    similarity_score: float


class ProteinDetail(BaseModel):
    uniprot_id: str
    name: str
    gene_name: str
    organism: str
    function_description: str
    function_category: str
    sequence_length: int
    subcellular_location: str
    alphafold_url: str
    umap_x: float
    umap_y: float
    umap_z: float
    cluster_id: str | None = None
    halo_color: str | None = None
    lod_key: str | None = None
    bounds_radius: float | None = None
    diseases: list[DiseaseReference] = Field(default_factory=list)
    drugs: list[DrugReference] = Field(default_factory=list)
    go_terms: list[GOTerm] = Field(default_factory=list)


class StructureTrace(BaseModel):
    points: list[list[float]] = Field(default_factory=list)
    confidence: list[float] = Field(default_factory=list)


class ConfidencePalette(BaseModel):
    average: float
    minimum: float
    maximum: float
    very_high_fraction: float
    confident_fraction: float
    low_fraction: float
    very_low_fraction: float


class CameraHint(BaseModel):
    position: list[float]
    target: list[float]
    fov: int = 35


class ProteinUniverseAsset(BaseModel):
    uniprot_id: str
    cluster_id: str
    halo_color: str
    lod_key: str
    bounds_radius: float
    # Both tiers are optional so a caller can ask for one of them. mid_trace is
    # 71.5% of the universe payload but only renders on hover, select, or focus,
    # so shipping it in the first response delays the frame the user is waiting
    # for. The client fetches `low` to paint, then `mid` in the background.
    low_trace: StructureTrace | None = None
    mid_trace: StructureTrace | None = None


class ProteinStructureAsset(ProteinUniverseAsset):
    focus_trace: StructureTrace
    camera: CameraHint
    # Absent when structure_source is not "alphafold". A procedural trace's
    # confidence values are a sine wave, not pLDDT, and presenting them in the
    # same card as real per-residue confidence would be a fabrication.
    confidence_palette: ConfidencePalette | None = None
    alphafold_pdb_url: str | None = None
    structure_source: str = "alphafold"
    # Why the AlphaFold fetch failed, when it did. Kept so a substitution is
    # visible in the data rather than only in the build log.
    structure_error: str | None = None
    similar_ids: list[str] = Field(default_factory=list)


class GraphNode(BaseModel):
    id: str
    label: str
    type: GraphNodeType
    properties: dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    source: str
    target: str
    label: str
    properties: dict[str, Any] = Field(default_factory=dict)


class GraphData(BaseModel):
    nodes: list[GraphNode] = Field(default_factory=list)
    edges: list[GraphEdge] = Field(default_factory=list)


class GraphPathResponse(GraphData):
    path_ids: list[str] = Field(default_factory=list)


class GraphQueryRequest(BaseModel):
    entity_id: str | None = None
    search: str | None = None
    node_type: GraphNodeType | None = None
    hops: int = Field(default=1, ge=1, le=2)
    limit: int = Field(default=20, ge=1, le=50)


class ChatContext(BaseModel):
    selected_entity_id: str | None = None
    selected_protein_id: str | None = None
    graph_root_id: str | None = None
    universe_filter: str | None = None
    highlighted_ids: list[str] = Field(default_factory=list)


class ChatRequest(BaseModel):
    message: str
    context: ChatContext = Field(default_factory=ChatContext)


class ChatCommand(BaseModel):
    type: ChatCommandType
    target_id: str | None = None
    target_ids: list[str] = Field(default_factory=list)
    query: str | None = None
    viewport: ViewportType | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ChatSource(BaseModel):
    id: str
    label: str
    type: str
    url: str | None = None


class ChatEnvelope(BaseModel):
    response: str
    commands: list[ChatCommand] = Field(default_factory=list)
    sources: list[ChatSource] = Field(default_factory=list)
