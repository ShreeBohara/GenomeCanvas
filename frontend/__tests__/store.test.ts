import { initialStoreState, useGenomeCanvasStore } from "@/lib/store";
import { ChatCommand, ChatMessage } from "@/lib/types";


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
