"use client";

import { StructureViewport } from "@/components/StructureViewport";
import { ProteinDetail, ProteinStructureAsset, SimilarProteinResult } from "@/lib/types";


type StructurePanelProps = {
  open: boolean;
  protein: ProteinDetail;
  structureAsset: ProteinStructureAsset | null;
  similarProteins: SimilarProteinResult[];
  onBack: () => void;
  onSelectProtein: (uniprotId: string) => void;
};

export function StructurePanel({
  open,
  protein,
  structureAsset,
  similarProteins,
  onBack,
  onSelectProtein,
}: StructurePanelProps) {
  if (!open) {
    return null;
  }

  return (
    <StructureViewport
      onBack={onBack}
      onSelectProtein={onSelectProtein}
      protein={protein}
      similarProteins={similarProteins}
      structureAsset={structureAsset}
    />
  );
}
