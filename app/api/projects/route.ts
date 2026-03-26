import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/src/index";
import { projects } from "@/src/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/projects — list current user's projects
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userProjects = await db
            .select()
            .from(projects)
            .where(eq(projects.userId, userId))
            .orderBy(desc(projects.createdAt));

        return NextResponse.json(userProjects);
    } catch (error) {
        console.error("List projects error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 },
        );
    }
}
