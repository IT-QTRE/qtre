import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { MEDIA_ACCESS_CONFIG, requiredPathnamePrefix } from "@/convex/lib/mediaAccessConfig";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";

type UploadContext = { entityType: MediaEntityType; entityId: string };

function parseUploadContext(clientPayload: string | null): UploadContext {
  if (!clientPayload) {
    throw new Error("Missing upload context");
  }
  return JSON.parse(clientPayload) as UploadContext;
}

function tokenForEntityType(entityType: MediaEntityType): string {
  const isPrivate = MEDIA_ACCESS_CONFIG[entityType].access === "private";
  const token = isPrivate ? process.env.PRIVATE_BLOB_READ_WRITE_TOKEN : process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    // Fail closed: falling back to `undefined` here would make handleUpload
    // silently default to BLOB_READ_WRITE_TOKEN (the PUBLIC store) even for
    // a private-only entity type, uploading confidential documents to a
    // public bucket with no indication anything went wrong.
    throw new Error(`Missing ${isPrivate ? "PRIVATE_BLOB_READ_WRITE_TOKEN" : "BLOB_READ_WRITE_TOKEN"} env var`);
  }
  return token;
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  // Which Blob store's token to use is decided from clientPayload BEFORE
  // calling handleUpload() — the `access` field returned from
  // onBeforeGenerateToken below is NOT part of its allowed return shape
  // (access is a property of the store/token used to generate the client
  // token, not something handleUpload lets you set per-call). Both event
  // types carry the same payload string (as `clientPayload` on the initial
  // token request, echoed back as `tokenPayload` on the completed
  // callback) — checking only one leaves the other event type always
  // falling back to the public store's token, breaking signature
  // verification for private uploads' completed callbacks.
  const payload =
    body.type === "blob.generate-client-token" ? body.payload.clientPayload : body.payload.tokenPayload;
  const token = payload ? tokenForEntityType(parseUploadContext(payload).entityType) : undefined;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname, rawClientPayload) => {
        const { getToken } = await auth();
        const authToken = (await getToken()) ?? undefined;
        if (!authToken) {
          throw new Error("Not authenticated");
        }

        const { entityType, entityId } = parseUploadContext(rawClientPayload);

        // Role + ownership check — mirrored independently by
        // convex/mediaItems.ts's create mutation itself, so this route is
        // never the only enforcement point.
        await fetchQuery(api.mediaItems.checkUploadAuthorization, { entityType, entityId }, { token: authToken });

        // Reject any pathname the client tries to request outside its own
        // entity's namespace — see convex/lib/mediaAccessConfig.ts's
        // requiredPathnamePrefix for why this matters.
        if (!pathname.startsWith(requiredPathnamePrefix(entityType, entityId))) {
          throw new Error("Pathname does not belong to this entity");
        }

        const config = MEDIA_ACCESS_CONFIG[entityType];
        return {
          allowedContentTypes: config.allowedContentTypes,
          maximumSizeInBytes: config.maxSizeBytes,
          addRandomSuffix: true,
          tokenPayload: rawClientPayload,
        };
      },
      onUploadCompleted: async () => {
        // Intentionally a no-op — see this plan's Architecture Decisions
        // item 2. The mediaItems row is created by the client calling
        // convex/mediaItems.ts's `create` mutation directly right after
        // upload() resolves (media-uploader.tsx), not here.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
