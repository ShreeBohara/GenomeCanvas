export interface GraphNode {
  id: string;
  label: string;
  type: "protein" | "disease" | "drug" | "trial";
  properties: Record<string, string>;
}

export interface GraphEdge {
  source: string;
  target: string;
  label: string;
  properties: Record<string, string | number>;
}

export const NODE_TYPE_COLORS = {
  protein: "#22d3ee",
  disease: "#ef4444",
  drug: "#10b981",
  trial: "#a78bfa",
};

export const GRAPH_NODES: GraphNode[] = [
  { id: "P38398", label: "BRCA1", type: "protein", properties: { function_category: "dna_repair" } },
  { id: "P51587", label: "BRCA2", type: "protein", properties: { function_category: "dna_repair" } },
  { id: "P09874", label: "PARP1", type: "protein", properties: { function_category: "dna_repair" } },
  { id: "P04637", label: "TP53", type: "protein", properties: { function_category: "signaling" } },
  { id: "P00533", label: "EGFR", type: "protein", properties: { function_category: "enzyme" } },
  { id: "P04626", label: "ERBB2", type: "protein", properties: { function_category: "enzyme" } },
  { id: "P01116", label: "KRAS", type: "protein", properties: { function_category: "signaling" } },
  { id: "P15056", label: "BRAF", type: "protein", properties: { function_category: "enzyme" } },
  { id: "P31749", label: "AKT1", type: "protein", properties: { function_category: "enzyme" } },
  { id: "P13569", label: "CFTR", type: "protein", properties: { function_category: "transporter" } },
  { id: "disease:breast_cancer", label: "Breast Cancer", type: "disease", properties: { therapeutic_area: "Oncology" } },
  { id: "disease:ovarian_cancer", label: "Ovarian Cancer", type: "disease", properties: { therapeutic_area: "Oncology" } },
  { id: "disease:nsclc", label: "NSCLC", type: "disease", properties: { therapeutic_area: "Oncology" } },
  { id: "disease:melanoma", label: "Melanoma", type: "disease", properties: { therapeutic_area: "Oncology" } },
  { id: "disease:pancreatic_cancer", label: "Pancreatic Cancer", type: "disease", properties: { therapeutic_area: "Oncology" } },
  { id: "disease:cml", label: "CML", type: "disease", properties: { therapeutic_area: "Oncology" } },
  { id: "disease:glioblastoma", label: "Glioblastoma", type: "disease", properties: { therapeutic_area: "Oncology" } },
  { id: "disease:cystic_fibrosis", label: "Cystic Fibrosis", type: "disease", properties: { therapeutic_area: "Pulmonology" } },
  { id: "disease:colorectal_cancer", label: "Colorectal Cancer", type: "disease", properties: { therapeutic_area: "Oncology" } },
  { id: "drug:olaparib", label: "Olaparib", type: "drug", properties: { mechanism: "PARP inhibitor" } },
  { id: "drug:trastuzumab", label: "Trastuzumab", type: "drug", properties: { mechanism: "HER2 antibody" } },
  { id: "drug:erlotinib", label: "Erlotinib", type: "drug", properties: { mechanism: "EGFR TKI" } },
  { id: "drug:sotorasib", label: "Sotorasib", type: "drug", properties: { mechanism: "KRAS G12C inhibitor" } },
  { id: "drug:vemurafenib", label: "Vemurafenib", type: "drug", properties: { mechanism: "BRAF V600E inhibitor" } },
  { id: "drug:ivacaftor", label: "Ivacaftor", type: "drug", properties: { mechanism: "CFTR potentiator" } },
  { id: "trial:SOLO1", label: "SOLO-1", type: "trial", properties: { phase: "Phase 3", nct: "NCT01844986" } },
  { id: "trial:CLEOPATRA", label: "CLEOPATRA", type: "trial", properties: { phase: "Phase 3", nct: "NCT00567190" } },
  { id: "trial:CodeBreaK100", label: "CodeBreaK 100", type: "trial", properties: { phase: "Phase 2", nct: "NCT03600883" } },
];

