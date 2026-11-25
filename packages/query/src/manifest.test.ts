import { describe, expect, it } from "vitest";
import { ReleaseError } from "./errors.js";
import { parseManifest } from "./manifest.js";
import { fakeRelease } from "./test-utils.js";

const REMOVE = Symbol("remove");

// Return a copy of the good manifest with one value replaced or removed.
function withChange(path: readonly string[], value: unknown): unknown {
  const manifest = structuredClone(fakeRelease().manifest);
  let node: Record<string, unknown> = manifest;
  for (const key of path.slice(0, -1)) node = node[key] as Record<string, unknown>;
  const last = path[path.length - 1] as string;
  if (value === REMOVE) delete node[last];
  else node[last] = value;
  return manifest;
}

function detailOf(value: unknown): string {
  try {
    parseManifest(value);
  } catch (error) {
    if (error instanceof ReleaseError && error.code === "manifest_invalid") return error.detail;
    throw error;
  }
  throw new Error("expected manifest_invalid");
}

describe("parseManifest", () => {
  it("returns a typed manifest", () => {
    const manifest = parseManifest(fakeRelease().manifest);
    expect(manifest.rowCount).toBe(2);
    expect(manifest.sample).toBe(true);
    expect(manifest.sampleNotice).toBe("Sample data.");
    expect(manifest.categories.map((c) => c.label)).toEqual(["DNA repair", "Signalling"]);
    expect(manifest.files.points.format).toBe("points/0");
  });

  it.each<[string, readonly string[], unknown, string]>([
    ["a wrong format", ["format"], "release/1", "format"],
    ["a negative row count", ["row_count"], -1, "row_count"],
    ["a fractional row count", ["row_count"], 1.5, "row_count"],
    ["a sample with no notice", ["sample_notice"], REMOVE, "sample_notice"],
    ["a missing sample flag", ["sample"], REMOVE, "sample"],
    ["no categories", ["categories"], [], "categories"],
    [
      "a repeated category",
      ["categories"],
      [
        { id: "dna_repair", label: "DNA repair" },
        { id: "dna_repair", label: "Again" },
      ],
      "repeats",
    ],
    ["a path with a folder", ["files", "points", "path"], "../points.bin", "file name"],
    ["an absolute address", ["files", "points", "path"], "https://example.org/p.bin", "file name"],
    ["a short hash", ["files", "points", "sha256"], "abc", "SHA-256"],
    ["the wrong format for points", ["files", "points", "format"], "points/1", "points/0"],
    ["a missing proteins file", ["files", "proteins"], REMOVE, "files.proteins"],
  ])("rejects %s", (_, path, value, expected) => {
    expect(detailOf(withChange(path, value))).toContain(expected);
  });

  it("rejects something that is not an object", () => {
    expect(detailOf([])).toContain("not a JSON object");
  });
});
