import { initialStoreState, useGenomeCanvasStore } from "@/lib/store";
import { ChatCommand } from "@/lib/types";


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
