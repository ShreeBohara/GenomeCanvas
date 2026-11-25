import { defineConfig } from "vitest/config";

// Resolve workspace packages to their TypeScript sources, so tests never depend
// on a stale or missing build of a sibling package.
export default defineConfig({
  resolve: { conditions: ["source"] },
  ssr: { resolve: { conditions: ["source"] } },
});
