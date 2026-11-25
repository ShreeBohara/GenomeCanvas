import { app } from "./app.js";
import type { ReleaseBucket } from "./bucket.js";
import { RELEASE_PREFIX, serveRelease } from "./release.js";

/** The bindings wrangler.jsonc declares, in every environment. */
export interface Env {
  readonly RELEASES: ReleaseBucket;
}

// The Workers runtime looks for the handler as the module's default export.
// Only /api/* and /release/* reach it (wrangler.jsonc, run_worker_first);
// everything else is a static file.
export default {
  fetch(request: Request, env: Env): Response | Promise<Response> {
    if (new URL(request.url).pathname.startsWith(RELEASE_PREFIX)) {
      return serveRelease(request, env.RELEASES);
    }
    return app.fetch(request, env);
  },
};
