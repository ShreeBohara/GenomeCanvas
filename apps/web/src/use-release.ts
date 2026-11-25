import { loadRelease, type Release } from "@genomecanvas/query";
import { useEffect, useState } from "react";
import { type Problem, problemFor } from "./messages.js";

export type ReleaseState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly release: Release }
  | { readonly status: "failed"; readonly problem: Problem };

/** The one place the app learns where its data lives. */
export function releaseBaseUrl(): URL {
  const configured = import.meta.env.VITE_RELEASE_BASE_URL;
  return new URL(
    configured && configured.length > 0 ? configured : "/release/sample/",
    window.location.href,
  );
}

export function useRelease(): ReleaseState {
  const [state, setState] = useState<ReleaseState>({ status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    loadRelease(releaseBaseUrl(), { signal: controller.signal }).then(
      (release) => setState({ status: "ready", release }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("The release could not be loaded:", error);
        setState({ status: "failed", problem: problemFor(error) });
      },
    );
    return () => controller.abort();
  }, []);
  return state;
}
