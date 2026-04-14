import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  addProjectEmbedDomain,
  getOwnedProject,
  listProjectEmbedDomains,
} from "@/lib/project-embed-domains";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await getOwnedProject(id, userId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const domains = await listProjectEmbedDomains(id);

    return NextResponse.json({ domains });
  } catch (error) {
    console.error("Failed to list embed domains:", error);
    return NextResponse.json(
      { error: "Failed to load embed domains." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await getOwnedProject(id, userId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const body = (await request.json()) as { domain?: unknown };
    const domainInput = typeof body.domain === "string" ? body.domain : "";
    const result = await addProjectEmbedDomain(id, domainInput);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ domain: result.domain }, { status: 201 });
  } catch (error) {
    console.error("Failed to add embed domain:", error);
    return NextResponse.json(
      { error: "Failed to add embed domain." },
      { status: 500 },
    );
  }
}
