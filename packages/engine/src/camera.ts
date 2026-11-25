// The flat map's camera, as plain values and pure functions so it can be tested
// without a GPU. World y points up; screen y points down, as in the DOM.

export interface Camera {
  /** The world position at the centre of the viewport. */
  readonly cx: number;
  readonly cy: number;
  /** CSS pixels per world unit. */
  readonly zoom: number;
}

export interface Viewport {
  /** In CSS pixels. */
  readonly width: number;
  readonly height: number;
}

export interface Bounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface ZoomLimits {
  readonly min: number;
  readonly max: number;
}

export function worldToScreen(
  camera: Camera,
  viewport: Viewport,
  wx: number,
  wy: number,
): [number, number] {
  return [
    (wx - camera.cx) * camera.zoom + viewport.width / 2,
    viewport.height / 2 - (wy - camera.cy) * camera.zoom,
  ];
}

export function screenToWorld(
  camera: Camera,
  viewport: Viewport,
  sx: number,
  sy: number,
): [number, number] {
  return [
    camera.cx + (sx - viewport.width / 2) / camera.zoom,
    camera.cy - (sy - viewport.height / 2) / camera.zoom,
  ];
}

/** Move the map with the pointer: content follows a drag of (dx, dy) screen pixels. */
export function panByPixels(camera: Camera, dx: number, dy: number): Camera {
  return { cx: camera.cx - dx / camera.zoom, cy: camera.cy + dy / camera.zoom, zoom: camera.zoom };
}

export function clampZoom(zoom: number, limits: ZoomLimits): number {
  return Math.min(limits.max, Math.max(limits.min, zoom));
}

/** Zoom by `factor` while the world point under (sx, sy) stays under it. */
export function zoomAt(
  camera: Camera,
  viewport: Viewport,
  factor: number,
  sx: number,
  sy: number,
  limits: ZoomLimits,
): Camera {
  const zoom = clampZoom(camera.zoom * factor, limits);
  const [wx, wy] = screenToWorld(camera, viewport, sx, sy);
  return {
    cx: wx - (sx - viewport.width / 2) / zoom,
    cy: wy + (sy - viewport.height / 2) / zoom,
    zoom,
  };
}

export function boundsOf(xs: ArrayLike<number>, ys: ArrayLike<number>): Bounds | null {
  if (xs.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < xs.length; i++) {
    const x = xs[i] as number;
    const y = ys[i] as number;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

/** The camera that shows all of `bounds` with `padding` CSS pixels to spare on every side. */
export function fitBounds(bounds: Bounds, viewport: Viewport, padding: number): Camera {
  const usableW = Math.max(1, viewport.width - 2 * padding);
  const usableH = Math.max(1, viewport.height - 2 * padding);
  // A single point, or points on one line, still need a finite zoom.
  const spanX = Math.max(bounds.maxX - bounds.minX, 1e-6);
  const spanY = Math.max(bounds.maxY - bounds.minY, 1e-6);
  return {
    cx: (bounds.minX + bounds.maxX) / 2,
    cy: (bounds.minY + bounds.maxY) / 2,
    zoom: Math.min(usableW / spanX, usableH / spanY),
  };
}
