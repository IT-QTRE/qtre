import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ServicesFolio } from "@/components/public/services-folio";
import type { AppLocale } from "@/i18n/routing";
import { desksInGroup, serviceDeskPath } from "@/lib/service-desks";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [localeRaw, tSection, tServices, tBrand] = await Promise.all([
    getLocale(),
    getTranslations("section"),
    getTranslations("servicesPage"),
    getTranslations("brand"),
  ]);
  const locale = localeRaw as AppLocale;
  const title = tSection("servicesTitle");
  return {
    title: `${title} | ${tBrand("name")}`,
    description: tServices("metaDescription"),
    alternates: { canonical: `${siteUrl}/${locale}/services` },
  };
}

export default async function ServicesPage() {
  const [tSection, tServices, tNav, tHome] = await Promise.all([
    getTranslations("section"),
    getTranslations("servicesPage"),
    getTranslations("nav"),
    getTranslations("home"),
  ]);

  const toItems = (group: "visa" | "license") =>
    desksInGroup(group).map((desk) => ({
      name: tServices(desk.nameKey),
      types: "typesKey" in desk ? tServices(desk.typesKey) : undefined,
      href: serviceDeskPath(desk),
      group: desk.group,
      slug: desk.slug,
    }));

  return (
    <ServicesFolio
      label={tSection("servicesTitle")}
      identityTitle={tHome("identityTitle")}
      intro={tServices("intro")}
      catalogTitle={tServices("catalogTitle")}
      catalogItems={[
        { name: tNav("buy"), body: tServices("catalogBuyBody"), href: "/properties?status=sale" },
        { name: tNav("rent"), body: tServices("catalogRentBody"), href: "/properties?status=rent" },
        { name: tNav("offplan"), body: tServices("catalogOffplanBody"), href: "/projects" },
      ]}
      wrapItems={[
        { title: tServices("wrapSourceTitle"), body: tServices("wrapSourceBody") },
        { title: tServices("wrapDiligenceTitle"), body: tServices("wrapDiligenceBody") },
        { title: tServices("wrapSetupTitle"), body: tServices("wrapSetupBody") },
        { title: tServices("wrapResidencyTitle"), body: tServices("wrapResidencyBody") },
        { title: tServices("wrapAfterTitle"), body: tServices("wrapAfterBody") },
      ]}
      visaItems={toItems("visa")}
      licenseItems={toItems("license")}
      contactLabel={tServices("inquiryCta")}
    />
  );
}
