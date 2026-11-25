import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  IMMUTABLE_CACHE_CONTROL,
  isContentHashed,
  isReleaseName,
  REVALIDATE_CACHE_CONTROL,
  releaseFileHeaders,
  releaseObjectKey,
} from "./release-files.js";

interface NameVector {
  readonly name: string;
  readonly served: boolean;
  readonly hashed: boolean;
  readonly why: string;
}

interface ReleaseVector {
  readonly name: string;
  readonly valid: boolean;
  readonly why: string;
}

// Shared with forge's Python tests, so the pipeline names files by the rule the
// Worker serves them by.
const vectors = JSON.parse(
  readFileSync(new URL("../vectors/release-file-names.json", import.meta.url), "utf8"),
) as { readonly names: readonly NameVector[]; readonly releases: readonly ReleaseVector[] };

describe("the shared release-file vectors", () => {
  it("are not trivially small", () => {
    expect(vectors.names.filter((v) => v.served).length).toBeGreaterThanOrEqual(5);
    expect(vectors.names.filter((v) => !v.served).length).toBeGreaterThanOrEqual(10);
    expect(vectors.releases.length).toBeGreaterThanOrEqual(5);
  });

  it.each(vectors.names.map((v) => [v.name, v.why, v]))("classify %j (%s)", (_n, _w, vector) => {
    const v = vector as NameVector;
    expect(isContentHashed(v.name)).toBe(v.hashed);
    expect(releaseFileHeaders(v.name) !== null).toBe(v.served);
  });

  it.each(vectors.releases.map((v) => [v.name, v.why, v.valid]))(
    "judge the release name %j (%s)",
    (name, _why, valid) => {
      expect(isReleaseName(name as string)).toBe(valid);
    },
  );
});

describe("releaseFileHeaders", () => {
  it("lets the manifest be stored but checked before every use", () => {
    expect(releaseFileHeaders("manifest.json")).toEqual({
      contentType: "application/json; charset=utf-8",
      cacheControl: REVALIDATE_CACHE_CONTROL,
    });
    expect(REVALIDATE_CACHE_CONTROL).toBe("no-cache");
  });

  it("lets a hashed file be kept for a year without checking", () => {
    expect(releaseFileHeaders("points.f958edcc94e000e4.bin")).toEqual({
      contentType: "application/octet-stream",
      cacheControl: IMMUTABLE_CACHE_CONTROL,
    });
    expect(IMMUTABLE_CACHE_CONTROL).toBe("public, max-age=31536000, immutable");
  });

  it.each([
    ["proteins.0c919232e600b999.json", "application/json; charset=utf-8"],
    ["proteins.0c919232e600b999.parquet", "application/vnd.apache.parquet"],
    ["p38398.0c919232e600b999.bcif", "application/octet-stream"],
    ["points.0c919232e600b999.bin", "application/octet-stream"],
  ])("gives %s the content type %s", (name, type) => {
    expect(releaseFileHeaders(name)?.contentType).toBe(type);
  });

  it("refuses a name longer than 128 characters", () => {
    const long = `${"a".repeat(110)}.0123456789abcdef.bin`;
    expect(long.length).toBeGreaterThan(128);
    expect(releaseFileHeaders(long)).toBeNull();
    expect(releaseFileHeaders(long.slice(long.length - 128))).not.toBeNull();
  });
});

describe("releaseObjectKey", () => {
  it("joins a release and a file with one slash", () => {
    expect(releaseObjectKey("sample", "manifest.json")).toBe("sample/manifest.json");
  });

  it.each([
    ["..", "manifest.json"],
    ["sample", "../manifest.json"],
    ["sample/x", "manifest.json"],
    ["sample", "points.bin"],
  ])("refuses %j with %j", (release, file) => {
    expect(releaseObjectKey(release, file)).toBeNull();
  });
});
