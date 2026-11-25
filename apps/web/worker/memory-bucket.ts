// An in-memory stand-in for an R2 bucket, for unit tests. It answers the way R2
// does for the calls the release route makes: null for a missing key, a quoted
// entity tag, and exactly the requested bytes for a range.
import type { ReleaseBucket, ReleaseObjectBody, ReleaseObjectHead } from "./bucket.js";

export interface MemoryBucket extends ReleaseBucket {
  /** Every call made, in order, so a test can check what the route asked for. */
  readonly calls: string[];
}

export function createMemoryBucket(objects: Readonly<Record<string, Uint8Array>>): MemoryBucket {
  const calls: string[] = [];
  const headOf = (key: string, bytes: Uint8Array): ReleaseObjectHead => ({
    size: bytes.byteLength,
    // Not R2's MD5, but as good for these tests: it changes when the bytes do.
    httpEtag: `"${key.length}-${bytes.byteLength}-${bytes.reduce((a, b) => (a * 31 + b) >>> 0, 7)}"`,
  });
  return {
    calls,
    async head(key) {
      calls.push(`head ${key}`);
      const bytes = objects[key];
      return bytes === undefined ? null : headOf(key, bytes);
    },
    async get(key, options) {
      const range = options?.range;
      calls.push(range === undefined ? `get ${key}` : `get ${key} ${range.offset}+${range.length}`);
      const bytes = objects[key];
      if (bytes === undefined) return null;
      if (range !== undefined && range.offset + range.length > bytes.byteLength) {
        throw new Error("The requested range is not satisfiable");
      }
      const slice = new Uint8Array(
        range === undefined ? bytes : bytes.subarray(range.offset, range.offset + range.length),
      );
      const object: ReleaseObjectBody = {
        ...headOf(key, bytes),
        body: new Blob([slice]).stream(),
      };
      return object;
    },
  };
}
