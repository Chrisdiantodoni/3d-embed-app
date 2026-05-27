import { NextRequest, NextResponse } from "next/server";
import { getProjectById } from "@/app/api/projects/[id]/route";
import { verifyEmbedToken } from "@/lib/embed-auth";
import { getProjectActiveEmbedToken } from "@/lib/project-embed-access";

export async function GET(request: NextRequest) {
  try {
  const url = request.nextUrl.searchParams.get("url");
  const token = request.nextUrl.searchParams.get("token");
  const projectId = request.nextUrl.searchParams.get("projectId");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

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
    const activeToken = await getProjectActiveEmbedToken(projectId);
    if (
      !verifiedToken.ok ||
      verifiedToken.payload.projectId !== projectId ||
      !activeToken ||
      activeToken !== token
    ) {
      return NextResponse.json({ error: "Invalid embed token" }, { status: 403 });
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
    throw new Error(
      `R2 fetch failed with status ${response.status}: ${url}`,
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
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: "Proxy error", detail: String(error) },
      { status: 500 },
    );
  }
}
