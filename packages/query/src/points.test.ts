import { describe, expect, it } from "vitest";
import { ReleaseError } from "./errors.js";
import { decodePoints, pointsByteLength } from "./points.js";
import { encodePoints } from "./test-utils.js";

// The worked example in docs/formats/points-v0.md, shared with forge's Python tests.
const WORKED_EXAMPLE = "474350540000100002000000000000000000c03f0000803e000000c0000080400003";

function fromHex(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = Number.parseInt(hex.slice(2 * i, 2 * i + 2), 16);
  return bytes.buffer;
}

function codeOf(run: () => unknown): string {
  try {
    run();
  } catch (error) {
    if (error instanceof ReleaseError) return error.code;
    throw error;
  }
  throw new Error("expected a ReleaseError");
}

describe("decodePoints", () => {
  it("decodes the worked example in the specification", () => {
    const points = decodePoints(fromHex(WORKED_EXAMPLE), { rowCount: 2, categoryCount: 4 });
    expect(points.count).toBe(2);
    expect(Array.from(points.x)).toEqual([1.5, 0.25]);
    expect(Array.from(points.y)).toEqual([-2, 4]);
    expect(Array.from(points.category)).toEqual([0, 3]);
  });

  it("reads the arrays without copying the file", () => {
    const buffer = fromHex(WORKED_EXAMPLE);
    const points = decodePoints(buffer);
    expect(points.x.buffer).toBe(buffer);
    expect(points.category.buffer).toBe(buffer);
  });

  it("accepts an empty file that is only a header", () => {
    expect(decodePoints(encodePoints([])).count).toBe(0);
  });

  it("rejects a file shorter than the header", () => {
    expect(codeOf(() => decodePoints(fromHex(WORKED_EXAMPLE).slice(0, 15)))).toBe("truncated");
  });

  it("rejects a file cut off inside the data", () => {
    const whole = fromHex(WORKED_EXAMPLE);
    expect(whole.byteLength).toBe(pointsByteLength(2));
    expect(codeOf(() => decodePoints(whole.slice(0, whole.byteLength - 1)))).toBe("truncated");
  });

  it("rejects bytes after the last category", () => {
    const longer = new Uint8Array(pointsByteLength(2) + 1);
    longer.set(new Uint8Array(fromHex(WORKED_EXAMPLE)));
    expect(codeOf(() => decodePoints(longer.buffer))).toBe("trailing_bytes");
  });

  it("rejects a wrong magic number", () => {
    expect(codeOf(() => decodePoints(encodePoints([[0, 0, 0]], { magic: "GCPX" })))).toBe(
      "bad_magic",
    );
  });

  it("rejects a version it does not know", () => {
    expect(codeOf(() => decodePoints(encodePoints([[0, 0, 0]], { version: 1 })))).toBe(
      "unsupported_version",
    );
  });

  it("rejects a header length other than 16", () => {
    const buffer = fromHex(WORKED_EXAMPLE);
    new DataView(buffer).setUint16(6, 20, true);
    expect(codeOf(() => decodePoints(buffer))).toBe("malformed_header");
  });

  it("rejects a non-zero reserved field", () => {
    const buffer = fromHex(WORKED_EXAMPLE);
    new DataView(buffer).setUint32(12, 1, true);
    expect(codeOf(() => decodePoints(buffer))).toBe("malformed_header");
  });

  it("rejects a row count that disagrees with the manifest", () => {
    expect(codeOf(() => decodePoints(fromHex(WORKED_EXAMPLE), { rowCount: 3 }))).toBe(
      "row_count_mismatch",
    );
  });

  it("rejects a position that is not finite", () => {
    expect(
      codeOf(() =>
        decodePoints(
          encodePoints([
            [0, 0, 0],
            [Number.NaN, 0, 0],
          ]),
        ),
      ),
    ).toBe("non_finite");
    expect(codeOf(() => decodePoints(encodePoints([[0, Number.POSITIVE_INFINITY, 0]])))).toBe(
      "non_finite",
    );
  });

  it("rejects a category the manifest does not list", () => {
    expect(codeOf(() => decodePoints(fromHex(WORKED_EXAMPLE), { categoryCount: 3 }))).toBe(
      "bad_category",
    );
  });
});
