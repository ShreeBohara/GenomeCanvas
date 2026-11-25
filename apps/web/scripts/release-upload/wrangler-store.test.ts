import { describe, expect, it } from "vitest";
import { type PlannedObject, planUpload } from "./plan.js";
import { fakeRelease } from "./test-release.js";
import { getArgs, isMissingObjectError, putArgs } from "./wrangler-store.js";

const manifest = planUpload(fakeRelease(), { release: "sample", bucket: "b" }).objects.at(
  -1,
) as PlannedObject;

describe("wrangler arguments", () => {
  it("puts an object with both headers, in the account only when asked", () => {
    expect(putArgs("bucket", manifest, "/tmp/f", { kind: "remote" })).toEqual([
      "r2",
      "object",
      "put",
      "bucket/sample/manifest.json",
      "--file",
      "/tmp/f",
      "--content-type",
      "application/json; charset=utf-8",
      "--cache-control",
      "no-cache",
      "--remote",
    ]);
  });

  it("reads from wrangler's local state when local", () => {
    expect(getArgs("bucket", "sample/x", "/tmp/f", { kind: "local", persistTo: "state" })).toEqual([
      "r2",
      "object",
      "get",
      "bucket/sample/x",
      "--file",
      "/tmp/f",
      "--local",
      "--persist-to",
      "state",
    ]);
  });
});

describe("isMissingObjectError", () => {
  it("tells a missing key from any other failure", () => {
    expect(isMissingObjectError("✘ [ERROR] The specified key does not exist.")).toBe(true);
    expect(isMissingObjectError("✘ [ERROR] Authentication error [code: 10000]")).toBe(false);
  });
});
