import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/index";
import { analyticsEvents, projects } from "@/src/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/analytics — get analytics summary (auth required)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify project belongs to user
        const [project] = await db
            .select({ id: projects.id })
            .from(projects)
            .where(and(eq(projects.id, id), eq(projects.userId, userId)));

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Get totals by event type
        const totals = await db
            .select({
                eventType: analyticsEvents.eventType,
                count: sql<number>`count(*)`.as("count"),
            })
            .from(analyticsEvents)
            .where(eq(analyticsEvents.projectId, id))
            .groupBy(analyticsEvents.eventType);

        // Get daily view counts for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyViews = await db
            .select({
                date: sql<string>`date(${analyticsEvents.createdAt})`.as("date"),
                count: sql<number>`count(*)`.as("count"),
            })
            .from(analyticsEvents)
            .where(
                and(
                    eq(analyticsEvents.projectId, id),
                    eq(analyticsEvents.eventType, "view"),
                    sql`${analyticsEvents.createdAt} >= ${thirtyDaysAgo.toISOString()}`,
                ),
            )
            .groupBy(sql`date(${analyticsEvents.createdAt})`)
            .orderBy(sql`date(${analyticsEvents.createdAt})`);

        // Calculate summary
        const totalViews = totals.find((t) => t.eventType === "view")?.count || 0;
        const totalRotates = totals.find((t) => t.eventType === "rotate")?.count || 0;
        const totalZooms = totals.find((t) => t.eventType === "zoom")?.count || 0;
        const totalHotspotClicks = totals.find((t) => t.eventType === "hotspot_click")?.count || 0;

        return NextResponse.json({
            totalViews,
            totalInteractions: totalRotates + totalZooms + totalHotspotClicks,
            breakdown: {
                views: totalViews,
                rotates: totalRotates,
                zooms: totalZooms,
                hotspotClicks: totalHotspotClicks,
            },
            dailyViews,
        });
    } catch (error) {
        console.error("Analytics GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
