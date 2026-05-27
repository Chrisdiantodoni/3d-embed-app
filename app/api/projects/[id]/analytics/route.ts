import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/index";
import { analyticsEvents } from "@/src/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/projects/[id]/analytics
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const rows = await db
      .select({
        eventType: analyticsEvents.eventType,
        createdAt: analyticsEvents.createdAt,
      })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.projectId, id),
          gte(analyticsEvents.createdAt, new Date(thirtyDaysAgo * 1000)),
        ),
      );

    let views = 0;
    let rotates = 0;
    let zooms = 0;
    let hotspotClicks = 0;
    const weeklyMap = new Map<string, number>();

    for (const row of rows) {
      switch (row.eventType) {
        case "view":
          views++;
          break;
        case "rotate":
          rotates++;
          break;
        case "zoom":
          zooms++;
          break;
        case "hotspot_click":
          hotspotClicks++;
          break;
      }

      if (row.eventType === "view" && row.createdAt) {
        const date = new Date(row.createdAt);
        const dayOfWeek = date.getDay();
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(date);
        monday.setDate(date.getDate() - daysSinceMonday);
        const weekKey = monday.toISOString().slice(0, 10);
        weeklyMap.set(weekKey, (weeklyMap.get(weekKey) ?? 0) + 1);
      }
    }

    const weeklyViews = Array.from(weeklyMap.entries())
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week));

    return NextResponse.json({
      totalViews: views,
      totalInteractions: rotates + zooms + hotspotClicks,
      breakdown: { views, rotates, zooms, hotspotClicks },
      weeklyViews,
    });
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
