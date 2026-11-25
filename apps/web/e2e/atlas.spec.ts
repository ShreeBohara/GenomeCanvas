import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { loneliestRow, readBuiltRelease } from "./release.js";

const release = readBuiltRelease();
const require = createRequire(import.meta.url);

async function openAtlas(page: Page): Promise<Locator> {
  await page.goto("/");
  const canvas = page.getByRole("application", { name: /^Map of \d+ proteins/ }).locator("canvas");
  // The canvas records each frame it draws; wait for the first.
  await expect(canvas).toHaveAttribute("data-instances", /\d+/);
  return canvas;
}

function cameraOf(value: string | null): [number, number, number] {
  const parts = (value ?? "").split(",").map(Number);
  expect(parts).toHaveLength(3);
  return parts as [number, number, number];
}

test("draws one instance per protein in the release that was just built", async ({ page }) => {
  const canvas = await openAtlas(page);
  await expect(canvas).toHaveAttribute("data-instances", String(release.rowCount));
});

test("draws the whole atlas in at most two draw calls", async ({ page }) => {
  const canvas = await openAtlas(page);
  const calls = Number(await canvas.getAttribute("data-draw-calls"));
  expect(calls).toBeGreaterThanOrEqual(1);
  expect(calls).toBeLessThanOrEqual(2);
  // Two triangles per instanced point: the counter comes from the renderer, not the app.
  await expect(canvas).toHaveAttribute("data-triangles", String(2 * release.rowCount));
});

test("puts coloured points on the canvas", async ({ page }) => {
  const canvas = await openAtlas(page);
  const png = await canvas.screenshot();
  const stats = await page.evaluate(async (base64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${base64}`;
    await image.decode();
    const surface = new OffscreenCanvas(image.width, image.height);
    const context = surface.getContext("2d");
    if (context === null) throw new Error("no 2d context");
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, image.width, image.height);
    const background = [data[0], data[1], data[2]];
    let differing = 0;
    let saturated = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] as number;
      const g = data[i + 1] as number;
      const b = data[i + 2] as number;
      if (
        Math.abs(r - (background[0] as number)) +
          Math.abs(g - (background[1] as number)) +
          Math.abs(b - (background[2] as number)) >
        30
      )
        differing++;
      if (Math.max(r, g, b) - Math.min(r, g, b) > 80) saturated++;
    }
    return { pixels: data.length / 4, differing, saturated };
  }, png.toString("base64"));
  // 54 discs of radius 5 cover roughly 4,000 CSS pixels; demand a good share of that.
  expect(stats.differing).toBeGreaterThan(release.rowCount * 40);
  // And they are coloured, not grey: the palette belongs to the data.
  expect(stats.saturated).toBeGreaterThan(release.rowCount * 20);
});

test("moves the camera with an arrow key", async ({ page }) => {
  const canvas = await openAtlas(page);
  await page.getByRole("application").focus();
  const before = cameraOf(await canvas.getAttribute("data-camera"));
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(async () => cameraOf(await canvas.getAttribute("data-camera"))[0])
    .toBeGreaterThan(before[0]);
  const after = cameraOf(await canvas.getAttribute("data-camera"));
  expect(after[1]).toBe(before[1]);
  expect(after[2]).toBe(before[2]);
});

test("shows a protein's gene symbol and name when it is hovered", async ({ page }) => {
  const canvas = await openAtlas(page);
  const row = loneliestRow(release);
  const protein = release.proteins[row];
  if (protein === undefined) throw new Error("no such row");
  const [cx, cy, zoom] = cameraOf(await canvas.getAttribute("data-camera"));
  const box = await canvas.boundingBox();
  if (box === null) throw new Error("the canvas has no box");
  const sx = box.x + ((release.x[row] as number) - cx) * zoom + box.width / 2;
  const sy = box.y + box.height / 2 - ((release.y[row] as number) - cy) * zoom;

  const label = page.getByTestId("protein-label");
  await expect(label).toBeHidden();
  await page.mouse.move(sx + 1, sy + 1);
  await expect(label).toBeVisible();
  await expect(label).toContainText(protein.gene_symbol);
  await expect(label).toContainText(protein.name);
});

test("streams the three hello events in order", async ({ page }) => {
  await page.goto("/");
  const events = await page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const received: string[] = [];
        const source = new EventSource("/api/hello");
        source.addEventListener("hello", (event) => {
          received.push((event as MessageEvent<string>).data);
          if (received.length === 3) {
            source.close();
            resolve(received);
          }
        });
        source.onerror = () => {
          source.close();
          reject(new Error(`stream failed after ${received.length} events`));
        };
      }),
  );
  expect(events.map((e) => JSON.parse(e))).toEqual([
    { step: 1, of: 3, text: "Hello" },
    { step: 2, of: 3, text: "from the" },
    { step: 3, of: 3, text: "GenomeCanvas Worker" },
  ]);
});

test("passes an automated accessibility audit", async ({ page }) => {
  await openAtlas(page);
  await page.addScriptTag({
    content: readFileSync(require.resolve("axe-core/axe.min.js"), "utf8"),
  });
  const violations = await page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (
            context: Document,
          ) => Promise<{ violations: { id: string; help: string; nodes: unknown[] }[] }>;
        };
      }
    ).axe;
    const result = await axe.run(document);
    return result.violations.map((v) => ({ id: v.id, help: v.help, nodes: v.nodes.length }));
  });
  expect(violations).toEqual([]);
});

test("keeps the sample-data notice on screen", async ({ page }) => {
  await openAtlas(page);
  await expect(page.getByTestId("sample-notice")).toContainText("placed on the map by hand");
});

test("says so in plain words when the points file arrives truncated", async ({ page }) => {
  await page.route(`**/${release.pointsPath}`, async (route) => {
    const response = await route.fetch();
    const body = await response.body();
    await route.fulfill({ response, body: body.subarray(0, Math.floor(body.length / 2)) });
  });
  await page.goto("/");
  const alert = page.getByRole("alert");
  await expect(alert).toContainText("The protein map could not be loaded");
  await expect(alert).toContainText("incomplete or damaged");
  await expect(page.locator("canvas")).toHaveCount(0);
});

test("answers the health check", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});

test("fits every protein on screen again after the window is resized", async ({ page }) => {
  const canvas = await openAtlas(page);
  const before = cameraOf(await canvas.getAttribute("data-camera"));
  await page.setViewportSize({ width: 360, height: 740 });
  await expect
    .poll(async () => cameraOf(await canvas.getAttribute("data-camera"))[2])
    .not.toBe(before[2]);
  const [cx, cy, zoom] = cameraOf(await canvas.getAttribute("data-camera"));
  const box = await canvas.boundingBox();
  if (box === null) throw new Error("the canvas has no box");
  expect(box.width).toBe(360);
  for (let i = 0; i < release.rowCount; i++) {
    const sx = ((release.x[i] as number) - cx) * zoom + box.width / 2;
    const sy = box.height / 2 - ((release.y[i] as number) - cy) * zoom;
    expect(sx).toBeGreaterThan(0);
    expect(sx).toBeLessThan(box.width);
    expect(sy).toBeGreaterThan(0);
    expect(sy).toBeLessThan(box.height);
  }
});
