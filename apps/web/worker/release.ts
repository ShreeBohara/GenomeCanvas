// Release files, served from R2 under /release/<release>/<file>. Cloudflare's
// static-asset host ignores byte ranges, and the Parquet readers of Phase 2 need
// them, so release data comes through here rather than from the app's assets.
import { releaseFileHeaders, releaseObjectKey } from "@genomecanvas/protocol";
import type { ReleaseBucket } from "./bucket.js";
import { contentRange, parseRange } from "./range.js";

export const RELEASE_PREFIX = "/release/";

function notFound(): Response {
  return Response.json({ error: "not_found" }, { status: 404 });
}

/**
 * The bucket key a request path names, or null. The raw path is split as it
 * arrived, with nothing decoded, so `%2F` or `%2e%2e` can never become a slash
 * or a climb; both parts must then pass the shared naming rule.
 */
export function keyForPath(pathname: string): string | null {
  if (!pathname.startsWith(RELEASE_PREFIX)) return null;
  const parts = pathname.slice(RELEASE_PREFIX.length).split("/");
  if (parts.length !== 2) return null;
  const [release = "", file = ""] = parts;
  return releaseObjectKey(release, file);
}

/** Whether any entity tag listed in an If-None-Match header names this object. */
function matchesIfNoneMatch(header: string | null, etag: string): boolean {
  if (header === null) return false;
  if (header.trim() === "*") return true;
  // Weak comparison (RFC 9110, section 13.1.2): W/ prefixes are ignored.
  const bare = (tag: string) => tag.trim().replace(/^W\//, "");
  const wanted = bare(etag);
  return header.split(",").some((tag) => bare(tag) === wanted);
}

export async function serveRelease(request: Request, bucket: ReleaseBucket): Promise<Response> {
  const url = new URL(request.url);
  const key = keyForPath(url.pathname);
  if (key === null) return notFound();

  if (request.method !== "GET" && request.method !== "HEAD") {
    return Response.json(
      { error: "method_not_allowed" },
      { status: 405, headers: { Allow: "GET, HEAD" } },
    );
  }

  const object = await bucket.head(key);
  if (object === null) return notFound();

  // keyForPath has already accepted the name, so this only narrows the type.
  const fileName = key.slice(key.indexOf("/") + 1);
  const rule = releaseFileHeaders(fileName);
  if (rule === null) return notFound();

  const headers = new Headers({
    "Accept-Ranges": "bytes",
    "Cache-Control": rule.cacheControl,
    "Content-Type": rule.contentType,
    ETag: object.httpEtag,
  });

  if (matchesIfNoneMatch(request.headers.get("If-None-Match"), object.httpEtag)) {
    headers.delete("Content-Type");
    return new Response(null, { status: 304, headers });
  }

  const range = parseRange(request.headers.get("Range"), object.size);
  if (range.kind === "unsatisfiable") {
    headers.set("Content-Range", `bytes */${object.size}`);
    headers.delete("Content-Type");
    return new Response(null, { status: 416, headers });
  }

  const status = range.kind === "range" ? 206 : 200;
  const length = range.kind === "range" ? range.length : object.size;
  headers.set("Content-Length", String(length));
  if (range.kind === "range") {
    headers.set("Content-Range", contentRange(range.offset, range.length, object.size));
  }

  if (request.method === "HEAD") return new Response(null, { status, headers });

  // A second call, after head: R2 needs the size before a range can be checked.
  // Only the manifest is ever replaced, and a reader who races a replacement
  // gets a 200 whose ETag is one version old, which the next request corrects.
  const body = await bucket.get(
    key,
    range.kind === "range" ? { range: { offset: range.offset, length: range.length } } : {},
  );
  // Gone between the two calls: answer as if it had never been there.
  if (body === null) return notFound();
  return new Response(body.body, { status, headers });
}
