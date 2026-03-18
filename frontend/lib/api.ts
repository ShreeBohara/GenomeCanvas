import {
  ChatCommand,
  ChatSource,
  ChatStreamRequest,
  GraphData,
  GraphNode,
  GraphPathResponse,
  ProteinDetail,
  ProteinSearchResult,
  ProteinStructureAsset,
  ProteinSummary,
  ProteinUniverseAsset,
  SimilarProteinResult,
} from "@/lib/types";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type ChatHandlers = {
  onSources?: (sources: ChatSource[]) => void;
  onCommand?: (command: ChatCommand) => void | Promise<void>;
  onChunk?: (payload: { text: string }) => void;
  onDone?: () => void;
  onError?: (payload: { detail: string }) => void;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchUniverse(): Promise<ProteinSummary[]> {
  return requestJson<ProteinSummary[]>("/api/proteins/universe");
}

export async function searchProteins(query: string, limit = 8): Promise<ProteinSearchResult[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  return requestJson<ProteinSearchResult[]>(`/api/proteins/search?${params.toString()}`);
}

export async function fetchProteinDetail(uniprotId: string): Promise<ProteinDetail> {
  return requestJson<ProteinDetail>(`/api/proteins/${uniprotId}`);
}

export async function fetchUniverseAssets(): Promise<ProteinUniverseAsset[]> {
  return requestJson<ProteinUniverseAsset[]>("/api/proteins/universe-assets");
}

export async function fetchStructureAsset(uniprotId: string): Promise<ProteinStructureAsset> {
  return requestJson<ProteinStructureAsset>(`/api/proteins/${uniprotId}/structure-asset`);
}

export async function fetchSimilarProteins(uniprotId: string, limit = 6): Promise<SimilarProteinResult[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  return requestJson<SimilarProteinResult[]>(
    `/api/proteins/${uniprotId}/similar?${params.toString()}`,
  );
}

export async function fetchNeighborhood(nodeId: string, hops = 1): Promise<GraphData> {
  const params = new URLSearchParams({ hops: String(hops) });
  return requestJson<GraphData>(`/api/graph/neighborhood/${nodeId}?${params.toString()}`);
}

export async function searchGraph(query: string, type?: string): Promise<GraphNode[]> {
  const params = new URLSearchParams({ q: query });
  if (type) {
    params.set("type", type);
  }
  return requestJson<GraphNode[]>(`/api/graph/search?${params.toString()}`);
}

export async function fetchPath(fromId: string, toId: string): Promise<GraphPathResponse> {
  const params = new URLSearchParams({ from: fromId, to: toId });
  return requestJson<GraphPathResponse>(`/api/graph/path?${params.toString()}`);
}

function parseEventBlock(block: string): { event: string; data: string } | null {
  const lines = block.split("\n").filter(Boolean);
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  if (!dataLines.length) {
    return null;
  }
  return { event, data: dataLines.join("\n") };
}

export async function streamChatMessage(
  payload: ChatStreamRequest,
  handlers: ChatHandlers,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/chat/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    throw new Error("Unable to stream chat response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    let boundaryIndex = buffer.indexOf("\n\n");
    while (boundaryIndex >= 0) {
      const rawBlock = buffer.slice(0, boundaryIndex);
      buffer = buffer.slice(boundaryIndex + 2);
      const parsed = parseEventBlock(rawBlock);

      if (parsed) {
        const data = JSON.parse(parsed.data);
        if (parsed.event === "sources") {
          handlers.onSources?.(data as ChatSource[]);
        }
        if (parsed.event === "command") {
          await handlers.onCommand?.(data as ChatCommand);
        }
        if (parsed.event === "chunk") {
          handlers.onChunk?.(data as { text: string });
        }
        if (parsed.event === "done") {
          handlers.onDone?.();
        }
        if (parsed.event === "error") {
          handlers.onError?.(data as { detail: string });
        }
      }

      boundaryIndex = buffer.indexOf("\n\n");
    }

    if (done) {
      break;
    }
  }
}
