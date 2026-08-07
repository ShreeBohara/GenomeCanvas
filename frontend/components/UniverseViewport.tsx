"use client";

import { CameraTarget, ExperienceMode, ProteinSummary, ProteinUniverseAsset, ViewportPreset } from "@/lib/types";
import { ProteinUniverse } from "@/components/ProteinUniverse";


type UniverseViewportProps = {
  proteins: ProteinSummary[];
  universeAssets: Record<string, ProteinUniverseAsset>;
  filter: string;
  highlightedIds: string[];
  loading: boolean;
  selectedProteinId: string | null;
  focusedProteinId: string | null;
  hoveredEntityId: string | null;
  experienceMode: ExperienceMode;
  cameraTarget: CameraTarget;
  viewportPreset: ViewportPreset;
  viewportRevision: number;
  onHoverProtein: (uniprotId: string | null) => void;
  onSpotlightProtein: (uniprotId: string) => void;
  onFocusProtein: (uniprotId: string) => void;
  onBackgroundClick: () => void;
  onFitAll: () => void;
  onCenterSelection: () => void;
  onResetView: () => void;
};

export function UniverseViewport({
  proteins,
  universeAssets,
  filter,
  highlightedIds,
  loading,
  selectedProteinId,
  focusedProteinId,
  hoveredEntityId,
  experienceMode,
  cameraTarget,
  viewportPreset,
  viewportRevision,
  onHoverProtein,
  onSpotlightProtein,
  onFocusProtein,
  onBackgroundClick,
  onFitAll,
  onCenterSelection,
  onResetView,
}: UniverseViewportProps) {
  const activeSelectionCount = highlightedIds.filter((id) => !id.includes(":")).length;

  return (
    <div className="universe-workspace">
      <header className="viewport-header">
        <div>
          <p className="eyebrow-label">Primary viewport</p>
          <h2>Protein universe</h2>
          <p className="viewport-subtitle">
            Orbit, pan, zoom out, and reframe around selections without losing the scene.
          </p>
        </div>

        <div className="viewport-toolbar">
          <button className="toolbar-button" onClick={onFitAll} type="button">
            Fit all
          </button>
          <button className="toolbar-button" onClick={onCenterSelection} type="button">
            Center selection
          </button>
          <button className="toolbar-button" onClick={onResetView} type="button">
            Reset view
          </button>
        </div>
      </header>

      <div className="viewport-status-row">
        <span className="status-pill accent">{experienceMode === "focus" ? "Focus mode" : "Universe mode"}</span>
        <span className="status-pill">{activeSelectionCount} highlighted proteins</span>
        {filter ? <span className="status-pill">Filter: {filter}</span> : null}
        <span className="status-pill">{viewportPreset}</span>
      </div>

      <div className="universe-stage-card">
        <ProteinUniverse
          cameraTarget={cameraTarget}
          experienceMode={experienceMode}
          filter={filter}
          focusedProteinId={focusedProteinId}
          highlightedIds={highlightedIds}
          hoveredEntityId={hoveredEntityId}
          loading={loading}
          onBackgroundClick={onBackgroundClick}
          onFocusProtein={onFocusProtein}
          onHoverProtein={onHoverProtein}
          onSpotlightProtein={onSpotlightProtein}
          proteins={proteins}
          selectedProteinId={selectedProteinId}
          universeAssets={universeAssets}
          viewportPreset={viewportPreset}
          viewportRevision={viewportRevision}
        />
      </div>
    </div>
  );
}
