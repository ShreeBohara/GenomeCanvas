"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Line, OrbitControls, Sparkles, Stars, Text } from "@react-three/drei";
import { Color, Group, Vector3 } from "three";

import {
  CameraTarget,
  ExperienceMode,
  ProteinSummary,
  ProteinUniverseAsset,
  ViewportPreset,
} from "@/lib/types";
import {
  CATEGORY_COLORS,
  matchesUniverseFilter,
  proteinPosition,
  proteinScale,
  traceVertexColors,
} from "@/lib/utils";
import { buildCameraFrame, computeSelectionBounds, computeUniverseBounds } from "@/lib/viewport";


type ProteinUniverseProps = {
  proteins: ProteinSummary[];
  universeAssets: Record<string, ProteinUniverseAsset>;
  filter: string;
  highlightedIds: string[];
  loading: boolean;
  selectedProteinId: string | null;
  focusedProteinId: string | null;
  hoveredEntityId: string | null;
  experienceMode: ExperienceMode;
  cameraTarget: CameraTarget;
  viewportPreset: ViewportPreset;
  viewportRevision: number;
  onHoverProtein: (uniprotId: string | null) => void;
  onSpotlightProtein: (uniprotId: string) => void;
  onFocusProtein: (uniprotId: string) => void;
  onBackgroundClick: () => void;
};

type AnimationState = {
  duration: number;
  progress: number;
  fromPosition: Vector3;
  toPosition: Vector3;
  fromTarget: Vector3;
  toTarget: Vector3;
};

function easeInOutCubic(value: number) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - (Math.pow(-2 * value + 2, 3) / 2);
}

