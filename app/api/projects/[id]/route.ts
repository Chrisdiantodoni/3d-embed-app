// lib/db/projects.ts
import { db } from "@/src";
import { assets, projectAssets, projects } from "@/src/db/schema";
import { eq } from "drizzle-orm";

export async function getProjectById(id: string) {
  const result = await db
    .select({
      // Data Project
      projectName: projects.name,
      lighting: projects.lightingSettings,
      camera: projects.cameraSettings,
      // Data Asset Instance (dari junction)
      instanceId: projectAssets.id,
      position: projectAssets.position,
      rotation: projectAssets.rotation,
      scale: projectAssets.scale,
      // Data File Asset (dari tabel assets utama)
      assetName: assets.name,
      fileUrl: assets.url,
    })
    .from(projects)
    .leftJoin(projectAssets, eq(projects.id, projectAssets.projectId))
    .leftJoin(assets, eq(projectAssets.assetId, assets.id))
    .where(eq(projects.id, id));

  if (result.length === 0) return null;

  return {
    name: result[0].projectName,
    settings: {
      lighting: JSON.parse(result[0].lighting || "{}"),
      camera: JSON.parse(result[0].camera || "{}"),
    },
    sceneAssets: result
      .filter((r) => r.instanceId !== null) // handle project tanpa asset
      .map((r) => ({
        id: r.instanceId,
        name: r.assetName,
        url: r.fileUrl,
        transform: {
          position: JSON.parse(r.position || '{"x":0,"y":0,"z":0}'),
          rotation: JSON.parse(r.rotation || '{"x":0,"y":0,"z":0}'),
          scale: JSON.parse(r.scale || '{"x":1,"y":1,"z":1}'),
        },
      })),
  };
}

export type ProjectData = NonNullable<
  Awaited<ReturnType<typeof getProjectById>>
>;
