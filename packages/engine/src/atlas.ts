import {
  BufferAttribute,
  Camera as ThreeCamera,
  GLSL3,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  RawShaderMaterial,
  Scene,
  WebGLRenderer,
} from "three";
import {
  boundsOf,
  type Camera,
  fitBounds,
  panByPixels,
  type Viewport,
  worldToScreen,
  type ZoomLimits,
  zoomAt,
} from "./camera.js";
import { parseHexColour } from "./colour.js";
import { type GlCounter, instrumentDrawCalls } from "./gl-counter.js";
import { nearestPointOnScreen } from "./picking.js";

export interface AtlasPoints {
  readonly x: Float32Array;
  readonly y: Float32Array;
  /** An index into the palette, per point. */
  readonly category: Uint8Array;
}

export interface AtlasStyle {
  /** One "#rrggbb" per category. */
  readonly palette: readonly string[];
  /** Drawn around every point, so points stay distinct from the surface and each other. */
  readonly outline: string;
  /** The ring around the highlighted point. */
  readonly highlight: string;
}

export interface Counters {
  /** Instances submitted to the GPU in the last frame, counted at the context. */
  readonly instances: number;
  /** Draw calls in the last frame, as three.js's renderer counts them. */
  readonly drawCalls: number;
  readonly triangles: number;
  readonly frames: number;
}

export interface FrameInfo {
  readonly counters: Counters;
  readonly camera: Camera;
}

export interface AtlasOptions {
  /** Called after every frame is drawn. */
  readonly onFrame?: (frame: FrameInfo) => void;
}

export interface FrameMeasurement {
  readonly frames: number;
  /** Median time between animation frames: what a viewer experiences. */
  readonly medianFrameMs: number;
  /** Median time to draw one frame and wait for the GPU to finish it. */
  readonly medianRenderMs: number;
  readonly counters: Counters;
}

export interface Atlas {
  setPoints(points: AtlasPoints): void;
  setStyle(style: AtlasStyle): void;
  /** Highlight one point, or none with -1. */
  setHighlight(index: number): void;
  /** Size in CSS pixels, and the device pixel ratio. */
  resize(width: number, height: number, pixelRatio: number): void;
  /** The point within `maxPixels` of a screen position, or -1. */
  pick(sx: number, sy: number, maxPixels?: number): number;
  /** Where a point is drawn, in CSS pixels from the canvas's top left. */
  project(index: number): { x: number; y: number } | null;
  camera(): Camera;
  viewport(): Viewport;
  setCamera(camera: Camera): void;
  panBy(dx: number, dy: number): void;
  /** Zoom by a factor about a screen position, the centre by default. */
  zoomBy(factor: number, sx?: number, sy?: number): void;
  /** Show every point. */
  fit(): void;
  counters(): Counters;
  /** Draw `frames` frames back to back and time them. For measurement only. */
  measure(frames: number): Promise<FrameMeasurement>;
  dispose(): void;
}

/** Thrown when the browser cannot give a WebGL 2 context. */
export class AtlasUnavailableError extends Error {
  override readonly name = "AtlasUnavailableError";
}

const MAX_PALETTE = 16;
const POINT_RADIUS = 5;
const FIT_PADDING = 48;

