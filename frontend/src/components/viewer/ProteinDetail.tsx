"use client";

import { useStore } from "@/store/useStore";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/data/proteins";
import { motion, AnimatePresence } from "framer-motion";

function PhaseIndicator({ phase }: { phase: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${
            i <= phase ? "bg-emerald-400" : "bg-canvas-accent/40"
          }`}
        />
      ))}
    </div>
  );
}

function ScoreBar({ score, color = "#22d3ee" }: { score: number; color?: string }) {
  return (
    <div className="w-full h-1 bg-canvas-accent/30 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${score * 100}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </div>
  );
}

function GoTermBadge({ term, category }: { term: string; category: string }) {
  const colors = {
    molecular_function: "border-cyan-500/30 text-cyan-400/80",
    biological_process: "border-violet-500/30 text-violet-400/80",
    cellular_component: "border-pink-500/30 text-pink-400/80",
  };
  return (
    <span
      className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded border ${
        colors[category as keyof typeof colors] || colors.molecular_function
      }`}
    >
      {term}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 text-center">
      <div className="w-16 h-16 rounded-full border border-canvas-border flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-canvas-accent">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </div>
      <p className="text-sm text-gray-500 font-body">
        Select a protein from the 3D universe to explore its structure, associations, and therapeutic connections.
      </p>
    </div>
  );
}

export default function ProteinDetail() {
  const { selectedProtein: protein } = useStore();

  return (
    <div className="h-full overflow-y-auto">
      <AnimatePresence mode="wait">
        {!protein ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <EmptyState />
          </motion.div>
        ) : (
          <motion.div
            key={protein.uniprot_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
            className="p-5 space-y-5"
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-2xl font-display text-white italic">
                  {protein.gene_name}
                </h2>
                <span
                  className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border category-glow-${protein.function_category}`}
                  style={{
                    color: CATEGORY_COLORS[protein.function_category],
                    borderColor: CATEGORY_COLORS[protein.function_category] + "40",
                    backgroundColor: CATEGORY_COLORS[protein.function_category] + "10",
                  }}
                >
                  {CATEGORY_LABELS[protein.function_category]}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-mono">{protein.uniprot_id}</p>
              <p className="text-sm text-gray-300 mt-2 leading-relaxed font-body">
                {protein.name}
              </p>
            </div>

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-panel rounded-lg p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mb-1">Length</p>
                <p className="text-lg font-display text-white">{protein.sequence_length.toLocaleString()} <span className="text-xs text-gray-500">aa</span></p>
              </div>
              <div className="glass-panel rounded-lg p-3">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mb-1">Location</p>
                <p className="text-xs text-gray-300 leading-relaxed">{protein.subcellular_location}</p>
              </div>
            </div>

            {/* Function */}
            <div>
              <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mb-2">Function</h3>
              <p className="text-sm text-gray-400 leading-relaxed font-body">
                {protein.function_description}
              </p>
            </div>

            {/* AlphaFold Structure Preview */}
            <div className="glass-panel rounded-lg overflow-hidden">
              <div className="aspect-[4/3] bg-canvas-black flex items-center justify-center relative">
                <iframe
                  src={`https://alphafold.ebi.ac.uk/entry/${protein.uniprot_id}`}
                  className="w-full h-full border-0"
                  title={`AlphaFold structure for ${protein.gene_name}`}
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin"
                />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-canvas-panel to-transparent" />
              </div>
              <div className="px-3 py-2 flex items-center justify-between">
                <span className="text-[10px] text-gray-500 font-mono">AlphaFold Structure</span>
                <div className="flex gap-2">
                  {[
                    { color: "#1e88e5", label: ">90" },
                    { color: "#26c6da", label: "70-90" },
                    { color: "#ffca28", label: "50-70" },
                    { color: "#ef6c00", label: "<50" },
                  ].map((c) => (
                    <div key={c.label} className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: c.color }} />
                      <span className="text-[8px] text-gray-600 font-mono">{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Diseases */}
            {protein.diseases.length > 0 && (
              <div>
                <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mb-2">
                  Disease Associations
                </h3>
                <div className="space-y-2">
                  {protein.diseases.map((d) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400/80 flex-shrink-0" />
                      <span className="text-sm text-gray-300 flex-1">{d.name}</span>
                      <span className="text-[10px] text-gray-500 font-mono w-8 text-right">
                        {(d.association_score * 100).toFixed(0)}%
                      </span>
                      <div className="w-16">
                        <ScoreBar score={d.association_score} color="#ef4444" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Drugs */}
            {protein.drugs.length > 0 && (
              <div>
                <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mb-2">
                  Therapeutic Agents
                </h3>
                <div className="space-y-2">
                  {protein.drugs.map((d) => (
                    <div
                      key={d.name}
                      className="glass-panel rounded-lg p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm text-emerald-300 font-body">{d.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono mt-0.5">{d.mechanism}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-mono">Phase {d.max_phase}</span>
                        <PhaseIndicator phase={d.max_phase} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GO Terms */}
            {protein.go_terms.length > 0 && (
              <div>
                <h3 className="text-[10px] text-gray-500 uppercase tracking-wider font-mono mb-2">
                  Gene Ontology
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {protein.go_terms.map((t) => (
                    <GoTermBadge key={t.id} term={t.term} category={t.category} />
                  ))}
                </div>
              </div>
            )}

            {/* UMAP Coordinates */}
            <div className="border-t border-canvas-border pt-3">
              <div className="flex items-center gap-4 text-[10px] text-gray-600 font-mono">
                <span>x: {protein.umap_x.toFixed(1)}</span>
                <span>y: {protein.umap_y.toFixed(1)}</span>
                <span>z: {protein.umap_z.toFixed(1)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