export const GRAPH_EDGES: GraphEdge[] = [
  { source: "P38398", target: "disease:breast_cancer", label: "ASSOCIATED_WITH", properties: { score: 0.99 } },
  { source: "P38398", target: "disease:ovarian_cancer", label: "ASSOCIATED_WITH", properties: { score: 0.97 } },
  { source: "P51587", target: "disease:breast_cancer", label: "ASSOCIATED_WITH", properties: { score: 0.97 } },
  { source: "P51587", target: "disease:ovarian_cancer", label: "ASSOCIATED_WITH", properties: { score: 0.95 } },
  { source: "P51587", target: "disease:pancreatic_cancer", label: "ASSOCIATED_WITH", properties: { score: 0.80 } },
  { source: "P09874", target: "disease:breast_cancer", label: "ASSOCIATED_WITH", properties: { score: 0.80 } },
  { source: "P09874", target: "disease:ovarian_cancer", label: "ASSOCIATED_WITH", properties: { score: 0.78 } },
  { source: "P04637", target: "disease:breast_cancer", label: "ASSOCIATED_WITH", properties: { score: 0.88 } },
  { source: "P04637", target: "disease:colorectal_cancer", label: "ASSOCIATED_WITH", properties: { score: 0.85 } },
  { source: "P00533", target: "disease:nsclc", label: "ASSOCIATED_WITH", properties: { score: 0.97 } },
  { source: "P00533", target: "disease:glioblastoma", label: "ASSOCIATED_WITH", properties: { score: 0.88 } },
  { source: "P04626", target: "disease:breast_cancer", label: "ASSOCIATED_WITH", properties: { score: 0.99 } },
  { source: "P01116", target: "disease:pancreatic_cancer", label: "ASSOCIATED_WITH", properties: { score: 0.99 } },
  { source: "P01116", target: "disease:nsclc", label: "ASSOCIATED_WITH", properties: { score: 0.95 } },
  { source: "P01116", target: "disease:colorectal_cancer", label: "ASSOCIATED_WITH", properties: { score: 0.92 } },
  { source: "P15056", target: "disease:melanoma", label: "ASSOCIATED_WITH", properties: { score: 0.97 } },
  { source: "P13569", target: "disease:cystic_fibrosis", label: "ASSOCIATED_WITH", properties: { score: 0.99 } },
  { source: "drug:olaparib", target: "P09874", label: "TARGETS", properties: { mechanism: "PARP inhibition" } },
  { source: "drug:olaparib", target: "P38398", label: "TARGETS", properties: { mechanism: "synthetic lethality" } },
  { source: "drug:trastuzumab", target: "P04626", label: "TARGETS", properties: { mechanism: "HER2 blockade" } },
  { source: "drug:erlotinib", target: "P00533", label: "TARGETS", properties: { mechanism: "EGFR TKI" } },
  { source: "drug:sotorasib", target: "P01116", label: "TARGETS", properties: { mechanism: "KRAS G12C covalent" } },
  { source: "drug:vemurafenib", target: "P15056", label: "TARGETS", properties: { mechanism: "BRAF V600E" } },
  { source: "drug:ivacaftor", target: "P13569", label: "TARGETS", properties: { mechanism: "CFTR potentiation" } },
  { source: "P38398", target: "P51587", label: "INTERACTS_WITH", properties: { interaction_type: "HR complex" } },
  { source: "P38398", target: "P04637", label: "INTERACTS_WITH", properties: { interaction_type: "damage response" } },
  { source: "P09874", target: "P38398", label: "INTERACTS_WITH", properties: { interaction_type: "repair pathway" } },
  { source: "drug:olaparib", target: "trial:SOLO1", label: "INVESTIGATED_IN", properties: { role: "experimental" } },
  { source: "drug:trastuzumab", target: "trial:CLEOPATRA", label: "INVESTIGATED_IN", properties: { role: "experimental" } },
  { source: "drug:sotorasib", target: "trial:CodeBreaK100", label: "INVESTIGATED_IN", properties: { role: "experimental" } },
  { source: "trial:SOLO1", target: "disease:ovarian_cancer", label: "STUDIES", properties: { enrollment: 391 } },
  { source: "trial:CLEOPATRA", target: "disease:breast_cancer", label: "STUDIES", properties: { enrollment: 808 } },
  { source: "trial:CodeBreaK100", target: "disease:nsclc", label: "STUDIES", properties: { enrollment: 129 } },
];
