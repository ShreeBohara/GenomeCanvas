"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, OrbitControls, Sparkles, Stars } from "@react-three/drei";
import { Color, Group, Vector3 } from "three";

import { CameraTarget, ExperienceMode, ProteinSummary, ProteinUniverseAsset } from "@/lib/types";
import {
  matchesUniverseFilter,
  proteinPosition,
  proteinScale,
  traceVertexColors,
} from "@/lib/utils";


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
  onHoverProtein: (uniprotId: string | null) => void;
  onSpotlightProtein: (uniprotId: string) => void;
  onFocusProtein: (uniprotId: string) => void;
  onBackgroundClick: () => void;
};


function CameraRig({
  proteinsById,
  cameraTarget,
}: {
  proteinsById: Map<string, ProteinSummary>;
  cameraTarget: CameraTarget;
}) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();
  const focusTarget = useRef(new Vector3(0, 0, 0));
  const desiredPosition = useRef(new Vector3(0, 6, 34));

  useFrame((_state, delta) => {
    let nextTarget = new Vector3(0, 0, 0);
    let nextPosition = new Vector3(0, 6, 34);

    if (cameraTarget.id) {
      const protein = proteinsById.get(cameraTarget.id);
      if (protein) {
        const [x, y, z] = proteinPosition(protein);
        const scale = proteinScale(protein.bounds_radius);
        nextTarget = new Vector3(x, y, z);
        if (cameraTarget.mode === "focus") {
          nextPosition = new Vector3(x + 0.2, y + 0.35, z + (3.8 * scale));
        } else {
          nextPosition = new Vector3(x + 0.25, y + 0.65, z + (8.4 * scale));
        }
      }
    }

    focusTarget.current.lerp(nextTarget, 1 - Math.exp(-delta * 2.7));
    desiredPosition.current.lerp(nextPosition, 1 - Math.exp(-delta * 2.2));
    camera.position.lerp(desiredPosition.current, 1 - Math.exp(-delta * 2.2));
    controlsRef.current?.target.copy(focusTarget.current);
    controlsRef.current?.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom
      maxDistance={48}
      minDistance={2.8}
      rotateSpeed={0.72}
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
      const current = grouped.get(protein.cluster_id) ?? [];
      current.push(protein);
      grouped.set(protein.cluster_id, current);
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
        color: entries[0]?.halo_color ?? "#7de7dc",
        position: [
          centroid[0] / entries.length,
          centroid[1] / entries.length,
          centroid[2] / entries.length,
        ] as [number, number, number],
      };
    });
  }, [proteins]);

  return (
    <>
      {clusters.map((cluster) => (
        <mesh key={cluster.clusterId} position={cluster.position}>
          <sphereGeometry args={[4.2, 18, 18]} />
          <meshBasicMaterial color={cluster.color} opacity={0.035} transparent />
        </mesh>
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
  const trace =
    selected || hovered || highlighted || focused ? asset.mid_trace : asset.low_trace;

  const points = useMemo(
    () =>
      trace.points.map(
        ([x, y, z]) =>
          [x * baseScale, y * baseScale, z * baseScale] as [number, number, number],
      ),
    [baseScale, trace.points],
  );
  const vertexColors = useMemo(
    () => traceVertexColors(trace.confidence).map((value) => new Color(value)),
    [trace.confidence],
  );

  const matchesFilter = matchesUniverseFilter(protein, filter);
  const dimmedByFilter = Boolean(filter) && !matchesFilter && !highlighted && !selected;
  const opacity = experienceMode === "focus"
    ? focused
      ? 1
      : 0.12
    : dimmedByFilter
      ? 0.12
      : selected || hovered
        ? 1
        : highlighted
          ? 0.9
          : 0.68;

  const haloOpacity = selected || focused ? 0.46 : highlighted ? 0.26 : hovered ? 0.22 : 0.1;
  const lineWidth = focused ? 3.9 : selected ? 2.8 : hovered ? 2.2 : highlighted ? 1.8 : 1.25;
  const pulseSeed = useMemo(
    () => protein.uniprot_id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) * 0.017,
    [protein.uniprot_id],
  );

  useFrame((state) => {
    if (!groupRef.current) {
      return;
    }
    groupRef.current.rotation.y = (Math.sin(state.clock.elapsedTime * 0.22 + pulseSeed) * 0.12);
    groupRef.current.rotation.x = (Math.cos(state.clock.elapsedTime * 0.16 + pulseSeed) * 0.05);
  });

  return (
    <group position={worldPosition} ref={groupRef}>
      <Line
        color={protein.halo_color}
        lineWidth={lineWidth + 2.2}
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
    return <div className="overlay-empty">Loading the protein universe…</div>;
  }

  return (
    <div className="universe-shell">
      <Canvas
        camera={{ position: [0, 6, 34], fov: 42 }}
        dpr={[1, 2]}
        onPointerMissed={onBackgroundClick}
      >
        <color attach="background" args={["#030b12"]} />
        <ambientLight intensity={1.3} />
        <pointLight color="#74dfff" intensity={120} position={[12, 18, 12]} />
        <pointLight color="#ff9a6a" intensity={80} position={[-14, -10, 10]} />
        <fog attach="fog" args={["#06111d", 16, 58]} />
        <Stars depth={30} factor={2.4} count={1600} fade radius={80} saturation={0} />
        <Sparkles
          color="#e7fbff"
          count={85}
          noise={2.2}
          opacity={0.28}
          scale={[56, 42, 56]}
          size={1.8}
          speed={0.2}
        />

        <ClusterMist proteins={proteins} />

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

        <CameraRig cameraTarget={cameraTarget} proteinsById={proteinsById} />
      </Canvas>
    </div>
  );
}
