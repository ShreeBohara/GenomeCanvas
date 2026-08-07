"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { streamChatMessage } from "@/lib/api";
import { useGenomeCanvasStore } from "@/lib/store";
import { ChatCommand, SelectedEntity } from "@/lib/types";


type GuideWorkspaceProps = {
  open: boolean;
  graphRootId: string | null;
  highlightedIds: string[];
  selectedEntity: SelectedEntity | null;
  selectedProteinId: string | null;
  universeFilter: string;
  queuedPrompt: string | null;
  onClose: () => void;
  onPromptConsumed: () => void;
  onCommand: (command: ChatCommand) => Promise<void>;
};

export const STARTER_PROMPTS = [
  "What does BRCA1 do?",
  "Show me proteins involved in Alzheimer's disease",
  "Find drugs targeting EGFR",
];

function describeCommand(command: ChatCommand) {
  switch (command.type) {
    case "highlight":
      return "Highlight selection";
    case "navigate":
      return "Open graph context";
    case "filter_universe":
      return "Filter universe";
    case "load_structure":
      return "Load structure";
    case "set_graph_root":
      return "Set graph root";
    case "set_viewport":
      return command.viewport === "focus" ? "Enter focus mode" : "Return to universe";
    default:
      return command.type;
  }
}

export function GuideWorkspace({
  open,
  graphRootId,
  highlightedIds,
  selectedEntity,
  selectedProteinId,
  universeFilter,
  queuedPrompt,
  onClose,
  onPromptConsumed,
  onCommand,
}: GuideWorkspaceProps) {
  const chatSession = useGenomeCanvasStore((state) => state.chatSession);
  const loading = useGenomeCanvasStore((state) => state.loading.chat);
  const appendMessage = useGenomeCanvasStore((state) => state.appendMessage);
  const appendAssistantChunk = useGenomeCanvasStore((state) => state.appendAssistantChunk);
  const attachSources = useGenomeCanvasStore((state) => state.attachSources);
  const appendCommand = useGenomeCanvasStore((state) => state.appendCommand);
  const finalizeMessage = useGenomeCanvasStore((state) => state.finalizeMessage);
  const setLoading = useGenomeCanvasStore((state) => state.setLoading);
  const resetChat = useGenomeCanvasStore((state) => state.resetChat);
  const setGuideOpen = useGenomeCanvasStore((state) => state.setGuideOpen);

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatSession]);

  const context = useMemo(
    () => ({
      selected_entity_id: selectedEntity?.id ?? null,
      selected_protein_id: selectedProteinId,
      graph_root_id: graphRootId,
      universe_filter: universeFilter || null,
      highlighted_ids: highlightedIds,
    }),
    [graphRootId, highlightedIds, selectedEntity?.id, selectedProteinId, universeFilter],
  );

  useEffect(() => {
    if (!open || !queuedPrompt) {
      return;
    }
    void sendPrompt(queuedPrompt);
    onPromptConsumed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, queuedPrompt, onPromptConsumed]);

  async function sendPrompt(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return;
    }

    setGuideOpen(true);
    const userId = `user-${Date.now()}`;
    const assistantId = `assistant-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    appendMessage({
      id: userId,
      role: "user",
      content: trimmed,
      status: "complete",
      commands: [],
      sources: [],
    });

    appendMessage({
      id: assistantId,
      role: "assistant",
      content: "",
      status: "streaming",
      commands: [],
      sources: [],
    });

    setLoading("chat", true);

    try {
      await streamChatMessage(
        {
          message: trimmed,
          context,
        },
        {
          onSources: (sources) => attachSources(assistantId, sources),
          onCommand: async (command) => {
            appendCommand(assistantId, command);
            await onCommand(command);
          },
          onChunk: ({ text, paragraph }) => appendAssistantChunk(assistantId, text, paragraph),
          onDone: () => finalizeMessage(assistantId),
          onError: ({ detail }) => appendAssistantChunk(assistantId, detail),
        },
      );
    } finally {
      finalizeMessage(assistantId);
      setLoading("chat", false);
    }
  }

  return (
    <section className={`rail-panel guide-workspace ${open ? "" : "collapsed"}`}>
      <header className="rail-panel-header">
        <div>
          <p className="eyebrow-label">AI guide</p>
          <h2>Guided exploration</h2>
        </div>
        <div className="toolbar-group">
          <button className="toolbar-button" onClick={resetChat} type="button">
            Clear
          </button>
          <button className="toolbar-button" onClick={onClose} type="button">
            {open ? "Collapse" : "Expand"}
          </button>
        </div>
      </header>

      {open ? (
        <>
          <div className="guide-scroll-region">
            {chatSession.length === 0 ? (
              <div className="guide-empty-state">
                <p>
                  Ask for a protein, disease, or drug story and the canvas will reframe around it.
                </p>
                <div className="starter-grid">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      className="starter-card"
                      key={prompt}
                      onClick={() => void sendPrompt(prompt)}
                      type="button"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="guide-thread">
                {chatSession.map((message) => (
                  <article className={`guide-message-card ${message.role}`} key={message.id}>
                    <div className="guide-message-header">
                      <span>{message.role === "assistant" ? "Guide" : "You"}</span>
                      <span>{message.status === "streaming" ? "Streaming" : "Ready"}</span>
                    </div>
                    <div className="guide-message-body">{message.content || "Thinking…"}</div>

                    {message.commands.length > 0 ? (
                      <div className="guide-meta-block">
                        <span className="guide-meta-label">Actions</span>
                        <div className="chip-row">
                          {message.commands.map((command, index) => (
                            <span className="inline-chip" key={`${message.id}-${command.type}-${index}`}>
                              {describeCommand(command)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {message.sources.length > 0 ? (
                      <div className="guide-meta-block">
                        <span className="guide-meta-label">Sources</span>
                        <div className="chip-row">
                          {message.sources.map((source) =>
                            source.url ? (
                              <a
                                className="inline-chip"
                                href={source.url}
                                key={source.id}
                                rel="noreferrer"
                                target="_blank"
                              >
                                {source.label}
                              </a>
                            ) : (
                              <span className="inline-chip" key={source.id}>
                                {source.label}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))}
                <div ref={endRef} />
              </div>
            )}
          </div>

          <form
            className="guide-composer"
            onSubmit={(event) => {
              event.preventDefault();
              const prompt = input;
              setInput("");
              void sendPrompt(prompt);
            }}
          >
            <input
              className="guide-composer-input"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask the guide to spotlight a structure, disease, or drug path…"
              value={input}
            />
            <button className="toolbar-button primary" disabled={loading} type="submit">
              {loading ? "Thinking…" : "Send"}
            </button>
          </form>
        </>
      ) : (
        <div className="rail-panel-collapsed-copy">
          {chatSession.length > 0
            ? `${chatSession.length} messages ready in the guide.`
            : "Expand the guide for prompts, narration, and grounded actions."}
        </div>
      )}
    </section>
  );
}
