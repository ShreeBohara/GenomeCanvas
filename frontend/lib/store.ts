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
  SelectedEntity,
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
  spotlightEntity: (entity: SelectedEntity) => void;
  focusProtein: (uniprotId: string) => void;
  leaveFocus: () => void;
  appendMessage: (message: ChatMessage) => void;
  appendAssistantChunk: (messageId: string, chunk: string) => void;
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
  graphOpen: false,
  guideOpen: false,
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
  setGraphOpen: (graphOpen) => set({ graphOpen }),
  setGuideOpen: (guideOpen) => set({ guideOpen }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setCameraTarget: (cameraTarget) => set({ cameraTarget }),
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
      highlightedIds: uniqueIds([
        ...(entity.type === "protein" ? [entity.id] : []),
        ...state.highlightedIds,
      ]),
      cameraTarget: {
        id: entity.id,
        mode: "spotlight",
      },
      graphOpen: true,
    })),
  focusProtein: (uniprotId) =>
    set((state) => ({
      selectedEntity: { id: uniprotId, type: "protein" },
      focusedProteinId: uniprotId,
      graphRootId: uniprotId,
      experienceMode: "focus",
      highlightedIds: uniqueIds([uniprotId, ...state.highlightedIds]),
      graphOpen: true,
      cameraTarget: {
        id: uniprotId,
        mode: "focus",
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
    })),
  appendMessage: (message) =>
    set((state) => ({
      chatSession: [...state.chatSession, message],
      guideOpen: true,
    })),
  appendAssistantChunk: (messageId, chunk) =>
    set((state) => ({
      chatSession: state.chatSession.map((message) =>
        message.id === messageId
          ? {
              ...message,
              content: `${message.content}${message.content ? " " : ""}${chunk}`.trim(),
            }
          : message,
      ),
      guideOpen: true,
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
      }

      if ((command.type === "navigate" || command.type === "set_graph_root") && command.target_id) {
        nextState.graphRootId = command.target_id;
        nextState.selectedEntity = {
          id: command.target_id,
          type: inferEntityType(command.target_id),
        };
        nextState.graphOpen = true;
        nextState.cameraTarget = {
          id: command.target_id,
          mode: inferEntityType(command.target_id) === "protein" ? "spotlight" : state.cameraTarget.mode,
        };
      }

      if (command.type === "load_structure" && command.target_id) {
        nextState.experienceMode = "focus";
        nextState.focusedProteinId = command.target_id;
        nextState.selectedEntity = {
          id: command.target_id,
          type: "protein",
        };
        nextState.graphRootId = command.target_id;
        nextState.graphOpen = true;
        nextState.cameraTarget = {
          id: command.target_id,
          mode: "focus",
        };
      }

      if (command.type === "set_viewport" && command.viewport) {
        nextState.experienceMode = command.viewport;
        if (command.viewport === "universe") {
          nextState.focusedProteinId = null;
          nextState.cameraTarget = {
            id: state.selectedEntity?.id ?? null,
            mode: state.selectedEntity ? "spotlight" : "wide",
          };
        }
      }

      return nextState as StoreState;
    }),
  resetChat: () => set({ chatSession: [], guideOpen: false }),
  resetExperience: () =>
    set({
      experienceMode: "universe",
      focusedProteinId: null,
      hoveredEntityId: null,
      highlightedIds: [],
      graphOpen: false,
      guideOpen: false,
      paletteOpen: false,
      cameraTarget: { id: null, mode: "wide" },
    }),
}));
