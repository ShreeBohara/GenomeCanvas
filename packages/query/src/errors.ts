/**
 * Why a release could not be read. These are codes for callers, not text for
 * people: an interface turns them into words.
 */
export type ReleaseErrorCode =
  | "manifest_unreachable"
  | "manifest_invalid"
  | "file_unreachable"
  | "length_mismatch"
  | "hash_mismatch"
  | "truncated"
  | "trailing_bytes"
  | "bad_magic"
  | "unsupported_version"
  | "malformed_header"
  | "row_count_mismatch"
  | "non_finite"
  | "bad_category"
  | "index_invalid";

/** The codes that mean the data never arrived, as opposed to arriving wrong. */
export const UNREACHABLE_CODES: ReadonlySet<ReleaseErrorCode> = new Set([
  "manifest_unreachable",
  "file_unreachable",
]);

export class ReleaseError extends Error {
  override readonly name = "ReleaseError";

  constructor(
    readonly code: ReleaseErrorCode,
    readonly detail: string,
  ) {
    super(`${code}: ${detail}`);
  }
}
