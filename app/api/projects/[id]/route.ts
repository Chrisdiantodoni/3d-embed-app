// lib/db/projects.ts
import { db } from "@/src";
import { assets, projectAssets, projects } from "@/src/db/schema";
import { eq, inArray } from "drizzle-orm";

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
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const projectId = params.id;
  const body = await req.json();
  const { sceneAssets: clientAssets, lighting, cameraSettings } = body;

  try {
    // ── 1. Update project settings ────────────────────────────────────────
    await db
      .update(projects)
      .set({
        lightingSettings: JSON.stringify(lighting),
        cameraSettings: JSON.stringify(cameraSettings),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));

    // ── 2. Ambil semua instance yang ada di DB sekarang ───────────────────
    const existingRows = await db
      .select({ id: projectAssets.id })
      .from(projectAssets)
      .where(eq(projectAssets.projectId, projectId));

    const existingIds = new Set(existingRows.map((r) => r.id));
    const clientIds = new Set(clientAssets.map((a: any) => a.id));

    // ── 3. Pisahkan: mana yang baru, update, dan hapus ────────────────────
    const toInsert = clientAssets.filter((a: any) => !existingIds.has(a.id));
    const toUpdate = clientAssets.filter((a: any) => existingIds.has(a.id));
    const toDeleteIds = [...existingIds].filter((id) => !clientIds.has(id));

    // ── 4. DELETE — asset yang dihapus dari scene ─────────────────────────
    if (toDeleteIds.length > 0) {
      await db
        .delete(projectAssets)
        .where(inArray(projectAssets.id, toDeleteIds));
    }

    // ── 5. INSERT — asset baru dari library ───────────────────────────────
    if (toInsert.length > 0) {
      await db.insert(projectAssets).values(
        toInsert.map((a: any) => ({
          id: a.id,
          projectId,
          assetId: a.assetId, // ✅ ID dari tabel assets (bukan instanceId)
          position: JSON.stringify(a.transform.position),
          rotation: JSON.stringify(a.transform.rotation),
          scale: JSON.stringify(a.transform.scale),
        })),
      );
    }

    // ── 6. UPDATE — asset yang sudah ada, update transform ────────────────
    if (toUpdate.length > 0) {
      await Promise.all(
        toUpdate.map((a: any) =>
          db
            .update(projectAssets)
            .set({
              position: JSON.stringify(a.transform.position),
              rotation: JSON.stringify(a.transform.rotation),
              scale: JSON.stringify(a.transform.scale),
            })
            .where(eq(projectAssets.id, a.id)),
        ),
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/projects/:id]", err);
    return Response.json({ error: "Failed to save" }, { status: 500 });
  }
}
