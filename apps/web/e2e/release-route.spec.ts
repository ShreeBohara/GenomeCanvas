// The release reaches the page the way production serves it: through the
// Worker's /release/ route, from R2 (wrangler's local R2 here, filled by
// `corepack pnpm release:local`), never from the static assets.
import { existsSync, readdirSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { expect, test } from "@playwright/test";
import { readBuiltFile, readBuiltRelease } from "./release.js";

const release = readBuiltRelease();
const POINTS_URL = `/release/sample/${release.pointsPath}`;

/** A GET whose path is sent exactly as written: no client folds `..` away first. */
function rawGet(baseURL: string, path: string): Promise<{ status: number; body: string }> {
  const { hostname, port } = new URL(baseURL);
  return new Promise((resolve, reject) => {
    const req = httpRequest({ hostname, port, path, method: "GET" }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => {
        body += chunk;
      });
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", reject);
    req.end();
  });
}

test("a ranged request returns exactly those bytes of the file on disk", async ({ request }) => {
  const onDisk = readBuiltFile(release.pointsPath);
  const response = await request.get(POINTS_URL, { headers: { Range: "bytes=0-15" } });
  expect(response.status()).toBe(206);
  expect(response.headers()["content-range"]).toBe(`bytes 0-15/${onDisk.byteLength}`);
  expect(response.headers()["accept-ranges"]).toBe("bytes");
  const body = await response.body();
  expect(body.byteLength).toBe(16);
  expect(body.equals(onDisk.subarray(0, 16))).toBe(true);
});

test("a range in the middle of the file is exact too", async ({ request }) => {
  const onDisk = readBuiltFile(release.pointsPath);
  const response = await request.get(POINTS_URL, { headers: { Range: "bytes=100-163" } });
  expect(response.status()).toBe(206);
  expect((await response.body()).equals(onDisk.subarray(100, 164))).toBe(true);
});

test("a range past the end is refused with 416 and the size", async ({ request }) => {
  const size = readBuiltFile(release.pointsPath).byteLength;
  const response = await request.get(POINTS_URL, { headers: { Range: `bytes=${size}-` } });
  expect(response.status()).toBe(416);
  expect(response.headers()["content-range"]).toBe(`bytes */${size}`);
});

test("the manifest must be checked before reuse; a hashed file is kept a year", async ({
  request,
}) => {
  const manifest = await request.get("/release/sample/manifest.json");
  expect(manifest.status()).toBe(200);
  expect(manifest.headers()["cache-control"]).toBe("no-cache");
  expect((await manifest.body()).equals(readBuiltFile("manifest.json"))).toBe(true);

  const points = await request.get(POINTS_URL);
  expect(points.headers()["cache-control"]).toBe("public, max-age=31536000, immutable");
  expect(points.headers()["content-type"]).toBe("application/octet-stream");
});

test("a repeated request with If-None-Match is answered 304 with no body", async ({ request }) => {
  const first = await request.get(POINTS_URL);
  const etag = first.headers().etag;
  expect(etag).toMatch(/^".+"$/);
  const second = await request.get(POINTS_URL, { headers: { "If-None-Match": etag as string } });
  expect(second.status()).toBe(304);
  expect((await second.body()).byteLength).toBe(0);
});

test("paths that try to climb out of a release are a JSON 404", async ({ baseURL }) => {
  for (const path of [
    "/release/sample/../manifest.json",
    "/release/sample/..%2Fmanifest.json",
    "/release/sample/%2e%2e/manifest.json",
    "/release/../release/sample/sub/manifest.json",
    "/release/sample/points.bin",
  ]) {
    const response = await rawGet(baseURL as string, path);
    expect(response.status, path).toBe(404);
    expect(JSON.parse(response.body), path).toEqual({ error: "not_found" });
  }
});

test("a climb all the way out of /release/ lands on the app, never on a private file", async ({
  baseURL,
}) => {
  // URLs are normalised before any code sees them, so this is a request for
  // /wrangler.jsonc, which is not an asset: the single-page fallback answers.
  const response = await rawGet(baseURL as string, "/release/sample/%2e%2e/%2e%2e/wrangler.jsonc");
  expect(response.body).toContain("<!doctype html>");
  expect(response.body).not.toContain("r2_buckets");
});

test("the page reads its release through the Worker route", async ({ page }) => {
  const seen = new Map<string, string | undefined>();
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    if (path.startsWith("/release/")) seen.set(path, response.headers()["cache-control"]);
  });
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveAttribute("data-instances", String(release.rowCount));
  expect(seen.get("/release/sample/manifest.json")).toBe("no-cache");
  expect(seen.get(POINTS_URL)).toBe("public, max-age=31536000, immutable");
});

test("no release file is left in the app's static assets", () => {
  const assets = new URL("../dist/client/", import.meta.url);
  expect(existsSync(assets)).toBe(true);
  expect(existsSync(new URL("release", assets))).toBe(false);
  // Vite's own build manifest is .vite/manifest.json; the release's would sit at the top.
  const names = readdirSync(assets, { recursive: true }).map(String);
  const releaseNames = new Set([
    "manifest.json",
    release.pointsPath,
    ...readdirSync(new URL("../../../build/release/sample/", import.meta.url)),
  ]);
  expect(
    names.filter((n) => releaseNames.has(n.split(/[\\/]/).pop() ?? "") && !n.startsWith(".vite")),
  ).toEqual([]);
});
