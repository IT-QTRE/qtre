import type { Metadata } from "next";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { DeveloperDirectory } from "@/components/public/developer-directory";
import { pickLocalized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [localeRaw, tSection, tCatalog, tBrand, developers] = await Promise.all([
    getLocale(),
    getTranslations("section"),
    getTranslations("catalog"),
    getTranslations("brand"),
    fetchPublicQuery(api.publicCatalog.listPublishedDevelopers, {}),
  ]);
  const locale = localeRaw as AppLocale;
  const title = tSection("developersTitle");
  const description =
    developers.length > 0 ? tCatalog("developersMetaDescription") : tSection("developersBody");
  const canonical = `${siteUrl}/${locale}/developers`;
  return {
    title: `${title} | ${tBrand("name")}`,
    description,
    alternates: { canonical },
  };
}

export default async function DevelopersPage() {
  const [localeRaw, tSection, tHome, tCatalog, developers] = await Promise.all([
    getLocale(),
    getTranslations("section"),
    getTranslations("home"),
    getTranslations("catalog"),
    fetchPublicQuery(api.publicCatalog.listPublishedDevelopers, {}),
  ]);
  const locale = localeRaw as AppLocale;

  return (
    <DeveloperDirectory
      title={tSection("developersTitle")}
      intro={tHome("developersBody")}
      empty={tSection("developersBody")}
      countLabel={developers.length > 0 ? tCatalog("developerCount", { count: developers.length }) : null}
      marksLabel={tCatalog("developerMarksLabel")}
      listLabel={tCatalog("developerListLabel")}
      developers={developers.map((developer) => ({
        id: developer._id,
        name: pickLocalized(developer.name, locale),
        imageUrl: developer.imageUrl,
        href: `/developers/${developer.slug}`,
      }))}
    />
  );
}
