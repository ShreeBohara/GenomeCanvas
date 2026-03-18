"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { streamChatMessage } from "@/lib/api";
import { useGenomeCanvasStore } from "@/lib/store";
import { ChatCommand, SelectedEntity } from "@/lib/types";


type ChatPanelProps = {
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


export function ChatPanel({
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
}: ChatPanelProps) {
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
          onChunk: ({ text }) => appendAssistantChunk(assistantId, text),
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
    <section className={`guide-deck ${open ? "open" : ""}`}>
      <div className="guide-header">
        <div>
          <p className="drawer-kicker">AI Guide</p>
          <h2 className="drawer-title">Narrated exploration</h2>
        </div>
        <div className="guide-header-actions">
          <button className="hud-button" onClick={resetChat} type="button">
            Clear
          </button>
          <button className="hud-button" onClick={onClose} type="button">
            Hide
          </button>
        </div>
      </div>

      {chatSession.length === 0 ? (
        <div className="guide-empty">
          <p>Ask for a protein, disease, or drug story and the canvas will reframe around it.</p>
          <div className="guide-chip-row">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                className="prompt-chip"
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
        <div className="guide-messages">
          {chatSession.map((message) => (
            <div className={`guide-message ${message.role}`} key={message.id}>
              <div className="guide-message-body">{message.content || "Thinking…"}</div>
              {(message.sources.length > 0 || message.commands.length > 0) && (
                <div className="guide-meta">
                  {message.sources.map((source) =>
                    source.url ? (
                      <a
                        className="message-chip"
                        href={source.url}
                        key={source.id}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {source.label}
                      </a>
                    ) : (
                      <span className="message-chip" key={source.id}>
                        {source.label}
                      </span>
                    ),
                  )}
                  {message.commands.map((command, index) => (
                    <span className="message-chip" key={`${message.id}-${command.type}-${index}`}>
                      {command.type}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}

      <form
        className="guide-form"
        onSubmit={(event) => {
          event.preventDefault();
          const prompt = input;
          setInput("");
          void sendPrompt(prompt);
        }}
      >
        <input
          className="guide-input"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask the guide to spotlight a structure, disease, or drug path…"
          value={input}
        />
        <button className="hud-button primary" disabled={loading} type="submit">
          {loading ? "Thinking…" : "Send"}
        </button>
      </form>
    </section>
  );
}
