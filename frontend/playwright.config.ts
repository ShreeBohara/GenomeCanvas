import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://127.0.0.1:3005",
    trace: "on-first-retry",
    // `ProteinUniverse` mounts a @react-three/fiber <Canvas>, so every page in
    // this suite needs a working WebGL context before the app renders at all.
    // Headless Chromium on macOS has no GPU to fall back on: three.js throws
    // "Error creating WebGL context." out of `new WebGLRenderer`, and the Next
    // dev overlay then mounts a full-screen "Unhandled Runtime Error" dialog
    // that pulls the real app out of the accessibility tree mid-test. Forcing
    // the SwiftShader software rasterizer gives us a context everywhere.
    //
    // These are set unconditionally, not gated on !CI, for two reasons. Local
    // and CI runs should exercise the same renderer rather than diverging on
    // an environment check. And CI's pass today rests on an implicit default —
    // Linux headless Chromium happens to fall back to SwiftShader on its own.
    // Chromium 120+ refuses that fallback unless --enable-unsafe-swiftshader
    // is passed, so stating it here is what keeps a future Chromium bump from
    // turning CI into the same failure we are fixing on macOS.
    launchOptions: {
      args: [
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
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
