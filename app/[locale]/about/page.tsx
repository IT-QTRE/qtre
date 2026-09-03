import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { AboutFolio } from "@/components/public/about-folio";
import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [localeRaw, tSection, tAbout, tBrand] = await Promise.all([
    getLocale(),
    getTranslations("section"),
    getTranslations("aboutPage"),
    getTranslations("brand"),
  ]);
  const locale = localeRaw as AppLocale;
  const title = tSection("aboutTitle");
  return {
    title: `${title} | ${tBrand("name")}`,
    description: tAbout("metaDescription"),
    alternates: { canonical: `${siteUrl}/${locale}/about` },
  };
}

export default async function AboutPage() {
  const [tSection, tAbout, tNav] = await Promise.all([
    getTranslations("section"),
    getTranslations("aboutPage"),
    getTranslations("nav"),
  ]);

  return (
    <AboutFolio
      title={tSection("aboutTitle")}
      intro={tAbout("intro")}
      founderName={tAbout("founderName")}
      founderRole={tAbout("founderRole")}
      founderBody={tAbout("founderBody")}
      quote={tAbout("quote")}
      quoteAttr={tAbout("quoteAttr")}
      whoTitle={tAbout("whoTitle")}
      whoBody={tAbout("whoBody")}
      foundationTitle={tAbout("foundationTitle")}
      foundationBody={tAbout("foundationBody")}
      networkTitle={tAbout("networkTitle")}
      entities={[
        { name: tAbout("entityUaeName"), place: tAbout("entityUaePlace"), body: tAbout("entityUaeBody") },
        { name: tAbout("entityTrName"), place: tAbout("entityTrPlace"), body: tAbout("entityTrBody") },
        { name: tAbout("entityThName"), place: tAbout("entityThPlace"), body: tAbout("entityThBody") },
      ]}
      pillarsTitle={tAbout("pillarsTitle")}
      pillars={[
        { title: tAbout("pillarMarketTitle"), body: tAbout("pillarMarketBody") },
        { title: tAbout("pillarContinuityTitle"), body: tAbout("pillarContinuityBody") },
        { title: tAbout("pillarServiceTitle"), body: tAbout("pillarServiceBody") },
      ]}
      commitTitle={tAbout("commitTitle")}
      commitBody={tAbout("commitBody")}
      contactLabel={tNav("contact")}
    />
  );
}
