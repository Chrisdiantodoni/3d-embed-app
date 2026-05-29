"use client";

import { Suspense, useEffect, useMemo, useRef, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

type Vec3 = { x: number; y: number; z: number };

type SceneAsset = {
  id: string;
  name: string;
  url: string;
  transform: {
    position: Vec3;
    rotation: Vec3;
    scale: Vec3;
  };
};

type EmbedSceneClientProps = {
  data: {
    projectId: string;
    token: string;
    settings: {
      lighting?: {
        type?: string;
        intensity?: number;
        color?: string;
        shadowEnabled?: boolean;
      };
      camera?: {
        position?: [number, number, number];
        target?: [number, number, number];
        autoRotate?: boolean;
        autoRotateSpeed?: number;
      };
    };
    sceneAssets: SceneAsset[];
  };
};

function trackEvent(
  projectId: string,
  eventType: string,
  metadata?: Record<string, unknown>,
) {
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ projectId, eventType, metadata }),
  }).catch(() => {});
}

function toProxyUrl(url: string, projectId: string, token: string) {
  if (
    !url ||
    url.startsWith("blob:") ||
    url.startsWith("/") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  return `/api/proxy?url=${encodeURIComponent(url)}&projectId=${encodeURIComponent(projectId)}&token=${encodeURIComponent(token)}`;
}

function SceneModel({
  asset,
  projectId,
  token,
}: {
  asset: SceneAsset;
  projectId: string;
  token: string;
}) {
  const { scene } = useGLTF(toProxyUrl(asset.url, projectId, token), "/draco/");
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <primitive
      object={clonedScene}
      position={[
        asset.transform.position.x,
        asset.transform.position.y,
        asset.transform.position.z,
      ]}
      rotation={[
        asset.transform.rotation.x,
        asset.transform.rotation.y,
        asset.transform.rotation.z,
      ]}
      scale={[
        asset.transform.scale.x,
        asset.transform.scale.y,
        asset.transform.scale.z,
      ]}
    />
  );
}

function TrackedControls({ projectId, cameraTarget, autoRotate, autoRotateSpeed }: {
  projectId: string;
  cameraTarget: [number, number, number];
  autoRotate: boolean;
  autoRotateSpeed: number;
}) {
  const viewFired = useRef(false);
  const lastInteraction = useRef(0);
  const interactionToggle = useRef(0);

  useEffect(() => {
    if (!viewFired.current) {
      viewFired.current = true;
      trackEvent(projectId, "view");
    }
  }, [projectId]);

  const handleInteractionEnd = useCallback(() => {
    const now = Date.now();
    if (now - lastInteraction.current < 3000) return;
    lastInteraction.current = now;
    interactionToggle.current += 1;
    const eventType = interactionToggle.current % 2 === 0 ? "rotate" : "zoom";
    trackEvent(projectId, eventType);
  }, [projectId]);

  return (
    <OrbitControls
      makeDefault
      target={new THREE.Vector3(...cameraTarget)}
      enablePan
      enableZoom
      autoRotate={autoRotate}
      autoRotateSpeed={autoRotateSpeed}
      onEnd={handleInteractionEnd}
    />
  );
}

export default function EmbedSceneClient({ data }: EmbedSceneClientProps) {
  const lighting = data.settings.lighting ?? {};
  const camera = data.settings.camera ?? {};
  const cameraPosition = camera.position ?? [5, 5, 5];
  const cameraTarget = camera.target ?? [0, 0, 0];
  const background = (lighting as any).background ?? "environment";
  const autoRotate = camera.autoRotate ?? false;
  const autoRotateSpeed = camera.autoRotateSpeed ?? 1;
  const environment = (lighting.type ?? "studio") as
    | "studio"
    | "sunset"
    | "dawn"
    | "night"
    | "warehouse"
    | "forest"
    | "apartment"
    | "city"
    | "park"
    | "lobby";

  return (
    <div className={`h-screen w-screen ${background === "none" ? "bg-transparent" : "bg-zinc-950"}`}>
      <Canvas
        shadows={lighting.shadowEnabled ?? true}
        camera={{ position: cameraPosition, fov: 50 }}
        className="h-full w-full"
      >
        <Suspense fallback={null}>
          <Environment
            preset={environment}
            environmentIntensity={lighting.intensity ?? 1}
            background={background === "environment"}
          />
          <ambientLight
            color={lighting.color ?? "#ffffff"}
            intensity={(lighting.intensity ?? 1) * 0.5}
          />

          <group>
            {data.sceneAssets.map((asset) => (
              <SceneModel
                key={asset.id}
                asset={asset}
                projectId={data.projectId}
                token={data.token}
              />
            ))}
          </group>

          {(lighting.shadowEnabled ?? true) && (
            <ContactShadows
              position={[0, -0.01, 0]}
              opacity={0.4}
              scale={20}
              blur={2}
            />
          )}

          <TrackedControls projectId={data.projectId} cameraTarget={cameraTarget} autoRotate={autoRotate} autoRotateSpeed={autoRotateSpeed} />
        </Suspense>
      </Canvas>
    </div>
  );
}
