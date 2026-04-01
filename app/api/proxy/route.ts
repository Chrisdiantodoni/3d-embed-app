import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "No URL provided" }, { status: 400 });
  }

  // Whitelist domain R2 kamu
  if (!url.startsWith("https://pub-9e69d67f0bf3407992765577a7c517ea.r2.dev/")) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
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
