from pydantic import BaseModel


class ProteinSummary(BaseModel):
    uniprot_id: str
    name: str
    gene_name: str
    organism: str
    function_category: str
    umap_x: float
    umap_y: float
    umap_z: float


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
    diseases: list[dict] = []
    drugs: list[dict] = []
    go_terms: list[dict] = []


class GraphNode(BaseModel):
    id: str
    label: str
    type: str  # protein, disease, drug, trial
    properties: dict = {}


class GraphEdge(BaseModel):
    source: str
    target: str
    label: str
    properties: dict = {}


class GraphData(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class ChatMessage(BaseModel):
    message: str
    context: dict = {}


class ChatResponse(BaseModel):
    response: str
    commands: list[dict] = []
    sources: list[str] = []
