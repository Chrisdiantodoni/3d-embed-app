import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  deleteProjectEmbedDomain,
  getOwnedProject,
} from "@/lib/project-embed-domains";

type RouteContext = {
  params: Promise<{ id: string; domainId: string }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, domainId } = await params;
    const project = await getOwnedProject(id, userId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const deleted = await deleteProjectEmbedDomain(id, domainId);

    if (!deleted) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete embed domain:", error);
    return NextResponse.json(
      { error: "Failed to delete embed domain." },
      { status: 500 },
    );
  }
}
