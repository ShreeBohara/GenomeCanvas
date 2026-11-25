import type { Atlas, FrameInfo } from "@genomecanvas/engine";
import type { Points, Release } from "@genomecanvas/query";
import { categoryToken, readMapColours } from "@genomecanvas/ui";
import { useSearch } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { repeatPoints } from "./dev-switches.js";
import type { Problem } from "./messages.js";

interface AtlasViewProps {
  readonly release: Release;
  readonly onProblem: (problem: Problem) => void;
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const DARK = "(prefers-color-scheme: dark)";

// Started as soon as this module loads, so the engine chunk downloads while the
// release is still arriving.
const enginePromise = import("@genomecanvas/engine");

/** Writes what the renderer drew onto the canvas, where tests and tools can read it. */
function recordFrame(canvas: HTMLCanvasElement, frame: FrameInfo): void {
  const { counters, camera } = frame;
  canvas.dataset.instances = String(counters.instances);
  canvas.dataset.drawCalls = String(counters.drawCalls);
  canvas.dataset.triangles = String(counters.triangles);
  canvas.dataset.camera = `${camera.cx},${camera.cy},${camera.zoom}`;
}

export function AtlasView({ release, onProblem }: AtlasViewProps) {
  const search = useSearch({ from: "/" });
  const surfaceRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const atlasRef = useRef<Atlas | null>(null);
  const activeRef = useRef(-1);
  const keyboardRef = useRef(false);

  const [hovered, setHovered] = useState(-1);
  const [centred, setCentred] = useState(-1);
  const [keyboard, setKeyboard] = useState(false);

  const points: Points = useMemo(
    () =>
      import.meta.env.DEV && search.repeat !== undefined
        ? repeatPoints(release.points, search.repeat)
        : release.points,
    [release, search.repeat],
  );
  const proteinAt = useCallback(
    (index: number) => (index < 0 ? undefined : release.proteins[index % release.proteins.length]),
    [release],
  );

  const active = hovered >= 0 ? hovered : keyboard ? centred : -1;
  activeRef.current = active;
  keyboardRef.current = keyboard;

  const placeLabel = useCallback(() => {
    const label = labelRef.current;
    const atlas = atlasRef.current;
    if (label === null || atlas === null) return;
    const at = atlas.project(activeRef.current);
    if (at === null) return;
    const { width } = atlas.viewport();
    // Keep the label on screen: flip it to the left of the point near the right edge.
    const flip = at.x > width - 260;
    label.style.transform = `translate(${Math.round(at.x + (flip ? -14 : 14))}px, ${Math.round(at.y - 14)}px) translateX(${flip ? "-100%" : "0"})`;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const surface = surfaceRef.current;
    if (canvas === null || surface === null) return;
    let disposed = false;
    const cleanups: (() => void)[] = [];

    enginePromise.then(
      (engine) => {
        if (disposed) return;
        let atlas: Atlas;
        try {
          atlas = engine.createAtlas(canvas, {
            onFrame: (frame) => {
              recordFrame(canvas, frame);
              if (keyboardRef.current) {
                const { width, height } = atlas.viewport();
                setCentred(atlas.pick(width / 2, height / 2, Math.max(width, height)));
              }
              placeLabel();
            },
          });
        } catch (error) {
          if (error instanceof engine.AtlasUnavailableError) onProblem("cannot_draw");
          else throw error;
          return;
        }
        atlasRef.current = atlas;
        cleanups.push(() => {
          atlasRef.current = null;
          atlas.dispose();
        });

        const applyColours = () =>
          atlas.setStyle(
            readMapColours(document.documentElement, release.manifest.categories.length),
          );
        applyColours();
        const dark = window.matchMedia(DARK);
        dark.addEventListener("change", applyColours);
        cleanups.push(() => dark.removeEventListener("change", applyColours));

        const resize = () => {
          const rect = canvas.getBoundingClientRect();
          atlas.resize(rect.width, rect.height, window.devicePixelRatio || 1);
        };
        resize();
        atlas.setPoints(points);
        const observer = new ResizeObserver(resize);
        observer.observe(canvas);
        cleanups.push(() => observer.disconnect());

        const reducedMotion = window.matchMedia(REDUCED_MOTION);
        cleanups.push(
          engine.attachControls(surface, atlas, {
            reducedMotion: () => reducedMotion.matches,
            onHover: (sx, sy) => setHovered(atlas.pick(sx, sy)),
            onLeave: () => setHovered(-1),
          }),
        );

        if (import.meta.env.DEV && search.measure !== undefined) {
          atlas.measure(search.measure).then((result) => {
            const report = { instances: points.count, ...result };
            document.documentElement.dataset.measurement = JSON.stringify(report);
            console.info("GenomeCanvas frame measurement", report);
          });
        }
      },
      (error: unknown) => {
        console.error("The map's renderer could not be loaded:", error);
        if (!disposed) onProblem("unreachable");
      },
    );

    return () => {
      disposed = true;
      for (const cleanup of cleanups.reverse()) cleanup();
    };
  }, [points, release, onProblem, placeLabel, search.measure]);

  useEffect(() => {
    atlasRef.current?.setHighlight(active);
    placeLabel();
  }, [active, placeLabel]);

  const protein = proteinAt(active);
  const categories = release.manifest.categories;
  const focusedProtein = keyboard ? proteinAt(centred) : undefined;

  return (
    <>
      {/* The focusable, labelled map; the canvas inside it is only pixels. */}
      <div
        ref={surfaceRef}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: an application region takes keyboard input by design; the arrow keys move the map
        tabIndex={0}
        role="application"
        aria-roledescription="map"
        aria-label={`Map of ${release.manifest.rowCount} proteins, coloured by function`}
        aria-describedby="atlas-keys"
        className="absolute inset-0 touch-none outline-none focus-visible:outline-2 focus-visible:outline-focus focus-visible:-outline-offset-4"
        onFocus={(event) => setKeyboard(event.currentTarget.matches(":focus-visible"))}
        onBlur={() => setKeyboard(false)}
      >
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
      <p id="atlas-keys" className="sr-only">
        Arrow keys move the map, plus and minus zoom, and zero shows every protein. The protein
        nearest the centre is read out.
      </p>
      <p aria-live="polite" className="sr-only">
        {focusedProtein
          ? `${focusedProtein.geneSymbol}, ${focusedProtein.name}, ${categories[focusedProtein.category]?.label ?? ""}`
          : ""}
      </p>

      {keyboard ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-focus"
        />
      ) : null}

      <div
        ref={labelRef}
        data-testid="protein-label"
        hidden={protein === undefined}
        className="pointer-events-none absolute top-0 left-0 z-20 max-w-60 rounded-sm border border-line bg-surface px-2 py-1 shadow-sm"
      >
        {protein ? (
          <>
            <p className="font-mono font-semibold text-sm">{protein.geneSymbol}</p>
            <p className="text-muted text-xs">{protein.name}</p>
          </>
        ) : null}
      </div>

      <div className="absolute top-3 right-3 z-10 flex flex-col overflow-hidden rounded-md border border-line bg-surface sm:top-4 sm:right-4">
        <MapButton label="Zoom in" onClick={() => atlasRef.current?.zoomBy(1.25)}>
          +
        </MapButton>
        <MapButton label="Zoom out" onClick={() => atlasRef.current?.zoomBy(0.8)}>
          −
        </MapButton>
        <MapButton label="Show every protein" onClick={() => atlasRef.current?.fit()}>
          ⤢
        </MapButton>
      </div>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-col-reverse items-start gap-2 sm:inset-x-4 sm:bottom-4 sm:flex-row sm:items-end sm:justify-between">
        {release.manifest.sampleNotice ? (
          <p
            data-testid="sample-notice"
            className="pointer-events-auto max-w-md rounded-md border border-line bg-surface px-3 py-2 text-muted text-xs"
          >
            {release.manifest.sampleNotice}
          </p>
        ) : null}
        <ul
          aria-label="Functions"
          className="pointer-events-auto flex flex-wrap gap-x-3 gap-y-1 rounded-md border border-line bg-surface px-3 py-2 text-xs sm:max-w-xs"
        >
          {categories.map((c, i) => (
            <li key={c.id} className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: `var(${categoryToken(i)})` }}
              />
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function MapButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center border-line text-lg not-last:border-b hover:bg-canvas"
    >
      <span aria-hidden="true">{children}</span>
    </button>
  );
}
