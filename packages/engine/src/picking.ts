import { type Camera, screenToWorld, type Viewport } from "./camera.js";

/**
 * The index of the point nearest to (wx, wy) within `maxDistance` world units,
 * or -1. A brute-force scan: at 20,429 points it takes well under a millisecond.
 * Ties go to the lower index, so the answer is deterministic.
 */
export function nearestPoint(
  xs: ArrayLike<number>,
  ys: ArrayLike<number>,
  wx: number,
  wy: number,
  maxDistance: number,
): number {
  let best = -1;
  let bestSquared = maxDistance * maxDistance;
  for (let i = 0; i < xs.length; i++) {
    const dx = (xs[i] as number) - wx;
    const dy = (ys[i] as number) - wy;
    const squared = dx * dx + dy * dy;
    if (squared < bestSquared || (squared === bestSquared && best === -1)) {
      best = i;
      bestSquared = squared;
    }
  }
  return best;
}

/** The point nearest a screen position, within `maxPixels` CSS pixels. */
export function nearestPointOnScreen(
  camera: Camera,
  viewport: Viewport,
  xs: ArrayLike<number>,
  ys: ArrayLike<number>,
  sx: number,
  sy: number,
  maxPixels: number,
): number {
  const [wx, wy] = screenToWorld(camera, viewport, sx, sy);
  return nearestPoint(xs, ys, wx, wy, maxPixels / camera.zoom);
}
