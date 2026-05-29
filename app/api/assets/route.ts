import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/index";
import { assets } from "@/src/db/schema";
import { eq, desc, count, and, like } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get Query Params
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "9"));
    const offset = (page - 1) * limit;

    const filters = and(
      eq(assets.userId, userId),
      like(assets.name, `%${q}%`), // Use like instead of ilike
    );
    // 3. Run queries in parallel for better performance
    const [userAssets, totalCountResult] = await Promise.all([
      db
        .select()
        .from(assets)
        .where(filters)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(assets.createdAt)),

      db.select({ value: count() }).from(assets).where(filters),
    ]);

    const totalCount = totalCountResult[0].value;
    const totalPages = Math.ceil(totalCount / limit);

    // 4. Return data + metadata
    return NextResponse.json({
      data: userAssets,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error("List assets error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
