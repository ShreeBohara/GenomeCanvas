/** What a key does to the map. Pure, so the key map is tested without a DOM. */
export type MapAction =
  | { readonly kind: "pan"; readonly dx: number; readonly dy: number }
  | { readonly kind: "zoom"; readonly factor: number }
  | { readonly kind: "fit" };

/** A key press moves the map by this share of the viewport; with Shift, by three times as much. */
export const PAN_STEP = 0.1;
export const ZOOM_STEP = 1.25;

export function actionForKey(
  key: string,
  shift: boolean,
  viewport: { readonly width: number; readonly height: number },
): MapAction | null {
  const times = shift ? 3 : 1;
  const across = viewport.width * PAN_STEP * times;
  const down = viewport.height * PAN_STEP * times;
  // An arrow moves the view, so the map moves the opposite way under it.
  switch (key) {
    case "ArrowLeft":
      return { kind: "pan", dx: across, dy: 0 };
    case "ArrowRight":
      return { kind: "pan", dx: -across, dy: 0 };
    case "ArrowUp":
      return { kind: "pan", dx: 0, dy: down };
    case "ArrowDown":
      return { kind: "pan", dx: 0, dy: -down };
    case "+":
    case "=":
      return { kind: "zoom", factor: ZOOM_STEP };
    case "-":
    case "_":
      return { kind: "zoom", factor: 1 / ZOOM_STEP };
    case "0":
    case "Home":
      return { kind: "fit" };
    default:
      return null;
  }
}

/**
 * Speed after `elapsedMs` of glide, given the release speed in pixels per ms.
 * Glide stops within about 400 ms, the longest any motion may run.
 */
export function glideSpeed(releaseSpeed: number, elapsedMs: number): number {
  const remaining = Math.exp(-elapsedMs / 100);
  return remaining < 0.02 ? 0 : releaseSpeed * remaining;
}
