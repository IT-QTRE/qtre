import { getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BlogIndexEntry } from "@/components/public/blog-index-entry";
import type { BlogPostRow } from "@/components/public/blog-post-link";
import { formatPublishedAt } from "@/lib/format/published-at";
import type { AppLocale } from "@/i18n/routing";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export type BlogNote = BlogPostRow;

export async function BlogNotes({
  heading,
  seeAllLabel,
  hint,
  notes,
}: {
  heading: string;
  seeAllLabel: string;
  hint?: string;
  notes: BlogNote[];
}) {
  const locale = (await getLocale()) as AppLocale;
  const posts = notes.slice(0, 5);
  const lead = posts[0];
  const rest = posts.slice(1);

  if (!lead) return null;

  return (
    <section className="relative bg-background text-foreground" aria-labelledby="blog-notes-heading">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
      <div className={cn("w-full py-20 sm:py-28", publicGutter)}>
        <div className="flex items-baseline justify-between gap-4">
          <h2
            id="blog-notes-heading"
            className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
          >
            {heading}
          </h2>
          <Link
            href="/blog"
            className="shrink-0 text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {seeAllLabel}
          </Link>
        </div>
        {hint ? (
          <p className="mt-6 max-w-prose text-sm leading-relaxed text-foreground/80">{hint}</p>
        ) : null}

        {rest.length === 0 ? (
          <div className={cn(hint ? "mt-10" : "mt-12 sm:mt-16", "max-w-md")}>
            <BlogIndexEntry
              post={lead}
              dateLabel={formatPublishedAt(lead.publishedAt, locale)}
              heading="h3"
              eager
            />
          </div>
        ) : (
          <div
            className={cn(
              hint ? "mt-10" : "mt-12 sm:mt-16",
              "grid gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start lg:gap-x-12",
            )}
          >
            <BlogIndexEntry
              post={lead}
              dateLabel={formatPublishedAt(lead.publishedAt, locale)}
              heading="h3"
              featured
              eager
            />
            <ul className="flex flex-col gap-8 lg:gap-10">
              {rest.map((post) => (
                <li key={post.id}>
                  <BlogIndexEntry
                    post={post}
                    dateLabel={formatPublishedAt(post.publishedAt, locale)}
                    heading="h3"
                    compact
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