const VERTEX_SHADER = /* glsl */ `
precision highp float;
precision highp int;

in vec3 position;
in float aX;
in float aY;
in float aCategory;

uniform vec2 uCenter;
uniform float uZoom;
uniform vec2 uViewport;
uniform float uRadius;
uniform int uHighlight;
uniform vec3 uPalette[${MAX_PALETTE}];

out vec2 vCorner;
out vec3 vColour;
out float vHighlight;
out float vRadius;

void main() {
  bool highlighted = gl_InstanceID == uHighlight;
  float radius = highlighted ? uRadius * 1.8 : uRadius;
  vec2 fromCentre = (vec2(aX, aY) - uCenter) * uZoom + position.xy * radius;
  // The highlighted point sits nearer the viewer, so it is drawn over its neighbours.
  gl_Position = vec4(fromCentre / (uViewport * 0.5), highlighted ? -0.5 : 0.0, 1.0);
  vCorner = position.xy;
  vColour = uPalette[int(aCategory)];
  vHighlight = highlighted ? 1.0 : 0.0;
  vRadius = radius;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;

in vec2 vCorner;
in vec3 vColour;
in float vHighlight;
in float vRadius;

uniform vec3 uOutline;
uniform vec3 uRing;

out vec4 outColour;

void main() {
  float d = length(vCorner) * vRadius;
  if (d > vRadius) discard;
  float edge = vHighlight > 0.5 ? 3.0 : 1.25;
  vec3 rim = vHighlight > 0.5 ? uRing : uOutline;
  vec3 colour = mix(vColour, rim, smoothstep(vRadius - edge - 0.75, vRadius - edge, d));
  float alpha = 1.0 - smoothstep(vRadius - 1.0, vRadius, d);
  outColour = vec4(colour, alpha);
}
`;

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length === 0) return Number.NaN;
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
}

function colourOrThrow(value: string): [number, number, number] {
  const rgb = parseHexColour(value);
  if (rgb === null) throw new Error(`not a "#rrggbb" colour: ${JSON.stringify(value)}`);
  return rgb;
}

