// Uploads a built release folder to the releases bucket of one environment.
//
//   release-upload <folder> --release <name> (--local | --env staging|production) [--apply]
//
// Without --apply it prints its plan and changes nothing. With --apply and
// --env it needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the
// environment. The bucket comes from the RELEASES binding in wrangler.jsonc, so
// the Worker and this command can never disagree about where a release lives.
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { unstable_readConfig } from "wrangler";
import { applyPlan, UploadError } from "./apply.js";
import { describePlan, type LocalFile, PlanError, planUpload } from "./plan.js";
import { createWranglerStore, type Location } from "./wrangler-store.js";

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ENVIRONMENTS = ["staging", "production"] as const;

export interface CliOptions {
  readonly folder: string;
  readonly release: string;
  readonly env: (typeof ENVIRONMENTS)[number] | null;
  readonly apply: boolean;
}

export function parseCli(argv: readonly string[]): CliOptions {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    options: {
      release: { type: "string" },
      env: { type: "string" },
      local: { type: "boolean", default: false },
      apply: { type: "boolean", default: false },
    },
  });
  const usage =
    "usage: release-upload <folder> --release <name> (--local | --env staging|production) [--apply]";
  if (positionals.length !== 1 || values.release === undefined) throw new Error(usage);
  if (values.local === (values.env !== undefined)) {
    throw new Error(`choose exactly one of --local and --env\n${usage}`);
  }
  const env = values.env ?? null;
  if (env !== null && !(ENVIRONMENTS as readonly string[]).includes(env)) {
    throw new Error(`--env must be staging or production, not ${JSON.stringify(env)}`);
  }
  return {
    folder: positionals[0] as string,
    release: values.release,
    env: env as CliOptions["env"],
    apply: values.apply,
  };
}

/** The bucket bound as RELEASES, for one environment or the local top level. */
export function bucketFor(env: string | null): string {
  const config = unstable_readConfig({
    config: join(APP_ROOT, "wrangler.jsonc"),
    ...(env === null ? {} : { env }),
  });
  const buckets: readonly { binding: string; bucket_name?: string }[] = config.r2_buckets;
  const binding = buckets.find((b) => b.binding === "RELEASES");
  if (binding?.bucket_name === undefined) {
    throw new Error(`wrangler.jsonc has no RELEASES bucket for ${env ?? "local development"}`);
  }
  return binding.bucket_name;
}

async function readFolder(folder: string): Promise<LocalFile[]> {
  const files: LocalFile[] = [];
  for (const name of (await readdir(folder)).sort()) {
    const path = join(folder, name);
    if (!(await stat(path)).isFile()) {
      throw new PlanError([`${name} is a folder; a release holds only files`]);
    }
    files.push({ name, bytes: new Uint8Array(await readFile(path)) });
  }
  return files;
}

async function main(argv: readonly string[]): Promise<number> {
  const options = parseCli(argv);
  const bucket = bucketFor(options.env);
  const target = options.env === null ? "wrangler's local state" : `the ${options.env} account`;
  const plan = planUpload(await readFolder(resolve(options.folder)), {
    release: options.release,
    bucket,
  });
  console.log(describePlan(plan, target));

  if (!options.apply) {
    console.log("\nThis was the plan only; nothing was changed. Add --apply to upload.");
    return 0;
  }

  let location: Location;
  if (options.env === null) {
    location = { kind: "local", persistTo: join(APP_ROOT, ".wrangler/state") };
  } else {
    const missing = ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"].filter(
      (name) => (process.env[name] ?? "") === "",
    );
    if (missing.length > 0) {
      console.error(`\n--apply with --env needs ${missing.join(" and ")} in the environment.`);
      return 2;
    }
    location = { kind: "remote" };
  }

  console.log("\nUploading:");
  const store = createWranglerStore({
    wrangler: join(APP_ROOT, "node_modules/.bin/wrangler"),
    bucket,
    location,
    cwd: APP_ROOT,
  });
  const outcomes = await applyPlan(plan, store, (line) => console.log(line));
  const written = [...outcomes.values()].filter((o) => o === "written").length;
  console.log(`Done: ${written} written, ${outcomes.size - written} already there, none deleted.`);
  return 0;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error: unknown) => {
      // Known refusals are sentences for a person; anything else keeps its stack.
      const known =
        error instanceof PlanError || error instanceof UploadError || error instanceof TypeError;
      console.error(known ? (error as Error).message : error);
      process.exitCode = 1;
    },
  );
}
