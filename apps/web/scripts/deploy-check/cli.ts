// deploy-check <base-url> --release <name> --manifest <path>
//
// Run by the deploy and preview workflows after wrangler finishes. Exits 1,
// naming every problem, if the deployment is not right after several tries.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { checkDeployment } from "./check.js";

async function main(argv: readonly string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: [...argv],
    allowPositionals: true,
    options: { release: { type: "string" }, manifest: { type: "string" } },
  });
  const [baseUrl] = positionals;
  if (baseUrl === undefined || values.release === undefined || values.manifest === undefined) {
    console.error("usage: deploy-check <base-url> --release <name> --manifest <path>");
    return 2;
  }
  const manifest = new Uint8Array(await readFile(resolve(values.manifest)));
  const problems = await checkDeployment(
    baseUrl,
    { release: values.release, manifest },
    { fetchFn: (url) => fetch(url), attempts: 10, delayMs: 6_000, log: (l) => console.log(l) },
  );
  if (problems.length > 0) {
    for (const p of problems) console.error(`FAIL: ${p}`);
    return 1;
  }
  console.log(`${baseUrl}: /api/health is ok and the ${values.release} manifest matches.`);
  return 0;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    },
  );
}
