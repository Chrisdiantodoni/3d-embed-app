import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/index";
import { assets, projects } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/projects — list current user's projects
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userAssets = await db
      .select()
      .from(assets)
      .where(eq(assets.userId, userId))
      .orderBy(desc(assets.createdAt));

    return NextResponse.json(userAssets);
  } catch (error) {
    console.error("List assets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
