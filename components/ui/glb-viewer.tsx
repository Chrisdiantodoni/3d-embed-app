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
import { Suspense, useEffect, useRef, Component, ReactNode } from "react";

// Error Boundary biar tidak crash
class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#ef4444" wireframe />
          </mesh>
        )
      );
    }
    return this.props.children;
  }
}
function toProxyUrl(url: string) {
  // Jika URL kosong, atau merupakan Blob lokal, atau file di folder public/
  // Langsung kembalikan URL aslinya tanpa proxy.
  if (
    !url ||
    url.startsWith("blob:") ||
    url.startsWith("/") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  // Hanya gunakan proxy untuk URL eksternal (seperti R2 atau domain lain)
  return `/api/proxy?url=${encodeURIComponent(url)}`;
}
function Model({ url, onReady }: { url: string; onReady?: () => void }) {
  // useGLTF akan melempar error ke Error Boundary jika fetch gagal
  const { scene } = useGLTF(toProxyUrl(url));
  const bounds = useBounds();

  useEffect(() => {
    if (scene) {
      bounds.refresh().fit();
      const timeout = setTimeout(() => {
        onReady?.();
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [scene, bounds, onReady]);

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
    let frameCount = 0;
    const waitFrames = () => {
      frameCount++;
      if (frameCount < 5) {
        requestAnimationFrame(waitFrames);
        return;
      }
      glRef.current!.domElement.toBlob(
        (blob) => {
          if (blob) onScreenshot(blob);
        },
        "image/webp",
        0.8,
      );
    };
    requestAnimationFrame(waitFrames);
  };

  return (
    <div className="w-full aspect-square rounded-lg overflow-hidden border">
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          glRef.current = gl;
        }}
      >
        <color attach="background" args={["#020617"]} />
        <Suspense fallback={<ModelFallback />}>
          <ModelErrorBoundary>
            {url && (
              <Stage environment="city" intensity={0.6}>
                <Bounds fit clip observe margin={1.5}>
                  <Model url={url} onReady={captureScreenshot} />
                </Bounds>
              </Stage>
            )}
          </ModelErrorBoundary>
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
