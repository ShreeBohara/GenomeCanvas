import { describe, expect, it } from "vitest";
import { ReleaseError } from "./errors.js";
import { loadRelease, releaseFolder } from "./release.js";
import { fakeFetch, fakeRelease } from "./test-utils.js";

const BASE = "https://data.example/release/test/";

async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ReleaseError) return error.code;
    throw error;
  }
  throw new Error("expected a ReleaseError");
}

describe("loadRelease", () => {
  it("loads a release and lines the index up with the points", async () => {
    const { files } = fakeRelease();
    const release = await loadRelease(BASE, { fetch: fakeFetch(files) });
    expect(release.points.count).toBe(2);
    expect(release.proteins.map((p) => p.geneSymbol)).toEqual(["BRCA1", "TP53"]);
    expect(release.proteins.map((p) => p.category)).toEqual(Array.from(release.points.category));
  });

  it("says when the manifest cannot be fetched", async () => {
    expect(await codeOf(loadRelease(BASE, { fetch: fakeFetch(new Map()) }))).toBe(
      "manifest_unreachable",
    );
  });

  it("says when the network fails outright", async () => {
    const failing: typeof fetch = async () => {
      throw new TypeError("network down");
    };
    expect(await codeOf(loadRelease(BASE, { fetch: failing }))).toBe("manifest_unreachable");
  });

  it("says when a named file is missing", async () => {
    const { files, manifest } = fakeRelease();
    files.delete((manifest.files as { points: { path: string } }).points.path);
    expect(await codeOf(loadRelease(BASE, { fetch: fakeFetch(files) }))).toBe("file_unreachable");
  });

  it("rejects a file whose length disagrees with the manifest", async () => {
    const { files, manifest } = fakeRelease();
    const path = (manifest.files as { points: { path: string } }).points.path;
    const whole = files.get(path) as Uint8Array;
    files.set(path, whole.slice(0, whole.byteLength - 3));
    expect(await codeOf(loadRelease(BASE, { fetch: fakeFetch(files) }))).toBe("length_mismatch");
  });

  it("rejects a file whose content does not match its hash", async () => {
    const { files, manifest } = fakeRelease();
    const path = (manifest.files as { points: { path: string } }).points.path;
    const changed = (files.get(path) as Uint8Array).slice();
    changed[20] = (changed[20] ?? 0) ^ 0xff;
    files.set(path, changed);
    expect(await codeOf(loadRelease(BASE, { fetch: fakeFetch(files) }))).toBe("hash_mismatch");
  });

  it("rejects a manifest that is not JSON", async () => {
    const files = new Map([["manifest.json", new TextEncoder().encode("{not json")]]);
    expect(await codeOf(loadRelease(BASE, { fetch: fakeFetch(files) }))).toBe("manifest_invalid");
  });
});

describe("releaseFolder", () => {
  it("adds the trailing slash a folder needs", () => {
    expect(releaseFolder("https://data.example/release/test").href).toBe(BASE);
    expect(releaseFolder(BASE).href).toBe(BASE);
  });
});
