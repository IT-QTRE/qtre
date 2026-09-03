import Image from "next/image";
import { ImageOff } from "lucide-react";

export type PrimaryMediaItem = { url: string; mimeType: string } | null;

// Photo preview on admin inventory lists. `item === undefined` (the batched
// query hasn't resolved) renders the same muted placeholder as `null`
// (no photo) — not worth a distinct loading state here.
export function ThumbnailCell({
  item,
  alt = "",
  objectTop = false,
}: {
  item: PrimaryMediaItem | undefined;
  alt?: string;
  objectTop?: boolean;
}) {
  if (item && item.mimeType.startsWith("image/")) {
    return (
      <div className="relative size-10 overflow-hidden border border-border bg-muted">
        <Image
          src={item.url}
          alt={alt}
          fill
          sizes="40px"
          className={objectTop ? "object-cover object-top" : "object-cover"}
        />
      </div>
    );
  }
  return (
    <div className="flex size-10 items-center justify-center border border-dashed border-border bg-muted text-muted-foreground">
      <ImageOff className="size-4" />
    </div>
  );
}
