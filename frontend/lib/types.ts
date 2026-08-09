export type GraphNodeType = "protein" | "disease" | "drug" | "trial" | "go_term" | "pathway";
export type ExperienceMode = "universe" | "focus";
export type ViewportPreset = "fit-all" | "selection" | "focus";

export interface RightRailSections {
  graph: boolean;
  guide: boolean;
}

export interface ProteinSummary {
  uniprot_id: string;
  name: string;
  gene_name: string;
  organism: string;
  function_category: string;
  umap_x: number;
  umap_y: number;
  umap_z: number;
  cluster_id: string;
  halo_color: string;
  lod_key: string;
  bounds_radius: number;
}

export interface ProteinSearchResult extends ProteinSummary {
  match_reason: string;
  score: number;
}

export interface SimilarProteinResult extends ProteinSummary {
  similarity_score: number;
}

export interface DiseaseReference {
  id: string;
  name: string;
  association_score: number | null;
}

export interface DrugReference {
  id: string;
  name: string;
  mechanism: string | null;
  max_phase: number | null;
  drug_type: string | null;
}

export interface GOTerm {
  id: string;
  term: string;
  category: string;
}

export interface ProteinDetail extends ProteinSummary {
  function_description: string;
  sequence_length: number;
  subcellular_location: string;
  alphafold_url: string;
  diseases: DiseaseReference[];
  drugs: DrugReference[];
  go_terms: GOTerm[];
}

export interface StructureTrace {
  points: Array<[number, number, number]>;
  confidence: number[];
}

export interface ConfidencePalette {
  average: number;
  minimum: number;
  maximum: number;
  very_high_fraction: number;
  confident_fraction: number;
  low_fraction: number;
  very_low_fraction: number;
}

export interface CameraHint {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
}

export type UniverseAssetTier = "low" | "mid" | "all";

export interface ProteinUniverseAsset {
  uniprot_id: string;
  cluster_id: string;
  halo_color: string;
  lod_key: string;
  bounds_radius: number;
  // Nullable because the tiers are fetched separately: `low` paints the first
  // frame, `mid` arrives afterwards and is merged in. Anything reading these
  // must tolerate the tier it wants not having landed yet.
  low_trace: StructureTrace | null;
  mid_trace: StructureTrace | null;
}

export interface ProteinStructureAsset extends ProteinUniverseAsset {
  focus_trace: StructureTrace;
  camera: CameraHint;
  confidence_palette: ConfidencePalette;
  alphafold_pdb_url: string | null;
  structure_source: string;
  similar_ids: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  properties: Record<string, string | number | boolean | null>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  properties: Record<string, string | number | boolean | null>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphPathResponse extends GraphData {
  path_ids: string[];
}

export interface ChatContextPayload {
  selected_entity_id: string | null;
  selected_protein_id: string | null;
  graph_root_id: string | null;
  universe_filter: string | null;
  highlighted_ids: string[];
}

export type ChatCommandType =
  | "highlight"
  | "navigate"
  | "filter_universe"
  | "load_structure"
  | "set_graph_root"
  | "set_viewport";

export interface ChatCommand {
  type: ChatCommandType;
  target_id: string | null;
  target_ids: string[];
  query: string | null;
  viewport: ExperienceMode | null;
  metadata: Record<string, string | number | boolean | null>;
}

export interface ChatSource {
  id: string;
  label: string;
  type: string;
  url: string | null;
}

export interface ChatStreamRequest {
  message: string;
  context: ChatContextPayload;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "streaming" | "complete";
  commands: ChatCommand[];
  sources: ChatSource[];
  /**
   * Index of the last streamed paragraph. The backend chunks a response on word
   * boundaries and tags each chunk with its source paragraph; this is how the
   * client knows to insert a blank line rather than a space between two chunks.
   */
  paragraphCursor?: number;
}

export interface SelectedEntity {
  id: string;
  type: GraphNodeType | "protein";
}

export interface CameraTarget {
  id: string | null;
  mode: "wide" | "spotlight" | "focus";
}
