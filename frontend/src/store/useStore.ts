import { create } from "zustand";
import { Protein, FunctionCategory, PROTEINS } from "@/data/proteins";

interface AppState {
  // Protein selection
  selectedProtein: Protein | null;
  hoveredProtein: Protein | null;
  setSelectedProtein: (p: Protein | null) => void;
  setHoveredProtein: (p: Protein | null) => void;

  // Universe filters
  activeCategories: Set<FunctionCategory>;
  toggleCategory: (c: FunctionCategory) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Panel state
  activePanel: "universe" | "structure";
  setActivePanel: (p: "universe" | "structure") => void;
  rightPanel: "graph" | "details";
  setRightPanel: (p: "graph" | "details") => void;

  // Filtered proteins
  filteredProteins: () => Protein[];
}

export const useStore = create<AppState>((set, get) => ({
  selectedProtein: null,
  hoveredProtein: null,
  setSelectedProtein: (p) => set({ selectedProtein: p }),
  setHoveredProtein: (p) => set({ hoveredProtein: p }),

  activeCategories: new Set<FunctionCategory>([
    "enzyme", "signaling", "structural", "transporter", "dna_repair",
  ]),
  toggleCategory: (c) =>
    set((state) => {
      const next = new Set(state.activeCategories);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return { activeCategories: next };
    }),
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),

  activePanel: "universe",
  setActivePanel: (p) => set({ activePanel: p }),
  rightPanel: "details",
  setRightPanel: (p) => set({ rightPanel: p }),

  filteredProteins: () => {
    const { activeCategories, searchQuery } = get();
    return PROTEINS.filter((p) => {
      if (!activeCategories.has(p.function_category)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          p.gene_name.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.function_description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  },
}));
