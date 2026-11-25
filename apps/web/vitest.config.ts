import { defineConfig } from "vitest/config";

// Unit tests only: the Worker through its request method and pure helpers. The
// Cloudflare plugin is not loaded here; nothing in these tests needs a runtime.
export default defineConfig({
  resolve: { conditions: ["source"] },
  ssr: { resolve: { conditions: ["source"] } },
  test: { include: ["src/**/*.test.ts", "worker/**/*.test.ts", "scripts/**/*.test.ts"] },
});
