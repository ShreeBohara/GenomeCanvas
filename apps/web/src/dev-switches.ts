import type { Points } from "@genomecanvas/query";

/**
 * Development-only switches, read from the address bar. A production build
 * ignores them: `import.meta.env.DEV` is false there, so the code below is
 * removed from the bundle.
 *
 *   ?repeat=20429   draw the sample points repeated up to this many instances
 *   ?measure=240    then time this many frames (see Atlas.measure)
 */
export interface DevSearch {
  readonly repeat?: number;
  readonly measure?: number;
}

export const MAX_REPEAT = 1_000_000;

function positiveInteger(value: unknown, max: number): number | undefined {
  const n =
    typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN;
  return Number.isSafeInteger(n) && n > 0 && n <= max ? n : undefined;
}

export function parseDevSearch(search: Record<string, unknown>): DevSearch {
  if (!import.meta.env.DEV) return {};
  const repeat = positiveInteger(search.repeat, MAX_REPEAT);
  const measure = positiveInteger(search.measure, 10_000);
  return {
    ...(repeat !== undefined ? { repeat } : {}),
    ...(measure !== undefined ? { measure } : {}),
  };
}

/**
 * Tile copies of the points side by side until there are `target` of them.
 * Row i of the result is a copy of row i % count, so labels still resolve.
 */
export function repeatPoints(points: Points, target: number): Points {
  const n = points.count;
  if (n === 0 || target <= n) return points;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < n; i++) {
    const px = points.x[i] as number;
    const py = points.y[i] as number;
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
  }
  const stepX = (maxX - minX || 1) * 1.15;
  const stepY = (maxY - minY || 1) * 1.15;
  const columns = Math.ceil(Math.sqrt(Math.ceil(target / n)));

  const x = new Float32Array(target);
  const y = new Float32Array(target);
  const category = new Uint8Array(target);
  for (let i = 0; i < target; i++) {
    const source = i % n;
    const copy = Math.floor(i / n);
    x[i] = (points.x[source] as number) + (copy % columns) * stepX;
    y[i] = (points.y[source] as number) - Math.floor(copy / columns) * stepY;
    category[i] = points.category[source] as number;
  }
  return { count: target, x, y, category };
}
