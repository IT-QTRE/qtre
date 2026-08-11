"use server";

import { auth } from "@clerk/nextjs/server";
import { del } from "@vercel/blob";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export async function deleteMediaItem(mediaItemId: Id<"mediaItems">): Promise<void> {
  const { getToken } = await auth();
  const token = (await getToken()) ?? undefined;
  if (!token) {
    throw new Error("Not authenticated");
  }

  // Throws (ForbiddenError, surfaced as a generic Convex error to this
  // caller) if the signed-in user isn't allowed to delete this item —
  // neither deleteRecord nor del() below run for an unauthorized caller.
  // Returns null (rather than throwing) if the item is already gone — e.g.
  // a double-click on "Remove", or a stale client list that hadn't yet
  // caught up with an earlier delete — which is a no-op, not an error.
  const result = await fetchQuery(api.mediaItems.getForDelete, { mediaItemId }, { token });
  if (!result) {
    return;
  }
  const { pathname, access } = result;

  const blobToken = access === "private" ? process.env.PRIVATE_BLOB_READ_WRITE_TOKEN : process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    // Fail closed: an undefined token would make del() silently fall back
    // to BLOB_READ_WRITE_TOKEN (the public store), which for a private
    // pathname would just fail to find the object rather than deleting it
    // — better to surface the misconfiguration than to fail silently.
    throw new Error(`Missing ${access === "private" ? "PRIVATE_BLOB_READ_WRITE_TOKEN" : "BLOB_READ_WRITE_TOKEN"} env var`);
  }

  // Delete the Convex row BEFORE the Blob object (reversed from the naive
  // order). deleteRecord re-checks authorization independently rather than
  // trusting getForDelete above — see Global Constraints — so if the item
  // became ineligible between the two checks (e.g. its submission's status
  // changed to under_review concurrently), deleteRecord throws and del()
  // never runs, leaving the blob untouched. If del() fails after
  // deleteRecord already succeeded, the Convex row is gone but the Blob
  // object survives as a harmless orphan (wasted storage, never a security
  // issue) — the opposite ordering risks the reverse: a live Convex row
  // whose blob was already destroyed out from under an in-flight
  // authorization race.
  await fetchMutation(api.mediaItems.deleteRecord, { mediaItemId }, { token });

  await del(pathname, { token: blobToken });
}
