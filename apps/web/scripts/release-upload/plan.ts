// What uploading a release folder would do, worked out from the files alone.
// Pure: no disk, no network. cli.ts reads the folder; apply.ts does the work.
import { createHash } from "node:crypto";
import { MANIFEST_FILE, releaseFileHeaders, releaseObjectKey } from "@genomecanvas/protocol";
import { parseManifest } from "@genomecanvas/query";

export interface LocalFile {
  readonly name: string;
  readonly bytes: Uint8Array;
}

export interface PlannedObject {
  readonly key: string;
  readonly fileName: string;
  readonly size: number;
  readonly sha256: string;
  readonly contentType: string;
  readonly cacheControl: string;
  /**
   * `put-if-absent` for content-hashed files, whose bytes are fixed by their
   * name: one already there is left alone. `replace` for the manifest only.
   */
  readonly action: "put-if-absent" | "replace";
  readonly bytes: Uint8Array;
}

export interface UploadPlan {
  readonly release: string;
  readonly bucket: string;
  /** Data files first, the manifest last, so a reader never sees a manifest whose files are missing. */
  readonly objects: readonly PlannedObject[];
}

export class PlanError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(`${problems.length} problem(s) with the release folder:\n  ${problems.join("\n  ")}`);
    this.name = "PlanError";
  }
}

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Checks a built release folder against its own manifest and the shared naming
 * rule, and lists the objects to write. Every problem is collected before
 * anything is refused, so one run shows them all.
 */
export function planUpload(
  files: readonly LocalFile[],
  options: { readonly release: string; readonly bucket: string },
): UploadPlan {
  const problems: string[] = [];
  const byName = new Map(files.map((f) => [f.name, f]));

  const manifestFile = byName.get(MANIFEST_FILE);
  if (manifestFile === undefined) throw new PlanError([`there is no ${MANIFEST_FILE}`]);

  let named: readonly { path: string; bytes: number; sha256: string }[] = [];
  try {
    const manifest = parseManifest(JSON.parse(new TextDecoder().decode(manifestFile.bytes)));
    named = Object.values(manifest.files);
  } catch (error) {
    throw new PlanError([`${MANIFEST_FILE} cannot be read: ${(error as Error).message}`]);
  }

  const expected = new Set([MANIFEST_FILE, ...named.map((f) => f.path)]);
  for (const name of [...byName.keys()].sort()) {
    if (!expected.has(name)) problems.push(`${name} is not named by the manifest`);
  }
  for (const entry of named) {
    const file = byName.get(entry.path);
    if (file === undefined) {
      problems.push(`${entry.path} is named by the manifest but missing`);
      continue;
    }
    if (file.bytes.byteLength !== entry.bytes) {
      problems.push(
        `${entry.path} is ${file.bytes.byteLength} bytes; the manifest says ${entry.bytes}`,
      );
    } else if (sha256Hex(file.bytes) !== entry.sha256) {
      problems.push(`${entry.path} does not have the SHA-256 the manifest records`);
    }
  }

  const objects: PlannedObject[] = [];
  for (const name of [...expected].sort((a, b) =>
    a === MANIFEST_FILE ? 1 : b === MANIFEST_FILE ? -1 : a < b ? -1 : a > b ? 1 : 0,
  )) {
    const file = byName.get(name);
    const headers = releaseFileHeaders(name);
    const key = releaseObjectKey(options.release, name);
    if (headers === null) {
      problems.push(`${name} is not a name a release may contain`);
      continue;
    }
    if (key === null) {
      problems.push(`${JSON.stringify(options.release)} is not a release name`);
      break;
    }
    if (file === undefined) continue;
    objects.push({
      key,
      fileName: name,
      size: file.bytes.byteLength,
      sha256: sha256Hex(file.bytes),
      contentType: headers.contentType,
      cacheControl: headers.cacheControl,
      action: name === MANIFEST_FILE ? "replace" : "put-if-absent",
      bytes: file.bytes,
    });
  }

  if (problems.length > 0) throw new PlanError(problems);
  return { release: options.release, bucket: options.bucket, objects };
}

/** The plan as a reader sees it: one line per object, with its size and headers. */
export function describePlan(plan: UploadPlan, target: string): string {
  const lines = [
    `Release "${plan.release}" to bucket ${plan.bucket} (${target}): ${plan.objects.length} objects, in this order.`,
  ];
  for (const o of plan.objects) {
    const action = o.action === "replace" ? "replace" : "put if absent";
    lines.push(
      `  ${action.padEnd(13)} ${o.key}  ${o.size} bytes  sha256 ${o.sha256.slice(0, 16)}…`,
      `                Content-Type: ${o.contentType}`,
      `                Cache-Control: ${o.cacheControl}`,
    );
  }
  lines.push("Nothing is ever deleted.");
  return lines.join("\n");
}
