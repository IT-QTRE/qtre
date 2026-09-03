import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { BlogArticle } from "@/components/public/blog-article";
import { BlogAlsoSee } from "@/components/public/blog-also-see";
import { ProfileBreadcrumb } from "@/components/public/profile-breadcrumb";
import { pickLocalized } from "@/lib/i18n/localized";
import { formatPublishedAt } from "@/lib/format/published-at";
import { plainTextFromHtml, sanitizeBlogHtml } from "@/lib/sanitize-blog-html";
import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

function descriptionFromPost(
  post: {
    seoDescription: { en: string; ar?: string; tr?: string } | null;
    body: { en: string; ar?: string; tr?: string };
  },
  locale: AppLocale,
  fallback: string,
) {
  if (post.seoDescription) {
    const seo = pickLocalized(post.seoDescription, locale).replace(/\s+/g, " ").trim();
    if (seo) return seo.slice(0, 160);
  }
  const fromBody = plainTextFromHtml(pickLocalized(post.body, locale)).slice(0, 160).trim();
  return fromBody || fallback;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [localeRaw, tBrand, t, post] = await Promise.all([
    getLocale(),
    getTranslations("brand"),
    getTranslations("catalog"),
    fetchPublicQuery(api.publicCatalog.getPublishedBlogPostBySlug, { slug }),
  ]);
  if (!post) return { title: tBrand("name") };
  const locale = localeRaw as AppLocale;
  const title = post.seoTitle ? pickLocalized(post.seoTitle, locale) : pickLocalized(post.title, locale);
  const description = descriptionFromPost(post, locale, t("blogProfileFallback"));
  const canonical = `${siteUrl}/${locale}/blog/${slug}`;
  return {
    title: `${title} | ${tBrand("name")}`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      publishedTime: new Date(post.publishedAt).toISOString(),
      images: post.imageUrl ? [{ url: post.imageUrl }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [localeRaw, t, tNav, post] = await Promise.all([
    getLocale(),
    getTranslations("catalog"),
    getTranslations("nav"),
    fetchPublicQuery(api.publicCatalog.getPublishedBlogPostBySlug, { slug }),
  ]);
  const locale = localeRaw as AppLocale;
  if (!post) notFound();

  const title = pickLocalized(post.title, locale);
  const html = sanitizeBlogHtml(pickLocalized(post.body, locale));
  const imageAlt = post.imageAlt ? pickLocalized(post.imageAlt, locale) : "";

  return (
    <BlogArticle
      breadcrumb={
        <ProfileBreadcrumb
          label={t("breadcrumb")}
          homeLabel={tNav("home")}
          parentHref="/blog"
          parentLabel={tNav("blog")}
          current={title}
          tone="onPrimary"
        />
      }
      backLabel={t("backToBlog")}
      dateLabel={formatPublishedAt(post.publishedAt, locale)}
      publishedAt={post.publishedAt}
      topicLabel={post.category ? pickLocalized(post.category.name, locale) : null}
      title={title}
      imageUrl={post.imageUrl}
      imageAlt={imageAlt}
      html={html}
      alsoSee={<BlogAlsoSee items={post.related ?? []} locale={locale} />}
    />
  );
}
