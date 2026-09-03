import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function CommunityFeaturedProject({
  label,
  name,
  developer,
  price,
  body,
  cta,
  href,
  imageUrl,
  photoLabel,
}: {
  label: string;
  name: string;
  developer?: string;
  price?: string;
  body?: string;
  cta: string;
  href: string;
  imageUrl?: string | null;
  photoLabel: string;
}) {
  return (
    <section className="relative bg-primary text-primary-foreground" aria-labelledby="community-featured-heading">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
      <div
        className={cn(
          "grid gap-6 py-10 sm:gap-10 sm:py-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-x-16",
          publicGutter,
        )}
      >
        <div className="relative aspect-16/10 overflow-hidden bg-accent text-foreground/80 sm:aspect-4/3 lg:aspect-5/4">
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill className="object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <ImageIcon className="size-7" aria-hidden />
              <span className="font-heading text-sm font-medium tracking-tight">{photoLabel}</span>
            </div>
          )}
        </div>
        <div>
          <p className="font-heading text-sm font-medium tracking-[0.16em] text-secondary uppercase">{label}</p>
          <h2
            id="community-featured-heading"
            className="mt-5 font-heading text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.05] tracking-tight text-balance"
          >
            {name}
          </h2>
          {developer ? (
            <p className="mt-3 font-heading text-base font-medium text-primary-foreground/80">{developer}</p>
          ) : null}
          <div className="mt-6 h-px w-16 bg-secondary" aria-hidden />
          {price ? <p className="mt-6 font-heading text-lg font-semibold tracking-tight">{price}</p> : null}
          {body ? (
            <p className="mt-4 max-w-prose text-sm leading-relaxed text-pretty text-primary-foreground/80 line-clamp-4 sm:text-base sm:line-clamp-none">
              {body}
            </p>
          ) : null}
          <Link
            href={href}
            className="mt-8 inline-flex min-h-12 items-center justify-center bg-secondary px-6 font-heading text-sm font-medium tracking-[0.14em] text-primary uppercase transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            {cta}
          </Link>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-secondary" />
    </section>
  );
}
