import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ChatPanel } from "@/components/ChatPanel";
import { initialStoreState, useGenomeCanvasStore } from "@/lib/store";


const streamChatMessage = vi.fn();


vi.mock("@/lib/api", () => ({
  streamChatMessage: (...args: unknown[]) => streamChatMessage(...args),
}));


function resetStore() {
  useGenomeCanvasStore.setState({ ...initialStoreState });
}


describe("ChatPanel", () => {
  beforeEach(() => {
    resetStore();
    streamChatMessage.mockReset();
  });

  it("sends prompts and appends streamed assistant content", async () => {
    streamChatMessage.mockImplementation(async (_payload, handlers) => {
      handlers.onSources?.([{ id: "P38398", label: "BRCA1 in UniProt", type: "protein", url: null }]);
      await handlers.onCommand?.({
        type: "load_structure",
        target_id: "P38398",
        target_ids: [],
        query: null,
        viewport: null,
        metadata: {},
      });
      handlers.onChunk?.({ text: "BRCA1 is a tumor suppressor." });
      handlers.onDone?.();
    });

    const onCommand = vi.fn().mockResolvedValue(undefined);
    render(
      <ChatPanel
        graphRootId={null}
        highlightedIds={[]}
        onClose={vi.fn()}
        selectedEntity={null}
        selectedProteinId={null}
        universeFilter=""
        queuedPrompt={null}
        onPromptConsumed={vi.fn()}
        onCommand={onCommand}
        open
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/ask the guide/i), {
      target: { value: "What does BRCA1 do?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText("What does BRCA1 do?")).toBeInTheDocument();
      expect(screen.getByText(/BRCA1 is a tumor suppressor/i)).toBeInTheDocument();
    });
    expect(onCommand).toHaveBeenCalled();
  });
});
