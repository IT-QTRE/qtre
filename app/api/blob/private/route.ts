import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const mediaItemId = request.nextUrl.searchParams.get("mediaItemId");
  if (!mediaItemId) {
    return NextResponse.json({ error: "Missing mediaItemId" }, { status: 400 });
  }

  const { getToken } = await auth();
  const token = (await getToken()) ?? undefined;
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let record;
  try {
    record = await fetchQuery(
      api.mediaItems.getForPrivateDelivery,
      { mediaItemId: mediaItemId as Id<"mediaItems"> },
      { token },
    );
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const privateToken = process.env.PRIVATE_BLOB_READ_WRITE_TOKEN;
  if (!privateToken) {
    // Fail closed rather than letting get() silently fall back to
    // BLOB_READ_WRITE_TOKEN (the public store), which would just 404 on a
    // private pathname instead of surfacing the real misconfiguration.
    return NextResponse.json({ error: "Server misconfigured: missing private blob token" }, { status: 500 });
  }

  const result = await get(record.pathname, {
    access: "private",
    token: privateToken,
  });
  if (result?.statusCode !== 200) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
      // Per Vercel's private-storage guidance: never let this be cached by
      // the CDN (no s-maxage) — only the requesting browser, and only
      // after this same authorization check re-runs on every request.
      "Cache-Control": "private, no-cache",
    },
  });
}
