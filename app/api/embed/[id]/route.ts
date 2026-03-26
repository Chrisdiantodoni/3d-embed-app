import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/index";
import { projects, hotspots } from "@/src/db/schema";
import { eq } from "drizzle-orm";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/embed/[id] — public endpoint to get project viewer config (no auth required)
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const [project] = await db
            .select({
                id: projects.id,
                name: projects.name,
                fileUrl: projects.fileUrl,
                intensity: projects.intensity,
                autoRotate: projects.autoRotate,
                environment: projects.environment,
                bgColor: projects.bgColor,
            })
            .from(projects)
            .where(eq(projects.id, id));

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 },
            );
        }

        // Also fetch hotspots
        const projectHotspots = await db
            .select()
            .from(hotspots)
            .where(eq(hotspots.projectId, id));

        return NextResponse.json({ ...project, hotspots: projectHotspots });
    } catch (error) {
        console.error("Embed API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