export function createAtlas(canvas: HTMLCanvasElement, options: AtlasOptions = {}): Atlas {
  const context = canvas.getContext("webgl2", { antialias: true, alpha: true });
  if (context === null) throw new AtlasUnavailableError("WebGL 2 is not available");

  const renderer = new WebGLRenderer({ canvas, context, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  const glCounter: GlCounter = instrumentDrawCalls(context);

  const scene = new Scene();
  // Positions are computed in the vertex shader, so three.js's camera is a formality.
  const threeCamera = new ThreeCamera();

  const geometry = new InstancedBufferGeometry();
  geometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3),
  );
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.instanceCount = 0;

  const palette = new Float32Array(MAX_PALETTE * 3);
  const uniforms = {
    uCenter: { value: [0, 0] },
    uZoom: { value: 1 },
    uViewport: { value: [1, 1] },
    uRadius: { value: POINT_RADIUS },
    uHighlight: { value: -1 },
    uPalette: { value: palette },
    uOutline: { value: [0, 0, 0] },
    uRing: { value: [1, 1, 1] },
  };
  const material = new RawShaderMaterial({
    glslVersion: GLSL3,
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    uniforms,
    transparent: true,
    depthTest: true,
    depthWrite: true,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  scene.add(mesh);

  let points: AtlasPoints = {
    x: new Float32Array(),
    y: new Float32Array(),
    category: new Uint8Array(),
  };
  let viewport: Viewport = { width: 1, height: 1 };
  let camera: Camera = { cx: 0, cy: 0, zoom: 1 };
  let limits: ZoomLimits = { min: 1e-6, max: 1e6 };
  let frames = 0;
  let last: Counters = { instances: 0, drawCalls: 0, triangles: 0, frames: 0 };
  let pending = 0;
  let disposed = false;
  // Until the reader moves the map, a resize fits everything again, so a canvas
  // measured before its styles arrived still ends up showing every point.
  let moved = false;

  function render(): void {
    uniforms.uCenter.value = [camera.cx, camera.cy];
    uniforms.uZoom.value = camera.zoom;
    uniforms.uViewport.value = [viewport.width, viewport.height];
    glCounter.reset();
    renderer.render(scene, threeCamera);
    frames += 1;
    last = {
      instances: glCounter.tally.instances,
      drawCalls: renderer.info.render.calls,
      triangles: renderer.info.render.triangles,
      frames,
    };
    options.onFrame?.({ counters: last, camera });
  }

  function requestRender(): void {
    if (pending !== 0 || disposed) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      if (!disposed) render();
    });
  }

  function place(next: Camera): void {
    camera = { ...next, zoom: Math.min(limits.max, Math.max(limits.min, next.zoom)) };
    requestRender();
  }

  function fitAll(): void {
    const bounds = boundsOf(points.x, points.y);
    if (bounds) place(fitBounds(bounds, viewport, FIT_PADDING));
  }

  function updateLimits(): void {
    const bounds = boundsOf(points.x, points.y);
    const fitted = bounds ? fitBounds(bounds, viewport, FIT_PADDING) : camera;
    limits = { min: fitted.zoom / 8, max: fitted.zoom * 64 };
  }

  const atlas: Atlas = {
    setPoints(next) {
      if (next.x.length !== next.y.length || next.x.length !== next.category.length) {
        throw new Error("x, y and category must have one entry per point");
      }
      points = next;
      geometry.setAttribute("aX", new InstancedBufferAttribute(next.x, 1));
      geometry.setAttribute("aY", new InstancedBufferAttribute(next.y, 1));
      geometry.setAttribute("aCategory", new InstancedBufferAttribute(next.category, 1));
      geometry.instanceCount = next.x.length;
      updateLimits();
      atlas.fit();
    },
    setStyle(style) {
      if (style.palette.length > MAX_PALETTE) throw new Error(`at most ${MAX_PALETTE} categories`);
      palette.fill(0);
      for (const [i, c] of style.palette.entries()) palette.set(colourOrThrow(c), i * 3);
      uniforms.uOutline.value = colourOrThrow(style.outline);
      uniforms.uRing.value = colourOrThrow(style.highlight);
      requestRender();
    },
    setHighlight(index) {
      if (uniforms.uHighlight.value === index) return;
      uniforms.uHighlight.value = index;
      requestRender();
    },
    resize(width, height, pixelRatio) {
      viewport = { width: Math.max(1, width), height: Math.max(1, height) };
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewport.width, viewport.height, false);
      updateLimits();
      if (moved) requestRender();
      else fitAll();
    },
    pick(sx, sy, maxPixels = POINT_RADIUS * 3) {
      return nearestPointOnScreen(camera, viewport, points.x, points.y, sx, sy, maxPixels);
    },
    project(index) {
      if (index < 0 || index >= points.x.length) return null;
      const [x, y] = worldToScreen(
        camera,
        viewport,
        points.x[index] as number,
        points.y[index] as number,
      );
      return { x, y };
    },
    camera: () => camera,
    viewport: () => viewport,
    setCamera(next) {
      moved = true;
      place(next);
    },
    panBy(dx, dy) {
      atlas.setCamera(panByPixels(camera, dx, dy));
    },
    zoomBy(factor, sx = viewport.width / 2, sy = viewport.height / 2) {
      atlas.setCamera(zoomAt(camera, viewport, factor, sx, sy, limits));
    },
    fit() {
      moved = false;
      fitAll();
    },
    counters: () => last,
    async measure(count) {
      const gl = context;
      const pixel = new Uint8Array(4);
      const frameTimes: number[] = [];
      const renderTimes: number[] = [];
      let previous = -1;
      await new Promise<void>((resolve) => {
        const step = (now: number) => {
          if (disposed) return resolve();
          if (previous >= 0) frameTimes.push(now - previous);
          previous = now;
          const start = performance.now();
          render();
          // Reading one pixel back waits until the GPU has finished the frame.
          gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
          renderTimes.push(performance.now() - start);
          if (renderTimes.length >= count) resolve();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
      return {
        frames: renderTimes.length,
        medianFrameMs: median(frameTimes),
        medianRenderMs: median(renderTimes),
        counters: last,
      };
    },
    dispose() {
      disposed = true;
      if (pending !== 0) cancelAnimationFrame(pending);
      glCounter.restore();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
  return atlas;
}
