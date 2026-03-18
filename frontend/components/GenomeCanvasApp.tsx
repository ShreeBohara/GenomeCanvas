"use client";

import {
  FormEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  fetchNeighborhood,
  fetchProteinDetail,
  fetchSimilarProteins,
  fetchStructureAsset,
  fetchUniverse,
  fetchUniverseAssets,
  searchGraph,
  searchProteins,
} from "@/lib/api";
import { STARTER_PROMPTS, ChatPanel } from "@/components/ChatPanel";
import { GraphPanel } from "@/components/GraphPanel";
import { ProteinUniverse } from "@/components/ProteinUniverse";
import { StructurePanel } from "@/components/StructurePanel";
import { useGenomeCanvasStore } from "@/lib/store";
import { GraphNode, GraphNodeType, ProteinSearchResult, SimilarProteinResult } from "@/lib/types";
import { inferEntityType, isProteinId } from "@/lib/utils";


type PaletteResult =
  | {
      kind: "protein";
      key: string;
      label: string;
      subtitle: string;
      protein: ProteinSearchResult;
    }
  | {
      kind: "graph";
      key: string;
      label: string;
      subtitle: string;
      node: GraphNode;
    };


export function GenomeCanvasApp() {
  const universe = useGenomeCanvasStore((state) => state.universe);
  const universeAssets = useGenomeCanvasStore((state) => state.universeAssets);
  const structureAssets = useGenomeCanvasStore((state) => state.structureAssets);
  const searchResults = useGenomeCanvasStore((state) => state.searchResults);
  const graphResults = useGenomeCanvasStore((state) => state.graphResults);
  const graphData = useGenomeCanvasStore((state) => state.graphData);
  const selectedEntity = useGenomeCanvasStore((state) => state.selectedEntity);
  const experienceMode = useGenomeCanvasStore((state) => state.experienceMode);
  const focusedProteinId = useGenomeCanvasStore((state) => state.focusedProteinId);
  const hoveredEntityId = useGenomeCanvasStore((state) => state.hoveredEntityId);
  const highlightedIds = useGenomeCanvasStore((state) => state.highlightedIds);
  const graphRootId = useGenomeCanvasStore((state) => state.graphRootId);
  const universeFilter = useGenomeCanvasStore((state) => state.universeFilter);
  const graphOpen = useGenomeCanvasStore((state) => state.graphOpen);
  const guideOpen = useGenomeCanvasStore((state) => state.guideOpen);
  const paletteOpen = useGenomeCanvasStore((state) => state.paletteOpen);
  const cameraTarget = useGenomeCanvasStore((state) => state.cameraTarget);
  const proteinDetails = useGenomeCanvasStore((state) => state.proteinDetails);
  const chatSession = useGenomeCanvasStore((state) => state.chatSession);
  const loading = useGenomeCanvasStore((state) => state.loading);
  const setUniverse = useGenomeCanvasStore((state) => state.setUniverse);
  const upsertUniverseAssets = useGenomeCanvasStore((state) => state.upsertUniverseAssets);
  const upsertStructureAsset = useGenomeCanvasStore((state) => state.upsertStructureAsset);
  const setSearchResults = useGenomeCanvasStore((state) => state.setSearchResults);
  const setGraphResults = useGenomeCanvasStore((state) => state.setGraphResults);
  const setGraphData = useGenomeCanvasStore((state) => state.setGraphData);
  const upsertProteinDetail = useGenomeCanvasStore((state) => state.upsertProteinDetail);
  const setSelectedEntity = useGenomeCanvasStore((state) => state.setSelectedEntity);
  const setHoveredEntityId = useGenomeCanvasStore((state) => state.setHoveredEntityId);
  const setGraphRootId = useGenomeCanvasStore((state) => state.setGraphRootId);
  const setUniverseFilter = useGenomeCanvasStore((state) => state.setUniverseFilter);
  const setHighlightedIds = useGenomeCanvasStore((state) => state.setHighlightedIds);
  const setGraphOpen = useGenomeCanvasStore((state) => state.setGraphOpen);
  const setGuideOpen = useGenomeCanvasStore((state) => state.setGuideOpen);
  const setPaletteOpen = useGenomeCanvasStore((state) => state.setPaletteOpen);
  const setCameraTarget = useGenomeCanvasStore((state) => state.setCameraTarget);
  const setLoading = useGenomeCanvasStore((state) => state.setLoading);
  const spotlightEntity = useGenomeCanvasStore((state) => state.spotlightEntity);
  const focusProteinState = useGenomeCanvasStore((state) => state.focusProtein);
  const leaveFocus = useGenomeCanvasStore((state) => state.leaveFocus);
  const applyCommand = useGenomeCanvasStore((state) => state.applyCommand);

  const [similarProteins, setSimilarProteins] = useState<SimilarProteinResult[]>([]);
  const [commandInput, setCommandInput] = useState("");
  const [queuedPrompt, setQueuedPrompt] = useState<string | null>(null);
  const [isSearching, startSearchTransition] = useTransition();
  const deferredQuery = useDeferredValue(commandInput.trim());

  const selectedProteinId =
    selectedEntity && isProteinId(selectedEntity.id) ? selectedEntity.id : null;
  const focusedProtein = focusedProteinId ? proteinDetails[focusedProteinId] ?? null : null;
  const focusedStructureAsset = focusedProteinId ? structureAssets[focusedProteinId] ?? null : null;
  const hoveredProtein = useMemo(
    () => universe.find((protein) => protein.uniprot_id === hoveredEntityId) ?? null,
    [hoveredEntityId, universe],
  );

  const paletteResults = useMemo<PaletteResult[]>(() => {
    const proteinEntries: PaletteResult[] = searchResults.slice(0, 6).map((protein) => ({
      kind: "protein",
      key: `protein-${protein.uniprot_id}`,
      label: protein.gene_name,
      subtitle: protein.name,
      protein,
    }));

    const graphEntries: PaletteResult[] = graphResults
      .filter((node) => !proteinEntries.some((entry) => entry.kind === "protein" && entry.protein.uniprot_id === node.id))
      .slice(0, 6)
      .map((node) => ({
        kind: "graph",
        key: `graph-${node.id}`,
        label: node.label,
        subtitle: node.type.replace("_", " "),
        node,
      }));

    return [...proteinEntries, ...graphEntries];
  }, [graphResults, searchResults]);

  const hydrateProtein = useCallback(
    async (uniprotId: string) => {
      if (proteinDetails[uniprotId]) {
        return proteinDetails[uniprotId];
      }
      const detail = await fetchProteinDetail(uniprotId);
      upsertProteinDetail(detail);
      return detail;
    },
    [proteinDetails, upsertProteinDetail],
  );

  const hydrateStructureAsset = useCallback(
    async (uniprotId: string) => {
      if (structureAssets[uniprotId]) {
        return structureAssets[uniprotId];
      }
      const asset = await fetchStructureAsset(uniprotId);
      upsertStructureAsset(asset);
      return asset;
    },
    [structureAssets, upsertStructureAsset],
  );

  const highlightFilter = useCallback(
    async (query: string) => {
      const results = await searchProteins(query, 12);
      setSearchResults(results);
      setUniverseFilter(query);
      setHighlightedIds(results.map((result) => result.uniprot_id));
      setPaletteOpen(false);
    },
    [setHighlightedIds, setPaletteOpen, setSearchResults, setUniverseFilter],
  );

  const spotlightProtein = useCallback(
    async (uniprotId: string) => {
      await hydrateProtein(uniprotId);
      spotlightEntity({ id: uniprotId, type: "protein" });
      setPaletteOpen(false);
    },
    [hydrateProtein, setPaletteOpen, spotlightEntity],
  );

  const openGraphContext = useCallback(
    async (id: string, type: GraphNodeType | "protein") => {
      if (type === "protein") {
        await hydrateProtein(id);
      }
      spotlightEntity({ id, type });
      setGraphOpen(true);
      setPaletteOpen(false);
    },
    [hydrateProtein, setGraphOpen, setPaletteOpen, spotlightEntity],
  );

  const focusProtein = useCallback(
    async (uniprotId: string) => {
      setLoading("structure", true);
      try {
        await Promise.all([hydrateProtein(uniprotId), hydrateStructureAsset(uniprotId)]);
        focusProteinState(uniprotId);
        setPaletteOpen(false);
      } finally {
        setLoading("structure", false);
      }
    },
    [focusProteinState, hydrateProtein, hydrateStructureAsset, setLoading, setPaletteOpen],
  );

  const handleCommand = useCallback(
    async (command: Parameters<typeof applyCommand>[0]) => {
      applyCommand(command);
      const targetId = command.target_id;
      if (!targetId) {
        return;
      }

      if (command.type === "load_structure" && isProteinId(targetId)) {
        await Promise.all([hydrateProtein(targetId), hydrateStructureAsset(targetId)]);
        return;
      }

      if (isProteinId(targetId)) {
        await hydrateProtein(targetId);
      }
    },
    [applyCommand, hydrateProtein, hydrateStructureAsset],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setLoading("universe", true);
      try {
        const [proteins, assets] = await Promise.all([fetchUniverse(), fetchUniverseAssets()]);
        if (cancelled) {
          return;
        }
        setUniverse(proteins);
        upsertUniverseAssets(assets);
      } finally {
        if (!cancelled) {
          setLoading("universe", false);
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [setLoading, setUniverse, upsertUniverseAssets]);

  useEffect(() => {
    if (!paletteOpen || !deferredQuery) {
      if (!deferredQuery) {
        setSearchResults([]);
        setGraphResults([]);
      }
      return;
    }

    let cancelled = false;
    startSearchTransition(() => {
      void (async () => {
        const [proteins, nodes] = await Promise.all([
          searchProteins(deferredQuery, 8),
          searchGraph(deferredQuery, undefined),
        ]);

        if (cancelled) {
          return;
        }
        setSearchResults(proteins);
        setGraphResults(nodes.slice(0, 8));
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [deferredQuery, paletteOpen, setGraphResults, setSearchResults, startSearchTransition]);

  useEffect(() => {
    if (!graphOpen || !graphRootId) {
      return;
    }

    let cancelled = false;
    const currentGraphRoot = graphRootId;
    async function loadGraph() {
      setLoading("graph", true);
      try {
        const graph = await fetchNeighborhood(currentGraphRoot, 1);
        if (!cancelled) {
          setGraphData(graph);
        }
      } catch (error) {
        if (!cancelled) {
          setGraphData(null);
        }
        console.error(error);
      } finally {
        if (!cancelled) {
          setLoading("graph", false);
        }
      }
    }

    void loadGraph();
    return () => {
      cancelled = true;
    };
  }, [graphOpen, graphRootId, setGraphData, setLoading]);

  useEffect(() => {
    if (!focusedProteinId) {
      setSimilarProteins([]);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const results = await fetchSimilarProteins(focusedProteinId, 6);
        if (!cancelled) {
          setSimilarProteins(results);
        }
      } catch (error) {
        if (!cancelled) {
          setSimilarProteins([]);
        }
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [focusedProteinId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (paletteOpen) {
        setPaletteOpen(false);
        return;
      }
      if (guideOpen) {
        setGuideOpen(false);
        return;
      }
      if (graphOpen) {
        setGraphOpen(false);
        return;
      }
      if (experienceMode === "focus") {
        leaveFocus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [experienceMode, graphOpen, guideOpen, leaveFocus, paletteOpen, setGraphOpen, setGuideOpen, setPaletteOpen]);

  const handlePaletteSubmit = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    if (!commandInput.trim()) {
      setPaletteOpen(false);
      return;
    }
    if (paletteResults[0]?.kind === "protein") {
      await focusProtein(paletteResults[0].protein.uniprot_id);
      return;
    }
    if (paletteResults[0]?.kind === "graph") {
      await openGraphContext(
        paletteResults[0].node.id,
        inferEntityType(paletteResults[0].node.id),
      );
      return;
    }
    await highlightFilter(commandInput.trim());
  };

  return (
    <div className="immersive-page">
      <div className="scene-shell">
        <ProteinUniverse
          cameraTarget={cameraTarget}
          experienceMode={experienceMode}
          filter={universeFilter}
          focusedProteinId={focusedProteinId}
          highlightedIds={highlightedIds}
          hoveredEntityId={hoveredEntityId}
          loading={loading.universe}
          onBackgroundClick={() => {
            setHoveredEntityId(null);
            if (experienceMode === "universe" && cameraTarget.mode !== "wide") {
              setCameraTarget({ id: null, mode: "wide" });
              setGraphOpen(false);
            }
          }}
          onFocusProtein={(uniprotId) => void focusProtein(uniprotId)}
          onHoverProtein={setHoveredEntityId}
          onSpotlightProtein={(uniprotId) => void spotlightProtein(uniprotId)}
          proteins={universe}
          selectedProteinId={selectedProteinId}
          universeAssets={universeAssets}
        />

        <header className="hud">
          <div className="hud-brand">
            <span className="hud-mark" />
            <div>
              <p className="hud-eyebrow">Protein universe</p>
              <h1>GenomeCanvas</h1>
            </div>
          </div>

          <form className="palette-shell" onSubmit={handlePaletteSubmit}>
            <input
              className="palette-input"
              onChange={(event) => setCommandInput(event.target.value)}
              onFocus={() => setPaletteOpen(true)}
              placeholder="Spotlight proteins, diseases, drugs, or pathways"
              value={commandInput}
            />
            <button className="hud-button primary" type="submit">
              {isSearching ? "Searching…" : "Explore"}
            </button>

            <div className={`palette-results ${paletteOpen ? "open" : ""}`}>
              {paletteResults.length === 0 && commandInput.trim() ? (
                <div className="palette-empty">No matches yet. Press explore to filter the universe.</div>
              ) : (
                paletteResults.map((result) => (
                  <div className="palette-result" key={result.key}>
                    <div>
                      <strong>{result.label}</strong>
                      <p>{result.subtitle}</p>
                    </div>
                    <div className="palette-actions">
                      {result.kind === "protein" ? (
                        <>
                          <button
                            className="result-chip"
                            onClick={() => void spotlightProtein(result.protein.uniprot_id)}
                            type="button"
                          >
                            Spotlight
                          </button>
                          <button
                            className="result-chip"
                            onClick={() => void focusProtein(result.protein.uniprot_id)}
                            type="button"
                          >
                            Dive
                          </button>
                          <button
                            className="result-chip"
                            onClick={() => void highlightFilter(result.protein.gene_name)}
                            type="button"
                          >
                            Filter
                          </button>
                          <button
                            className="result-chip"
                            onClick={() => void openGraphContext(result.protein.uniprot_id, "protein")}
                            type="button"
                          >
                            Graph
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="result-chip"
                            onClick={() => void openGraphContext(result.node.id, result.node.type)}
                            type="button"
                          >
                            Spotlight
                          </button>
                          <button
                            className="result-chip"
                            onClick={() => void highlightFilter(result.node.label)}
                            type="button"
                          >
                            Filter
                          </button>
                          <button
                            className="result-chip"
                            onClick={() => void openGraphContext(result.node.id, result.node.type)}
                            type="button"
                          >
                            Graph
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </form>

          <div className="hud-actions">
            {selectedEntity ? (
              <div className="selection-pill">
                <span>{selectedEntity.type}</span>
                <strong>{selectedEntity.id}</strong>
              </div>
            ) : null}
            <button
              className={`hud-button ${graphOpen ? "active" : ""}`}
              onClick={() => setGraphOpen(!graphOpen)}
              type="button"
            >
              Graph
            </button>
            <button
              className={`hud-button ${guideOpen ? "active" : ""}`}
              onClick={() => setGuideOpen(!guideOpen)}
              type="button"
            >
              Guide
            </button>
          </div>
        </header>

        {!guideOpen && chatSession.length === 0 ? (
          <div className="floating-prompts">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                className="prompt-chip"
                key={prompt}
                onClick={() => {
                  setGuideOpen(true);
                  setCommandInput("");
                  setQueuedPrompt(prompt);
                }}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>
        ) : null}

        {hoveredProtein ? (
          <div className="hover-brief">
            <span>{hoveredProtein.function_category.replace("_", " ")}</span>
            <strong>{hoveredProtein.gene_name}</strong>
            <p>{hoveredProtein.name}</p>
          </div>
        ) : null}

        <GraphPanel
          graphData={graphData}
          graphRootId={graphRootId}
          highlightedIds={highlightedIds}
          loading={loading.graph}
          onClose={() => setGraphOpen(false)}
          onSelectNode={(nodeId, nodeType) => {
            if (nodeType === "protein") {
              void spotlightProtein(nodeId);
              return;
            }
            void openGraphContext(nodeId, nodeType);
          }}
          open={graphOpen}
          selectedEntityId={selectedEntity?.id ?? null}
        />

        <ChatPanel
          graphRootId={graphRootId}
          highlightedIds={highlightedIds}
          onClose={() => setGuideOpen(false)}
          onCommand={handleCommand}
          onPromptConsumed={() => setQueuedPrompt(null)}
          open={guideOpen}
          queuedPrompt={queuedPrompt}
          selectedEntity={selectedEntity}
          selectedProteinId={selectedProteinId}
          universeFilter={universeFilter}
        />

        {focusedProtein ? (
          <StructurePanel
            onBack={leaveFocus}
            onSelectProtein={(uniprotId) => void focusProtein(uniprotId)}
            open={experienceMode === "focus"}
            protein={focusedProtein}
            similarProteins={similarProteins}
            structureAsset={focusedStructureAsset}
          />
        ) : null}

        <div className="ambient-copy">
          <span>{universe.length} structures</span>
          <span>{Object.keys(universeAssets).length} trace assets</span>
          <span>{experienceMode}</span>
        </div>
      </div>
    </div>
  );
}
