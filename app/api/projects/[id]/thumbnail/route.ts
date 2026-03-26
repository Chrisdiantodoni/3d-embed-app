import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/index";
import { projects } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { uploadToR2 } from "@/lib/r2";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/projects/[id]/thumbnail — upload a captured thumbnail
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
        const { image } = body;

        if (!image || !image.startsWith("data:image/png;base64,")) {
            return NextResponse.json(
                { error: "Invalid image data. Must be a base64 PNG." },
                { status: 400 },
            );
        }

        // Extract base64 data and convert to buffer
        const base64Data = image.replace(/^data:image\/png;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Upload to R2
        const r2Key = `${userId}/${id}_thumb.png`;
        const thumbnailUrl = await uploadToR2(r2Key, buffer, "image/png");

        // Update project in DB
        await db
            .update(projects)
            .set({
                thumbnailUrl,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(projects.id, id));

        return NextResponse.json({ thumbnailUrl }, { status: 200 });
    } catch (error) {
        console.error("Thumbnail upload error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
