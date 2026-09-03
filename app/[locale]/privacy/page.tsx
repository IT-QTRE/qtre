import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { LegalFolio } from "@/components/public/legal-folio";
import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [localeRaw, t, tBrand] = await Promise.all([
    getLocale(),
    getTranslations("privacyPage"),
    getTranslations("brand"),
  ]);
  const locale = localeRaw as AppLocale;
  return {
    title: `${t("title")} | ${tBrand("name")}`,
    description: t("metaDescription"),
    alternates: { canonical: `${siteUrl}/${locale}/privacy` },
  };
}

export default async function PrivacyPage() {
  const [t, tNav] = await Promise.all([getTranslations("privacyPage"), getTranslations("nav")]);

  return (
    <LegalFolio
      title={t("title")}
      intro={t("intro")}
      updated={t("updated")}
      headingId="privacy-heading"
      contactLabel={tNav("contact")}
      sections={[
        { title: t("whoTitle"), body: t("whoBody") },
        { title: t("inquireTitle"), body: t("inquireBody") },
        { title: t("accountsTitle"), body: t("accountsBody") },
        { title: t("cookiesTitle"), body: t("cookiesBody") },
        { title: t("mapsTitle"), body: t("mapsBody") },
        { title: t("hostingTitle"), body: t("hostingBody") },
        { title: t("keepTitle"), body: t("keepBody") },
        { title: t("requestsTitle"), body: t("requestsBody") },
      ]}
    />
  );
}
