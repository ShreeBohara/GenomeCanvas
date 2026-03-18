import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3005",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --port 3005",
    port: 3005,
    reuseExistingServer: !process.env.CI,
    cwd: __dirname,
  },
});
