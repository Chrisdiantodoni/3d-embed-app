"use client";

import { Suspense, useRef, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import {
  useGLTF,
  Stage,
  OrbitControls,
  Environment,
  Loader,
  Html,
} from "@react-three/drei";
import * as THREE from "three";
import HotspotPin, { type HotspotData } from "./HotspotPin";

type SceneConfig = {
  intensity: number;
  autoRotate: boolean;
  environment: "city" | "studio" | "lobby";
};

type ModelProps = {
  url: string;
  config: SceneConfig;
  placingHotspot?: boolean;
  onPlaceHotspot?: (position: { x: number; y: number; z: number }) => void;
};

type R3FViewerProps = {
  url: string;
  config: SceneConfig;
  hotspots?: HotspotData[];
  onDeleteHotspot?: (id: string) => void;
  placingHotspot?: boolean;
  onPlaceHotspot?: (position: { x: number; y: number; z: number }) => void;
  editable?: boolean;
  gl?: React.MutableRefObject<THREE.WebGLRenderer | null>;
};

// Internal model renderer with raycasting for hotspot placement
function Model({ url, placingHotspot, onPlaceHotspot }: ModelProps) {
  const { scene } = useGLTF(url);
  const meshRef = useRef<THREE.Group>(null);

  const handleClick = useCallback(
    (
      e: THREE.Event & { point: THREE.Vector3; stopPropagation: () => void },
    ) => {
      if (!placingHotspot || !onPlaceHotspot) return;
      e.stopPropagation();
      onPlaceHotspot({
        x: parseFloat(e.point.x.toFixed(4)),
        y: parseFloat(e.point.y.toFixed(4)),
        z: parseFloat(e.point.z.toFixed(4)),
      });
    },
    [placingHotspot, onPlaceHotspot],
  );

  return (
    <group ref={meshRef} dispose={null} onClick={handleClick}>
      <primitive object={scene} />
    </group>
  );
}

// Captures the GL renderer ref for thumbnail screenshots
function RendererCapture({
  glRef,
}: {
  glRef?: React.MutableRefObject<THREE.WebGLRenderer | null>;
}) {
  const { gl } = useThree();
  if (glRef) {
    glRef.current = gl;
  }
  return null;
}

export default function R3FViewer({
  url,
  config,
  hotspots = [],
  onDeleteHotspot,
  placingHotspot = false,
  onPlaceHotspot,
  editable = false,
  gl,
}: R3FViewerProps) {
  return (
    <div
      className="w-full h-full relative group"
      style={{ cursor: placingHotspot ? "crosshair" : "auto" }}
    >
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 2]}
        gl={{ preserveDrawingBuffer: true }}
        className="touch-none"
      >
        {gl && <RendererCapture glRef={gl} />}

        {/* Automatic Professional Lighting and Environment */}
        <Stage
          intensity={config.intensity}
          environment={config.environment}
          shadows="contact"
          adjustCamera={true}
        >
          <Suspense
            fallback={
              <Html center className="text-sm font-mono text-zinc-400">
                Loading 3D Model...
              </Html>
            }
          >
            <Model
              url={url}
              config={config}
              placingHotspot={placingHotspot}
              onPlaceHotspot={onPlaceHotspot}
            />
          </Suspense>
        </Stage>

        {/* Hotspot Pins */}
        {hotspots.map((hs) => (
          <HotspotPin
            key={hs.id}
            hotspot={hs}
            onDelete={onDeleteHotspot}
            editable={editable}
          />
        ))}

        {/* Interaction Controls */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          autoRotate={config.autoRotate}
          autoRotateSpeed={1.5}
        />
      </Canvas>
      <Loader />

      {/* Placing hotspot indicator */}
      {placingHotspot && (
        <div
          style={{
            position: "absolute",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            color: "white",
            padding: "8px 18px",
            borderRadius: 24,
            fontSize: 13,
            fontFamily: "system-ui, sans-serif",
            fontWeight: 500,
            boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
            zIndex: 20,
            pointerEvents: "none",
          }}
        >
          Click on the model to place a hotspot
        </div>
      )}
    </div>
  );
}
