import { buildCameraFrame, computeSelectionBounds, computeUniverseBounds, distanceToFitBounds } from "@/lib/viewport";
import { ProteinSummary } from "@/lib/types";


const sampleProteins: ProteinSummary[] = [
  {
    uniprot_id: "P11111",
    name: "Alpha kinase",
    gene_name: "ALPK",
    organism: "Homo sapiens",
    function_category: "enzyme",
    umap_x: -3,
    umap_y: 2,
    umap_z: 1,
    cluster_id: "enzyme",
    halo_color: "#77a8ff",
    lod_key: "P11111",
    bounds_radius: 12,
  },
  {
    uniprot_id: "P22222",
    name: "Beta transporter",
    gene_name: "BETA",
    organism: "Homo sapiens",
    function_category: "transporter",
    umap_x: 5,
    umap_y: -4,
    umap_z: 2.5,
    cluster_id: "transporter",
    halo_color: "#8bdc86",
    lod_key: "P22222",
    bounds_radius: 18,
  },
  {
    uniprot_id: "P33333",
    name: "Gamma structural",
    gene_name: "GAMA",
    organism: "Homo sapiens",
    function_category: "structural",
    umap_x: 8,
    umap_y: 7,
    umap_z: 0.6,
    cluster_id: "structural",
    halo_color: "#ff8874",
    lod_key: "P33333",
    bounds_radius: 10,
  },
];

describe("viewport fit helpers", () => {
  it("computes non-empty bounds for the universe", () => {
    const bounds = computeUniverseBounds(sampleProteins);

    expect(bounds.radius).toBeGreaterThan(0);
    expect(bounds.size[0]).toBeGreaterThan(0);
    expect(bounds.max[0]).toBeGreaterThan(bounds.min[0]);
  });

  it("computes a tighter selection bounds for a subset", () => {
    const allBounds = computeUniverseBounds(sampleProteins);
    const selectionBounds = computeSelectionBounds(sampleProteins, ["P11111"]);

    expect(selectionBounds).not.toBeNull();
    expect(selectionBounds?.radius).toBeLessThan(allBounds.radius);
  });

  it("returns farther camera distances for larger bounds", () => {
    const small = distanceToFitBounds(8, 42, 16 / 10);
    const large = distanceToFitBounds(20, 42, 16 / 10);

    expect(large).toBeGreaterThan(small);
  });

  it("builds a valid camera frame around bounds", () => {
    const bounds = computeUniverseBounds(sampleProteins);
    const frame = buildCameraFrame(bounds, 16 / 10);

    expect(frame.distance).toBeGreaterThan(0);
    expect(frame.position[2]).toBeGreaterThan(frame.target[2]);
    expect(frame.maxDistance).toBeGreaterThan(frame.minDistance);
  });
});
