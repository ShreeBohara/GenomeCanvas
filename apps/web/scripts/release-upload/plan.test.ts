import { describe, expect, it } from "vitest";
import { describePlan, PlanError, planUpload } from "./plan.js";
import { fakeRelease } from "./test-release.js";

const options = { release: "sample", bucket: "genomecanvas-releases-staging" };

function problemsOf(run: () => unknown): readonly string[] {
  try {
    run();
  } catch (error) {
    if (error instanceof PlanError) return error.problems;
    throw error;
  }
  throw new Error("expected a PlanError");
}

describe("planUpload", () => {
  it("lists data files first, in name order, and the manifest last", () => {
    const plan = planUpload(fakeRelease(), options);
    const names = plan.objects.map((o) => o.fileName);
    expect(names.at(-1)).toBe("manifest.json");
    expect(names.slice(0, -1)).toEqual([...names.slice(0, -1)].sort());
    expect(names).toHaveLength(3);
    expect(plan.objects.map((o) => o.key)).toEqual(names.map((n) => `sample/${n}`));
  });

  it("gives each object its size, digest and the headers the Worker would serve", () => {
    const files = fakeRelease();
    const plan = planUpload(files, options);
    const points = plan.objects.find((o) => o.fileName.startsWith("points."));
    expect(points).toMatchObject({
      size: 25,
      contentType: "application/octet-stream",
      cacheControl: "public, max-age=31536000, immutable",
      action: "put-if-absent",
    });
    expect(points?.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(points?.fileName.slice(7, 23)).toBe(points?.sha256.slice(0, 16));
    const manifest = plan.objects.at(-1);
    expect(manifest).toMatchObject({
      contentType: "application/json; charset=utf-8",
      cacheControl: "no-cache",
      action: "replace",
    });
  });

  it("does not depend on the order the folder was read in", () => {
    expect(planUpload([...fakeRelease()].reverse(), options).objects.map((o) => o.key)).toEqual(
      planUpload(fakeRelease(), options).objects.map((o) => o.key),
    );
  });

  it("refuses a folder without a manifest", () => {
    const files = fakeRelease().filter((f) => f.name !== "manifest.json");
    expect(problemsOf(() => planUpload(files, options))).toEqual(["there is no manifest.json"]);
  });

  it("refuses a manifest it cannot read", () => {
    const files = fakeRelease().map((f) =>
      f.name === "manifest.json" ? { ...f, bytes: new TextEncoder().encode('{"format":1}') } : f,
    );
    expect(problemsOf(() => planUpload(files, options))[0]).toMatch(/cannot be read/);
  });

  it("collects every problem: a stray file, a missing file and a damaged file", () => {
    const files = fakeRelease();
    const [manifest, proteins, points] = files as [
      (typeof files)[0],
      (typeof files)[0],
      (typeof files)[0],
    ];
    const damaged = { ...proteins, bytes: proteins.bytes.map((b, i) => (i === 0 ? b ^ 1 : b)) };
    const problems = problemsOf(() =>
      planUpload([manifest, damaged, { name: "notes.txt", bytes: new Uint8Array(1) }], options),
    );
    expect(problems).toEqual([
      "notes.txt is not named by the manifest",
      `${points.name} is named by the manifest but missing`,
      `${proteins.name} does not have the SHA-256 the manifest records`,
    ]);
  });

  it("refuses a file whose size is not the size the manifest records", () => {
    const files = fakeRelease().map((f) =>
      f.name.startsWith("points.") ? { ...f, bytes: f.bytes.slice(1) } : f,
    );
    expect(problemsOf(() => planUpload(files, options))).toEqual([
      expect.stringMatching(/^points\..+ is 24 bytes; the manifest says 25$/),
    ]);
  });

  it("refuses a release name that is not allowed", () => {
    expect(problemsOf(() => planUpload(fakeRelease(), { ...options, release: "../x" }))).toEqual([
      '"../x" is not a release name',
    ]);
  });
});

describe("describePlan", () => {
  it("shows each object with its size and both headers, and says nothing is deleted", () => {
    const plan = planUpload(fakeRelease(), options);
    const text = describePlan(plan, "the staging account");
    expect(text).toContain("genomecanvas-releases-staging (the staging account): 3 objects");
    expect(text).toMatch(/put if absent +sample\/points\.[0-9a-f]{16}\.bin {2}25 bytes/);
    expect(text).toMatch(/replace +sample\/manifest\.json/);
    expect(text.match(/Cache-Control: public, max-age=31536000, immutable/g)).toHaveLength(2);
    expect(text.match(/Cache-Control: no-cache/g)).toHaveLength(1);
    expect(text).toContain("Nothing is ever deleted.");
  });
});
