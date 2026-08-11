import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3005",
    trace: "on-first-retry",
    launchOptions: {
      // The stage is a react-three-fiber canvas, so a browser with no WebGL
      // renders nothing and every spec fails on an empty page -- a failure
      // about the environment, not the app. SwiftShader is Chromium's software
      // rasteriser; these flags make WebGL available without a GPU, which is
      // the situation both on a headless mac and on a CI runner.
      args: [
        "--enable-unsafe-swiftshader",
        "--use-gl=swiftshader",
        "--enable-webgl",
        "--ignore-gpu-blocklist",
      ],
    },
  },
  webServer: {
    command: "npm run dev -- --port 3005",
    port: 3005,
    reuseExistingServer: !process.env.CI,
    cwd: __dirname,
    env: {
      // NEXT_PUBLIC_* is read at dev-server start, so it has to be set on the
      // server process rather than on the test process.
      NEXT_PUBLIC_API_BASE_URL:
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000",
    },
  },
});
