import type { Release } from "@genomecanvas/query";
import { useState } from "react";
import { AtlasView } from "./atlas-view.js";
import { type Problem, problemText } from "./messages.js";
import { ProteinTable } from "./protein-table.js";
import { useRelease } from "./use-release.js";

export function AtlasPage() {
  const state = useRelease();
  const [drawProblem, setDrawProblem] = useState<Problem | null>(null);

  return (
    <main className="relative h-full w-full overflow-hidden bg-canvas text-ink">
      {state.status === "ready" && drawProblem === null ? (
        <AtlasView release={state.release} onProblem={setDrawProblem} />
      ) : null}

      <header className="pointer-events-none absolute top-3 left-3 z-10 sm:top-4 sm:left-4">
        <div className="pointer-events-auto rounded-md border border-line bg-surface px-3 py-2">
          <h1 className="font-semibold text-base leading-tight">GenomeCanvas</h1>
          {state.status === "ready" ? (
            <p className="text-muted text-xs">
              {proteinCount(state.release)} human proteins, grouped by function
            </p>
          ) : null}
        </div>
      </header>

      {state.status === "loading" ? <Centred>Loading the protein map…</Centred> : null}
      {state.status === "failed" ? <Failure problem={state.problem} /> : null}
      {state.status === "ready" && drawProblem !== null ? <Failure problem={drawProblem} /> : null}
      {state.status === "ready" ? <ProteinTable release={state.release} /> : null}
    </main>
  );
}

function proteinCount(release: Release): string {
  return release.manifest.rowCount.toLocaleString("en");
}

function Centred({ children }: { children: string }) {
  return (
    <div role="status" className="absolute inset-0 grid place-items-center p-6 text-muted text-sm">
      {children}
    </div>
  );
}

function Failure({ problem }: { problem: Problem }) {
  const { title, body } = problemText(problem);
  return (
    <div className="absolute inset-0 grid place-items-center p-6">
      <section
        role="alert"
        aria-labelledby="failure-title"
        className="max-w-md rounded-md border border-line bg-surface p-6"
      >
        <h2 id="failure-title" className="font-semibold text-lg">
          {title}
        </h2>
        <p className="mt-2 text-muted text-sm">{body}</p>
        {problem === "cannot_draw" ? null : (
          <button
            type="button"
            className="mt-4 rounded-sm border border-line px-3 py-1.5 text-sm hover:bg-canvas"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        )}
      </section>
    </div>
  );
}
