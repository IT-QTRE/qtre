import Image from "next/image";
import { ImageOff } from "lucide-react";

export type PrimaryMediaItem = { url: string; mimeType: string } | null;

// Leftmost column across every admin list table (Properties, Projects,
// Developers, Agents, Communities) — lets an admin visually scan for which
// rows even have a photo yet without opening each one. `item === undefined`
// (the batched query for this page hasn't resolved) renders the same muted
// placeholder as `null` (genuinely no photo) rather than a loading skeleton,
// since this is a small, low-priority affordance — not worth a distinct
// loading state.
export function ThumbnailCell({ item }: { item: PrimaryMediaItem | undefined }) {
  if (item && item.mimeType.startsWith("image/")) {
    return (
      <div className="relative size-10 overflow-hidden rounded-md border border-border bg-muted">
        <Image src={item.url} alt="" fill sizes="40px" className="object-cover" />
      </div>
    );
  }
  return (
    <div className="flex size-10 items-center justify-center rounded-md border border-dashed border-border bg-muted text-muted-foreground">
      <ImageOff className="size-4" />
    </div>
  );
}
