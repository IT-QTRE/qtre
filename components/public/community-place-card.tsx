import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function CommunityPlaceCard({
  href,
  name,
  city,
  excerpt,
  imageUrl,
  imageAlt,
  photoLabel,
  eager = false,
}: {
  href: string;
  name: string;
  city: string;
  excerpt: string;
  imageUrl: string | null;
  imageAlt?: string;
  photoLabel: string;
  eager?: boolean;
}) {
  return (
    <article>
      <Link
        href={href}
        className="group block touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-accent sm:aspect-4/3">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt ?? name}
              fill
              priority={eager}
              loading={eager ? "eager" : "lazy"}
              className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 50vw"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-foreground/80">
              <ImageIcon className="size-6" aria-hidden />
              <span>{photoLabel}</span>
            </div>
          )}
        </div>
        <h2 className="mt-3 font-heading text-base font-semibold tracking-tight text-pretty text-foreground sm:mt-4 sm:text-lg">
          {name}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{city}</p>
        {excerpt.trim() ? (
          <p className="mt-2 hidden text-sm leading-relaxed text-pretty text-foreground/80 line-clamp-2 sm:block">
            {excerpt}
          </p>
        ) : null}
      </Link>
    </article>
  );
}
