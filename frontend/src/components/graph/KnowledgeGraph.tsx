"use client";

import { useEffect, useState } from "react";

export default function KnowledgeGraph() {
  const [GraphComponent, setGraphComponent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import("./ForceGraphWrapper").then((mod) => {
      setGraphComponent(() => mod.default);
    });
  }, []);

  if (!GraphComponent) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-[10px] text-gray-600 font-mono animate-pulse">
          Loading knowledge graph...
        </span>
      </div>
    );
  }

  return <GraphComponent />;
}
