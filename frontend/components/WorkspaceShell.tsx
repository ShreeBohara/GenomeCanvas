"use client";

import { ReactNode } from "react";


type WorkspaceShellProps = {
  commandBar: ReactNode;
  viewport: ReactNode;
  graph: ReactNode;
  guide: ReactNode;
  stageOverlay?: ReactNode;
  stageFooter?: ReactNode;
};

export function WorkspaceShell({
  commandBar,
  viewport,
  graph,
  guide,
  stageOverlay,
  stageFooter,
}: WorkspaceShellProps) {
  return (
    <div className="workspace-shell">
      <header className="workspace-topbar">{commandBar}</header>

      <main className="workspace-grid">
        <section className="workspace-stage">
          <div className="workspace-stage-surface">
            {viewport}
            {stageOverlay ? <div className="workspace-stage-overlay">{stageOverlay}</div> : null}
            {stageFooter ? <div className="workspace-stage-footer">{stageFooter}</div> : null}
          </div>
        </section>

        <aside className="workspace-rail">
          {graph}
          {guide}
        </aside>
      </main>
    </div>
  );
}
