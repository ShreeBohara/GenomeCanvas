import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

// The three events /api/hello streams. Plumbing for the Guide (plan Phase 6),
// which will stream its turns the same way; nothing on screen uses it yet.
export const HELLO_EVENTS = [
  { step: 1, of: 3, text: "Hello" },
  { step: 2, of: 3, text: "from the" },
  { step: 3, of: 3, text: "GenomeCanvas Worker" },
] as const;

export const app = new Hono().basePath("/api");

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/hello", (c) => {
  const response = streamSSE(c, async (stream) => {
    for (const event of HELLO_EVENTS) {
      await stream.writeSSE({
        event: "hello",
        id: String(event.step),
        data: JSON.stringify(event),
      });
    }
  });
  // streamSSE sets "no-cache"; no-transform also stops a proxy from compressing,
  // and so buffering, the stream.
  response.headers.set("Cache-Control", "no-cache, no-transform");
  return response;
});

app.notFound((c) => c.json({ error: "not_found" }, 404));
