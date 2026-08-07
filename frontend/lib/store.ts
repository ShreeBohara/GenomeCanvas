import { create } from "zustand";

import {
  CameraTarget,
  ChatCommand,
  ChatMessage,
  ChatSource,
  ExperienceMode,
  GraphData,
  GraphNode,
  ProteinDetail,
  ProteinSearchResult,
  ProteinStructureAsset,
  ProteinSummary,
  ProteinUniverseAsset,
  RightRailSections,
  SelectedEntity,
  ViewportPreset,
} from "@/lib/types";
import { inferEntityType, uniqueIds } from "@/lib/utils";


type LoadingState = {
  universe: boolean;
  graph: boolean;
  chat: boolean;
  structure: boolean;
};

export type StoreSnapshot = {
  universe: ProteinSummary[];
  universeAssets: Record<string, ProteinUniverseAsset>;
  structureAssets: Record<string, ProteinStructureAsset>;
  searchResults: ProteinSearchResult[];
  graphResults: GraphNode[];
  graphData: GraphData | null;
  selectedEntity: SelectedEntity | null;
  experienceMode: ExperienceMode;
  focusedProteinId: string | null;
  hoveredEntityId: string | null;
  highlightedIds: string[];
  graphRootId: string | null;
  universeFilter: string;
  graphOpen: boolean;
  guideOpen: boolean;
  paletteOpen: boolean;
  cameraTarget: CameraTarget;
  proteinDetails: Record<string, ProteinDetail>;
  chatSession: ChatMessage[];
  loading: LoadingState;
  graphHops: 1 | 2;
  graphSelectionId: string | null;
  viewportPreset: ViewportPreset;
  viewportRevision: number;
  rightRailSections: RightRailSections;
};

type StoreState = StoreSnapshot & {
  setUniverse: (proteins: ProteinSummary[]) => void;
  upsertUniverseAssets: (assets: ProteinUniverseAsset[]) => void;
  upsertStructureAsset: (asset: ProteinStructureAsset) => void;
  setSearchResults: (results: ProteinSearchResult[]) => void;
  setGraphResults: (results: GraphNode[]) => void;
  setGraphData: (graph: GraphData | null) => void;
  upsertProteinDetail: (protein: ProteinDetail) => void;
  setSelectedEntity: (entity: SelectedEntity | null) => void;
  setHoveredEntityId: (entityId: string | null) => void;
  setExperienceMode: (mode: ExperienceMode) => void;
  setFocusedProteinId: (uniprotId: string | null) => void;
  setGraphRootId: (id: string | null) => void;
  setUniverseFilter: (filter: string) => void;
  setHighlightedIds: (ids: string[]) => void;
  setGraphOpen: (open: boolean) => void;
  setGuideOpen: (open: boolean) => void;
  setPaletteOpen: (open: boolean) => void;
  setCameraTarget: (target: CameraTarget) => void;
  setLoading: (key: keyof LoadingState, value: boolean) => void;
  setGraphHops: (hops: 1 | 2) => void;
  setGraphSelectionId: (id: string | null) => void;
  setViewportPreset: (preset: ViewportPreset) => void;
  setRightRailSection: (section: keyof RightRailSections, open: boolean) => void;
  spotlightEntity: (entity: SelectedEntity) => void;
  focusProtein: (uniprotId: string) => void;
  leaveFocus: () => void;
  appendMessage: (message: ChatMessage) => void;
  appendAssistantChunk: (messageId: string, chunk: string, paragraph?: number) => void;
  attachSources: (messageId: string, sources: ChatSource[]) => void;
  appendCommand: (messageId: string, command: ChatCommand) => void;
  finalizeMessage: (messageId: string) => void;
  applyCommand: (command: ChatCommand) => void;
  resetChat: () => void;
  resetExperience: () => void;
};


export const initialStoreState: StoreSnapshot = {
  universe: [],
  universeAssets: {},
  structureAssets: {},
  searchResults: [],
  graphResults: [],
  graphData: null,
  selectedEntity: null,
  experienceMode: "universe",
  focusedProteinId: null,
  hoveredEntityId: null,
  highlightedIds: [],
  graphRootId: null,
  universeFilter: "",
  graphOpen: true,
  guideOpen: true,
  paletteOpen: false,
  cameraTarget: {
    id: null,
    mode: "wide",
  },
  proteinDetails: {},
  chatSession: [],
  loading: {
    universe: false,
    graph: false,
    chat: false,
    structure: false,
  },
  graphHops: 1,
  graphSelectionId: null,
  viewportPreset: "fit-all",
  viewportRevision: 0,
  rightRailSections: {
    graph: true,
    guide: true,
  },
};


