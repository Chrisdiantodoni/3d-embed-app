import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { db } from "@/src/index";
import { analyticsEvents, projects } from "@/src/db/schema";
import { eq } from "drizzle-orm";

// POST /api/analytics — public endpoint to record events (no auth)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, eventType, metadata } = body;

        if (!projectId || !eventType) {
            return NextResponse.json(
                { error: "projectId and eventType are required" },
                { status: 400 },
            );
        }

        const validEvents = ["view", "rotate", "zoom", "hotspot_click"];
        if (!validEvents.includes(eventType)) {
            return NextResponse.json(
                { error: "Invalid event type" },
                { status: 400 },
            );
        }

        // Verify the project exists
        const [project] = await db
            .select({ id: projects.id })
            .from(projects)
            .where(eq(projects.id, projectId));

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 },
            );
        }

        await db.insert(analyticsEvents).values({
            id: nanoid(16),
            projectId,
            eventType,
            metadata: metadata ? JSON.stringify(metadata) : null,
            createdAt: new Date().toISOString(),
        });

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error("Analytics error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
