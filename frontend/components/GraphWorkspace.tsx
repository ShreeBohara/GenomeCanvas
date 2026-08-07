"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { GraphData, GraphNode, GraphNodeType } from "@/lib/types";
import { NODE_COLORS } from "@/lib/utils";


const ForceGraph2D = dynamic(
  () => import("react-force-graph-2d").then((module) => module.default),
  {
    ssr: false,
    loading: () => <div className="graph-canvas-fallback">Preparing graph canvas…</div>,
  },
);

type GraphWorkspaceProps = {
  open: boolean;
  graphData: GraphData | null;
  graphRootId: string | null;
  graphSelectionId: string | null;
  highlightedIds: string[];
  selectedEntityId: string | null;
  graphHops: 1 | 2;
  loading: boolean;
  onChangeHops: (hops: 1 | 2) => void;
  onClose: () => void;
  onSelectNode: (nodeId: string, nodeType: GraphNodeType) => void;
};

type ForceNode = GraphNode & {
  color: string;
  fx?: number;
  fy?: number;
  val: number;
  x?: number;
  y?: number;
};

type ForceLink = GraphData["edges"][number] & {
  source: string | ForceNode;
  target: string | ForceNode;
};

const TYPE_ORDER: GraphNodeType[] = [
  "protein",
  "disease",
  "drug",
  "pathway",
  "go_term",
  "trial",
];

function forceNodeId(value: string | ForceNode) {
  return typeof value === "string" ? value : value.id;
}

function seedPositionForNode(
  node: GraphNode,
  graphRootId: string | null,
  index: number,
  total: number,
) {
  if (node.id === graphRootId) {
    return { x: 0, y: 0, fx: 0, fy: 0 };
  }

  const typeIndex = TYPE_ORDER.indexOf(node.type);
  const ring = 135 + (typeIndex * 42);
  const angle = (-Math.PI / 2) + ((Math.PI * 2) / Math.max(total, 1)) * index;
  return {
    x: Math.cos(angle) * ring,
    y: Math.sin(angle) * ring,
  };
}

