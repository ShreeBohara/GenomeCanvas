"use client";

import { useRef, useMemo } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { Protein } from "@/data/proteins";

export interface BackboneData {
  points: [number, number, number][];
  plddt: number[];
}

// AlphaFold pLDDT color scheme
function plddtColor(score: number): THREE.Color {
  if (score > 90) return new THREE.Color("#1e88e5");
  if (score > 70) return new THREE.Color("#26c6da");
  if (score > 50) return new THREE.Color("#ffca28");
  return new THREE.Color("#ef6c00");
}

// Blend pLDDT color with category color
function blendColor(plddt: number, categoryColor: string, blend: number): THREE.Color {
  const plddtC = plddtColor(plddt);
  const catC = new THREE.Color(categoryColor);
  return plddtC.lerp(catC, blend);
}

export default function ProteinRibbon({
  protein,
  backbone,
  position,
  color,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onUnhover,
}: {
  protein: Protein;
  backbone: BackboneData;
  position: [number, number, number];
  color: string;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onUnhover: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const tubeRef = useRef<THREE.Mesh>(null);

  // Scale the ribbon to fit in the scene (matching previous sphere size ~0.15 radius)
  const ribbonScale = 0.4;

  // Build tube geometry from backbone points
  const { tubeGeo, vertexColors } = useMemo(() => {
    const pts = backbone.points.map(
      ([x, y, z]) => new THREE.Vector3(x, y, z)
    );

    const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.5);
    const tubularSegments = Math.min(pts.length * 2, 500);
    const radius = 0.025;
    const radialSegments = 8;

    const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);

    // Apply vertex colors based on pLDDT
    const colors = new Float32Array(geo.attributes.position.count * 3);
    const posAttr = geo.attributes.position;

    // Map each vertex to its nearest backbone point to get pLDDT
    for (let i = 0; i < posAttr.count; i++) {
      // Vertices are arranged in rings along the tube
      // Each ring has (radialSegments + 1) vertices
      const ringCount = radialSegments + 1;
      const segIdx = Math.floor(i / ringCount);
      const t = segIdx / tubularSegments;
      // Map t to pLDDT index
      const plddtIdx = Math.min(
        Math.floor(t * backbone.plddt.length),
        backbone.plddt.length - 1
      );
      const c = blendColor(backbone.plddt[plddtIdx], color, 0.35);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { tubeGeo: geo, vertexColors: colors };
  }, [backbone, color]);

  // Animate scale and glow
  const targetScale = isSelected ? ribbonScale * 1.3 : isHovered ? ribbonScale * 1.15 : ribbonScale;

  useFrame((_, delta) => {
    if (groupRef.current) {
      const s = groupRef.current.scale.x;
      const next = THREE.MathUtils.lerp(s, targetScale, delta * 6);
      groupRef.current.scale.setScalar(next);

      // Gentle idle rotation
      if (!isHovered && !isSelected) {
        groupRef.current.rotation.y += delta * 0.15;
      }
    }

    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshStandardMaterial;
      const targetEmissive = isSelected ? 0.6 : isHovered ? 0.4 : 0.15;
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        targetEmissive,
        delta * 6
      );
    }

  });

  return (
    <group position={position}>
      <group ref={groupRef} scale={ribbonScale}>
        {/* Ribbon tube */}
        <mesh ref={tubeRef} geometry={tubeGeo}>
          <meshStandardMaterial
            vertexColors
            emissive={color}
            emissiveIntensity={0.15}
            roughness={0.35}
            metalness={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Invisible hit-detection sphere */}
        <mesh
          onClick={(e: ThreeEvent<MouseEvent>) => {
            e.stopPropagation();
            onSelect();
          }}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            onHover();
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            onUnhover();
            document.body.style.cursor = "default";
          }}
        >
          <sphereGeometry args={[1.2, 8, 8]} />
          <meshBasicMaterial
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Label */}
      {(isHovered || isSelected) && (
        <Html
          position={[0, ribbonScale * 1.3, 0]}
          center
          distanceFactor={8}
          zIndexRange={[10, 0]}
        >
          <div
            style={{
              color: "#e8ecf4",
              fontSize: "11px",
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              whiteSpace: "nowrap",
              textShadow: "0 0 6px #06080c, 0 0 12px #06080c",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {protein.gene_name}
          </div>
        </Html>
      )}
    </group>
  );
}
