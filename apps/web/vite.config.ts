import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defaultClientConditions, defaultServerConditions, defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  // Workspace packages resolve to their TypeScript sources, so `dev` needs no build first.
  resolve: { conditions: ["source", ...defaultClientConditions] },
  // The same for the Worker, whose environment the Cloudflare plugin names after it.
  environments: {
    genomecanvas: { resolve: { conditions: ["source", ...defaultServerConditions] } },
  },
  build: {
    target: "es2023",
    // scripts/budget.mjs reads the manifest to tell first-load chunks from later ones.
    manifest: true,
    rolldownOptions: {
      output: {
        // The engine and three.js load after the shell, as one chunk with a
        // name the budget report can show.
        codeSplitting: {
          groups: [
            { name: "engine", test: /packages[\\/]engine[\\/]|node_modules[\\/]three[\\/]/ },
          ],
        },
      },
    },
    // The engine chunk is over Vite's default warning size; it is budgeted on its own.
    chunkSizeWarningLimit: 600,
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
});
