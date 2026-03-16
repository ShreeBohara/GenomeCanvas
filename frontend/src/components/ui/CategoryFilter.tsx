"use client";

import { useStore } from "@/store/useStore";
import { CATEGORY_COLORS, CATEGORY_LABELS, FunctionCategory } from "@/data/proteins";

const categories: FunctionCategory[] = [
  "enzyme",
  "signaling",
  "structural",
  "transporter",
  "dna_repair",
];

export default function CategoryFilter() {
  const { activeCategories, toggleCategory, searchQuery, setSearchQuery } = useStore();

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 overflow-hidden min-w-0">
      {/* Search */}
      <div className="relative flex-shrink-0 w-[120px]">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search proteins..."
          className="w-full bg-canvas-black/50 border border-canvas-border rounded-md pl-8 pr-3 py-1.5 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-canvas-accent/60 font-mono transition-colors"
        />
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-canvas-border" />

      {/* Category toggles */}
      <div className="flex items-center gap-1 overflow-x-auto flex-shrink min-w-0 scrollbar-hidden">
        {categories.map((cat) => {
          const active = activeCategories.has(cat);
          const shortLabels: Record<FunctionCategory, string> = {
            enzyme: "ENZ",
            signaling: "SIG",
            structural: "STR",
            transporter: "TRP",
            dna_repair: "DNA",
          };
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all duration-200 flex-shrink-0"
              style={{
                color: active ? CATEGORY_COLORS[cat] : "#4a5568",
                backgroundColor: active ? CATEGORY_COLORS[cat] + "10" : "transparent",
                borderWidth: 1,
                borderColor: active ? CATEGORY_COLORS[cat] + "30" : "transparent",
              }}
              title={CATEGORY_LABELS[cat]}
            >
              <div
                className="w-1.5 h-1.5 rounded-full transition-opacity"
                style={{
                  backgroundColor: CATEGORY_COLORS[cat],
                  opacity: active ? 1 : 0.3,
                }}
              />
              {shortLabels[cat]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
