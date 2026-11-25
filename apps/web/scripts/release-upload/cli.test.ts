import { describe, expect, it } from "vitest";
import { bucketFor, parseCli } from "./cli.js";

describe("parseCli", () => {
  it("plans by default", () => {
    expect(parseCli(["out", "--release", "sample", "--env", "staging"])).toEqual({
      folder: "out",
      release: "sample",
      env: "staging",
      apply: false,
    });
  });

  it("uploads only with --apply", () => {
    expect(parseCli(["out", "--release", "sample", "--local", "--apply"])).toMatchObject({
      env: null,
      apply: true,
    });
  });

  it.each([
    [["out", "--release", "sample"]],
    [["out", "--release", "sample", "--local", "--env", "staging"]],
    [["out", "--env", "staging"]],
    [["--release", "sample", "--local"]],
    [["out", "--release", "sample", "--env", "dev"]],
  ])("refuses %j", (argv) => {
    expect(() => parseCli(argv)).toThrow();
  });
});

describe("bucketFor", () => {
  it("reads each environment's RELEASES bucket from wrangler.jsonc", () => {
    expect(bucketFor(null)).toBe("genomecanvas-releases-local");
    expect(bucketFor("staging")).toBe("genomecanvas-releases-staging");
    expect(bucketFor("production")).toBe("genomecanvas-releases-production");
  });
});
