import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/index";
import { projects } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { deleteFromR2, getR2KeyFromUrl } from "@/lib/r2";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/projects/[id] — get single project
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, id), eq(projects.userId, userId)));

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 },
            );
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error("Get project error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// PATCH /api/projects/[id] — update viewer configuration
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { name, intensity, autoRotate, environment, bgColor } = body;

        // Build update object with only provided fields
        const updateData: Record<string, unknown> = {
            updatedAt: new Date().toISOString(),
        };
        if (name !== undefined) updateData.name = name;
        if (intensity !== undefined) updateData.intensity = String(intensity);
        if (autoRotate !== undefined) updateData.autoRotate = autoRotate;
        if (environment !== undefined) updateData.environment = environment;
        if (bgColor !== undefined) updateData.bgColor = bgColor;

        const result = await db
            .update(projects)
            .set(updateData)
            .where(and(eq(projects.id, id), eq(projects.userId, userId)))
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 },
            );
        }

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error("Update project error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}

// DELETE /api/projects/[id] — delete project and file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get project to find the file URL
        const [project] = await db
            .select()
            .from(projects)
            .where(and(eq(projects.id, id), eq(projects.userId, userId)));

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 },
            );
        }

        // Delete from R2
        try {
            const r2Key = getR2KeyFromUrl(project.fileUrl);
            await deleteFromR2(r2Key);
        } catch (r2Error) {
            console.error("R2 delete error (continuing):", r2Error);
        }

        // Delete from DB
        await db
            .delete(projects)
            .where(and(eq(projects.id, id), eq(projects.userId, userId)));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete project error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
