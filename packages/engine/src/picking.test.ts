import { describe, expect, it } from "vitest";
import { worldToScreen } from "./camera.js";
import { nearestPoint, nearestPointOnScreen } from "./picking.js";

const xs = new Float32Array([0, 10, 10.5, -4]);
const ys = new Float32Array([0, 0, 0.2, 3]);

describe("nearestPoint", () => {
  it("finds the nearest point, not the first one in range", () => {
    expect(nearestPoint(xs, ys, 10.4, 0.1, 5)).toBe(2);
    expect(nearestPoint(xs, ys, 9.9, 0, 5)).toBe(1);
  });

  it("returns -1 when nothing is within reach", () => {
    expect(nearestPoint(xs, ys, 5, 20, 1)).toBe(-1);
  });

  it("breaks ties toward the lower index", () => {
    expect(nearestPoint([1, -1], [0, 0], 0, 0, 5)).toBe(0);
  });

  it("returns -1 for no points", () => {
    expect(nearestPoint([], [], 0, 0, 5)).toBe(-1);
  });
});

describe("nearestPointOnScreen", () => {
  const camera = { cx: 3, cy: 1, zoom: 40 };
  const viewport = { width: 640, height: 480 };

  it("picks the point drawn under the pointer", () => {
    const [sx, sy] = worldToScreen(camera, viewport, -4, 3);
    expect(nearestPointOnScreen(camera, viewport, xs, ys, sx + 3, sy - 2, 8)).toBe(3);
  });

  it("measures reach in screen pixels, so it shrinks in world units as you zoom in", () => {
    const [sx, sy] = worldToScreen(camera, viewport, -4, 3);
    expect(nearestPointOnScreen(camera, viewport, xs, ys, sx + 12, sy, 8)).toBe(-1);
    expect(
      nearestPointOnScreen(
        { ...camera, zoom: 4 },
        viewport,
        xs,
        ys,
        320 + (-4 - 3) * 4 + 12,
        240 - 2 * 4,
        16,
      ),
    ).toBe(3);
  });
});
