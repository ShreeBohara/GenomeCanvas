// Checks a deployed address the way a first visitor would meet it: the API
// answers, and the release manifest comes through the Worker from R2 with the
// right cache header and exactly the bytes that were uploaded.
import { createHash } from "node:crypto";

export type Fetch = (url: string) => Promise<Response>;

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Every problem with the deployment at `baseUrl`, or none. One attempt. */
export async function findProblems(
  baseUrl: string,
  expected: { readonly release: string; readonly manifest: Uint8Array },
  fetchFn: Fetch,
): Promise<string[]> {
  const problems: string[] = [];
  const base = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  try {
    const health = await fetchFn(new URL("api/health", base).href);
    const body = health.ok ? await health.text() : "";
    if (health.status !== 200) problems.push(`/api/health answered ${health.status}`);
    else if (body.trim() !== '{"status":"ok"}')
      problems.push(`/api/health said ${body.slice(0, 200)}`);
  } catch (error) {
    problems.push(`/api/health could not be fetched: ${(error as Error).message}`);
  }

  const path = `release/${expected.release}/manifest.json`;
  try {
    const manifest = await fetchFn(new URL(path, base).href);
    if (manifest.status !== 200) {
      problems.push(`/${path} answered ${manifest.status}`);
    } else {
      const cache = manifest.headers.get("cache-control");
      if (cache !== "no-cache") problems.push(`/${path} has Cache-Control ${String(cache)}`);
      const bytes = new Uint8Array(await manifest.arrayBuffer());
      if (sha256(bytes) !== sha256(expected.manifest)) {
        problems.push(`/${path} is not the manifest that was uploaded`);
      }
    }
  } catch (error) {
    problems.push(`/${path} could not be fetched: ${(error as Error).message}`);
  }
  return problems;
}

/**
 * Tries until the deployment passes or the attempts run out. A new workers.dev
 * address can take some seconds to answer everywhere.
 */
export async function checkDeployment(
  baseUrl: string,
  expected: { readonly release: string; readonly manifest: Uint8Array },
  options: {
    readonly fetchFn: Fetch;
    readonly attempts: number;
    readonly delayMs: number;
    readonly log: (line: string) => void;
  },
): Promise<string[]> {
  let problems: string[] = [];
  for (let attempt = 1; attempt <= options.attempts; attempt++) {
    problems = await findProblems(baseUrl, expected, options.fetchFn);
    if (problems.length === 0) return [];
    options.log(`attempt ${attempt} of ${options.attempts}: ${problems.join("; ")}`);
    if (attempt < options.attempts) await new Promise((r) => setTimeout(r, options.delayMs));
  }
  return problems;
}
