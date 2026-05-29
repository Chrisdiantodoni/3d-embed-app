import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { db } from "@/src/index";
import { assets, projectAssets } from "@/src/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { deleteFromR2, getR2KeyFromUrl } from "@/lib/r2";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [asset] = await db
      .select()
      .from(assets)
      .where(and(eq(assets.id, id), eq(assets.userId, userId)));

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    try {
      const key = getR2KeyFromUrl(asset.url);
      await deleteFromR2(key);
    } catch (err) {
      console.error("Failed to delete from R2:", err);
    }

    if (asset.thumbnailUrl) {
      try {
        const match = asset.thumbnailUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.\w+$/);
        if (match) {
          await cloudinary.uploader.destroy(match[1]);
        }
      } catch (err) {
        console.error("Failed to delete Cloudinary thumbnail:", err);
      }
    }

    // Enable FK enforcement and cascade to project_assets
    await db.run(sql`PRAGMA foreign_keys = ON`);
    await db
      .delete(projectAssets)
      .where(eq(projectAssets.assetId, id));

    await db.delete(assets).where(eq(assets.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete asset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
