import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createEmbedToken, normalizeAllowedDomain } from "@/lib/embed-auth";
import {
  getOwnedProject,
  listProjectEmbedDomains,
} from "@/lib/project-embed-domains";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json()) as {
      previewOrigin?: unknown;
    };
    const previewOrigin = typeof body.previewOrigin === "string"
      ? normalizeAllowedDomain(body.previewOrigin)
      : null;

    const project = await getOwnedProject(id, userId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const storedDomains = await listProjectEmbedDomains(id);
    const uniqueDomains = [
      ...new Set(storedDomains.map((item) => item.domain).concat(previewOrigin ?? [])),
    ];

    if (storedDomains.length === 0) {
      return NextResponse.json(
        { error: "Add at least one saved domain before exporting." },
        { status: 400 },
      );
    }

    const token = createEmbedToken({
      projectId: id,
      allowedDomains: uniqueDomains,
    });

    return NextResponse.json({
      token,
      allowedDomains: uniqueDomains,
      expiresInDays: 30,
    });
  } catch (error) {
    console.error("Failed to create embed token:", error);
    return NextResponse.json(
      { error: "Failed to create embed token." },
      { status: 500 },
    );
  }
}
