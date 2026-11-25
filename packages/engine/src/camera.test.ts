import { describe, expect, it } from "vitest";
import {
  boundsOf,
  type Camera,
  fitBounds,
  panByPixels,
  screenToWorld,
  type Viewport,
  worldToScreen,
  zoomAt,
} from "./camera.js";

const viewport: Viewport = { width: 800, height: 600 };
const camera: Camera = { cx: 2, cy: -1, zoom: 50 };
const limits = { min: 1, max: 1000 };

describe("camera transforms", () => {
  it("puts the camera centre at the middle of the viewport", () => {
    expect(worldToScreen(camera, viewport, 2, -1)).toEqual([400, 300]);
  });

  it("points world y up and screen y down", () => {
    const [sx, sy] = worldToScreen(camera, viewport, 3, 0);
    expect(sx).toBe(450);
    expect(sy).toBe(250);
  });

  it("inverts exactly", () => {
    for (const [wx, wy] of [
      [0, 0],
      [-7.25, 3.5],
      [12, -9],
    ] as const) {
      const [sx, sy] = worldToScreen(camera, viewport, wx, wy);
      const [bx, by] = screenToWorld(camera, viewport, sx, sy);
      expect(bx).toBeCloseTo(wx, 10);
      expect(by).toBeCloseTo(wy, 10);
    }
  });

  it("makes content follow a drag", () => {
    const before = worldToScreen(camera, viewport, 5, 5);
    const moved = panByPixels(camera, 30, -20);
    const after = worldToScreen(moved, viewport, 5, 5);
    expect(after[0] - before[0]).toBeCloseTo(30, 10);
    expect(after[1] - before[1]).toBeCloseTo(-20, 10);
  });

  it("keeps the point under the cursor fixed while zooming", () => {
    const cursor = [610, 140] as const;
    const before = screenToWorld(camera, viewport, ...cursor);
    const zoomed = zoomAt(camera, viewport, 1.7, ...cursor, limits);
    expect(zoomed.zoom).toBeCloseTo(85, 10);
    const after = screenToWorld(zoomed, viewport, ...cursor);
    expect(after[0]).toBeCloseTo(before[0], 10);
    expect(after[1]).toBeCloseTo(before[1], 10);
  });

  it("stops zooming at the limits", () => {
    expect(zoomAt(camera, viewport, 1e9, 0, 0, limits).zoom).toBe(1000);
    expect(zoomAt(camera, viewport, 1e-9, 0, 0, limits).zoom).toBe(1);
  });
});

describe("fitting", () => {
  it("finds the bounds of a set of points", () => {
    expect(boundsOf([1, -3, 2], [0, 5, -4])).toEqual({ minX: -3, minY: -4, maxX: 2, maxY: 5 });
    expect(boundsOf([], [])).toBeNull();
  });

  it("shows every point inside the padding", () => {
    const xs = [-9.7, 9.1, 0];
    const ys = [-11.8, 11.5, 2];
    const bounds = boundsOf(xs, ys);
    if (bounds === null) throw new Error("no bounds");
    const fitted = fitBounds(bounds, viewport, 40);
    for (let i = 0; i < xs.length; i++) {
      const [sx, sy] = worldToScreen(fitted, viewport, xs[i] as number, ys[i] as number);
      expect(sx).toBeGreaterThanOrEqual(40 - 1e-9);
      expect(sx).toBeLessThanOrEqual(760 + 1e-9);
      expect(sy).toBeGreaterThanOrEqual(40 - 1e-9);
      expect(sy).toBeLessThanOrEqual(560 + 1e-9);
    }
    // The taller extent is the one that fills the space.
    expect(fitted.zoom).toBeCloseTo(520 / 23.3, 10);
  });

  it("gives a single point a finite zoom", () => {
    const fitted = fitBounds({ minX: 1, minY: 1, maxX: 1, maxY: 1 }, viewport, 10);
    expect(Number.isFinite(fitted.zoom)).toBe(true);
    expect(fitted.cx).toBe(1);
  });
});
