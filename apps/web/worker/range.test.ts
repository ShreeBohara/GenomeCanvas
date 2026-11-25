import { describe, expect, it } from "vitest";
import { contentRange, parseRange } from "./range.js";

describe("parseRange", () => {
  it.each([
    ["bytes=0-15", 100, 0, 16],
    ["bytes=10-19", 100, 10, 10],
    ["bytes=99-99", 100, 99, 1],
    ["bytes=90-", 100, 90, 10],
    ["bytes=90-500", 100, 90, 10],
    ["bytes=-10", 100, 90, 10],
    ["bytes=-500", 100, 0, 100],
    [" bytes=0-0 ", 100, 0, 1],
  ])("reads %j of %i bytes as offset %i, length %i", (header, size, offset, length) => {
    expect(parseRange(header, size)).toEqual({ kind: "range", offset, length });
  });

  it.each([
    ["bytes=100-", 100],
    ["bytes=100-200", 100],
    ["bytes=-0", 100],
    ["bytes=0-0", 0],
    ["bytes=-5", 0],
  ])("finds %j of a %i-byte file unsatisfiable", (header, size) => {
    expect(parseRange(header, size)).toEqual({ kind: "unsatisfiable" });
  });

  it.each([
    [null],
    ["bytes=5-1"],
    ["bytes=0-1,4-5"],
    ["items=0-1"],
    ["bytes=-"],
    ["bytes=a-b"],
    ["bytes=0x10-20"],
    ["bytes=99999999999999999999-"],
  ])("ignores %j and sends the whole file", (header) => {
    expect(parseRange(header, 100)).toEqual({ kind: "none" });
  });
});

describe("contentRange", () => {
  it("names the first and last byte, inclusive, and the size", () => {
    expect(contentRange(0, 16, 502)).toBe("bytes 0-15/502");
    expect(contentRange(501, 1, 502)).toBe("bytes 501-501/502");
  });
});