export function GraphWorkspace({
  open,
  graphData,
  graphRootId,
  graphSelectionId,
  highlightedIds,
  selectedEntityId,
  graphHops,
  loading,
  onChangeHops,
  onClose,
  onSelectNode,
}: GraphWorkspaceProps) {
  const graphRef = useRef<any>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(560);

  const graphPayload = useMemo(() => {
    if (!graphData?.nodes.length) {
      return { nodes: [] as ForceNode[], links: [] as ForceLink[] };
    }

    const nodes = graphData.nodes.map((node, index, allNodes) => {
      const seeded = seedPositionForNode(node, graphRootId, index, allNodes.length);
      return {
        ...node,
        ...seeded,
        val: node.id === graphRootId ? 9 : highlightedIds.includes(node.id) ? 6 : 4.8,
        color: NODE_COLORS[node.type],
      };
    });

    return {
      nodes,
      links: graphData.edges.map((edge) => ({ ...edge })),
    };
  }, [graphData, graphRootId, highlightedIds]);

  const inspectedNode = useMemo(() => {
    if (!graphData?.nodes.length) {
      return null;
    }

    return (
      graphData.nodes.find((node) => node.id === hoveredNodeId) ??
      graphData.nodes.find((node) => node.id === graphSelectionId) ??
      graphData.nodes.find((node) => node.id === graphRootId) ??
      graphData.nodes[0]
    );
  }, [graphData?.nodes, graphRootId, graphSelectionId, hoveredNodeId]);

  useEffect(() => {
    if (!canvasHostRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.max(280, Math.floor(entries[0]?.contentRect.width ?? 560) - 2);
      setCanvasWidth(nextWidth);
    });

    observer.observe(canvasHostRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!graphRef.current || !graphPayload.nodes.length || !open) {
      return;
    }

    graphRef.current.d3Force?.("charge")?.strength?.(-240);
    graphRef.current.d3Force?.("link")?.distance?.((link: ForceLink) => {
      const sourceId = forceNodeId(link.source);
      const targetId = forceNodeId(link.target);
      return sourceId === graphRootId || targetId === graphRootId ? 128 : 84;
    });
    graphRef.current.d3Force?.("link")?.strength?.((link: ForceLink) => {
      const sourceId = forceNodeId(link.source);
      const targetId = forceNodeId(link.target);
      return sourceId === graphRootId || targetId === graphRootId ? 0.24 : 0.14;
    });
    graphRef.current.d3VelocityDecay?.(0.34);
    graphRef.current.d3AlphaDecay?.(0.08);
    graphRef.current.d3ReheatSimulation?.();

    const fitTimeout = window.setTimeout(() => {
      graphRef.current?.zoomToFit?.(360, 88);
    }, 280);

    return () => window.clearTimeout(fitTimeout);
  }, [graphPayload, graphRootId, graphHops, open]);

  return (
    <section className={`rail-panel graph-workspace ${open ? "" : "collapsed"}`}>
      <header className="rail-panel-header">
        <div>
          <p className="eyebrow-label">Graph constellation</p>
          <h2>{graphRootId ?? "No active root"}</h2>
        </div>
        <div className="toolbar-group">
          <div className="segmented-control">
            <button
              className={graphHops === 1 ? "active" : ""}
              onClick={() => onChangeHops(1)}
              type="button"
            >
              1 hop
            </button>
            <button
              className={graphHops === 2 ? "active" : ""}
              onClick={() => onChangeHops(2)}
              type="button"
            >
              2 hops
            </button>
          </div>
          <button
            className="toolbar-button"
            onClick={() => graphRef.current?.zoomToFit?.(320, 88)}
            type="button"
          >
            Reset
          </button>
          <button className="toolbar-button" onClick={onClose} type="button">
            {open ? "Collapse" : "Expand"}
          </button>
        </div>
      </header>

      {open ? (
        <>
          <div className="graph-subtitle">
            {loading
              ? "Refreshing the current neighborhood."
              : "Interactive neighborhood graph with stable force layout, zoom, and entity details."}
          </div>

          <div className="legend-row">
            {TYPE_ORDER.map((type) => (
              <span className="legend-item" key={type}>
                <span className="legend-dot" style={{ backgroundColor: NODE_COLORS[type] }} />
                {type.replace("_", " ")}
              </span>
            ))}
          </div>

          <div className="graph-canvas-shell" ref={canvasHostRef}>
            {!graphPayload.nodes.length ? (
              <div className="graph-canvas-empty">
                Select or search an entity to load a graph neighborhood.
              </div>
            ) : (
              <ForceGraph2D
                backgroundColor="transparent"
                cooldownTicks={80}
                enableNodeDrag={false}
                graphData={graphPayload}
                height={360}
                linkColor={() => "rgba(190, 206, 225, 0.18)"}
                linkDirectionalParticles={0}
                linkWidth={(link: any) => {
                  const sourceId = forceNodeId(link.source);
                  const targetId = forceNodeId(link.target);
                  return sourceId === graphRootId || targetId === graphRootId ? 2.1 : 1;
                }}
                nodeCanvasObject={(node, ctx, globalScale) => {
                  const graphNode = node as ForceNode;
                  const nodeId = graphNode.id;
                  const active =
                    nodeId === graphRootId ||
                    nodeId === selectedEntityId ||
                    nodeId === graphSelectionId ||
                    nodeId === hoveredNodeId;
                  const highlighted = highlightedIds.includes(nodeId);
                  const radius = nodeId === graphRootId ? 9.5 : active ? 7.2 : highlighted ? 6.6 : 5.5;

                  ctx.save();
                  ctx.beginPath();
                  ctx.arc(graphNode.x ?? 0, graphNode.y ?? 0, radius + 4, 0, 2 * Math.PI);
                  ctx.fillStyle = active ? "rgba(6, 16, 28, 0.92)" : "rgba(5, 14, 25, 0.72)";
                  ctx.fill();

                  ctx.beginPath();
                  ctx.arc(graphNode.x ?? 0, graphNode.y ?? 0, radius, 0, 2 * Math.PI);
                  ctx.fillStyle = graphNode.color;
                  ctx.fill();

                  if (active || highlighted) {
                    ctx.beginPath();
                    ctx.arc(graphNode.x ?? 0, graphNode.y ?? 0, radius + 8, 0, 2 * Math.PI);
                    ctx.strokeStyle = active ? "rgba(108, 226, 255, 0.42)" : "rgba(255, 255, 255, 0.16)";
                    ctx.lineWidth = 1.2;
                    ctx.stroke();
                  }

                  const showLabel = active || highlighted || globalScale > 1.45;
                  if (showLabel) {
                    const fontSize = Math.max(8, 13 / globalScale);
                    ctx.font = `600 ${fontSize}px sans-serif`;
                    ctx.fillStyle = "#edf5ff";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "middle";
                    ctx.fillText(graphNode.label, (graphNode.x ?? 0) + radius + 8, graphNode.y ?? 0);
                  }

                  ctx.restore();
                }}
                nodeLabel={() => ""}
                onNodeClick={(node) => {
                  const graphNode = node as ForceNode;
                  onSelectNode(graphNode.id, graphNode.type);
                }}
                onNodeHover={(node) => {
                  setHoveredNodeId((node as ForceNode | null)?.id ?? null);
                }}
                ref={graphRef}
                width={canvasWidth}
              />
            )}
          </div>

          {inspectedNode ? (
            <div className="graph-detail-strip">
              <div>
                <span className="graph-detail-type">{inspectedNode.type.replace("_", " ")}</span>
                <strong>{inspectedNode.label}</strong>
                <p>{inspectedNode.id}</p>
              </div>

              <div className="graph-detail-properties">
                {Object.entries(inspectedNode.properties).slice(0, 4).map(([key, value]) => (
                  <div className="graph-detail-property" key={key}>
                    <span>{key.replace(/_/g, " ")}</span>
                    <strong>{String(value)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rail-panel-collapsed-copy">
          {graphData?.nodes.length
            ? `${graphData.nodes.length} nodes loaded in the current constellation.`
            : "Expand the graph to explore neighbors, zoom, and inspect relationships."}
        </div>
      )}
    </section>
  );
}
