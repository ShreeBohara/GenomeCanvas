// The naming rule for files in a release, shared by the Worker that serves them
// and the command that uploads them. forge writes data files as
// `<stem>.<first 16 hex digits of SHA-256>.<extension>`; the shared vectors in
// ../vectors/release-file-names.json hold both languages to the same rule.

/** One path segment: lowercase letters and digits, joined by single dots, hyphens or underscores. */
const SEGMENT = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

/** A data file whose name carries a prefix of its own SHA-256, so its bytes never change. */
const CONTENT_HASHED = /^[a-z0-9]+(?:[._-][a-z0-9]+)*\.[0-9a-f]{16}\.[a-z0-9]+$/;

const MAX_SEGMENT_LENGTH = 128;

/** The one file in a release with a fixed name; it is replaced when the release is. */
export const MANIFEST_FILE = "manifest.json";

/** Kept by the browser and every cache, unchecked, for a year. */
export const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

/** Stored, but checked with the origin before every use. */
export const REVALIDATE_CACHE_CONTROL = "no-cache";

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  bin: "application/octet-stream",
  // BinaryCIF has no registered media type; Mol* reads it as plain bytes.
  bcif: "application/octet-stream",
  json: "application/json; charset=utf-8",
  parquet: "application/vnd.apache.parquet",
};

export interface ReleaseFileHeaders {
  readonly contentType: string;
  readonly cacheControl: string;
}

export function isReleaseName(value: string): boolean {
  return value.length <= MAX_SEGMENT_LENGTH && SEGMENT.test(value);
}

export function isContentHashed(fileName: string): boolean {
  return fileName.length <= MAX_SEGMENT_LENGTH && CONTENT_HASHED.test(fileName);
}

function extensionOf(fileName: string): string {
  return fileName.slice(fileName.lastIndexOf(".") + 1);
}

/**
 * The headers a release file is served with, or null if the name is not one a
 * release may contain: not a bare name, an unknown extension, or a fixed name
 * other than the manifest. Fixed names are refused because they could be
 * replaced, and a replaceable file must not be cached as if it never changes.
 */
export function releaseFileHeaders(fileName: string): ReleaseFileHeaders | null {
  if (fileName.length > MAX_SEGMENT_LENGTH || !SEGMENT.test(fileName)) return null;
  const contentType = CONTENT_TYPES[extensionOf(fileName)];
  if (contentType === undefined) return null;
  if (fileName === MANIFEST_FILE) {
    return { contentType, cacheControl: REVALIDATE_CACHE_CONTROL };
  }
  if (isContentHashed(fileName)) {
    return { contentType, cacheControl: IMMUTABLE_CACHE_CONTROL };
  }
  return null;
}

/** The bucket key for a file of a release, or null if either part is not allowed. */
export function releaseObjectKey(release: string, fileName: string): string | null {
  if (!isReleaseName(release) || releaseFileHeaders(fileName) === null) return null;
  return `${release}/${fileName}`;
}
