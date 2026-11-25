import type { Atlas } from "./atlas.js";
import { actionForKey, glideSpeed } from "./keys.js";

export interface ControlsOptions {
  /** Read on every release, so a change to the system setting takes effect at once. */
  readonly reducedMotion: () => boolean;
  /** The pointer moved over the map without a button held, in CSS pixels from its top left. */
  readonly onHover?: (sx: number, sy: number) => void;
  readonly onLeave?: () => void;
}

interface Tracked {
  x: number;
  y: number;
}

/**
 * Drag to pan, wheel or pinch to zoom toward the pointer, arrows and plus and
 * minus from the keyboard, and 0 to show everything. Returns a function that
 * removes every listener.
 */
export function attachControls(
  element: HTMLElement,
  atlas: Atlas,
  options: ControlsOptions,
): () => void {
  const pointers = new Map<number, Tracked>();
  let velocity = { x: 0, y: 0, t: 0 };
  let glide = 0;

  const local = (event: { clientX: number; clientY: number }) => {
    const rect = element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const stopGlide = () => {
    if (glide !== 0) cancelAnimationFrame(glide);
    glide = 0;
  };

  const startGlide = () => {
    const speed = Math.hypot(velocity.x, velocity.y);
    if (options.reducedMotion() || speed < 0.05 || performance.now() - velocity.t > 60) return;
    const direction = { x: velocity.x / speed, y: velocity.y / speed };
    const started = performance.now();
    let previous = started;
    const step = (now: number) => {
      const current = glideSpeed(speed, now - started);
      if (current === 0) {
        glide = 0;
        return;
      }
      const dt = now - previous;
      previous = now;
      atlas.panBy(direction.x * current * dt, direction.y * current * dt);
      glide = requestAnimationFrame(step);
    };
    glide = requestAnimationFrame(step);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;
    stopGlide();
    element.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, local(event));
    velocity = { x: 0, y: 0, t: performance.now() };
  };

  const onPointerMove = (event: PointerEvent) => {
    const at = local(event);
    const tracked = pointers.get(event.pointerId);
    if (tracked === undefined) {
      if (pointers.size === 0) options.onHover?.(at.x, at.y);
      return;
    }
    if (pointers.size === 1) {
      const dx = at.x - tracked.x;
      const dy = at.y - tracked.y;
      const now = performance.now();
      const dt = Math.max(1, now - velocity.t);
      velocity = { x: dx / dt, y: dy / dt, t: now };
      atlas.panBy(dx, dy);
    } else if (pointers.size === 2) {
      const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)?.[1];
      if (other !== undefined) {
        const before = Math.hypot(tracked.x - other.x, tracked.y - other.y);
        const after = Math.hypot(at.x - other.x, at.y - other.y);
        if (before > 0) atlas.zoomBy(after / before, (at.x + other.x) / 2, (at.y + other.y) / 2);
      }
    }
    tracked.x = at.x;
    tracked.y = at.y;
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!pointers.delete(event.pointerId)) return;
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    if (pointers.size === 0) startGlide();
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    stopGlide();
    const at = local(event);
    // Lines and pages are turned into pixels so every wheel zooms at a similar rate.
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 400 : 1;
    atlas.zoomBy(Math.exp(-event.deltaY * scale * 0.0015), at.x, at.y);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const action = actionForKey(event.key, event.shiftKey, atlas.viewport());
    if (action === null) return;
    event.preventDefault();
    stopGlide();
    if (action.kind === "pan") atlas.panBy(action.dx, action.dy);
    else if (action.kind === "zoom") atlas.zoomBy(action.factor);
    else atlas.fit();
  };

  const onPointerLeave = () => {
    if (pointers.size === 0) options.onLeave?.();
  };

  element.addEventListener("pointerdown", onPointerDown);
  element.addEventListener("pointermove", onPointerMove);
  element.addEventListener("pointerup", onPointerUp);
  element.addEventListener("pointercancel", onPointerUp);
  element.addEventListener("pointerleave", onPointerLeave);
  element.addEventListener("wheel", onWheel, { passive: false });
  element.addEventListener("keydown", onKeyDown);

  return () => {
    stopGlide();
    element.removeEventListener("pointerdown", onPointerDown);
    element.removeEventListener("pointermove", onPointerMove);
    element.removeEventListener("pointerup", onPointerUp);
    element.removeEventListener("pointercancel", onPointerUp);
    element.removeEventListener("pointerleave", onPointerLeave);
    element.removeEventListener("wheel", onWheel);
    element.removeEventListener("keydown", onKeyDown);
  };
}
