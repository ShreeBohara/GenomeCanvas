"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { GRAPH_NODES, GRAPH_EDGES, NODE_TYPE_COLORS, GraphNode, GraphEdge } from "@/data/graph";
import { useStore } from "@/store/useStore";
import { PROTEINS, Protein, CATEGORY_COLORS, FunctionCategory } from "@/data/proteins";

interface GraphDataNode extends GraphNode {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphDataLink {
  source: string | GraphDataNode;
  target: string | GraphDataNode;
  label: string;
  properties: Record<string, string | number>;
}

// Edge type colors
const EDGE_COLORS: Record<string, string> = {
  ASSOCIATED_WITH: "#ef444480",
  TARGETS: "#10b98180",
  INTERACTS_WITH: "#22d3ee60",
  INVESTIGATED_IN: "#a78bfa60",
  STUDIES: "#a78bfa40",
};

export default function ForceGraphWrapper() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const hoveredNodeRef = useRef<string | null>(null);
  const { selectedProtein, setSelectedProtein, setRightPanel } = useStore();
  const selectedProteinRef = useRef(selectedProtein);
  selectedProteinRef.current = selectedProtein;

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => ({
    nodes: GRAPH_NODES.map((n: GraphNode) => ({ ...n })),
    links: GRAPH_EDGES.map((e) => ({ ...e })),
  }), []);

  const nodeCanvasObject = useCallback(
    (node: GraphDataNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const x = node.x || 0;
      const y = node.y || 0;
      const baseColor = NODE_TYPE_COLORS[node.type] || "#666";
      const isHovered = hoveredNodeRef.current === node.id;
      const isSelectedProtein = selectedProteinRef.current?.uniprot_id === node.id;
      const isHighlighted = isHovered || isSelectedProtein;

      // Get protein category color if applicable
      let color = baseColor;
      if (node.type === "protein" && node.properties.function_category) {
        color = CATEGORY_COLORS[node.properties.function_category as FunctionCategory] || baseColor;
      }

      // Glow effect for highlighted nodes
      if (isHighlighted) {
        const glowRadius = node.type === "protein" ? 20 : 16;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, 2 * Math.PI);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        gradient.addColorStop(0, color + "30");
        gradient.addColorStop(0.6, color + "15");
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Node sizes - larger and more distinct
      const baseSize = {
        protein: 7,
        disease: 6,
        drug: 5.5,
        trial: 4.5,
      }[node.type] || 5;
      const size = isHighlighted ? baseSize * 1.4 : baseSize;

      // Draw node shape
      if (node.type === "protein") {
        // Circle with ring
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, size + 1.5, 0, 2 * Math.PI);
        ctx.strokeStyle = color + "50";
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (node.type === "disease") {
        // Diamond
        const s = size * 1.1;
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s, y);
        ctx.lineTo(x, y + s);
        ctx.lineTo(x - s, y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = color + "40";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else if (node.type === "drug") {
        // Rounded rectangle
        const s = size * 0.85;
        ctx.beginPath();
        ctx.roundRect(x - s, y - s, s * 2, s * 2, 2.5);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = color + "40";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      } else {
        // Triangle for trials
        const s = size * 1.1;
        ctx.beginPath();
        ctx.moveTo(x, y - s);
        ctx.lineTo(x + s * 0.9, y + s * 0.7);
        ctx.lineTo(x - s * 0.9, y + s * 0.7);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = color + "40";
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Always show labels — styled by type
      const fontSize = isHighlighted ? 11 / globalScale : 9 / globalScale;
      const labelY = y + size + (isHighlighted ? 5 : 3);

      ctx.font = `${isHighlighted ? "600" : "500"} ${fontSize}px "DM Sans", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      // Text shadow for readability
      ctx.fillStyle = "#06080c";
      ctx.fillText(node.label, x + 0.5, labelY + 0.5);
      ctx.fillText(node.label, x - 0.5, labelY - 0.5);

      // Label color varies by type
      const labelColor = isHighlighted
        ? "#f0f4ff"
        : node.type === "protein"
          ? "#c8d6e5"
          : node.type === "disease"
            ? "#fca5a5"
            : node.type === "drug"
              ? "#6ee7b7"
              : "#c4b5fd";
      ctx.fillStyle = labelColor;
      ctx.fillText(node.label, x, labelY);

      // Show extra info on hover
      if (isHighlighted && node.type === "disease" && node.properties.therapeutic_area) {
        const smallFont = 7 / globalScale;
        ctx.font = `400 ${smallFont}px "JetBrains Mono", monospace`;
        ctx.fillStyle = "#6b7280";
        ctx.fillText(node.properties.therapeutic_area, x, labelY + fontSize + 2);
      }
      if (isHighlighted && node.type === "drug" && node.properties.mechanism) {
        const smallFont = 7 / globalScale;
        ctx.font = `400 ${smallFont}px "JetBrains Mono", monospace`;
        ctx.fillStyle = "#6b7280";
        ctx.fillText(node.properties.mechanism, x, labelY + fontSize + 2);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const linkCanvasObject = useCallback(
    (link: GraphDataLink, ctx: CanvasRenderingContext2D) => {
      const source = link.source as GraphDataNode;
      const target = link.target as GraphDataNode;
      if (!source.x || !source.y || !target.x || !target.y) return;

      const edgeColor = EDGE_COLORS[link.label] || "rgba(42, 53, 80, 0.2)";

      // Check if either endpoint is hovered
      const isConnected = hoveredNodeRef.current === (typeof link.source === "string" ? link.source : (link.source as GraphDataNode).id)
        || hoveredNodeRef.current === (typeof link.target === "string" ? link.target : (link.target as GraphDataNode).id);

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = isConnected ? edgeColor.replace(/[\da-f]{2}$/, "cc") : edgeColor;
      ctx.lineWidth = isConnected ? 1.5 : 0.8;
      ctx.stroke();

      // Arrow
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) return;
      const nx = dx / len;
      const ny = dy / len;
      const arrowPos = 0.75;
      const ax = source.x + dx * arrowPos;
      const ay = source.y + dy * arrowPos;
      const arrowSize = isConnected ? 4 : 2.5;

      ctx.beginPath();
      ctx.moveTo(ax + nx * arrowSize, ay + ny * arrowSize);
      ctx.lineTo(ax - ny * arrowSize * 0.5 - nx * arrowSize * 0.3, ay + nx * arrowSize * 0.5 - ny * arrowSize * 0.3);
      ctx.lineTo(ax + ny * arrowSize * 0.5 - nx * arrowSize * 0.3, ay - nx * arrowSize * 0.5 - ny * arrowSize * 0.3);
      ctx.closePath();
      ctx.fillStyle = isConnected ? edgeColor.replace(/[\da-f]{2}$/, "ee") : edgeColor;
      ctx.fill();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleNodeClick = useCallback(
    (node: GraphDataNode) => {
      if (node.type === "protein") {
        const protein = PROTEINS.find((p: Protein) => p.uniprot_id === node.id);
        if (protein) {
          setSelectedProtein(protein);
          setRightPanel("details");
        }
      }
    },
    [setSelectedProtein, setRightPanel]
  );

  return (
    <div ref={containerRef} className="w-full h-full graph-container relative">
      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeId="id"
        linkSource="source"
        linkTarget="target"
        nodeCanvasObject={nodeCanvasObject}
        nodePointerAreaPaint={(node: GraphDataNode, color: string, ctx: CanvasRenderingContext2D) => {
          ctx.beginPath();
          ctx.arc(node.x || 0, node.y || 0, 12, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();
        }}
        linkCanvasObject={linkCanvasObject}
        onNodeHover={(node: GraphDataNode | null) => { hoveredNodeRef.current = node?.id || null; }}
        onNodeClick={handleNodeClick}
        backgroundColor="transparent"
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
        cooldownTicks={200}
        enableZoomInteraction
        enablePanInteraction
      />

      {/* Legend */}
      <div className="absolute bottom-3 left-3 glass-panel rounded-lg px-3 py-2">
        <div className="flex gap-4">
          {([
            { type: "protein", label: "Protein", shape: "circle" },
            { type: "disease", label: "Disease", shape: "diamond" },
            { type: "drug", label: "Drug", shape: "square" },
            { type: "trial", label: "Trial", shape: "triangle" },
          ] as const).map(({ type, label, shape }) => (
            <div key={type} className="flex items-center gap-1.5">
              {shape === "circle" && (
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_TYPE_COLORS[type] }} />
              )}
              {shape === "diamond" && (
                <div className="w-2.5 h-2.5 rotate-45" style={{ backgroundColor: NODE_TYPE_COLORS[type] }} />
              )}
              {shape === "square" && (
                <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: NODE_TYPE_COLORS[type] }} />
              )}
              {shape === "triangle" && (
                <div
                  className="w-0 h-0"
                  style={{
                    borderLeft: "4px solid transparent",
                    borderRight: "4px solid transparent",
                    borderBottom: `7px solid ${NODE_TYPE_COLORS[type]}`,
                  }}
                />
              )}
              <span className="text-[9px] text-gray-400 font-mono uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Edge legend */}
      <div className="absolute bottom-3 right-3 glass-panel rounded-lg px-3 py-2">
        <div className="flex flex-col gap-1">
          {[
            { label: "Associates", color: "#ef4444" },
            { label: "Targets", color: "#10b981" },
            { label: "Interacts", color: "#22d3ee" },
            { label: "Studies", color: "#a78bfa" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-4 h-px" style={{ backgroundColor: color }} />
              <span className="text-[8px] text-gray-500 font-mono">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
