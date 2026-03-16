"use client";

import { useStore } from "@/store/useStore";
import CategoryFilter from "@/components/ui/CategoryFilter";
import ProteinDetail from "@/components/viewer/ProteinDetail";
import { PROTEINS, CATEGORY_COLORS, CATEGORY_LABELS } from "@/data/proteins";
import { motion } from "framer-motion";
import { useState, useEffect, ComponentType } from "react";

function LoadingPlaceholder({ text }: { text: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="text-[10px] text-gray-600 font-mono animate-pulse">{text}</span>
    </div>
  );
}

function LazyUniverse() {
  const [Comp, setComp] = useState<ComponentType | null>(null);
  useEffect(() => {
    import("@/components/universe/ProteinUniverse").then((m) => setComp(() => m.default));
  }, []);
  return Comp ? <Comp /> : <LoadingPlaceholder text="Loading 3D universe..." />;
}

function LazyGraph() {
  const [Comp, setComp] = useState<ComponentType | null>(null);
  useEffect(() => {
    import("@/components/graph/KnowledgeGraph").then((m) => setComp(() => m.default));
  }, []);
  return Comp ? <Comp /> : <LoadingPlaceholder text="Loading knowledge graph..." />;
}

function Header() {
  return (
    <header className="h-12 border-b border-canvas-border flex items-center justify-between px-5 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-cyan-400/20 to-violet-500/20 border border-cyan-500/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-cyan-400">
              <circle cx="12" cy="12" r="3" fill="currentColor" />
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
              <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
            </svg>
          </div>
          <h1 className="text-base font-display italic text-white tracking-wide">GenomeCanvas</h1>
        </div>
        <div className="w-px h-5 bg-canvas-border" />
        <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
          Protein Explorer
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{PROTEINS.length} proteins loaded</span>
        </div>
      </div>
    </header>
  );
}

function StatsBar() {
  const categories = ["enzyme", "signaling", "structural", "transporter", "dna_repair"] as const;
  const counts = categories.map((cat) => ({
    cat,
    count: PROTEINS.filter((p) => p.function_category === cat).length,
  }));

  return (
    <div className="flex items-center gap-4 px-5 py-2 border-b border-canvas-border/50">
      {counts.map(({ cat, count }) => (
        <div key={cat} className="flex items-center gap-1.5">
          <div
            className="w-1 h-3 rounded-full"
            style={{ backgroundColor: CATEGORY_COLORS[cat] }}
          />
          <span className="text-[10px] font-mono text-gray-500">
            {count} {CATEGORY_LABELS[cat]}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProteinList() {
  const { filteredProteins, selectedProtein, setSelectedProtein, hoveredProtein, setHoveredProtein } = useStore();
  const proteins = filteredProteins();

  return (
    <div className="px-3 py-2 space-y-1 overflow-y-auto flex-1">
      {proteins.map((p, i) => {
        const isSelected = selectedProtein?.uniprot_id === p.uniprot_id;
        const isHovered = hoveredProtein?.uniprot_id === p.uniprot_id;
        return (
          <motion.button
            key={p.uniprot_id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02, duration: 0.3 }}
            onClick={() => setSelectedProtein(p)}
            onMouseEnter={() => setHoveredProtein(p)}
            onMouseLeave={() => setHoveredProtein(null)}
            className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-all duration-200 protein-card ${
              isSelected
                ? "bg-canvas-accent/20 border border-canvas-accent/40"
                : isHovered
                ? "bg-canvas-panel/80"
                : "border border-transparent"
            }`}
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: CATEGORY_COLORS[p.function_category] }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-white font-display italic">
                  {p.gene_name}
                </span>
                <span className="text-[10px] text-gray-600 font-mono truncate">
                  {p.uniprot_id}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 truncate">{p.name}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              <span className="text-[10px] text-gray-600 font-mono">
                {p.sequence_length} aa
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

export default function Home() {
  const { rightPanel, setRightPanel } = useStore();
  const [leftView, setLeftView] = useState<"universe" | "list">("universe");

  return (
    <div className="h-screen w-screen flex flex-col gradient-mesh">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — 60% */}
        <div className="w-[60%] flex flex-col border-r border-canvas-border">
          {/* Toolbar */}
          <div className="border-b border-canvas-border/50">
            <div className="flex items-center justify-between">
              <CategoryFilter />
              <div className="flex items-center gap-1 pr-4 flex-shrink-0">
                <button
                  onClick={() => setLeftView("universe")}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md transition-colors ${
                    leftView === "universe"
                      ? "text-cyan-400 bg-cyan-400/10"
                      : "text-gray-600 hover:text-gray-400"
                  }`}
                >
                  3D
                </button>
                <button
                  onClick={() => setLeftView("list")}
                  className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md transition-colors ${
                    leftView === "list"
                      ? "text-cyan-400 bg-cyan-400/10"
                      : "text-gray-600 hover:text-gray-400"
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 relative">
            {leftView === "universe" ? (
              <LazyUniverse />
            ) : (
              <div className="h-full flex flex-col">
                <StatsBar />
                <ProteinList />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel — 40% */}
        <div className="w-[40%] flex flex-col">
          {/* Tab bar */}
          <div className="flex items-center border-b border-canvas-border/50 px-4">
            <button
              onClick={() => setRightPanel("details")}
              className={`px-4 py-3 text-[10px] font-mono uppercase tracking-wider border-b-2 transition-colors ${
                rightPanel === "details"
                  ? "text-white border-cyan-400"
                  : "text-gray-600 border-transparent hover:text-gray-400"
              }`}
            >
              Protein Details
            </button>
            <button
              onClick={() => setRightPanel("graph")}
              className={`px-4 py-3 text-[10px] font-mono uppercase tracking-wider border-b-2 transition-colors ${
                rightPanel === "graph"
                  ? "text-white border-violet-400"
                  : "text-gray-600 border-transparent hover:text-gray-400"
              }`}
            >
              Knowledge Graph
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            {rightPanel === "details" ? (
              <ProteinDetail />
            ) : (
              <LazyGraph />
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="h-6 border-t border-canvas-border flex items-center px-4 justify-between flex-shrink-0">
        <div className="flex items-center gap-3 text-[9px] text-gray-600 font-mono">
          <span>GenomeCanvas v0.1.0</span>
          <span className="text-canvas-border">|</span>
          <span>Homo sapiens</span>
          <span className="text-canvas-border">|</span>
          <span>50 proteins &middot; 129 nodes &middot; 156 edges</span>
        </div>
        <div className="text-[9px] text-gray-600 font-mono">
          Interactive Protein Explorer
        </div>
      </div>
    </div>
  );
}
