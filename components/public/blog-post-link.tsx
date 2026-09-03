import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type BlogPostRow = {
  id: string;
  title: string;
  publishedAt: number;
  href: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  topic?: string | null;
};

const ruleEase =
  "transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none";

export function BlogPostLink({
  post,
  dateLabel,
  featured = false,
  heading: Heading = "h3",
  eager = false,
}: {
  post: BlogPostRow;
  dateLabel: string;
  featured?: boolean;
  heading?: "h2" | "h3";
  eager?: boolean;
}) {
  const alt = post.imageAlt?.trim() ?? "";
  const cover = post.imageUrl ? (
    <span className="relative aspect-video w-28 shrink-0 overflow-hidden bg-muted sm:w-36 lg:w-40">
      <Image
        src={post.imageUrl}
        alt={alt}
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 10rem, (min-width: 640px) 9rem, 7rem"
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
      />
    </span>
  ) : null;

  return (
    <Link
      href={post.href}
      className={cn(
        "group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        cover ? "flex items-start gap-5 sm:gap-8" : null,
      )}
    >
      {cover}
      <span className="min-w-0">
        <time className="text-sm text-secondary" dateTime={new Date(post.publishedAt).toISOString()}>
          {dateLabel}
        </time>
        <Heading
          className={cn(
            "mt-2 font-heading font-semibold tracking-tight text-balance text-foreground transition-colors duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none group-hover:text-primary",
            featured
              ? "text-[clamp(1.5rem,3.4vw,2.5rem)] leading-[1.2]"
              : "text-lg leading-snug sm:text-xl",
          )}
        >
          {post.title}
        </Heading>
        <span
          className={cn(
            "mt-4 block h-px bg-secondary",
            ruleEase,
            featured ? "w-10 group-hover:w-20" : "w-8 group-hover:w-14",
          )}
        />
      </span>
    </Link>
  );
}
