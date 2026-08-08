"use client";


export interface CommandBarAction {
  label: string;
  onSelect: () => void | Promise<void>;
  tone?: "default" | "primary";
}

export interface CommandBarResult {
  key: string;
  kind: "protein" | "graph";
  label: string;
  subtitle: string;
  meta?: string;
  actions: CommandBarAction[];
}

type CommandBarProps = {
  countsLabel: string;
  graphVisible: boolean;
  guideVisible: boolean;
  isSearching: boolean;
  modeLabel: string;
  onFocusInput: () => void;
  onQueryChange: (value: string) => void;
  onSubmit: (event?: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onToggleGraph: () => void;
  onToggleGuide: () => void;
  query: string;
  results: CommandBarResult[];
  resultsOpen: boolean;
  selectionLabel: {
    eyebrow: string;
    title: string;
  } | null;
};

export function CommandBar({
  countsLabel,
  graphVisible,
  guideVisible,
  isSearching,
  modeLabel,
  onFocusInput,
  onQueryChange,
  onSubmit,
  onToggleGraph,
  onToggleGuide,
  query,
  results,
  resultsOpen,
  selectionLabel,
}: CommandBarProps) {
  return (
    <div className="command-bar">
      <div className="brand-lockup">
        <div className="brand-orb" />
        <div>
          <p className="eyebrow-label">Protein universe</p>
          <h1>GenomeCanvas</h1>
        </div>
      </div>

      <form
        className="command-search"
        onSubmit={(event) => {
          void onSubmit(event);
        }}
      >
        <div className="command-search-main">
          <p className="eyebrow-label">Explore</p>
          <input
            className="command-input"
            onChange={(event) => onQueryChange(event.target.value)}
            onFocus={onFocusInput}
            placeholder="Search proteins, diseases, drugs, or pathways"
            value={query}
          />
        </div>
        <button className="toolbar-button primary" type="submit">
          {isSearching ? "Searching…" : "Explore"}
        </button>

        {resultsOpen ? (
          <div className="command-results" data-testid="command-results">
            {results.length === 0 && query.trim() ? (
              <div className="command-results-empty">
                No direct matches yet. Press explore to filter the universe.
              </div>
            ) : (
              results.map((result) => (
                <div className="command-result-card" key={result.key}>
                  <div className="command-result-copy">
                    <div className="command-result-title-row">
                      <strong>{result.label}</strong>
                      <span className="command-result-kind">{result.kind}</span>
                    </div>
                    <p>{result.subtitle}</p>
                    {result.meta ? <span className="command-result-meta">{result.meta}</span> : null}
                  </div>
                  <div className="command-result-actions">
                    {result.actions.map((action) => (
                      <button
                        className={`inline-chip ${action.tone === "primary" ? "primary" : ""}`}
                        key={`${result.key}-${action.label}`}
                        onClick={() => {
                          void action.onSelect();
                        }}
                        type="button"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </form>

      <div className="command-status">
        <div className="status-pills">
          <span className="status-pill accent">{modeLabel}</span>
          <span className="status-pill">{countsLabel}</span>
        </div>

        {selectionLabel ? (
          <div className="selection-card">
            <span>{selectionLabel.eyebrow}</span>
            <strong>{selectionLabel.title}</strong>
          </div>
        ) : null}

        <div className="toolbar-group">
          <button
            className={`toolbar-button ${graphVisible ? "active" : ""}`}
            onClick={onToggleGraph}
            type="button"
          >
            {graphVisible ? "Hide graph" : "Show graph"}
          </button>
          <button
            className={`toolbar-button ${guideVisible ? "active" : ""}`}
            onClick={onToggleGuide}
            type="button"
          >
            {guideVisible ? "Hide guide" : "Show guide"}
          </button>
        </div>
      </div>
    </div>
  );
}
