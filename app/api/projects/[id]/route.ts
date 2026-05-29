// lib/db/projects.ts
import { db } from "@/src";
import { assets, projectAssets, projects } from "@/src/db/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import { auth } from "@clerk/nextjs/server";

export async function getProjectById(id: string) {
  const result = await db
    .select({
      id: projects.id,
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
    id: result[0].id,
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
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const projectId = id;

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const body = await req.json();

  const { sceneAssets: clientAssets, lighting, cameraSettings, thumbnail, name } = body;

  try {
    // If only renaming, update and return early
    if (name && typeof name === "string" && !clientAssets) {
      await db.update(projects).set({ name: name.trim(), updatedAt: new Date() }).where(eq(projects.id, projectId));
      return Response.json({ success: true });
    }

    let thumbnailUrl: string | undefined;

    if (thumbnail && typeof thumbnail === "string" && thumbnail.startsWith("data:")) {
      try {
        const base64 = thumbnail.split(",")[1];
        const buffer = Buffer.from(base64, "base64");
        const result = await uploadToCloudinary(buffer, {
          folder: "3d-thumbnails",
          public_id: `project-${projectId}`,
          format: "webp",
          overwrite: true,
        });
        thumbnailUrl = result.secure_url;
      } catch (err) {
        console.error("Thumbnail upload failed:", err);
      }
    }

    // ── 1. Update project settings ────────────────────────────────────────

    await db

      .update(projects)

      .set({
        lightingSettings: JSON.stringify(lighting),

        cameraSettings: JSON.stringify(cameraSettings),

        updatedAt: new Date(),

        ...(thumbnailUrl ? { thumbnailUrl } : {}),
        ...(name && typeof name === "string" ? { name: name.trim() } : {}),
      })

      .where(eq(projects.id, projectId));

    // ── 2. Ambil semua instance yang ada di DB sekarang ───────────────────
    await db.transaction(async (tx) => {
      const existingRows = await tx
        .select({ id: projectAssets.id, assetId: projectAssets.assetId })
        .from(projectAssets)
        .where(eq(projectAssets.projectId, projectId));

      // Key by assetId → projectAssets PK for lookup
      const existingByAssetId = new Map(
        existingRows.map((r) => [r.assetId, r.id]),
      );
      const clientAssetIds = new Set(clientAssets.map((a: any) => a.assetId));

      // ── 3. Classify ─────────────────────────────────────────────────────────
      const toInsert = clientAssets.filter(
        (a: any) => !existingByAssetId.has(a.assetId),
      );
      const toUpdate = clientAssets.filter((a: any) =>
        existingByAssetId.has(a.assetId),
      );
      const toDeleteIds = [...existingByAssetId.entries()]
        .filter(([assetId]) => !clientAssetIds.has(assetId))
        .map(([, id]) => id);

      // ── 4. DELETE ────────────────────────────────────────────────────────────
      if (toDeleteIds.length > 0) {
        await tx
          .delete(projectAssets)
          .where(inArray(projectAssets.id, toDeleteIds));
      }

      // ── 5. INSERT ────────────────────────────────────────────────────────────
      if (toInsert.length > 0) {
        await tx.insert(projectAssets).values(
          toInsert.map((a: any) => ({
            id: crypto.randomUUID(),
            projectId,
            assetId: a.assetId,
            position: JSON.stringify(a.transform.position),
            rotation: JSON.stringify(a.transform.rotation),
            scale: JSON.stringify(a.transform.scale),
          })),
        );
      }

      // ── 6. UPDATE — use the real DB id from the map ──────────────────────────
      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((a: any) =>
            tx
              .update(projectAssets)
              .set({
                position: JSON.stringify(a.transform.position),
                rotation: JSON.stringify(a.transform.rotation),
                scale: JSON.stringify(a.transform.scale),
              })
              .where(eq(projectAssets.id, existingByAssetId.get(a.assetId)!)),
          ),
        );
      }
    });
    return Response.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/projects/:id]", err);

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await db.run(sql`PRAGMA foreign_keys = ON`);
    await db.delete(projects).where(eq(projects.id, id));
    return Response.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/projects/:id]", err);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }
}
