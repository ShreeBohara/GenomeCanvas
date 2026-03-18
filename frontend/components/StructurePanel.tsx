"use client";

import { MolstarViewport } from "@/components/MolstarViewport";
import { ProteinDetail, ProteinStructureAsset, SimilarProteinResult } from "@/lib/types";


type StructurePanelProps = {
  open: boolean;
  protein: ProteinDetail;
  structureAsset: ProteinStructureAsset | null;
  similarProteins: SimilarProteinResult[];
  onBack: () => void;
  onSelectProtein: (uniprotId: string) => void;
};


export function StructurePanel({
  open,
  protein,
  structureAsset,
  similarProteins,
  onBack,
  onSelectProtein,
}: StructurePanelProps) {
  if (!open) {
    return null;
  }

  const hasMolstar = Boolean(structureAsset?.alphafold_pdb_url);

  return (
    <section className="focus-overlay">
      <div className="focus-backdrop" onClick={onBack} />

      <div className="focus-shell">
        <header className="focus-header">
          <div>
            <p className="drawer-kicker">Protein Focus</p>
            <h2 className="focus-title">{protein.gene_name}</h2>
            <p className="focus-copy">{protein.name}</p>
          </div>
          <button className="hud-button" onClick={onBack} type="button">
            Back to universe
          </button>
        </header>

        <div className="focus-surface">
          <div className="focus-structure">
            {hasMolstar && structureAsset ? (
              <MolstarViewport
                label={protein.gene_name}
                structureUrl={structureAsset.alphafold_pdb_url as string}
              />
            ) : (
              <div className="focus-fallback">
                <div>
                  <strong>Approximate focus trace</strong>
                  <p>
                    This protein does not currently expose a directly loadable AlphaFold model
                    from the public API, so the immersive canvas keeps its precomputed trace in
                    focus mode instead of opening Molstar.
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="focus-sidebar">
            <div className="focus-card">
              <div className="focus-chip-row">
                <span className="focus-chip">{protein.function_category}</span>
                <span className="focus-chip">{protein.sequence_length} aa</span>
                <span className="focus-chip">{protein.organism}</span>
              </div>
              <p className="focus-body">{protein.function_description}</p>
            </div>

            <div className="focus-card">
              <p className="focus-section-label">Context</p>
              <div className="focus-chip-row">
                {protein.diseases.slice(0, 4).map((disease) => (
                  <span className="focus-chip subtle" key={disease.id}>
                    {disease.name}
                  </span>
                ))}
                {protein.drugs.slice(0, 4).map((drug) => (
                  <span className="focus-chip subtle" key={drug.id}>
                    {drug.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="focus-card">
              <p className="focus-section-label">Nearby structures</p>
              <div className="focus-chip-row">
                {similarProteins.slice(0, 5).map((candidate) => (
                  <button
                    className="prompt-chip"
                    key={candidate.uniprot_id}
                    onClick={() => onSelectProtein(candidate.uniprot_id)}
                    type="button"
                  >
                    {candidate.gene_name}
                  </button>
                ))}
              </div>
            </div>

            {structureAsset ? (
              <div className="focus-card compact">
                <p className="focus-section-label">Confidence palette</p>
                <div className="focus-metric-grid">
                  <div>
                    <span>Avg pLDDT</span>
                    <strong>{structureAsset.confidence_palette.average}</strong>
                  </div>
                  <div>
                    <span>Very high</span>
                    <strong>{Math.round(structureAsset.confidence_palette.very_high_fraction * 100)}%</strong>
                  </div>
                  <div>
                    <span>Low</span>
                    <strong>{Math.round(structureAsset.confidence_palette.low_fraction * 100)}%</strong>
                  </div>
                  <div>
                    <span>Source</span>
                    <strong>{structureAsset.structure_source}</strong>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
