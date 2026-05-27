import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  ensureOrCreateProjectEmbedToken,
  getProjectEmbedAccess,
  regenerateProjectEmbedToken,
  revokeProjectEmbedToken,
} from "@/lib/project-embed-access";
import { verifyEmbedToken } from "@/lib/embed-auth";
import { getOwnedProject } from "@/lib/project-embed-domains";

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

    const access = await getProjectEmbedAccess(id);

    const activeToken = access?.activeToken ?? null;
    const verified = activeToken ? verifyEmbedToken(activeToken) : null;

    return NextResponse.json({
      hasActiveToken: Boolean(activeToken),
      activeToken,
      updatedAt: access?.updatedAt ?? null,
      isExpired: Boolean(activeToken && verified && !verified.ok),
    });
  } catch (error) {
    console.error("Failed to load embed access:", error);
    return NextResponse.json(
      { error: "Failed to load embed access." },
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

    const body = (await request.json()) as {
      action?: unknown;
    };
    const action = typeof body.action === "string" ? body.action : "ensure";

    if (action === "revoke") {
      await revokeProjectEmbedToken(id);
      return NextResponse.json({
        hasActiveToken: false,
        activeToken: null,
      });
    }

    const result =
      action === "regenerate"
        ? await regenerateProjectEmbedToken(id)
        : await ensureOrCreateProjectEmbedToken(id);

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      hasActiveToken: true,
      activeToken: result.token,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    console.error("Failed to update embed access:", error);
    return NextResponse.json(
      { error: "Failed to update embed access." },
      { status: 500 },
    );
  }
}
