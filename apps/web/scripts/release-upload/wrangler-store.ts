// An ObjectStore that goes through wrangler's `r2 object` commands, locally
// (wrangler's own state folder, what `vite dev` and `vite preview` read) or in
// the Cloudflare account named by CLOUDFLARE_ACCOUNT_ID with
// CLOUDFLARE_API_TOKEN. wrangler has no command that only asks whether an
// object exists, so read() downloads it; releases are small until Phase 2,
// which can move to R2's S3 interface if that starts to cost time.
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { ObjectStore } from "./apply.js";
import type { PlannedObject } from "./plan.js";

const run = promisify(execFile);

export type Location =
  | { readonly kind: "local"; readonly persistTo: string }
  | { readonly kind: "remote" };

function locationArgs(location: Location): string[] {
  return location.kind === "local" ? ["--local", "--persist-to", location.persistTo] : ["--remote"];
}

export function putArgs(
  bucket: string,
  object: PlannedObject,
  file: string,
  location: Location,
): string[] {
  return [
    "r2",
    "object",
    "put",
    `${bucket}/${object.key}`,
    "--file",
    file,
    "--content-type",
    object.contentType,
    "--cache-control",
    object.cacheControl,
    ...locationArgs(location),
  ];
}

export function getArgs(bucket: string, key: string, file: string, location: Location): string[] {
  return ["r2", "object", "get", `${bucket}/${key}`, "--file", file, ...locationArgs(location)];
}

/** wrangler's words when the key is absent, as opposed to any other failure. */
export function isMissingObjectError(output: string): boolean {
  return /key does not exist|NoSuchKey|object not found/i.test(output);
}

export function createWranglerStore(options: {
  readonly wrangler: string;
  readonly bucket: string;
  readonly location: Location;
  readonly cwd: string;
}): ObjectStore {
  const { wrangler, bucket, location, cwd } = options;
  const wranglerRun = (args: string[]) =>
    run(wrangler, args, {
      cwd,
      env: { ...process.env, WRANGLER_SEND_METRICS: "false" },
      maxBuffer: 16 * 1024 * 1024,
    });

  return {
    async read(key) {
      const folder = await mkdtemp(join(tmpdir(), "genomecanvas-r2-"));
      const file = join(folder, "object");
      try {
        await wranglerRun(getArgs(bucket, key, file, location));
        return new Uint8Array(await readFile(file));
      } catch (error) {
        const e = error as { stdout?: string; stderr?: string; message: string };
        const output = `${e.stdout ?? ""}\n${e.stderr ?? ""}\n${e.message}`;
        if (isMissingObjectError(output)) return null;
        throw error;
      } finally {
        await rm(folder, { recursive: true, force: true });
      }
    },
    async write(object: PlannedObject) {
      const folder = await mkdtemp(join(tmpdir(), "genomecanvas-r2-"));
      const file = join(folder, "object");
      try {
        await writeFile(file, object.bytes);
        await wranglerRun(putArgs(bucket, object, file, location));
      } finally {
        await rm(folder, { recursive: true, force: true });
      }
    },
  };
}
