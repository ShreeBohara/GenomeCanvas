import { ReleaseError } from "./errors.js";
import { type Manifest, parseManifest, type ReleaseFile } from "./manifest.js";
import { decodePoints, type Points } from "./points.js";
import { type ProteinRecord, parseProteinIndex } from "./proteins.js";

export interface Release {
  readonly manifest: Manifest;
  readonly points: Points;
  readonly proteins: readonly ProteinRecord[];
}

export interface LoadOptions {
  readonly fetch?: typeof fetch;
  readonly signal?: AbortSignal;
}

/** A release folder's address must end in a slash, or relative file names resolve beside it. */
export function releaseFolder(baseUrl: string | URL): URL {
  const url = new URL(baseUrl);
  if (!url.pathname.endsWith("/")) url.pathname += "/";
  return url;
}

async function get(
  url: URL,
  options: LoadOptions,
  unreachable: "manifest_unreachable" | "file_unreachable",
): Promise<Response> {
  const fetcher = options.fetch ?? globalThis.fetch;
  let response: Response;
  try {
    response = await fetcher(url, options.signal ? { signal: options.signal } : {});
  } catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ReleaseError(unreachable, `${url.pathname}: ${String(error)}`);
  }
  if (!response.ok) throw new ReleaseError(unreachable, `${url.pathname}: HTTP ${response.status}`);
  return response;
}

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
  return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Fetch one file the manifest names and check its length and hash before anything reads it. */
export async function fetchReleaseFile(
  folder: URL,
  file: ReleaseFile,
  options: LoadOptions = {},
): Promise<ArrayBuffer> {
  const response = await get(new URL(file.path, folder), options, "file_unreachable");
  const data = await response.arrayBuffer();
  if (data.byteLength !== file.bytes) {
    throw new ReleaseError(
      "length_mismatch",
      `${file.path}: ${data.byteLength} bytes; the manifest says ${file.bytes}`,
    );
  }
  if ((await sha256Hex(data)) !== file.sha256) {
    throw new ReleaseError(
      "hash_mismatch",
      `${file.path}: content does not match the manifest's hash`,
    );
  }
  return data;
}

export async function fetchManifest(folder: URL, options: LoadOptions = {}): Promise<Manifest> {
  const response = await get(new URL("manifest.json", folder), options, "manifest_unreachable");
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ReleaseError("manifest_invalid", "manifest.json is not JSON");
  }
  return parseManifest(json);
}

/** Load a whole release from its folder's address: the manifest, then every file it names. */
export async function loadRelease(
  baseUrl: string | URL,
  options: LoadOptions = {},
): Promise<Release> {
  const folder = releaseFolder(baseUrl);
  const manifest = await fetchManifest(folder, options);
  const [pointsData, indexData] = await Promise.all([
    fetchReleaseFile(folder, manifest.files.points, options),
    fetchReleaseFile(folder, manifest.files.proteins, options),
  ]);

  const points = decodePoints(pointsData, {
    rowCount: manifest.rowCount,
    categoryCount: manifest.categories.length,
  });

  let index: unknown;
  try {
    index = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(indexData));
  } catch {
    throw new ReleaseError("index_invalid", `${manifest.files.proteins.path} is not UTF-8 JSON`);
  }
  const proteins = parseProteinIndex(index, manifest);
  for (let i = 0; i < proteins.length; i++) {
    if (proteins[i]?.category !== points.category[i]) {
      throw new ReleaseError(
        "index_invalid",
        `row ${i}: the index and the points disagree on its category`,
      );
    }
  }
  return { manifest, points, proteins };
}
