import { ReleaseError } from "./errors.js";

// The layout is specified in docs/formats/points-v0.md.
export const POINTS_MAGIC = "GCPT";
export const POINTS_VERSION = 0;
export const POINTS_HEADER_LENGTH = 16;

export interface Points {
  readonly count: number;
  readonly x: Float32Array;
  readonly y: Float32Array;
  /** An index into the manifest's categories, per row. */
  readonly category: Uint8Array;
}

export interface PointsExpectation {
  readonly rowCount?: number;
  readonly categoryCount?: number;
}

const LITTLE_ENDIAN_PLATFORM = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

export function pointsByteLength(rowCount: number): number {
  return POINTS_HEADER_LENGTH + 9 * rowCount;
}

function readFloats(view: DataView, offset: number, n: number): Float32Array {
  // On a little-endian platform, which is every platform a browser runs on today,
  // the file's bytes are already a Float32Array and need no copy.
  if (LITTLE_ENDIAN_PLATFORM) return new Float32Array(view.buffer, view.byteOffset + offset, n);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = view.getFloat32(offset + 4 * i, true);
  return out;
}

/**
 * Decode a points version 0 file. Every rule in the specification is checked,
 * and each failure throws a `ReleaseError` with its own code.
 */
export function decodePoints(buffer: ArrayBuffer, expect: PointsExpectation = {}): Points {
  if (buffer.byteLength < POINTS_HEADER_LENGTH) {
    throw new ReleaseError("truncated", `${buffer.byteLength} bytes is shorter than the header`);
  }
  const view = new DataView(buffer);
  const magic = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  );
  if (magic !== POINTS_MAGIC)
    throw new ReleaseError("bad_magic", `magic is ${JSON.stringify(magic)}`);

  const version = view.getUint16(4, true);
  if (version !== POINTS_VERSION) {
    throw new ReleaseError("unsupported_version", `format version ${version}`);
  }
  const headerLength = view.getUint16(6, true);
  if (headerLength !== POINTS_HEADER_LENGTH) {
    throw new ReleaseError("malformed_header", `header length ${headerLength}`);
  }
  if (view.getUint32(12, true) !== 0) {
    throw new ReleaseError("malformed_header", "reserved field is not zero");
  }

  const n = view.getUint32(8, true);
  const expected = pointsByteLength(n);
  if (buffer.byteLength < expected) {
    throw new ReleaseError("truncated", `${buffer.byteLength} bytes; ${n} rows need ${expected}`);
  }
  if (buffer.byteLength > expected) {
    throw new ReleaseError(
      "trailing_bytes",
      `${buffer.byteLength} bytes; ${n} rows need ${expected}`,
    );
  }
  if (expect.rowCount !== undefined && n !== expect.rowCount) {
    throw new ReleaseError("row_count_mismatch", `${n} rows; the manifest says ${expect.rowCount}`);
  }

  const x = readFloats(view, POINTS_HEADER_LENGTH, n);
  const y = readFloats(view, POINTS_HEADER_LENGTH + 4 * n, n);
  const category = new Uint8Array(buffer, POINTS_HEADER_LENGTH + 8 * n, n);

  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(x[i]) || !Number.isFinite(y[i])) {
      throw new ReleaseError("non_finite", `row ${i} has a position that is not a finite number`);
    }
    // i < n, the array's length, so the element exists.
    const c = category[i] as number;
    if (expect.categoryCount !== undefined && c >= expect.categoryCount) {
      throw new ReleaseError("bad_category", `row ${i} has category ${c}`);
    }
  }
  return { count: n, x, y, category };
}
