"use client";

import { Canvas } from "@react-three/fiber";
import {
  useGLTF,
  Stage,
  OrbitControls,
  Bounds,
  useBounds,
  ContactShadows,
} from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";

function Model({ url, onReady }: { url: string; onReady?: () => void }) {
  const { scene } = useGLTF(url);
  const bounds = useBounds();

  useEffect(() => {
    // Refresh bounds setelah model load, biar kamera fit otomatis
    bounds.refresh().fit();
    onReady?.();
  }, [scene]);

  return <primitive object={scene} />;
}

function ModelFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#1e293b" wireframe />
    </mesh>
  );
}

export function GLBViewer({
  url,
  onScreenshot,
}: {
  url: string | null;
  onScreenshot?: (blob: Blob) => void;
}) {
  const glRef = useRef<THREE.WebGLRenderer | null>(null);

  const captureScreenshot = () => {
    if (!glRef.current || !onScreenshot) return;
    requestAnimationFrame(() => {
      glRef.current!.domElement.toBlob(
        (blob) => {
          if (blob) onScreenshot(blob);
        },
        "image/webp",
        0.8,
      );
    });
  };

  return (
    <div className="w-full aspect-square rounded-lg overflow-hidden border">
      <Canvas
        shadows
        // Posisi awal kamera — Bounds.fit() akan override ini secara otomatis
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          glRef.current = gl;
        }}
      >
        <color attach="background" args={["#020617"]} />
        <Suspense fallback={<ModelFallback />}>
          {url && (
            <Stage environment="city" intensity={0.6}>
              <Bounds
                fit // auto fit kamera ke bounding box model
                clip // clip kamera supaya tidak terlalu jauh
                observe // update saat model berubah
                margin={1} // padding 1 = pas, naikkan kalau mau lebih jauh
              >
                <Model url={url} onReady={captureScreenshot} />
              </Bounds>
            </Stage>
          )}
          <ContactShadows
            position={[0, -0.1, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={0.8}
          />
        </Suspense>
        <OrbitControls
          makeDefault
          autoRotate
          autoRotateSpeed={0.8}
          minPolarAngle={0}
          maxPolarAngle={Math.PI / 1.75}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
