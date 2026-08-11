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
  fetchPath,
  fetchProteinDetail,
  fetchSimilarProteins,
  fetchStructureAsset,
  fetchUniverse,
  fetchUniverseAssets,
  searchGraph,
  searchProteins,
} from "@/lib/api";
import { CommandBar, CommandBarResult } from "@/components/CommandBar";
import { GraphWorkspace } from "@/components/GraphWorkspace";
import { GuideWorkspace } from "@/components/GuideWorkspace";
import { StructureViewport } from "@/components/StructureViewport";
import { UniverseViewport } from "@/components/UniverseViewport";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useGenomeCanvasStore } from "@/lib/store";
import { GraphNode, GraphNodeType, ProteinSearchResult, SimilarProteinResult } from "@/lib/types";
import { inferEntityType, isProteinId } from "@/lib/utils";


type PaletteResult =
  | {
      kind: "protein";
      key: string;
      label: string;
      subtitle: string;
      meta: string;
      protein: ProteinSearchResult;
    }
  | {
      kind: "graph";
      key: string;
      label: string;
      subtitle: string;
      meta: string;
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
  const paletteOpen = useGenomeCanvasStore((state) => state.paletteOpen);
  const cameraTarget = useGenomeCanvasStore((state) => state.cameraTarget);
  const proteinDetails = useGenomeCanvasStore((state) => state.proteinDetails);
  const loading = useGenomeCanvasStore((state) => state.loading);
  const graphHops = useGenomeCanvasStore((state) => state.graphHops);
  const graphSelectionId = useGenomeCanvasStore((state) => state.graphSelectionId);
  const viewportPreset = useGenomeCanvasStore((state) => state.viewportPreset);
  const viewportRevision = useGenomeCanvasStore((state) => state.viewportRevision);
  const rightRailSections = useGenomeCanvasStore((state) => state.rightRailSections);
  const setUniverse = useGenomeCanvasStore((state) => state.setUniverse);
  const upsertUniverseAssets = useGenomeCanvasStore((state) => state.upsertUniverseAssets);
  const upsertStructureAsset = useGenomeCanvasStore((state) => state.upsertStructureAsset);
  const setSearchResults = useGenomeCanvasStore((state) => state.setSearchResults);
  const setGraphResults = useGenomeCanvasStore((state) => state.setGraphResults);
  const setGraphData = useGenomeCanvasStore((state) => state.setGraphData);
  const upsertProteinDetail = useGenomeCanvasStore((state) => state.upsertProteinDetail);
  const setHoveredEntityId = useGenomeCanvasStore((state) => state.setHoveredEntityId);
  const setGraphRootId = useGenomeCanvasStore((state) => state.setGraphRootId);
  const setUniverseFilter = useGenomeCanvasStore((state) => state.setUniverseFilter);
  const setHighlightedIds = useGenomeCanvasStore((state) => state.setHighlightedIds);
  const setPaletteOpen = useGenomeCanvasStore((state) => state.setPaletteOpen);
  const setCameraTarget = useGenomeCanvasStore((state) => state.setCameraTarget);
  const setLoading = useGenomeCanvasStore((state) => state.setLoading);
  const setGraphHops = useGenomeCanvasStore((state) => state.setGraphHops);
  const setGraphSelectionId = useGenomeCanvasStore((state) => state.setGraphSelectionId);
  const graphPathIds = useGenomeCanvasStore((state) => state.graphPathIds);
  const setGraphPathIds = useGenomeCanvasStore((state) => state.setGraphPathIds);
  const setViewportPreset = useGenomeCanvasStore((state) => state.setViewportPreset);
  const setRightRailSection = useGenomeCanvasStore((state) => state.setRightRailSection);
  const spotlightEntity = useGenomeCanvasStore((state) => state.spotlightEntity);
  const focusProteinState = useGenomeCanvasStore((state) => state.focusProtein);
  const leaveFocus = useGenomeCanvasStore((state) => state.leaveFocus);
  const applyCommand = useGenomeCanvasStore((state) => state.applyCommand);

  const [similarProteins, setSimilarProteins] = useState<SimilarProteinResult[]>([]);
  const [commandInput, setCommandInput] = useState("");
  const [queuedPrompt, setQueuedPrompt] = useState<string | null>(null);
  const [pathPending, setPathPending] = useState(false);
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
      meta: protein.match_reason,
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
        meta: node.id,
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
      setViewportPreset("fit-all");
      setPaletteOpen(false);
    },
    [setHighlightedIds, setPaletteOpen, setSearchResults, setUniverseFilter, setViewportPreset],
  );

  const spotlightProtein = useCallback(
    async (uniprotId: string) => {
      await hydrateProtein(uniprotId);
      spotlightEntity({ id: uniprotId, type: "protein" });
      setPaletteOpen(false);
    },
    [hydrateProtein, setPaletteOpen, spotlightEntity],
  );

  const tracePath = useCallback(
    async (targetId: string) => {
      if (!graphRootId || targetId === graphRootId) {
        return;
      }
      setPathPending(true);
      try {
        const result = await fetchPath(graphRootId, targetId);
        setGraphPathIds(result.path_ids);
      } catch (error) {
        // The endpoint 404s when the two entities are in the graph but have no
        // connecting route. That is an answer, not a failure, so it renders as
        // an empty path rather than an error.
        setGraphPathIds([]);
        console.error(error);
      } finally {
        setPathPending(false);
      }
    },
    [graphRootId, setGraphPathIds],
  );

  const openGraphContext = useCallback(
    async (id: string, type: GraphNodeType | "protein") => {
      if (type === "protein") {
        await hydrateProtein(id);
      }
      spotlightEntity({ id, type });
      setGraphSelectionId(id);
      setPaletteOpen(false);
    },
    [hydrateProtein, setGraphSelectionId, setPaletteOpen, spotlightEntity],
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
        // First paint needs the 24-vertex tier only. The 72-vertex tier is 71.5%
        // of the full payload and renders only on hover, selection, or focus, so
        // it is fetched after the scene is on screen rather than ahead of it.
        const [proteins, lowAssets] = await Promise.all([
          fetchUniverse(),
          fetchUniverseAssets("low"),
        ]);
        if (cancelled) {
          return;
        }
        setUniverse(proteins);
        upsertUniverseAssets(lowAssets);
      } finally {
        if (!cancelled) {
          setLoading("universe", false);
        }
      }

      // Backfill. A failure here costs detail on hover, not the scene, so it
      // stays out of the loading flag and is swallowed rather than surfaced.
      try {
        const midAssets = await fetchUniverseAssets("mid");
        if (!cancelled) {
          upsertUniverseAssets(midAssets);
        }
      } catch (error) {
        console.error("mid-tier universe assets failed to load", error);
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
    if (!graphRootId) {
      setGraphData(null);
      return;
    }

    let cancelled = false;
    const currentGraphRoot = graphRootId;
    // A traced route belongs to the root it was traced from. Re-rooting makes it
    // meaningless, and leaving it on screen would dim a neighborhood against a
    // path that no longer refers to it.
    setGraphPathIds(null);
    async function loadGraph() {
      setLoading("graph", true);
      try {
        const graph = await fetchNeighborhood(currentGraphRoot, graphHops);
        if (!cancelled) {
          setGraphData(graph);
          setGraphSelectionId(currentGraphRoot);
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
  }, [graphHops, graphRootId, setGraphData, setGraphPathIds, setGraphSelectionId, setLoading]);

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

      if (experienceMode === "focus") {
        leaveFocus();
        return;
      }

      if (rightRailSections.guide) {
        setRightRailSection("guide", false);
        return;
      }

      if (rightRailSections.graph) {
        setRightRailSection("graph", false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [experienceMode, leaveFocus, paletteOpen, rightRailSections.graph, rightRailSections.guide, setPaletteOpen, setRightRailSection]);

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

  const commandBarResults = useMemo<CommandBarResult[]>(
    () =>
      paletteResults.map((result) => {
        if (result.kind === "protein") {
          return {
            key: result.key,
            kind: "protein",
            label: result.label,
            subtitle: result.subtitle,
            meta: result.meta,
            actions: [
              {
                label: "Spotlight",
                onSelect: () => void spotlightProtein(result.protein.uniprot_id),
              },
              {
                label: "Dive",
                onSelect: () => void focusProtein(result.protein.uniprot_id),
                tone: "primary",
              },
              {
                label: "Filter",
                onSelect: () => void highlightFilter(result.protein.gene_name),
              },
              {
                label: "Graph",
                onSelect: () => void openGraphContext(result.protein.uniprot_id, "protein"),
              },
            ],
          };
        }

        return {
          key: result.key,
          kind: "graph",
          label: result.label,
          subtitle: result.subtitle,
          meta: result.meta,
          actions: [
            {
              label: "Open",
              onSelect: () => void openGraphContext(result.node.id, result.node.type),
              tone: "primary",
            },
            {
              label: "Filter",
              onSelect: () => void highlightFilter(result.node.label),
            },
          ],
        };
      }),
    [focusProtein, highlightFilter, openGraphContext, paletteResults, spotlightProtein],
  );

  const selectionLabel = useMemo(() => {
    if (!selectedEntity) {
      return null;
    }

    const proteinTitle = selectedEntity.type === "protein"
      ? proteinDetails[selectedEntity.id]?.gene_name ?? selectedEntity.id
      : graphData?.nodes.find((node) => node.id === selectedEntity.id)?.label ?? selectedEntity.id;

    return {
      eyebrow: selectedEntity.type.replace("_", " "),
      title: proteinTitle,
    };
  }, [graphData?.nodes, proteinDetails, selectedEntity]);

  const countsLabel = `${universe.length} structures • ${Object.keys(universeAssets).length} traces`;
  const modeLabel = experienceMode === "focus" ? "Focused structure" : "Exploration workspace";

  return (
    <div className="immersive-page">
      <WorkspaceShell
        commandBar={(
          <CommandBar
            countsLabel={countsLabel}
            graphVisible={rightRailSections.graph}
            guideVisible={rightRailSections.guide}
            isSearching={isSearching}
            modeLabel={modeLabel}
            onFocusInput={() => setPaletteOpen(true)}
            onQueryChange={setCommandInput}
            onSubmit={handlePaletteSubmit}
            onToggleGraph={() => setRightRailSection("graph", !rightRailSections.graph)}
            onToggleGuide={() => setRightRailSection("guide", !rightRailSections.guide)}
            query={commandInput}
            results={commandBarResults}
            resultsOpen={paletteOpen && Boolean(commandInput.trim())}
            selectionLabel={selectionLabel}
          />
        )}
        graph={(
          <GraphWorkspace
            graphData={graphData}
            graphHops={graphHops}
            graphRootId={graphRootId}
            graphSelectionId={graphSelectionId}
            highlightedIds={highlightedIds}
            loading={loading.graph}
            onChangeHops={setGraphHops}
            onClearPath={() => setGraphPathIds(null)}
            onTracePath={(targetId) => void tracePath(targetId)}
            pathIds={graphPathIds}
            pathPending={pathPending}
            onClose={() => setRightRailSection("graph", !rightRailSections.graph)}
            onSelectNode={(nodeId, nodeType) => {
              setGraphSelectionId(nodeId);
              if (nodeType === "protein") {
                void spotlightProtein(nodeId);
                return;
              }
              void openGraphContext(nodeId, nodeType);
            }}
            open={rightRailSections.graph}
            selectedEntityId={selectedEntity?.id ?? null}
          />
        )}
        guide={(
          <GuideWorkspace
            graphRootId={graphRootId}
            highlightedIds={highlightedIds}
            onClose={() => setRightRailSection("guide", !rightRailSections.guide)}
            onCommand={handleCommand}
            onPromptConsumed={() => setQueuedPrompt(null)}
            open={rightRailSections.guide}
            queuedPrompt={queuedPrompt}
            selectedEntity={selectedEntity}
            selectedProteinId={selectedProteinId}
            universeFilter={universeFilter}
          />
        )}
        stageFooter={(
          <div className="stage-footnote-copy">
            <span>Double-click a ribbon to open focused structure mode.</span>
            <span>Use Fit all anytime after zooming deep into the universe.</span>
          </div>
        )}
        stageOverlay={(
          <>
            <div className="stage-context-card">
              <span>{hoveredProtein ? hoveredProtein.function_category.replace("_", " ") : "Navigation"}</span>
              <strong>{hoveredProtein ? hoveredProtein.gene_name : "Universe controls are now persistent"}</strong>
              <p>
                {hoveredProtein
                  ? hoveredProtein.name
                  : "Search from the command bar, inspect graph neighbors on the right, and keep the guide visible while you explore."}
              </p>
            </div>

            {selectedEntity ? (
              <div className="stage-context-card secondary">
                <span>Selected entity</span>
                <strong>{selectionLabel?.title ?? selectedEntity.id}</strong>
                <p>{selectedEntity.id}</p>
              </div>
            ) : null}
          </>
        )}
        viewport={focusedProtein ? (
          <StructureViewport
            onBack={leaveFocus}
            onSelectProtein={(uniprotId) => void focusProtein(uniprotId)}
            protein={focusedProtein}
            similarProteins={similarProteins}
            structureAsset={focusedStructureAsset}
          />
        ) : (
          <UniverseViewport
            cameraTarget={cameraTarget}
            experienceMode={experienceMode}
            filter={universeFilter}
            focusedProteinId={focusedProteinId}
            highlightedIds={highlightedIds}
            hoveredEntityId={hoveredEntityId}
            loading={loading.universe}
            onBackgroundClick={() => {
              setHoveredEntityId(null);
              setCameraTarget({ id: null, mode: "wide" });
              setViewportPreset("fit-all");
            }}
            onCenterSelection={() => setViewportPreset(selectedEntity ? "selection" : "fit-all")}
            onFitAll={() => {
              setCameraTarget({ id: null, mode: "wide" });
              setViewportPreset("fit-all");
            }}
            onFocusProtein={(uniprotId) => void focusProtein(uniprotId)}
            onHoverProtein={setHoveredEntityId}
            onResetView={() => {
              if (experienceMode === "focus") {
                setViewportPreset("focus");
                return;
              }
              setViewportPreset(selectedEntity ? "selection" : "fit-all");
            }}
            onSpotlightProtein={(uniprotId) => void spotlightProtein(uniprotId)}
            proteins={universe}
            selectedProteinId={selectedProteinId}
            universeAssets={universeAssets}
            viewportPreset={viewportPreset}
            viewportRevision={viewportRevision}
          />
        )}
      />
    </div>
  );
}
