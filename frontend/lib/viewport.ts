import { ProteinSummary } from "@/lib/types";
import { proteinPosition, proteinScale } from "@/lib/utils";


export interface UniverseBounds {
  center: [number, number, number];
  min: [number, number, number];
  max: [number, number, number];
  radius: number;
  size: [number, number, number];
}

const EMPTY_BOUNDS: UniverseBounds = {
  center: [0, 0, 0],
  min: [-8, -8, -8],
  max: [8, 8, 8],
  radius: 14,
  size: [16, 16, 16],
};

function proteinEnvelopeRadius(protein: ProteinSummary): number {
  return Math.max(1.4, proteinScale(protein.bounds_radius) * 3.2);
}

export function computeUniverseBounds(proteins: ProteinSummary[]): UniverseBounds {
  if (!proteins.length) {
    return EMPTY_BOUNDS;
  }

  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];

  proteins.forEach((protein) => {
    const [x, y, z] = proteinPosition(protein);
    const radius = proteinEnvelopeRadius(protein);
    min[0] = Math.min(min[0], x - radius);
    min[1] = Math.min(min[1], y - radius);
    min[2] = Math.min(min[2], z - radius);
    max[0] = Math.max(max[0], x + radius);
    max[1] = Math.max(max[1], y + radius);
    max[2] = Math.max(max[2], z + radius);
  });

  const size: [number, number, number] = [
    max[0] - min[0],
    max[1] - min[1],
    max[2] - min[2],
  ];
  const center: [number, number, number] = [
    min[0] + (size[0] / 2),
    min[1] + (size[1] / 2),
    min[2] + (size[2] / 2),
  ];

  return {
    center,
    min,
    max,
    size,
    radius: Math.max(6, Math.hypot(size[0] / 2, size[1] / 2, size[2] / 2)),
  };
}

export function computeSelectionBounds(
  proteins: ProteinSummary[],
  ids: string[],
): UniverseBounds | null {
  const selection = proteins.filter((protein) => ids.includes(protein.uniprot_id));
  if (!selection.length) {
    return null;
  }
  return computeUniverseBounds(selection);
}

export function distanceToFitBounds(
  radius: number,
  fovDegrees: number,
  aspect: number,
  framing = 1.2,
): number {
  const verticalFov = (fovDegrees * Math.PI) / 180;
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(aspect, 0.75));
  const limitingFov = Math.min(verticalFov, horizontalFov);
  return (radius * framing) / Math.tan(limitingFov / 2);
}

export function buildCameraFrame(
  bounds: UniverseBounds,
  aspect: number,
  options?: {
    fov?: number;
    framing?: number;
    elevation?: number;
    lateralOffset?: number;
  },
) {
  const fov = options?.fov ?? 42;
  const distance = distanceToFitBounds(bounds.radius, fov, aspect, options?.framing ?? 1.22);
  const elevation = options?.elevation ?? 0.18;
  const lateralOffset = options?.lateralOffset ?? 0.2;

  return {
    distance,
    target: bounds.center,
    position: [
      bounds.center[0] + (distance * lateralOffset),
      bounds.center[1] + (distance * elevation),
      bounds.center[2] + distance,
    ] as [number, number, number],
    minDistance: Math.max(1.8, bounds.radius * 0.2),
    maxDistance: Math.max(24, bounds.radius * 6),
  };
}
