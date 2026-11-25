import { describe, expect, it } from "vitest";
import { app, HELLO_EVENTS } from "./app.js";

describe("GET /api/health", () => {
  it("answers ok as JSON", async () => {
    const response = await app.request("/api/health");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/^application\/json/);
    expect(await response.json()).toEqual({ status: "ok" });
  });
});

describe("GET /api/hello", () => {
  it("streams three server-sent events in order", async () => {
    const response = await app.request("/api/hello");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(response.headers.get("cache-control")).toBe("no-cache, no-transform");

    const text = await response.text();
    const events = text
      .trim()
      .split("\n\n")
      .map((block) =>
        Object.fromEntries(
          block
            .split("\n")
            .map((line) => [line.slice(0, line.indexOf(":")), line.slice(line.indexOf(":") + 2)]),
        ),
      );
    expect(events.map((e) => e.event)).toEqual(["hello", "hello", "hello"]);
    expect(events.map((e) => e.id)).toEqual(["1", "2", "3"]);
    expect(events.map((e) => JSON.parse(e.data as string))).toEqual(HELLO_EVENTS);
  });

  it("sends each event as it is written, not all at the end", async () => {
    const response = await app.request("/api/hello");
    const reader = (response.body as ReadableStream<Uint8Array>).getReader();
    const first = await reader.read();
    const firstText = new TextDecoder().decode(first.value);
    // A buffered response would hand over all three events in one piece.
    expect(firstText).toContain('"step":1');
    expect(firstText).not.toContain('"step":2');
    await reader.cancel();
  });
});

describe("unknown API paths", () => {
  it("answer 404 as JSON", async () => {
    const response = await app.request("/api/nothing-here");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
  });
});
