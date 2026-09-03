import { CatalogEmpty } from "@/components/public/catalog-empty";
import { BlogIndexEntry } from "@/components/public/blog-index-entry";
import { BlogFilterBar } from "@/components/public/blog-filter-bar";
import type { BlogPostRow } from "@/components/public/blog-post-link";
import { DirectoryHero } from "@/components/public/directory-hero";
import { formatPublishedAt } from "@/lib/format/published-at";
import { blogHasFilters, blogSearchHref, type BlogSearch } from "@/lib/blog-search";
import type { AppLocale } from "@/i18n/routing";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

export function BlogDirectory({
  title,
  intro,
  empty,
  countLabel,
  listLabel,
  locale,
  posts,
  search,
  topics,
  clearLabel,
}: {
  title: string;
  intro: string;
  empty: string;
  countLabel: string | null;
  listLabel: string;
  locale: AppLocale;
  posts: BlogPostRow[];
  search: BlogSearch;
  topics: { slug: string; name: string }[];
  clearLabel: string;
}) {
  return (
    <main id="main">
      <DirectoryHero title={title} intro={intro} countLabel={countLabel} headingId="blog-directory-heading" />

      <div className="border-b border-border bg-background">
        <BlogFilterBar search={search} topics={topics} />
      </div>

      {posts.length === 0 ? (
        <div className={cn("py-16 sm:py-20", publicGutter)}>
          <CatalogEmpty>{empty}</CatalogEmpty>
          {blogHasFilters(search) ? (
            <p className="mt-6">
              <Link
                href={blogSearchHref()}
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {clearLabel}
              </Link>
            </p>
          ) : null}
        </div>
      ) : (
        <section aria-label={listLabel} className={cn("bg-background py-10 sm:py-20 lg:py-24", publicGutter)}>
          <ul
            className={cn(
              "grid gap-x-4 gap-y-8 sm:gap-x-8 sm:gap-y-14 lg:gap-x-10",
              posts.length === 1 ? "max-w-md" : "grid-cols-2 lg:grid-cols-3",
            )}
          >
            {posts.map((post, index) => (
              <li key={post.id}>
                <BlogIndexEntry
                  post={post}
                  dateLabel={formatPublishedAt(post.publishedAt, locale)}
                  eager={index < 3}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
