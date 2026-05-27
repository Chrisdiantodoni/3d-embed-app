import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { nanoid } from "nanoid";
import { uploadToR2 } from "@/lib/r2";
import {
    MAX_FILE_SIZE_BYTES,
    ALLOWED_EXTENSIONS,
    MAX_PROJECTS_FREE,
} from "@/lib/constants";
import { db } from "@/src/index";
import { projects } from "@/src/db/schema";
import { eq, count } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check free-tier project limit
        const [projectCount] = await db
            .select({ count: count() })
            .from(projects)
            .where(eq(projects.userId, userId));

        if (projectCount.count >= MAX_PROJECTS_FREE) {
            return NextResponse.json(
                {
                    error: `Free tier limit reached. Maximum ${MAX_PROJECTS_FREE} projects allowed.`,
                },
                { status: 403 },
            );
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const name = formData.get("name") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!name || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Project name is required" },
                { status: 400 },
            );
        }

        // Validate file extension
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return NextResponse.json(
                { error: "Only .glb files are allowed" },
                { status: 400 },
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json(
                { error: "File size exceeds 50MB limit" },
                { status: 400 },
            );
        }

        // Upload to R2
        const fileId = nanoid();
        const r2Key = `${userId}/${fileId}.glb`;
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileUrl = await uploadToR2(r2Key, buffer, "model/gltf-binary");

        // Create project in DB
        const projectId = nanoid(12);
        const now = new Date().toISOString();

        await db.insert(projects).values({
            id: projectId,
            userId,
            name: name.trim(),
            description: file.name,
            thumbnailUrl: fileUrl,
            lightingSettings: "{}",
            cameraSettings: "{}",
        });

        return NextResponse.json(
            {
                id: projectId,
                name: name.trim(),
                fileUrl,
                fileName: file.name,
                fileSize: file.size,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
