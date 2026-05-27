 
"use server";

import { ProjectPayload } from "@/components/ui/modal/create-project-modal";
import { db } from "@/src";
import { projectAssets, projects } from "@/src/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function createProjectAction(data: ProjectPayload) {
  const { userId } = await auth();

  if (!userId) {
    return { success: false, error: "Unauthorized: Kamu harus login." };
  }

  try {
    // Jalankan transaksi di Turso
    const result = await db.transaction(async (tx) => {
      const projectId = crypto.randomUUID();

      // 1. Simpan Project Utama
      await tx.insert(projects).values({
        id: projectId,
        userId: userId,
        name: data.name,
        description: data.description || "",
        thumbnailUrl: data.thumbnailUrl,
        // Default settings (JSON string untuk SQLite)
        lightingSettings: JSON.stringify(data.lightingSettings),
        cameraSettings: JSON.stringify({ position: [5, 5, 5], fov: 50 }),
      });

      // 2. Simpan Daftar Assets (Multiple)
      if (data.assets && data.assets.length > 0) {
        const assetsToInsert = data.assets.map((item) => ({
          id: uuidv4(),
          projectId: projectId,
          assetId: item.assetId,
          position: JSON.stringify(item.position),
          rotation: JSON.stringify(item.rotation),
          scale: JSON.stringify(item.scale),
        }));

        await tx.insert(projectAssets).values(assetsToInsert);
      }

      return { projectId };
    });

    revalidatePath("/dashboard");
    return { success: true, projectId: result.projectId };
  } catch (error) {
    console.error("DB Error:", error);
    return { success: false, error: error };
  }
}
