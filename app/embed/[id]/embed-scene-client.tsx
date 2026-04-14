"use client";

import { Suspense, useMemo } from "react";
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
      };
    };
    sceneAssets: SceneAsset[];
  };
};

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
  const { scene } = useGLTF(toProxyUrl(asset.url, projectId, token));
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

export default function EmbedSceneClient({ data }: EmbedSceneClientProps) {
  const lighting = data.settings.lighting ?? {};
  const camera = data.settings.camera ?? {};
  const cameraPosition = camera.position ?? [5, 5, 5];
  const cameraTarget = camera.target ?? [0, 0, 0];
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
    <div className="h-screen w-screen bg-zinc-950">
      <Canvas
        shadows={lighting.shadowEnabled ?? true}
        camera={{ position: cameraPosition, fov: 50 }}
        className="h-full w-full"
      >
        <Suspense fallback={null}>
          <Environment
            preset={environment}
            environmentIntensity={lighting.intensity ?? 1}
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

          <OrbitControls
            makeDefault
            target={new THREE.Vector3(...cameraTarget)}
            enablePan
            enableZoom
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
