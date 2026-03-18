import { streamChatMessage } from "@/lib/api";


describe("streamChatMessage", () => {
  it("parses SSE sources, commands, chunks, and completion", async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            [
              'event: sources\ndata: [{"id":"P38398","label":"BRCA1 in UniProt","type":"protein","url":"https://example.com"}]\n\n',
              'event: command\ndata: {"type":"load_structure","target_id":"P38398","target_ids":[],"query":null,"viewport":"focus","metadata":{}}\n\n',
              'event: chunk\ndata: {"text":"BRCA1 is a tumor suppressor."}\n\n',
              'event: done\ndata: {"status":"ok"}\n\n',
            ].join(""),
          ),
        );
        controller.close();
      },
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
          },
        }),
      ),
    );

    const onSources = vi.fn();
    const onCommand = vi.fn();
    const onChunk = vi.fn();
    const onDone = vi.fn();

    await streamChatMessage(
      {
        message: "What does BRCA1 do?",
        context: {
          selected_entity_id: null,
          selected_protein_id: null,
          graph_root_id: null,
          universe_filter: null,
          highlighted_ids: [],
        },
      },
      { onSources, onCommand, onChunk, onDone },
    );

    expect(onSources).toHaveBeenCalledTimes(1);
    expect(onCommand).toHaveBeenCalledWith(
      expect.objectContaining({ type: "load_structure", target_id: "P38398" }),
    );
    expect(onChunk).toHaveBeenCalledWith({ text: "BRCA1 is a tumor suppressor." });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
