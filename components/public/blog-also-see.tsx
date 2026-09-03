import type { FunctionReturnType } from "convex/server";
import { getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { BlogPostLink } from "@/components/public/blog-post-link";
import { Link } from "@/i18n/navigation";
import { formatAed } from "@/lib/format/aed";
import { formatPublishedAt } from "@/lib/format/published-at";
import { pickLocalized } from "@/lib/i18n/localized";
import { catalogPath } from "@/lib/links/catalog-path";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

type RelatedItem = NonNullable<
  FunctionReturnType<typeof api.publicCatalog.getPublishedBlogPostBySlug>
>["related"][number];

const ruleEase =
  "transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none";

export async function BlogAlsoSee({
  items,
  locale,
}: {
  items: RelatedItem[];
  locale: AppLocale;
}) {
  if (items.length === 0) return null;
  const t = await getTranslations("catalog");

  return (
    <section className="mt-16 sm:mt-20" aria-labelledby="blog-also-see">
      <h2 id="blog-also-see" className="font-heading text-sm font-semibold tracking-tight text-primary">
        {t("blogAlsoSee")}
      </h2>
      <ul className="mt-6 space-y-8">
        {items.map((item) => (
          <li key={`${item.type}:${item.slug}`}>
            {item.type === "blogPost" ? (
              <BlogPostLink
                post={{
                  id: item.slug,
                  title: pickLocalized(item.title, locale),
                  publishedAt: item.publishedAt,
                  href: catalogPath("blogPost", item.slug),
                }}
                dateLabel={formatPublishedAt(item.publishedAt, locale)}
              />
            ) : (
              <CatalogRelatedLink
                href={catalogPath(item.type, item.slug)}
                title={pickLocalized(item.title, locale)}
                meta={
                  item.type === "property"
                    ? propertyMeta(item, t, locale)
                    : projectMeta(item, t, locale)
                }
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function propertyMeta(
  item: Extract<RelatedItem, { type: "property" }>,
  t: Awaited<ReturnType<typeof getTranslations<"catalog">>>,
  locale: AppLocale,
) {
  if (item.countryCode === "AE") {
    const status =
      item.listingStatus === "for_sale" ? t("forSale") : item.listingStatus === "for_rent" ? t("forRent") : null;
    const price = formatAed(item.price, locale);
    return status ? `${status} · ${price}` : price;
  }
  return pickLocalized(item.city, locale);
}

function projectMeta(
  item: Extract<RelatedItem, { type: "project" }>,
  t: Awaited<ReturnType<typeof getTranslations<"catalog">>>,
  locale: AppLocale,
) {
  if (item.startingPrice != null) return t("fromPrice", { price: formatAed(item.startingPrice, locale) });
  return pickLocalized(item.city, locale);
}

function CatalogRelatedLink({ href, title, meta }: { href: string; title: string; meta: string }) {
  return (
    <Link href={href} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="min-w-0">
        <span className="font-heading text-lg font-semibold leading-snug tracking-tight text-balance text-foreground transition-colors duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none group-hover:text-primary sm:text-xl">
          {title}
        </span>
        {meta ? <span className="mt-1 block text-sm text-muted-foreground">{meta}</span> : null}
        <span className={cn("mt-4 block h-px w-8 bg-secondary group-hover:w-14", ruleEase)} />
      </span>
    </Link>
  );
}