function CameraRig({
  proteins,
  proteinsById,
  highlightedIds,
  selectedProteinId,
  focusedProteinId,
  experienceMode,
  cameraTarget,
  viewportPreset,
  viewportRevision,
}: {
  proteins: ProteinSummary[];
  proteinsById: Map<string, ProteinSummary>;
  highlightedIds: string[];
  selectedProteinId: string | null;
  focusedProteinId: string | null;
  experienceMode: ExperienceMode;
  cameraTarget: CameraTarget;
  viewportPreset: ViewportPreset;
  viewportRevision: number;
}) {
  const controlsRef = useRef<any>(null);
  const animationRef = useRef<AnimationState | null>(null);
  const initialisedRef = useRef(false);
  const limitRef = useRef({ minDistance: 2, maxDistance: 72 });
  const { camera, size } = useThree();

  const sceneBounds = useMemo(() => computeUniverseBounds(proteins), [proteins]);

  const selectionIds = useMemo(() => {
    const ids: string[] = [];

    if (focusedProteinId) {
      ids.push(focusedProteinId);
    }
    if (selectedProteinId) {
      ids.push(selectedProteinId);
    }
    if (cameraTarget.id && proteinsById.has(cameraTarget.id)) {
      ids.push(cameraTarget.id);
    }
    ids.push(...highlightedIds.filter((id) => proteinsById.has(id)));

    return Array.from(new Set(ids));
  }, [cameraTarget.id, focusedProteinId, highlightedIds, proteinsById, selectedProteinId]);

  const selectionBounds = useMemo(
    () => computeSelectionBounds(proteins, selectionIds),
    [proteins, selectionIds],
  );

  useEffect(() => {
    if (!controlsRef.current) {
      return;
    }

    const aspect = size.width / Math.max(size.height, 1);
    let nextFrame = buildCameraFrame(sceneBounds, aspect, {
      framing: 1.12,
      elevation: 0.14,
      lateralOffset: 0.16,
    });

    if (experienceMode === "focus" && focusedProteinId && selectionBounds) {
      nextFrame = buildCameraFrame(selectionBounds, aspect, {
        framing: 0.72,
        elevation: 0.09,
        lateralOffset: 0.06,
      });
    } else if (viewportPreset === "selection" && selectionBounds) {
      nextFrame = buildCameraFrame(selectionBounds, aspect, {
        framing: 0.92,
        elevation: 0.15,
        lateralOffset: 0.12,
      });
    }

    limitRef.current = {
      minDistance:
        experienceMode === "focus"
          ? Math.max(1.6, nextFrame.minDistance * 0.7)
          : nextFrame.minDistance,
      maxDistance:
        experienceMode === "focus"
          ? Math.max(18, nextFrame.maxDistance * 0.45)
          : nextFrame.maxDistance,
    };

    const target = new Vector3(...nextFrame.target);
    const position = new Vector3(...nextFrame.position);

    if (!initialisedRef.current) {
      camera.position.copy(position);
      controlsRef.current.target.copy(target);
      controlsRef.current.minDistance = limitRef.current.minDistance;
      controlsRef.current.maxDistance = limitRef.current.maxDistance;
      controlsRef.current.update();
      initialisedRef.current = true;
      return;
    }

    animationRef.current = {
      duration: experienceMode === "focus" ? 0.75 : 0.95,
      progress: 0,
      fromPosition: camera.position.clone(),
      toPosition: position,
      fromTarget: controlsRef.current.target.clone(),
      toTarget: target,
    };
  }, [
    camera,
    experienceMode,
    focusedProteinId,
    sceneBounds,
    selectionBounds,
    size.height,
    size.width,
    viewportPreset,
    viewportRevision,
  ]);

  useFrame((_state, delta) => {
    if (!controlsRef.current) {
      return;
    }

    controlsRef.current.minDistance = limitRef.current.minDistance;
    controlsRef.current.maxDistance = limitRef.current.maxDistance;

    if (animationRef.current) {
      animationRef.current.progress = Math.min(
        animationRef.current.progress + (delta / animationRef.current.duration),
        1,
      );
      const eased = easeInOutCubic(animationRef.current.progress);
      camera.position.lerpVectors(
        animationRef.current.fromPosition,
        animationRef.current.toPosition,
        eased,
      );
      controlsRef.current.target.lerpVectors(
        animationRef.current.fromTarget,
        animationRef.current.toTarget,
        eased,
      );

      if (animationRef.current.progress >= 1) {
        animationRef.current = null;
      }
    }

    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      enablePan={experienceMode === "universe"}
      enableZoom
      zoomSpeed={0.9}
      dampingFactor={0.08}
      rotateSpeed={0.56}
    />
  );
}

function ClusterMist({
  proteins,
}: {
  proteins: ProteinSummary[];
}) {
  const clusters = useMemo(() => {
    const grouped = new Map<string, ProteinSummary[]>();
    proteins.forEach((protein) => {
      const current = grouped.get(protein.function_category) ?? [];
      current.push(protein);
      grouped.set(protein.function_category, current);
    });

    return Array.from(grouped.entries()).map(([clusterId, entries]) => {
      const centroid = entries.reduce(
        (acc, protein) => {
          const [x, y, z] = proteinPosition(protein);
          return [acc[0] + x, acc[1] + y, acc[2] + z];
        },
        [0, 0, 0],
      );

      return {
        clusterId,
        color: CATEGORY_COLORS[clusterId] ?? "#7de7dc",
        position: [
          centroid[0] / entries.length,
          centroid[1] / entries.length,
          centroid[2] / entries.length,
        ] as [number, number, number],
        radius: Math.max(4.6, Math.sqrt(entries.length) * 2.6),
      };
    });
  }, [proteins]);

  return (
    <>
      {clusters.map((cluster) => (
        <mesh key={cluster.clusterId} position={cluster.position}>
          <sphereGeometry args={[cluster.radius, 24, 24]} />
          <meshBasicMaterial color={cluster.color} opacity={0.045} transparent />
        </mesh>
      ))}
    </>
  );
}

function ClusterLabels({
  proteins,
}: {
  proteins: ProteinSummary[];
}) {
  const labels = useMemo(() => {
    const grouped = new Map<string, ProteinSummary[]>();
    proteins.forEach((protein) => {
      const current = grouped.get(protein.function_category) ?? [];
      current.push(protein);
      grouped.set(protein.function_category, current);
    });

    return Array.from(grouped.entries()).map(([clusterId, entries]) => {
      const centroid = entries.reduce(
        (acc, protein) => {
          const [x, y, z] = proteinPosition(protein);
          return [acc[0] + x, acc[1] + y, acc[2] + z];
        },
        [0, 0, 0],
      );
      return {
        clusterId,
        label: clusterId.replace(/_/g, " "),
        color: CATEGORY_COLORS[clusterId] ?? "#7de7dc",
        position: [
          centroid[0] / entries.length,
          (centroid[1] / entries.length) + 3.8,
          centroid[2] / entries.length,
        ] as [number, number, number],
      };
    });
  }, [proteins]);

  return (
    <>
      {labels.map((item) => (
        <Float key={item.clusterId} speed={0.55} floatIntensity={0.35}>
          <Text
            anchorX="center"
            anchorY="middle"
            color={item.color}
            fontSize={0.72}
            outlineColor="#020913"
            outlineWidth={0.045}
            position={item.position}
          >
            {item.label}
          </Text>
        </Float>
      ))}
    </>
  );
}

function ProteinRibbon({
  protein,
  asset,
  filter,
  highlighted,
  selected,
  focused,
  hovered,
  experienceMode,
  onHoverProtein,
  onSpotlightProtein,
  onFocusProtein,
}: {
  protein: ProteinSummary;
  asset: ProteinUniverseAsset;
  filter: string;
  highlighted: boolean;
  selected: boolean;
  focused: boolean;
  hovered: boolean;
  experienceMode: ExperienceMode;
  onHoverProtein: (uniprotId: string | null) => void;
  onSpotlightProtein: (uniprotId: string) => void;
  onFocusProtein: (uniprotId: string) => void;
}) {
  const groupRef = useRef<Group>(null);
  const lastClickRef = useRef(0);
  const worldPosition = useMemo(() => proteinPosition(protein), [protein]);
  const baseScale = proteinScale(protein.bounds_radius);
  // Prefer the denser tier when this ribbon is prominent, but fall back to
  // whichever tier has actually arrived: the two are fetched separately, so
  // during the first moments after load only `low` exists.
  const wantsDetail = selected || hovered || highlighted || focused;
  const trace =
    (wantsDetail ? asset.mid_trace ?? asset.low_trace : asset.low_trace ?? asset.mid_trace) ??
    null;

  const points = useMemo(
    () =>
      (trace?.points ?? []).map(
        ([x, y, z]) =>
          [x * baseScale, y * baseScale, z * baseScale] as [number, number, number],
      ),
    [baseScale, trace],
  );
  const vertexColors = useMemo(
    () => traceVertexColors(trace?.confidence ?? []).map((value) => new Color(value)),
    [trace],
  );

  const matchesFilter = matchesUniverseFilter(protein, filter);
  const dimmedByFilter = Boolean(filter) && !matchesFilter && !highlighted && !selected;
  const opacity = experienceMode === "focus"
    ? focused
      ? 1
      : 0.08
    : dimmedByFilter
      ? 0.12
      : selected || hovered
        ? 1
        : highlighted
          ? 0.94
          : 0.62;

  const haloOpacity = focused ? 0.56 : selected ? 0.44 : highlighted ? 0.3 : hovered ? 0.24 : 0.08;
  const lineWidth = focused ? 4.2 : selected ? 3.2 : hovered ? 2.5 : highlighted ? 2 : 1.22;
  const pulseSeed = useMemo(
    () => protein.uniprot_id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) * 0.017,
    [protein.uniprot_id],
  );

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.22 + pulseSeed) * 0.11;
    groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.16 + pulseSeed) * 0.05;
  });

  const showLabel = focused || selected || hovered || highlighted;

  // Placed after every hook so the hook order stays stable. A line needs two
  // points; with neither tier loaded there is nothing to draw yet.
  if (points.length < 2) {
    return null;
  }

  return (
    <group position={worldPosition} ref={groupRef}>
      <Line
        color={protein.halo_color}
        lineWidth={lineWidth + 2.4}
        opacity={haloOpacity}
        points={points}
        transparent
      />
      <Line
        onClick={(event) => {
          event.stopPropagation();
          const now = performance.now();
          if (now - lastClickRef.current < 260) {
            onFocusProtein(protein.uniprot_id);
          } else {
            onSpotlightProtein(protein.uniprot_id);
          }
          lastClickRef.current = now;
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          onHoverProtein(null);
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHoverProtein(protein.uniprot_id);
        }}
        lineWidth={lineWidth}
        opacity={opacity}
        points={points}
        transparent
        vertexColors={vertexColors}
      />

      {showLabel ? (
        <Text
          anchorX="center"
          anchorY="bottom"
          color="#f3f8ff"
          fontSize={focused ? 0.82 : 0.62}
          outlineColor="#02111a"
          outlineWidth={0.04}
          position={[0, (baseScale * 2.2) + 0.7, 0]}
        >
          {protein.gene_name}
        </Text>
      ) : null}
    </group>
  );
}

