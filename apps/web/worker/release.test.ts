import { describe, expect, it } from "vitest";
import worker from "./index.js";
import { createMemoryBucket } from "./memory-bucket.js";
import { keyForPath, serveRelease } from "./release.js";

const POINTS = "points.f958edcc94e000e4.bin";
const pointsBytes = Uint8Array.from({ length: 502 }, (_, i) => (i * 7 + 3) % 256);
const manifestBytes = new TextEncoder().encode('{"release":"sample-v1"}\n');

function bucket() {
  return createMemoryBucket({
    "sample/manifest.json": manifestBytes,
    [`sample/${POINTS}`]: pointsBytes,
    "sample/empty.0000000000000000.bin": new Uint8Array(0),
  });
}

function get(path: string, headers: Record<string, string> = {}, method = "GET") {
  return new Request(`https://genomecanvas.test${path}`, { method, headers });
}

async function bytesOf(response: Response): Promise<Uint8Array> {
  return new Uint8Array(await response.arrayBuffer());
}

describe("GET a whole release file", () => {
  it("sends every byte with its length, type and entity tag", async () => {
    const response = await serveRelease(get(`/release/sample/${POINTS}`), bucket());
    expect(response.status).toBe(200);
    expect(await bytesOf(response)).toEqual(pointsBytes);
    expect(response.headers.get("content-length")).toBe("502");
    expect(response.headers.get("content-type")).toBe("application/octet-stream");
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(response.headers.get("etag")).toMatch(/^".+"$/);
    expect(response.headers.has("content-range")).toBe(false);
  });

  it("lets a hashed file be cached for a year without checking", async () => {
    const response = await serveRelease(get(`/release/sample/${POINTS}`), bucket());
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
  });

  it("makes every reader check the manifest before using a stored copy", async () => {
    const response = await serveRelease(get("/release/sample/manifest.json"), bucket());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(response.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(await response.text()).toBe('{"release":"sample-v1"}\n');
  });
});

describe("GET a byte range", () => {
  it("sends exactly the first 16 bytes with 206 and Content-Range", async () => {
    const b = bucket();
    const response = await serveRelease(
      get(`/release/sample/${POINTS}`, { Range: "bytes=0-15" }),
      b,
    );
    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 0-15/502");
    expect(response.headers.get("content-length")).toBe("16");
    expect(await bytesOf(response)).toEqual(pointsBytes.slice(0, 16));
    // Only the requested bytes are read from the bucket.
    expect(b.calls).toEqual([`head sample/${POINTS}`, `get sample/${POINTS} 0+16`]);
  });

  it("sends the bytes from the middle of the file", async () => {
    const response = await serveRelease(
      get(`/release/sample/${POINTS}`, { Range: "bytes=100-149" }),
      bucket(),
    );
    expect(response.headers.get("content-range")).toBe("bytes 100-149/502");
    expect(await bytesOf(response)).toEqual(pointsBytes.slice(100, 150));
  });

  it("sends the last bytes for a suffix range, as a Parquet reader asks for its footer", async () => {
    const response = await serveRelease(
      get(`/release/sample/${POINTS}`, { Range: "bytes=-8" }),
      bucket(),
    );
    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 494-501/502");
    expect(await bytesOf(response)).toEqual(pointsBytes.slice(494));
  });

  it("answers 416 with the size when the range starts past the end", async () => {
    const b = bucket();
    const response = await serveRelease(
      get(`/release/sample/${POINTS}`, { Range: "bytes=502-600" }),
      b,
    );
    expect(response.status).toBe(416);
    expect(response.headers.get("content-range")).toBe("bytes */502");
    expect(response.headers.get("accept-ranges")).toBe("bytes");
    expect(await response.text()).toBe("");
    expect(b.calls).toEqual([`head sample/${POINTS}`]);
  });

  it("answers 416 for any range of an empty file", async () => {
    const response = await serveRelease(
      get("/release/sample/empty.0000000000000000.bin", { Range: "bytes=0-0" }),
      bucket(),
    );
    expect(response.status).toBe(416);
    expect(response.headers.get("content-range")).toBe("bytes */0");
  });

  it("sends the whole file when asked for several ranges at once", async () => {
    const response = await serveRelease(
      get(`/release/sample/${POINTS}`, { Range: "bytes=0-1,4-5" }),
      bucket(),
    );
    expect(response.status).toBe(200);
    expect((await bytesOf(response)).byteLength).toBe(502);
  });
});

describe("conditional requests", () => {
  it("answers 304 with no body when the entity tag matches", async () => {
    const first = await serveRelease(get(`/release/sample/${POINTS}`), bucket());
    const etag = first.headers.get("etag") as string;
    const b = bucket();
    const second = await serveRelease(
      get(`/release/sample/${POINTS}`, { "If-None-Match": etag }),
      b,
    );
    expect(second.status).toBe(304);
    expect(second.headers.get("etag")).toBe(etag);
    expect(second.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(await second.text()).toBe("");
    expect(b.calls).toEqual([`head sample/${POINTS}`]);
  });

  it("matches a weak tag, a tag in a list, and *", async () => {
    const etag = (await serveRelease(get(`/release/sample/${POINTS}`), bucket())).headers.get(
      "etag",
    ) as string;
    for (const header of [`W/${etag}`, `"other", ${etag}`, "*"]) {
      const response = await serveRelease(
        get(`/release/sample/${POINTS}`, { "If-None-Match": header }),
        bucket(),
      );
      expect(response.status, header).toBe(304);
    }
  });

  it("sends the file when the entity tag is a different one", async () => {
    const response = await serveRelease(
      get(`/release/sample/${POINTS}`, { "If-None-Match": '"stale"' }),
      bucket(),
    );
    expect(response.status).toBe(200);
  });
});

describe("HEAD", () => {
  it("sends the headers a GET would, and no body, without reading the object", async () => {
    const b = bucket();
    const response = await serveRelease(
      get(`/release/sample/${POINTS}`, { Range: "bytes=0-15" }, "HEAD"),
      b,
    );
    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 0-15/502");
    expect(response.headers.get("content-length")).toBe("16");
    expect(response.body).toBeNull();
    expect(b.calls).toEqual([`head sample/${POINTS}`]);
  });
});

describe("what is refused", () => {
  it.each([
    "/release/sample/../manifest.json",
    "/release/sample/..%2Fmanifest.json",
    "/release/sample/%2e%2e/manifest.json",
    "/release/sample/manifest%2Ejson",
    "/release/%2e%2e/sample/manifest.json",
    "/release/sample/sub/manifest.json",
    "/release/sample/",
    "/release/sample",
    "/release/",
    "/release//manifest.json",
    "/release/Sample/manifest.json",
    "/release/sample/points.bin",
    "/release/sample/manifest.json.bak",
    "/release/sample/.manifest.json",
    "/release/sample/missing.0123456789abcdef.bin",
  ])("answers %s with a JSON 404", async (path) => {
    const b = bucket();
    const response = await serveRelease(get(path), b);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
  });

  it("never asks the bucket about a key that fails validation", async () => {
    const b = bucket();
    await serveRelease(get("/release/sample/..%2F..%2Fsecret.json"), b);
    await serveRelease(get("/release/sample/points.bin"), b);
    expect(b.calls).toEqual([]);
  });

  it("answers other methods with 405 and the methods it allows", async () => {
    const response = await serveRelease(get(`/release/sample/${POINTS}`, {}, "PUT"), bucket());
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, HEAD");
  });
});

describe("keyForPath", () => {
  it("maps the path of a file to its bucket key", () => {
    expect(keyForPath(`/release/sample/${POINTS}`)).toBe(`sample/${POINTS}`);
    expect(keyForPath("/api/health")).toBeNull();
  });
});

describe("the Worker's entry point", () => {
  const env = { RELEASES: bucket() };

  it("sends /release/ paths to the release route", async () => {
    const response = await worker.fetch(get("/release/sample/manifest.json"), env);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-cache");
  });

  it("sends /api/ paths to the API", async () => {
    const response = await worker.fetch(get("/api/health"), env);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});