export const useGenomeCanvasStore = create<StoreState>((set) => ({
  ...initialStoreState,
  setUniverse: (universe) => set({ universe }),
  upsertUniverseAssets: (assets) =>
    set((state) => ({
      universeAssets: {
        ...state.universeAssets,
        ...Object.fromEntries(assets.map((asset) => [asset.uniprot_id, asset])),
      },
    })),
  upsertStructureAsset: (asset) =>
    set((state) => ({
      structureAssets: {
        ...state.structureAssets,
        [asset.uniprot_id]: asset,
      },
    })),
  setSearchResults: (searchResults) => set({ searchResults }),
  setGraphResults: (graphResults) => set({ graphResults }),
  setGraphData: (graphData) => set({ graphData }),
  upsertProteinDetail: (protein) =>
    set((state) => ({
      proteinDetails: {
        ...state.proteinDetails,
        [protein.uniprot_id]: protein,
      },
    })),
  setSelectedEntity: (selectedEntity) => set({ selectedEntity }),
  setHoveredEntityId: (hoveredEntityId) => set({ hoveredEntityId }),
  setExperienceMode: (experienceMode) => set({ experienceMode }),
  setFocusedProteinId: (focusedProteinId) => set({ focusedProteinId }),
  setGraphRootId: (graphRootId) => set({ graphRootId }),
  setUniverseFilter: (universeFilter) => set({ universeFilter }),
  setHighlightedIds: (highlightedIds) => set({ highlightedIds: uniqueIds(highlightedIds) }),
  setGraphOpen: (graphOpen) =>
    set((state) => ({
      graphOpen,
      rightRailSections: {
        ...state.rightRailSections,
        graph: graphOpen,
      },
    })),
  setGuideOpen: (guideOpen) =>
    set((state) => ({
      guideOpen,
      rightRailSections: {
        ...state.rightRailSections,
        guide: guideOpen,
      },
    })),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setCameraTarget: (cameraTarget) => set({ cameraTarget }),
  setGraphHops: (graphHops) => set({ graphHops }),
  setGraphSelectionId: (graphSelectionId) => set({ graphSelectionId }),
  setViewportPreset: (viewportPreset) =>
    set((state) => ({
      viewportPreset,
      viewportRevision: state.viewportRevision + 1,
    })),
  setRightRailSection: (section, open) =>
    set((state) => ({
      rightRailSections: {
        ...state.rightRailSections,
        [section]: open,
      },
      graphOpen: section === "graph" ? open : state.graphOpen,
      guideOpen: section === "guide" ? open : state.guideOpen,
    })),
  setLoading: (key, value) =>
    set((state) => ({
      loading: {
        ...state.loading,
        [key]: value,
      },
    })),
  spotlightEntity: (entity) =>
    set((state) => ({
      selectedEntity: entity,
      graphRootId: entity.id,
      graphSelectionId: entity.id,
      highlightedIds: uniqueIds([
        ...(entity.type === "protein" ? [entity.id] : []),
        ...state.highlightedIds,
      ]),
      cameraTarget: {
        id: entity.id,
        mode: "spotlight",
      },
      graphOpen: true,
      viewportPreset: entity.type === "protein" ? "selection" : "fit-all",
      viewportRevision: state.viewportRevision + 1,
      rightRailSections: {
        ...state.rightRailSections,
        graph: true,
      },
    })),
  focusProtein: (uniprotId) =>
    set((state) => ({
      selectedEntity: { id: uniprotId, type: "protein" },
      focusedProteinId: uniprotId,
      graphRootId: uniprotId,
      graphSelectionId: uniprotId,
      experienceMode: "focus",
      highlightedIds: uniqueIds([uniprotId, ...state.highlightedIds]),
      graphOpen: true,
      cameraTarget: {
        id: uniprotId,
        mode: "focus",
      },
      viewportPreset: "focus",
      viewportRevision: state.viewportRevision + 1,
      rightRailSections: {
        ...state.rightRailSections,
        graph: true,
      },
    })),
  leaveFocus: () =>
    set((state) => ({
      experienceMode: "universe",
      focusedProteinId: null,
      cameraTarget: {
        id: state.selectedEntity?.id ?? null,
        mode: state.selectedEntity ? "spotlight" : "wide",
      },
      viewportPreset: state.selectedEntity ? "selection" : "fit-all",
      viewportRevision: state.viewportRevision + 1,
    })),
  appendMessage: (message) =>
    set((state) => ({
      chatSession: [...state.chatSession, message],
      guideOpen: true,
      rightRailSections: {
        ...state.rightRailSections,
        guide: true,
      },
    })),
  appendAssistantChunk: (messageId, chunk, paragraph = 0) =>
    set((state) => ({
      chatSession: state.chatSession.map((message) => {
        if (message.id !== messageId) {
          return message;
        }

        // Chunks inside one paragraph rejoin with a space; a paragraph change
        // emits a blank line. Previously every chunk was joined with " ", which
        // silently flattened the backend's two-paragraph responses into one.
        const previousParagraph = message.paragraphCursor ?? paragraph;
        const separator = !message.content ? "" : paragraph > previousParagraph ? "\n\n" : " ";

        return {
          ...message,
          content: `${message.content}${separator}${chunk}`,
          paragraphCursor: paragraph,
        };
      }),
      guideOpen: true,
      rightRailSections: {
        ...state.rightRailSections,
        guide: true,
      },
    })),
  attachSources: (messageId, sources) =>
    set((state) => ({
      chatSession: state.chatSession.map((message) =>
        message.id === messageId ? { ...message, sources } : message,
      ),
    })),
  appendCommand: (messageId, command) =>
    set((state) => ({
      chatSession: state.chatSession.map((message) =>
        message.id === messageId
          ? {
              ...message,
              commands: [...message.commands, command],
            }
          : message,
      ),
    })),
  finalizeMessage: (messageId) =>
    set((state) => ({
      chatSession: state.chatSession.map((message) =>
        message.id === messageId ? { ...message, status: "complete" } : message,
      ),
    })),
  applyCommand: (command) =>
    set((state) => {
      const nextState: Partial<StoreState> = {};

      if (command.type === "highlight") {
        nextState.highlightedIds = uniqueIds([
          ...state.highlightedIds,
          ...(command.target_id ? [command.target_id] : []),
          ...command.target_ids,
        ]);
      }

      if (command.type === "filter_universe" && command.query) {
        nextState.universeFilter = command.query;
        nextState.paletteOpen = false;
        nextState.viewportPreset = "fit-all";
        nextState.viewportRevision = state.viewportRevision + 1;
      }

      if ((command.type === "navigate" || command.type === "set_graph_root") && command.target_id) {
        nextState.graphRootId = command.target_id;
        nextState.graphSelectionId = command.target_id;
        nextState.selectedEntity = {
          id: command.target_id,
          type: inferEntityType(command.target_id),
        };
        nextState.graphOpen = true;
        nextState.cameraTarget = {
          id: command.target_id,
          mode: inferEntityType(command.target_id) === "protein" ? "spotlight" : state.cameraTarget.mode,
        };
        nextState.rightRailSections = {
          ...state.rightRailSections,
          graph: true,
        };
        nextState.viewportPreset = inferEntityType(command.target_id) === "protein" ? "selection" : "fit-all";
        nextState.viewportRevision = state.viewportRevision + 1;
      }

      if (command.type === "load_structure" && command.target_id) {
        nextState.experienceMode = "focus";
        nextState.focusedProteinId = command.target_id;
        nextState.selectedEntity = {
          id: command.target_id,
          type: "protein",
        };
        nextState.graphRootId = command.target_id;
        nextState.graphSelectionId = command.target_id;
        nextState.graphOpen = true;
        nextState.cameraTarget = {
          id: command.target_id,
          mode: "focus",
        };
        nextState.rightRailSections = {
          ...state.rightRailSections,
          graph: true,
        };
        nextState.viewportPreset = "focus";
        nextState.viewportRevision = state.viewportRevision + 1;
      }

      if (command.type === "set_viewport" && command.viewport) {
        nextState.experienceMode = command.viewport;
        if (command.viewport === "universe") {
          nextState.focusedProteinId = null;
          nextState.cameraTarget = {
            id: state.selectedEntity?.id ?? null,
            mode: state.selectedEntity ? "spotlight" : "wide",
          };
          nextState.viewportPreset = state.selectedEntity ? "selection" : "fit-all";
          nextState.viewportRevision = state.viewportRevision + 1;
        }
      }

      return nextState as StoreState;
    }),
  resetChat: () => set({ chatSession: [] }),
  resetExperience: () =>
    set((state) => ({
      experienceMode: "universe",
      focusedProteinId: null,
      hoveredEntityId: null,
      highlightedIds: [],
      graphOpen: true,
      guideOpen: true,
      paletteOpen: false,
      cameraTarget: { id: null, mode: "wide" },
      graphSelectionId: null,
      viewportPreset: "fit-all",
      viewportRevision: state.viewportRevision + 1,
      rightRailSections: {
        ...state.rightRailSections,
        graph: true,
        guide: true,
      },
    })),
}));
