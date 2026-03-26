import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { db } from "@/src/index";
import { hotspots, projects } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/projects/[id]/hotspots — list hotspots for a project
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

        const projectHotspots = await db
            .select()
            .from(hotspots)
            .where(eq(hotspots.projectId, id));

        return NextResponse.json(projectHotspots);
    } catch (error) {
        console.error("List hotspots error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/projects/[id]/hotspots — create a new hotspot
export async function POST(request: NextRequest, { params }: RouteParams) {
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

        const body = await request.json();
        const { positionX, positionY, positionZ, label, description, linkUrl } = body;

        if (!label || positionX === undefined || positionY === undefined || positionZ === undefined) {
            return NextResponse.json(
                { error: "label, positionX, positionY, positionZ are required" },
                { status: 400 },
            );
        }

        const hotspotId = nanoid(12);
        const now = new Date().toISOString();

        const [newHotspot] = await db
            .insert(hotspots)
            .values({
                id: hotspotId,
                projectId: id,
                positionX: String(positionX),
                positionY: String(positionY),
                positionZ: String(positionZ),
                label: label.trim(),
                description: description?.trim() || null,
                linkUrl: linkUrl?.trim() || null,
                createdAt: now,
            })
            .returning();

        return NextResponse.json(newHotspot, { status: 201 });
    } catch (error) {
        console.error("Create hotspot error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
