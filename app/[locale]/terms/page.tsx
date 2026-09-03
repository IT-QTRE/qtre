import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LegalFolio } from "@/components/public/legal-folio";
import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [localeRaw, t, tBrand] = await Promise.all([
    getLocale(),
    getTranslations("termsPage"),
    getTranslations("brand"),
  ]);
  const locale = localeRaw as AppLocale;
  return {
    title: `${t("title")} | ${tBrand("name")}`,
    description: t("metaDescription"),
    alternates: { canonical: `${siteUrl}/${locale}/terms` },
  };
}

export default async function TermsPage() {
  const [t, tNav] = await Promise.all([getTranslations("termsPage"), getTranslations("nav")]);

  return (
    <LegalFolio
      title={t("title")}
      intro={t("intro")}
      updated={t("updated")}
      headingId="terms-heading"
      contactLabel={tNav("contact")}
      sections={[
        { title: t("catalogTitle"), body: t("catalogBody") },
        { title: t("offerTitle"), body: t("offerBody") },
        { title: t("inquireTitle"), body: t("inquireBody") },
        { title: t("thirdTitle"), body: t("thirdBody") },
        { title: t("useTitle"), body: t("useBody") },
        { title: t("liabilityTitle"), body: t("liabilityBody") },
        { title: t("changesTitle"), body: t("changesBody") },
      ]}
    />
  );
}
