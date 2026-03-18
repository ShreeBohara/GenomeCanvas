"use client";

import { useEffect, useId, useMemo, useState } from "react";


declare global {
  interface Window {
    molstar?: {
      Viewer: {
        create: (
          elementOrId: string,
          options: Record<string, unknown>,
        ) => Promise<{
          loadStructureFromUrl: (
            url: string,
            format: string,
            isBinary: boolean,
            options?: Record<string, unknown>,
          ) => Promise<void>;
          plugin?: {
            clear?: () => Promise<void>;
          };
        }>;
      };
    };
    __molstarLoaderPromise?: Promise<void>;
  }
}


function ensureMolstarAssets() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.molstar?.Viewer) {
    return Promise.resolve();
  }
  if (window.__molstarLoaderPromise) {
    return window.__molstarLoaderPromise;
  }

  window.__molstarLoaderPromise = new Promise<void>((resolve, reject) => {
    if (!document.getElementById("molstar-css")) {
      const link = document.createElement("link");
      link.id = "molstar-css";
      link.rel = "stylesheet";
      link.href = "/vendor/molstar-viewer/molstar.css";
      document.head.appendChild(link);
    }

    const existing = document.getElementById("molstar-script");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Molstar script failed")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = "molstar-script";
    script.src = "/vendor/molstar-viewer/molstar.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Molstar script failed"));
    document.body.appendChild(script);
  });

  return window.__molstarLoaderPromise;
}


type MolstarViewportProps = {
  structureUrl: string;
  label: string;
};


export function MolstarViewport({ structureUrl, label }: MolstarViewportProps) {
  const rawId = useId();
  const containerId = useMemo(() => `molstar-${rawId.replace(/:/g, "")}`, [rawId]);
  const [status, setStatus] = useState("Loading structure surface…");

  useEffect(() => {
    let cancelled = false;
    let mountedViewer:
      | {
          loadStructureFromUrl: (
            url: string,
            format: string,
            isBinary: boolean,
            options?: Record<string, unknown>,
          ) => Promise<void>;
          plugin?: {
            clear?: () => Promise<void>;
          };
        }
      | undefined;

    async function mount() {
      setStatus("Loading structure surface…");
      await ensureMolstarAssets();
      if (cancelled || !window.molstar?.Viewer) {
        return;
      }

      const container = document.getElementById(containerId);
      if (!container) {
        return;
      }
      container.innerHTML = "";

      mountedViewer = await window.molstar.Viewer.create(containerId, {
        layoutShowControls: false,
        layoutShowSequence: false,
        layoutShowLog: false,
        layoutShowLeftPanel: false,
        viewportShowExpand: false,
        viewportShowControls: true,
        collapseLeftPanel: true,
      });

      const format = structureUrl.endsWith(".bcif")
        ? "bcif"
        : structureUrl.endsWith(".cif")
          ? "mmcif"
          : "pdb";
      await mountedViewer.loadStructureFromUrl(structureUrl, format, format === "bcif", {
        label,
      });
      if (!cancelled) {
        setStatus("Structure ready");
      }
    }

    void mount().catch((error: unknown) => {
      console.error(error);
      if (!cancelled) {
        setStatus("Structure viewer unavailable");
      }
    });

    return () => {
      cancelled = true;
      void mountedViewer?.plugin?.clear?.();
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [containerId, label, structureUrl]);

  return (
    <div className="focus-viewer-shell">
      <div className="focus-viewer-status">{status}</div>
      <div className="focus-viewer" id={containerId} />
    </div>
  );
}
