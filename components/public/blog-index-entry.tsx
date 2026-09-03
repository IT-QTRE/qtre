import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { BlogPostRow } from "@/components/public/blog-post-link";
import { cn } from "@/lib/utils";

export function BlogIndexEntry({
  post,
  dateLabel,
  eager = false,
  featured = false,
  compact = false,
  heading: Heading = "h2",
}: {
  post: BlogPostRow;
  dateLabel: string;
  eager?: boolean;
  featured?: boolean;
  compact?: boolean;
  heading?: "h2" | "h3";
}) {
  const alt = post.imageAlt?.trim() ?? "";

  return (
    <Link
      href={post.href}
      className={cn(
        "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        compact ? "flex items-start gap-5 sm:gap-6" : "flex h-full flex-col",
      )}
    >
      <span
        className={cn(
          "relative overflow-hidden rounded-xl bg-primary",
          compact
            ? "aspect-16/10 w-28 shrink-0 sm:w-32 lg:w-36"
            : "mb-3 block aspect-16/10 sm:mb-6",
        )}
      >
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt={alt}
            fill
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            sizes={
              compact
                ? "9rem"
                : featured
                  ? "(min-width: 1024px) 24rem, 100vw"
                  : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            }
            priority={eager}
            loading={eager ? "eager" : "lazy"}
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-x-6 bottom-6 h-px bg-secondary/80 sm:inset-x-7 sm:bottom-7"
          />
        )}
      </span>
      <span className="min-w-0">
        <Heading
          className={cn(
            "font-heading font-semibold leading-snug tracking-tight text-balance text-foreground transition-colors duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none group-hover:text-primary",
            featured ? "text-xl sm:text-2xl" : compact ? "text-base sm:text-lg" : "text-base sm:text-xl line-clamp-3 sm:line-clamp-none",
          )}
        >
          {post.title}
        </Heading>
        <p className={cn("text-sm text-secondary", compact ? "mt-2" : "mt-2 sm:mt-5")}>
          <time dateTime={new Date(post.publishedAt).toISOString()}>{dateLabel}</time>
          {post.topic ? <span> · {post.topic}</span> : null}
        </p>
      </span>
    </Link>
  );
}
