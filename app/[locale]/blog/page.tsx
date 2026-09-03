import type { Metadata } from "next";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { BlogDirectory } from "@/components/public/blog-directory";
import { pickLocalized } from "@/lib/i18n/localized";
import { blogHasFilters, blogQueryArgs, blogSearchFromParams } from "@/lib/blog-search";
import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

type Search = { q?: string; topic?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const search = blogSearchFromParams(await searchParams);
  const [localeRaw, tSection, tCatalog, tBrand, posts] = await Promise.all([
    getLocale(),
    getTranslations("section"),
    getTranslations("catalog"),
    getTranslations("brand"),
    fetchPublicQuery(api.publicCatalog.listPublishedBlogPosts, blogQueryArgs(search)),
  ]);
  const locale = localeRaw as AppLocale;
  const title = tSection("blogTitle");
  const description = posts.length > 0 ? tCatalog("blogMetaDescription") : tSection("blogBody");
  const canonical = `${siteUrl}/${locale}/blog`;
  const filtered = blogHasFilters(search);
  return {
    title: `${title} | ${tBrand("name")}`,
    description,
    alternates: { canonical },
    robots: filtered ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = blogSearchFromParams(await searchParams);
  const [localeRaw, tSection, tCatalog, posts, topics] = await Promise.all([
    getLocale(),
    getTranslations("section"),
    getTranslations("catalog"),
    fetchPublicQuery(api.publicCatalog.listPublishedBlogPosts, blogQueryArgs(search)),
    fetchPublicQuery(api.publicCatalog.listPublishedBlogTopics, {}),
  ]);
  const locale = localeRaw as AppLocale;
  const filtered = blogHasFilters(search);

  return (
    <BlogDirectory
      title={tSection("blogTitle")}
      intro={tCatalog("blogIntro")}
      empty={filtered ? tCatalog("blogEmptyFiltered") : tSection("blogBody")}
      countLabel={posts.length > 0 ? tCatalog("blogCount", { count: posts.length }) : null}
      listLabel={tCatalog("blogListLabel")}
      locale={locale}
      search={search}
      topics={topics.map((topic) => ({ slug: topic.slug, name: pickLocalized(topic.name, locale) }))}
      clearLabel={tCatalog("blogClearFilters")}
      posts={posts.map((post) => ({
        id: post._id,
        title: pickLocalized(post.title, locale),
        publishedAt: post.publishedAt,
        href: `/blog/${post.slug}`,
        imageUrl: post.imageUrl,
        imageAlt: post.imageAlt ? pickLocalized(post.imageAlt, locale) : null,
        topic: post.category ? pickLocalized(post.category.name, locale) : null,
      }))}
    />
  );
}
