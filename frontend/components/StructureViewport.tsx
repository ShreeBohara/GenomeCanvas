"use client";

import { MolstarViewport } from "@/components/MolstarViewport";
import { ProteinDetail, ProteinStructureAsset, SimilarProteinResult } from "@/lib/types";


type StructureViewportProps = {
  protein: ProteinDetail;
  structureAsset: ProteinStructureAsset | null;
  similarProteins: SimilarProteinResult[];
  onBack: () => void;
  onSelectProtein: (uniprotId: string) => void;
};

export function StructureViewport({
  protein,
  structureAsset,
  similarProteins,
  onBack,
  onSelectProtein,
}: StructureViewportProps) {
  const hasMolstar = Boolean(structureAsset?.alphafold_pdb_url);

  return (
    <div className="structure-workspace">
      <header className="viewport-header">
        <div>
          <p className="eyebrow-label">Focused structure</p>
          <h2>{protein.gene_name}</h2>
          <p className="viewport-subtitle">{protein.name}</p>
        </div>
        <div className="toolbar-group">
          <span className="status-pill accent">Molstar</span>
          <button className="toolbar-button" onClick={onBack} type="button">
            Back to universe
          </button>
        </div>
      </header>

      <div className="structure-grid">
        <section className="structure-stage-card">
          {hasMolstar && structureAsset ? (
            <MolstarViewport
              label={protein.gene_name}
              structureUrl={structureAsset.alphafold_pdb_url as string}
            />
          ) : (
            <div className="viewport-empty-state">
              <div>
                <strong>Approximate focus trace</strong>
                <p>
                  This protein does not currently expose a directly loadable AlphaFold model from
                  the public API, so the app keeps its precomputed trace in focus mode.
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="structure-sidebar">
          <section className="info-card">
            <div className="chip-row">
              <span className="inline-chip">{protein.function_category}</span>
              <span className="inline-chip">{protein.sequence_length} aa</span>
              <span className="inline-chip">{protein.organism}</span>
            </div>
            <p className="info-body">{protein.function_description}</p>
          </section>

          <section className="info-card">
            <div className="panel-section-title">Context</div>
            <div className="chip-row">
              {protein.diseases.slice(0, 4).map((disease) => (
                <span className="inline-chip subtle" key={disease.id}>
                  {disease.name}
                </span>
              ))}
              {protein.drugs.slice(0, 4).map((drug) => (
                <span className="inline-chip subtle" key={drug.id}>
                  {drug.name}
                </span>
              ))}
            </div>
          </section>

          <section className="info-card">
            <div className="panel-section-title">Nearby structures</div>
            <div className="chip-row">
              {similarProteins.slice(0, 5).map((candidate) => (
                <button
                  className="inline-chip"
                  key={candidate.uniprot_id}
                  onClick={() => onSelectProtein(candidate.uniprot_id)}
                  type="button"
                >
                  {candidate.gene_name}
                </button>
              ))}
            </div>
          </section>

          {structureAsset ? (
            <section className="info-card">
              <div className="panel-section-title">Confidence palette</div>
              <div className="metric-grid">
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
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
