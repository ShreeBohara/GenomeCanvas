import { initialStoreState, useGenomeCanvasStore } from "@/lib/store";
import { ChatCommand, ChatMessage, ProteinUniverseAsset } from "@/lib/types";


function asset(overrides: Partial<ProteinUniverseAsset>): ProteinUniverseAsset {
  return {
    uniprot_id: "P38398",
    cluster_id: "dna_repair",
    halo_color: "#7de7dc",
    lod_key: "P38398",
    bounds_radius: 42,
    low_trace: null,
    mid_trace: null,
    ...overrides,
  };
}

const LOW = { points: [[0, 0, 0]] as Array<[number, number, number]>, confidence: [90] };
const MID = { points: [[1, 1, 1]] as Array<[number, number, number]>, confidence: [80] };


function seedAssistantMessage(id: string) {
  const message: ChatMessage = {
    id,
    role: "assistant",
    content: "",
    status: "streaming",
    commands: [],
    sources: [],
  };
  useGenomeCanvasStore.getState().appendMessage(message);
}


function resetStore() {
  useGenomeCanvasStore.setState({ ...initialStoreState });
}


describe("universe asset tiers", () => {
  beforeEach(() => {
    resetStore();
  });

  it("merges a later tier into an asset that already has the other one", () => {
    // The two tiers arrive as separate responses, each carrying only what was
    // requested. Replacing rather than merging would discard whichever landed
    // first, and ribbons would lose their geometry the moment `mid` arrived.
    const store = useGenomeCanvasStore.getState();
    store.upsertUniverseAssets([asset({ low_trace: LOW })]);
    store.upsertUniverseAssets([asset({ mid_trace: MID })]);

    const merged = useGenomeCanvasStore.getState().universeAssets.P38398;
    expect(merged.low_trace).toEqual(LOW);
    expect(merged.mid_trace).toEqual(MID);
  });

  it("does not let an absent tier erase one already present", () => {
    const store = useGenomeCanvasStore.getState();
    store.upsertUniverseAssets([asset({ low_trace: LOW, mid_trace: MID })]);
    store.upsertUniverseAssets([asset({ low_trace: null, mid_trace: null })]);

    const merged = useGenomeCanvasStore.getState().universeAssets.P38398;
    expect(merged.low_trace).toEqual(LOW);
    expect(merged.mid_trace).toEqual(MID);
  });

  it("keeps assets for other proteins untouched", () => {
    const store = useGenomeCanvasStore.getState();
    store.upsertUniverseAssets([
      asset({ uniprot_id: "P38398", low_trace: LOW }),
      asset({ uniprot_id: "P00533", low_trace: LOW }),
    ]);
    store.upsertUniverseAssets([asset({ uniprot_id: "P38398", mid_trace: MID })]);

    const all = useGenomeCanvasStore.getState().universeAssets;
    expect(Object.keys(all).sort()).toEqual(["P00533", "P38398"]);
    expect(all.P00533.low_trace).toEqual(LOW);
    expect(all.P00533.mid_trace).toBeNull();
  });
});


describe("GenomeCanvas store", () => {
  beforeEach(() => {
    resetStore();
  });

  it("applies highlight and navigation commands across shared UI state", () => {
    const highlight: ChatCommand = {
      type: "highlight",
      target_id: "P38398",
      target_ids: ["drug:olaparib"],
      query: null,
      viewport: null,
      metadata: {},
    };
    const navigate: ChatCommand = {
      type: "navigate",
      target_id: "disease:breast_cancer",
      target_ids: [],
      query: null,
      viewport: null,
      metadata: {},
    };

    useGenomeCanvasStore.getState().applyCommand(highlight);
    useGenomeCanvasStore.getState().applyCommand(navigate);

    const state = useGenomeCanvasStore.getState();
    expect(state.highlightedIds).toEqual(["P38398", "drug:olaparib"]);
    expect(state.graphRootId).toBe("disease:breast_cancer");
    expect(state.selectedEntity).toEqual({
      id: "disease:breast_cancer",
      type: "disease",
    });
  });

  it("rebuilds paragraph breaks from streamed chunk indices", () => {
    // Regression: every chunk used to be joined with " ", which flattened the
    // backend's deliberate two-paragraph responses into a single block.
    seedAssistantMessage("assistant-1");
    const append = useGenomeCanvasStore.getState().appendAssistantChunk;

    append("assistant-1", "BRCA1 is a tumor suppressor.", 0);
    append("assistant-1", "It repairs double-strand breaks.", 0);
    append("assistant-1", "The structure view is ready.", 1);

    const message = useGenomeCanvasStore
      .getState()
      .chatSession.find((entry) => entry.id === "assistant-1");

    expect(message?.content).toBe(
      "BRCA1 is a tumor suppressor. It repairs double-strand breaks.\n\nThe structure view is ready.",
    );
    expect(message?.paragraphCursor).toBe(1);
  });

  it("defaults to single-paragraph joining when no index is sent", () => {
    seedAssistantMessage("assistant-2");
    const append = useGenomeCanvasStore.getState().appendAssistantChunk;

    append("assistant-2", "First.");
    append("assistant-2", "Second.");

    const message = useGenomeCanvasStore
      .getState()
      .chatSession.find((entry) => entry.id === "assistant-2");

    expect(message?.content).toBe("First. Second.");
  });

  it("switches into focus mode when the chat requests a structure load", () => {
    const loadStructure: ChatCommand = {
      type: "load_structure",
      target_id: "P00533",
      target_ids: [],
      query: null,
      viewport: null,
      metadata: {},
    };

    useGenomeCanvasStore.getState().applyCommand(loadStructure);

    const state = useGenomeCanvasStore.getState();
    expect(state.experienceMode).toBe("focus");
    expect(state.focusedProteinId).toBe("P00533");
    expect(state.graphRootId).toBe("P00533");
    expect(state.selectedEntity).toEqual({ id: "P00533", type: "protein" });
  });
});
