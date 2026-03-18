"use client";

import { useMemo, useState } from "react";

import { GraphData, GraphNode, GraphNodeType } from "@/lib/types";
import { NODE_COLORS } from "@/lib/utils";


type GraphPanelProps = {
  open: boolean;
  graphData: GraphData | null;
  graphRootId: string | null;
  highlightedIds: string[];
  selectedEntityId: string | null;
  loading: boolean;
  onClose: () => void;
  onSelectNode: (nodeId: string, nodeType: GraphNodeType) => void;
};

type LayoutNode = GraphNode & {
  x: number;
  y: number;
  radius: number;
  showLabel: boolean;
};

const TYPE_RING_RADIUS: Record<GraphNodeType, number> = {
  protein: 108,
  disease: 152,
  drug: 196,
  pathway: 240,
  go_term: 282,
  trial: 324,
};

const TYPE_ORDER: GraphNodeType[] = [
  "protein",
  "disease",
  "drug",
  "pathway",
  "go_term",
  "trial",
];


function buildRadialLayout(
  graphData: GraphData | null,
  graphRootId: string | null,
  highlightedIds: string[],
  selectedEntityId: string | null,
): { nodes: LayoutNode[]; edges: GraphData["edges"] } {
  if (!graphData?.nodes.length) {
    return { nodes: [], edges: [] };
  }

  const root = graphData.nodes.find((node) => node.id === graphRootId) ?? graphData.nodes[0];
  const others = graphData.nodes
    .filter((node) => node.id !== root.id)
    .sort((first, second) => TYPE_ORDER.indexOf(first.type) - TYPE_ORDER.indexOf(second.type) || first.label.localeCompare(second.label));

  const grouped = new Map<GraphNodeType, GraphNode[]>();
  for (const type of TYPE_ORDER) {
    grouped.set(type, others.filter((node) => node.type === type));
  }

  const laidOut: LayoutNode[] = [
    {
      ...root,
      x: 360,
      y: 360,
      radius: 15,
      showLabel: true,
    },
  ];

  for (const type of TYPE_ORDER) {
    const group = grouped.get(type) ?? [];
    const radius = TYPE_RING_RADIUS[type];
    const total = group.length || 1;
    group.forEach((node, index) => {
      const angle = (-Math.PI / 2) + ((Math.PI * 2) / total) * index;
      laidOut.push({
        ...node,
        x: 360 + (Math.cos(angle) * radius),
        y: 360 + (Math.sin(angle) * radius),
        radius: highlightedIds.includes(node.id) || node.id === selectedEntityId ? 11 : 8,
        showLabel:
          highlightedIds.includes(node.id) ||
          node.id === selectedEntityId ||
          node.id === graphRootId,
      });
    });
  }

  return { nodes: laidOut, edges: graphData.edges };
}


export function GraphPanel({
  open,
  graphData,
  graphRootId,
  highlightedIds,
  selectedEntityId,
  loading,
  onClose,
  onSelectNode,
}: GraphPanelProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const layout = useMemo(
    () => buildRadialLayout(graphData, graphRootId, highlightedIds, selectedEntityId),
    [graphData, graphRootId, highlightedIds, selectedEntityId],
  );

  const nodeMap = useMemo(
    () => new Map(layout.nodes.map((node) => [node.id, node])),
    [layout.nodes],
  );

  return (
    <aside className={`graph-drawer ${open ? "open" : ""}`}>
      <div className="drawer-scrim" onClick={onClose} />
      <section className="drawer-card graph-card">
        <header className="drawer-header">
          <div>
            <p className="drawer-kicker">Graph Constellation</p>
            <h2 className="drawer-title">{graphRootId ?? "No active root"}</h2>
          </div>
          <button className="hud-button" onClick={onClose} type="button">
            Close
          </button>
        </header>

        <div className="drawer-copy">
          {loading
            ? "Refreshing the current neighborhood."
            : "Root-centered radial neighborhood with labels reserved for the active story points."}
        </div>

        <div className="graph-legend">
          {TYPE_ORDER.map((type) => (
            <span className="graph-legend-item" key={type}>
              <span className="graph-legend-dot" style={{ backgroundColor: NODE_COLORS[type] }} />
              {type.replace("_", " ")}
            </span>
          ))}
        </div>

        <div className="graph-surface">
          {!layout.nodes.length ? (
            <div className="overlay-empty">Select or search an entity to open graph context.</div>
          ) : (
            <svg className="graph-svg" viewBox="0 0 720 720" role="img">
              <defs>
                <radialGradient id="graph-haze" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(125, 231, 220, 0.18)" />
                  <stop offset="100%" stopColor="rgba(125, 231, 220, 0)" />
                </radialGradient>
              </defs>
              <circle cx="360" cy="360" fill="url(#graph-haze)" r="334" />

              {layout.edges.map((edge) => {
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (!source || !target) {
                  return null;
                }
                return (
                  <line
                    key={`${edge.source}-${edge.target}-${edge.label}`}
                    stroke="rgba(201, 214, 232, 0.22)"
                    strokeWidth={edge.source === graphRootId || edge.target === graphRootId ? 1.8 : 1}
                    x1={source.x}
                    x2={target.x}
                    y1={source.y}
                    y2={target.y}
                  />
                );
              })}

              {layout.nodes.map((node) => {
                const active = hoveredNodeId === node.id || node.id === selectedEntityId;
                return (
                  <g
                    key={node.id}
                    onClick={() => onSelectNode(node.id, node.type)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    style={{ cursor: "pointer" }}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      fill="rgba(4, 12, 18, 0.75)"
                      r={node.radius + 7}
                    />
                    <circle
                      cx={node.x}
                      cy={node.y}
                      fill={NODE_COLORS[node.type]}
                      r={node.radius}
                    />
                    {(node.showLabel || active || hoveredNodeId === node.id) && (
                      <text
                        className="graph-node-label"
                        fill="#eff6ff"
                        x={node.x + node.radius + 8}
                        y={node.y + 4}
                      >
                        {node.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </section>
    </aside>
  );
}
