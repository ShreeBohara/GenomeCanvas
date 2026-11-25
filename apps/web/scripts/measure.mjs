// Times the atlas on this machine's GPU, against a running dev server:
//
//   corepack pnpm dev                                  (in another terminal)
//   node scripts/measure.mjs [instances] [frames] [url]
//
// It opens the page with the development-only ?repeat and ?measure switches in
// Chromium using the real GPU (Metal on macOS, through ANGLE), not the software
// renderer the end-to-end tests use, and prints what Atlas.measure reports.
import { chromium } from "@playwright/test";

const instances = Number(process.argv[2] ?? 20_429);
const frames = Number(process.argv[3] ?? 600);
const base = process.argv[4] ?? "http://localhost:5173/";

const browser = await chromium.launch({
  channel: "chromium",
  args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const url = new URL(base);
  url.searchParams.set("repeat", String(instances));
  url.searchParams.set("measure", String(frames));
  await page.goto(url.href);
  const renderer = await page.evaluate(() => {
    const gl = document.createElement("canvas").getContext("webgl2");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : "unknown";
  });
  await page.waitForFunction(
    () => document.documentElement.dataset.measurement !== undefined,
    null,
    {
      timeout: 120_000,
    },
  );
  const measurement = JSON.parse(
    await page.evaluate(() => document.documentElement.dataset.measurement),
  );
  console.log(
    JSON.stringify({ renderer, viewport: "1440x900 CSS px at 2x", ...measurement }, null, 2),
  );
} finally {
  await browser.close();
}
