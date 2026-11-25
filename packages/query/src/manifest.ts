import { ReleaseError } from "./errors.js";

export interface ReleaseFile {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
  readonly format: string;
}

export interface Category {
  readonly id: string;
  readonly label: string;
}

export interface Manifest {
  readonly release: string;
  readonly rowCount: number;
  readonly sample: boolean;
  /** Present whenever `sample` is true: the sentence a reader must see. */
  readonly sampleNotice: string | null;
  readonly categories: readonly Category[];
  readonly files: { readonly points: ReleaseFile; readonly proteins: ReleaseFile };
}

export const RELEASE_FORMAT = "release/0";
export const POINTS_FORMAT = "points/0";
export const INDEX_FORMAT = "protein-index/0";

// A file name, never a path: no separator, no "..", so a manifest cannot point
// a reader outside the release folder or at another host.
const SAFE_FILE_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SHA256_HEX = /^[0-9a-f]{64}$/;
const MAX_CATEGORIES = 256;

type Json = Record<string, unknown>;

function invalid(detail: string): never {
  throw new ReleaseError("manifest_invalid", detail);
}

function isObject(value: unknown): value is Json {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "")
    invalid(`${field} is not a non-empty string`);
  return value;
}

function count(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    invalid(`${field} is not a non-negative integer`);
  }
  return value;
}

function parseFile(value: unknown, field: string, format: string): ReleaseFile {
  if (!isObject(value)) invalid(`${field} is missing`);
  const path = nonEmptyString(value.path, `${field}.path`);
  if (!SAFE_FILE_NAME.test(path) || path.includes(".."))
    invalid(`${field}.path is not a file name`);
  const sha256 = nonEmptyString(value.sha256, `${field}.sha256`);
  if (!SHA256_HEX.test(sha256)) invalid(`${field}.sha256 is not a SHA-256 in hex`);
  if (value.format !== format) invalid(`${field}.format is not ${format}`);
  return { path, bytes: count(value.bytes, `${field}.bytes`), sha256, format };
}

function parseCategories(value: unknown): Category[] {
  if (!Array.isArray(value) || value.length === 0) invalid("categories is not a non-empty list");
  if (value.length > MAX_CATEGORIES) invalid(`more than ${MAX_CATEGORIES} categories`);
  const seen = new Set<string>();
  return value.map((item: unknown, i) => {
    if (!isObject(item)) invalid(`categories[${i}] is not an object`);
    const id = nonEmptyString(item.id, `categories[${i}].id`);
    if (seen.has(id)) invalid(`categories[${i}].id repeats ${id}`);
    seen.add(id);
    return { id, label: nonEmptyString(item.label, `categories[${i}].label`) };
  });
}

/** Check a parsed `manifest.json` and return it typed, or throw `manifest_invalid`. */
export function parseManifest(value: unknown): Manifest {
  if (!isObject(value)) invalid("the manifest is not a JSON object");
  if (value.format !== RELEASE_FORMAT) invalid(`format is not ${RELEASE_FORMAT}`);
  if (typeof value.sample !== "boolean") invalid("sample is not true or false");
  const sampleNotice =
    value.sample || value.sample_notice !== undefined
      ? nonEmptyString(value.sample_notice, "sample_notice")
      : null;
  if (!isObject(value.files)) invalid("files is missing");

  return {
    release: nonEmptyString(value.release, "release"),
    rowCount: count(value.row_count, "row_count"),
    sample: value.sample,
    sampleNotice,
    categories: parseCategories(value.categories),
    files: {
      points: parseFile(value.files.points, "files.points", POINTS_FORMAT),
      proteins: parseFile(value.files.proteins, "files.proteins", INDEX_FORMAT),
    },
  };
}
