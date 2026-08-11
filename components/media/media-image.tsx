import Image, { type ImageProps } from "next/image";
import type { MediaEntityType } from "@/convex/lib/mediaEntityType";
import type { Id } from "@/convex/_generated/dataModel";

type MediaImageProps = Omit<ImageProps, "src"> & {
  mediaItemId: Id<"mediaItems">;
  url: string;
  entityType: MediaEntityType;
  mimeType: string;
};

// Public entity types (property/project/etc.): next/image against the
// direct Blob CDN URL, same as any other remote image — gets Vercel's
// image optimization. propertySubmission (private): a plain <img> against
// the authenticated delivery route (Task 9) — next/image's own optimizer
// can't carry our auth cookie/token through its fetch, and these are
// internal review-screen documents, not public marketing images, so
// skipping optimization here is the right tradeoff.
//
// propertySubmission also allows PDF documents (MEDIA_ACCESS_CONFIG), which
// a browser can't render inside <img> — a PDF there would just show a
// broken-image icon. Non-image mime types get a document link instead,
// opened in a new tab against the same authenticated delivery route.
export function MediaImage({ mediaItemId, url, entityType, mimeType, alt, ...imageProps }: MediaImageProps) {
  if (entityType === "propertySubmission") {
    const deliveryUrl = `/api/blob/private?mediaItemId=${mediaItemId}`;
    if (!mimeType.startsWith("image/")) {
      return (
        <a
          href={deliveryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted text-xs text-muted-foreground"
        >
          <span aria-hidden>📄</span>
          <span>View document</span>
        </a>
      );
    }
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={deliveryUrl} alt={alt} className="h-full w-full object-cover" />;
  }
  return <Image src={url} alt={alt} {...imageProps} />;
}
