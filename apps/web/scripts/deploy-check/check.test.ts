import { describe, expect, it } from "vitest";
import { checkDeployment, type Fetch, findProblems } from "./check.js";

const manifest = new TextEncoder().encode('{"release":"sample-v1"}\n');
const expected = { release: "sample", manifest };

function site(overrides: Record<string, () => Response> = {}): Fetch & { urls: string[] } {
  const urls: string[] = [];
  const routes: Record<string, () => Response> = {
    "/api/health": () => Response.json({ status: "ok" }),
    "/release/sample/manifest.json": () =>
      new Response(manifest, { headers: { "Cache-Control": "no-cache" } }),
    ...overrides,
  };
  const fn = (async (url: string) => {
    urls.push(url);
    const route = routes[new URL(url).pathname];
    return route === undefined ? new Response("missing", { status: 404 }) : route();
  }) as Fetch & { urls: string[] };
  fn.urls = urls;
  return fn;
}

describe("findProblems", () => {
  it("finds none on a good deployment, and asks the address it was given", async () => {
    const fetchFn = site();
    expect(await findProblems("https://x.workers.dev", expected, fetchFn)).toEqual([]);
    expect(fetchFn.urls).toEqual([
      "https://x.workers.dev/api/health",
      "https://x.workers.dev/release/sample/manifest.json",
    ]);
  });

  it("reports an unhealthy API", async () => {
    const problems = await findProblems(
      "https://x.workers.dev/",
      expected,
      site({ "/api/health": () => new Response("down", { status: 503 }) }),
    );
    expect(problems).toEqual(["/api/health answered 503"]);
  });

  it("reports a manifest served from somewhere that caches it", async () => {
    const problems = await findProblems(
      "https://x.workers.dev/",
      expected,
      site({
        "/release/sample/manifest.json": () =>
          new Response(manifest, { headers: { "Cache-Control": "max-age=600" } }),
      }),
    );
    expect(problems).toEqual(["/release/sample/manifest.json has Cache-Control max-age=600"]);
  });

  it("reports a manifest other than the one uploaded, and a missing one", async () => {
    const other = await findProblems(
      "https://x.workers.dev/",
      expected,
      site({
        "/release/sample/manifest.json": () =>
          new Response("{}", { headers: { "Cache-Control": "no-cache" } }),
      }),
    );
    expect(other).toEqual(["/release/sample/manifest.json is not the manifest that was uploaded"]);
    const missing = await findProblems(
      "https://x.workers.dev/",
      expected,
      site({ "/release/sample/manifest.json": () => new Response("", { status: 404 }) }),
    );
    expect(missing).toEqual(["/release/sample/manifest.json answered 404"]);
  });

  it("reports a network failure as a problem rather than throwing", async () => {
    const problems = await findProblems("https://x.workers.dev/", expected, async () => {
      throw new Error("getaddrinfo ENOTFOUND");
    });
    expect(problems).toHaveLength(2);
    expect(problems[0]).toMatch(/could not be fetched: getaddrinfo ENOTFOUND/);
  });
});

describe("checkDeployment", () => {
  it("tries again until the deployment answers", async () => {
    let calls = 0;
    const good = site();
    const fetchFn: Fetch = async (url) => {
      calls++;
      return calls <= 2 ? new Response("", { status: 404 }) : good(url);
    };
    const log: string[] = [];
    const problems = await checkDeployment("https://x.workers.dev", expected, {
      fetchFn,
      attempts: 3,
      delayMs: 0,
      log: (l) => log.push(l),
    });
    expect(problems).toEqual([]);
    expect(log).toHaveLength(1);
  });

  it("gives up after the last attempt with the problems it saw", async () => {
    const problems = await checkDeployment("https://x.workers.dev", expected, {
      fetchFn: async () => new Response("", { status: 500 }),
      attempts: 2,
      delayMs: 0,
      log: () => {},
    });
    expect(problems).toEqual([
      "/api/health answered 500",
      "/release/sample/manifest.json answered 500",
    ]);
  });
});