export function ProteinUniverse({
  proteins,
  universeAssets,
  filter,
  highlightedIds,
  loading,
  selectedProteinId,
  focusedProteinId,
  hoveredEntityId,
  experienceMode,
  cameraTarget,
  viewportPreset,
  viewportRevision,
  onHoverProtein,
  onSpotlightProtein,
  onFocusProtein,
  onBackgroundClick,
}: ProteinUniverseProps) {
  const proteinsById = useMemo(
    () => new Map(proteins.map((protein) => [protein.uniprot_id, protein])),
    [proteins],
  );

  if (loading && proteins.length === 0) {
    return <div className="viewport-empty-state">Loading the protein universe…</div>;
  }

  return (
    <div className="universe-canvas-shell">
      <Canvas
        camera={{ position: [0, 6, 34], fov: 42 }}
        dpr={[1, 2]}
        onPointerMissed={onBackgroundClick}
      >
        <color attach="background" args={["#06101a"]} />
        <ambientLight intensity={1.25} />
        <pointLight color="#86e9ff" intensity={115} position={[16, 20, 14]} />
        <pointLight color="#ffb47c" intensity={62} position={[-18, -8, 10]} />
        <pointLight color="#6eb7ff" intensity={48} position={[0, 10, -18]} />
        <fog attach="fog" args={["#07111b", 20, 92]} />

        <Stars depth={48} factor={2.8} count={1800} fade radius={96} saturation={0} />
        <Sparkles
          color="#dff8ff"
          count={64}
          noise={2.1}
          opacity={0.18}
          scale={[66, 52, 64]}
          size={2.2}
          speed={0.18}
        />

        <ClusterMist proteins={proteins} />
        {experienceMode === "universe" ? <ClusterLabels proteins={proteins} /> : null}

        {proteins.map((protein) => {
          const asset = universeAssets[protein.uniprot_id];
          if (!asset) {
            return null;
          }

          return (
            <ProteinRibbon
              asset={asset}
              experienceMode={experienceMode}
              filter={filter}
              focused={focusedProteinId === protein.uniprot_id}
              highlighted={highlightedIds.includes(protein.uniprot_id)}
              hovered={hoveredEntityId === protein.uniprot_id}
              key={protein.uniprot_id}
              onFocusProtein={onFocusProtein}
              onHoverProtein={onHoverProtein}
              onSpotlightProtein={onSpotlightProtein}
              protein={protein}
              selected={selectedProteinId === protein.uniprot_id}
            />
          );
        })}

        <CameraRig
          cameraTarget={cameraTarget}
          experienceMode={experienceMode}
          focusedProteinId={focusedProteinId}
          highlightedIds={highlightedIds}
          proteins={proteins}
          proteinsById={proteinsById}
          selectedProteinId={selectedProteinId}
          viewportPreset={viewportPreset}
          viewportRevision={viewportRevision}
        />
      </Canvas>
    </div>
  );
}
