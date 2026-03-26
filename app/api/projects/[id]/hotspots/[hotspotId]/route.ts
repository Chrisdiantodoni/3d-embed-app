import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/index";
import { hotspots, projects } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string; hotspotId: string }> };

// PATCH /api/projects/[id]/hotspots/[hotspotId] — update a hotspot
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id, hotspotId } = await params;
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

        const body = await request.json();
        const { label, description, linkUrl } = body;

        const updateData: Record<string, unknown> = {};
        if (label !== undefined) updateData.label = label.trim();
        if (description !== undefined) updateData.description = description?.trim() || null;
        if (linkUrl !== undefined) updateData.linkUrl = linkUrl?.trim() || null;

        const result = await db
            .update(hotspots)
            .set(updateData)
            .where(and(eq(hotspots.id, hotspotId), eq(hotspots.projectId, id)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: "Hotspot not found" }, { status: 404 });
        }

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error("Update hotspot error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/projects/[id]/hotspots/[hotspotId] — remove a hotspot
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id, hotspotId } = await params;
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

        const result = await db
            .delete(hotspots)
            .where(and(eq(hotspots.id, hotspotId), eq(hotspots.projectId, id)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: "Hotspot not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete hotspot error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
