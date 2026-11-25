// Single byte ranges (RFC 9110, section 14). Parquet readers ask for the footer
// first and then for column chunks, one range per request.

export type RangeResult =
  /** No usable Range header: send the whole file. */
  | { readonly kind: "none" }
  /** Bytes offset to offset + length - 1 inclusive. */
  | { readonly kind: "range"; readonly offset: number; readonly length: number }
  /** A well-formed range that lies wholly past the end of the file. */
  | { readonly kind: "unsatisfiable" };

const SINGLE_RANGE = /^bytes=(\d*)-(\d*)$/;

/**
 * Reads a Range header against a file of `size` bytes. A malformed header, a
 * unit other than bytes, or several ranges are ignored and the whole file is
 * sent, which RFC 9110 allows; only a well-formed single range that cannot be
 * met is unsatisfiable.
 */
export function parseRange(header: string | null, size: number): RangeResult {
  if (header === null) return { kind: "none" };
  const match = SINGLE_RANGE.exec(header.trim());
  if (match === null) return { kind: "none" };
  const [, startText = "", endText = ""] = match;

  if (startText === "") {
    // A suffix range: the last N bytes.
    if (endText === "") return { kind: "none" };
    const suffix = Number(endText);
    if (!Number.isSafeInteger(suffix)) return { kind: "none" };
    if (suffix === 0 || size === 0) return { kind: "unsatisfiable" };
    const length = Math.min(suffix, size);
    return { kind: "range", offset: size - length, length };
  }

  const start = Number(startText);
  if (!Number.isSafeInteger(start)) return { kind: "none" };
  if (start >= size) return { kind: "unsatisfiable" };
  if (endText === "") return { kind: "range", offset: start, length: size - start };

  const end = Number(endText);
  if (!Number.isSafeInteger(end) || end < start) return { kind: "none" };
  const last = Math.min(end, size - 1);
  return { kind: "range", offset: start, length: last - start + 1 };
}

/** The Content-Range value for bytes offset..offset + length - 1 of a file of `size` bytes. */
export function contentRange(offset: number, length: number, size: number): string {
  return `bytes ${offset}-${offset + length - 1}/${size}`;
}
