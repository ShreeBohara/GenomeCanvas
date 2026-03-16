"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "@/store/useStore";
import { CATEGORY_COLORS, FunctionCategory, PROTEINS } from "@/data/proteins";
import ProteinRibbon, { BackboneData } from "./ProteinRibbon";
import backboneData from "@/data/backbones.json";

const typedBackboneData = backboneData as unknown as Record<string, BackboneData>;

// Category cluster label
function ClusterLabel({
  category,
  position,
}: {
  category: FunctionCategory;
  position: [number, number, number];
}) {
  const labels: Record<FunctionCategory, string> = {
    enzyme: "ENZYMES",
    signaling: "SIGNALING",
    structural: "STRUCTURAL",
    transporter: "TRANSPORTERS",
    dna_repair: "DNA REPAIR",
  };

  return (
    <Html position={position} center distanceFactor={10} zIndexRange={[5, 0]}>
      <div
        style={{
          color: CATEGORY_COLORS[category],
          fontSize: "10px",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 500,
          letterSpacing: "0.2em",
          opacity: 0.4,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          userSelect: "none",
          textShadow: `0 0 8px ${CATEGORY_COLORS[category]}40`,
        }}
      >
        {labels[category]}
      </div>
    </Html>
  );
}

// Ambient floating particles for depth
function BackgroundParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 300;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.01;
      ref.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#2a3550"
        size={0.03}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// Connection lines between related proteins
function ConnectionLines() {
  const lines = useMemo(() => {
    const connections: { start: THREE.Vector3; end: THREE.Vector3; color: string }[] = [];
    const categories = ["enzyme", "signaling", "structural", "transporter", "dna_repair"] as const;

    for (const cat of categories) {
      const prots = PROTEINS.filter((p) => p.function_category === cat);
      for (let i = 0; i < prots.length; i++) {
        for (let j = i + 1; j < prots.length; j++) {
          const dist = Math.sqrt(
            (prots[i].umap_x - prots[j].umap_x) ** 2 +
            (prots[i].umap_y - prots[j].umap_y) ** 2 +
            (prots[i].umap_z - prots[j].umap_z) ** 2
          );
          if (dist < 4) {
            connections.push({
              start: new THREE.Vector3(prots[i].umap_x, prots[i].umap_y, prots[i].umap_z),
              end: new THREE.Vector3(prots[j].umap_x, prots[j].umap_y, prots[j].umap_z),
              color: CATEGORY_COLORS[cat],
            });
          }
        }
      }
    }
    return connections;
  }, []);

  return (
    <group>
      {lines.map((l, i) => {
        const points = [l.start, l.end];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({ color: l.color, transparent: true, opacity: 0.06 });
        const lineObj = new THREE.Line(geo, mat);
        return <primitive key={i} object={lineObj} />;
      })}
    </group>
  );
}

// Camera auto-position
function CameraController() {
  const { camera } = useThree();
  const initialized = useRef(false);

  useFrame(() => {
    if (!initialized.current) {
      camera.position.set(2, 4, 16);
      camera.lookAt(0, 2, 0);
      initialized.current = true;
    }
  });

  return null;
}

// Main scene
function UniverseScene() {
  const { selectedProtein, setSelectedProtein, hoveredProtein, setHoveredProtein, filteredProteins } = useStore();
  const proteins = filteredProteins();

  // Compute cluster centers
  const clusterCenters = useMemo(() => {
    const centers: Partial<Record<FunctionCategory, [number, number, number]>> = {};
    const categories: FunctionCategory[] = ["enzyme", "signaling", "structural", "transporter", "dna_repair"];
    for (const cat of categories) {
      const prots = PROTEINS.filter((p) => p.function_category === cat);
      if (prots.length === 0) continue;
      const cx = prots.reduce((s, p) => s + p.umap_x, 0) / prots.length;
      const cy = prots.reduce((s, p) => s + p.umap_y, 0) / prots.length;
      const cz = prots.reduce((s, p) => s + p.umap_z, 0) / prots.length;
      centers[cat] = [cx, cy + 1.5, cz];
    }
    return centers;
  }, []);

  return (
    <>
      <CameraController />

      {/* Lighting — tuned for ribbon surfaces */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[8, 12, 8]} intensity={0.8} color="#e8ecf4" />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#22d3ee" />
      <pointLight position={[-10, -5, -10]} intensity={0.3} color="#a78bfa" />
      <pointLight position={[0, -10, 5]} intensity={0.2} color="#f472b6" />

      <BackgroundParticles />
      <ConnectionLines />

      {/* Cluster labels */}
      {(Object.entries(clusterCenters) as [FunctionCategory, [number, number, number]][]).map(
        ([cat, pos]) => (
          <ClusterLabel key={cat} category={cat} position={pos} />
        )
      )}

      {/* Protein ribbons */}
      {proteins.map((protein) => {
        const backbone = typedBackboneData[protein.uniprot_id];
        if (!backbone) return null;
        return (
          <ProteinRibbon
            key={protein.uniprot_id}
            protein={protein}
            backbone={backbone}
            position={[protein.umap_x, protein.umap_y, protein.umap_z]}
            color={CATEGORY_COLORS[protein.function_category]}
            isSelected={selectedProtein?.uniprot_id === protein.uniprot_id}
            isHovered={hoveredProtein?.uniprot_id === protein.uniprot_id}
            onSelect={() => setSelectedProtein(protein)}
            onHover={() => setHoveredProtein(protein)}
            onUnhover={() => setHoveredProtein(null)}
          />
        );
      })}

      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={4}
        maxDistance={30}
        autoRotate
        autoRotateSpeed={0.3}
        dampingFactor={0.05}
        enableDamping
      />
    </>
  );
}

export default function ProteinUniverse() {
  return (
    <div className="w-full h-full relative">
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        camera={{ fov: 50, near: 0.1, far: 100 }}
        style={{ background: "transparent" }}
      >
        <fog attach="fog" args={["#06080c", 15, 35]} />
        <UniverseScene />
      </Canvas>
    </div>
  );
}
