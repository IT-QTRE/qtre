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
      body: tServices(desk.bodyKey),
      types: "typesKey" in desk ? tServices(desk.typesKey) : undefined,
      href: serviceDeskPath(desk),
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
      wrapTitle={tServices("wrapTitle")}
      wrapItems={[
        { title: tServices("wrapSourceTitle"), body: tServices("wrapSourceBody") },
        { title: tServices("wrapDiligenceTitle"), body: tServices("wrapDiligenceBody") },
        { title: tServices("wrapSetupTitle"), body: tServices("wrapSetupBody") },
        { title: tServices("wrapResidencyTitle"), body: tServices("wrapResidencyBody") },
        { title: tServices("wrapAfterTitle"), body: tServices("wrapAfterBody") },
      ]}
      groupTitle={tServices("groupTitle")}
      groupIntro={tServices("groupIntro")}
      visaTitle={tServices("visaTitle")}
      visaItems={toItems("visa")}
      licenseTitle={tServices("licenseTitle")}
      licenseItems={toItems("license")}
      contactLabel={tNav("contact")}
      contactTitle={tHome("contactTitle")}
      contactBody={tHome("contactBody")}
    />
  );
}
