import { GraphNodeType, ProteinDetail, ProteinSummary } from "@/lib/types";


export const CATEGORY_COLORS: Record<string, string> = {
  enzyme: "#8de285",
  signaling: "#f1766a",
  structural: "#77b0ff",
  transporter: "#f5b55f",
  dna_repair: "#7de7dc",
};

export const NODE_COLORS: Record<GraphNodeType, string> = {
  protein: "#77b0ff",
  disease: "#f1766a",
  drug: "#8de285",
  trial: "#f5b55f",
  go_term: "#7de7dc",
  pathway: "#cab7ff",
};

export const UNIVERSE_SPREAD = 2.25;

export function inferEntityType(id: string): GraphNodeType | "protein" {
  if (!id.includes(":")) {
    return "protein";
  }
  return id.split(":")[0] as GraphNodeType;
}

export function isProteinId(id: string): boolean {
  return !id.includes(":");
}

export function matchesUniverseFilter(protein: ProteinSummary | ProteinDetail, filter: string): boolean {
  if (!filter.trim()) {
    return true;
  }
  const value = filter.toLowerCase();
  const haystacks = [protein.gene_name, protein.name, protein.function_category, protein.organism];
  if ("function_description" in protein) {
    haystacks.push(protein.function_description);
    haystacks.push(...protein.diseases.map((disease) => disease.name));
    haystacks.push(...protein.drugs.map((drug) => drug.name));
  }
  return haystacks.some((haystack) => haystack.toLowerCase().includes(value));
}

export function uniqueIds(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

export function confidenceToColor(confidence: number): string {
  if (confidence >= 90) {
    return "#1d5fff";
  }
  if (confidence >= 70) {
    return "#57cbff";
  }
  if (confidence >= 50) {
    return "#ffd561";
  }
  return "#ff9757";
}

export function traceVertexColors(confidence: number[]): string[] {
  return confidence.map(confidenceToColor);
}

export function proteinScale(boundsRadius: number): number {
  return Math.max(0.55, Math.min(1.38, 0.48 + (Math.sqrt(boundsRadius) / 12)));
}

export function proteinPosition(protein: ProteinSummary): [number, number, number] {
  return [
    protein.umap_x * UNIVERSE_SPREAD,
    protein.umap_y * UNIVERSE_SPREAD * 0.82,
    protein.umap_z * UNIVERSE_SPREAD * 1.2,
  ];
}
