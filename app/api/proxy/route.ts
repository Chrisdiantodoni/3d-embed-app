import { NextRequest, NextResponse } from "next/server";
import { getProjectById } from "@/app/api/projects/[id]/route";
import { verifyEmbedToken } from "@/lib/embed-auth";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const token = request.nextUrl.searchParams.get("token");
  const projectId = request.nextUrl.searchParams.get("projectId");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Whitelist domain R2 kamu
  if (!url.startsWith("https://pub-9e69d67f0bf3407992765577a7c517ea.r2.dev/")) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  if (token || projectId) {
    if (!token || !projectId) {
      return NextResponse.json(
        { error: "Missing token or projectId" },
        { status: 400 },
      );
    }

    const verifiedToken = verifyEmbedToken(token);
    if (!verifiedToken.ok || verifiedToken.payload.projectId !== projectId) {
      return NextResponse.json({ error: "Invalid embed token" }, { status: 403 });
    }

    const requestOrigin = request.nextUrl.origin;
    const referer = request.headers.get("referer");
    if (!referer) {
      return NextResponse.json({ error: "Missing referer" }, { status: 403 });
    }

    try {
      const refererUrl = new URL(referer);
      if (
        refererUrl.origin !== requestOrigin ||
        refererUrl.pathname !== `/embed/${projectId}`
      ) {
        return NextResponse.json(
          { error: "Invalid embed referer" },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json({ error: "Invalid referer" }, { status: 403 });
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isProjectAsset = project.sceneAssets.some((asset) => asset.url === url);
    if (!isProjectAsset) {
      return NextResponse.json({ error: "Asset not allowed" }, { status: 403 });
    }
  }

  const response = await fetch(url);

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch" },
      { status: response.status },
    );
  }

  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}
