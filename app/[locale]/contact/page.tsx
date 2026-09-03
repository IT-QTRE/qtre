import type { Metadata } from "next";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { ContactDirectory } from "@/components/public/contact-directory";
import { safeGhlFormUrl } from "@/lib/ghl-form-url";
import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [localeRaw, tSection, tCatalog, tBrand] = await Promise.all([
    getLocale(),
    getTranslations("section"),
    getTranslations("catalog"),
    getTranslations("brand"),
  ]);
  const locale = localeRaw as AppLocale;
  const title = tSection("contactTitle");
  return {
    title: `${title} | ${tBrand("name")}`,
    description: tCatalog("contactMetaDescription"),
    alternates: { canonical: `${siteUrl}/${locale}/contact` },
  };
}

export default async function ContactPage() {
  const [tSection, tCatalog, settings] = await Promise.all([
    getTranslations("section"),
    getTranslations("catalog"),
    fetchPublicQuery(api.websiteSettings.publicGet, {}),
  ]);

  return (
    <ContactDirectory
      title={tSection("contactTitle")}
      intro={tCatalog("contactIntro")}
      email={settings?.contactEmail}
      phone={settings?.contactPhone}
      whatsapp={settings?.contactWhatsapp}
      socialLinks={settings?.socialLinks}
      formUrl={safeGhlFormUrl(settings?.contactFormUrl)}
      emailLabel={tCatalog("inquireEmail")}
      phoneLabel={tCatalog("inquirePhone")}
      whatsappLabel={tCatalog("contactWhatsapp")}
      detailsLabel={tCatalog("contactDetailsLabel")}
      detailsTitle={tCatalog("contactDetailsTitle")}
      detailsLead={tCatalog("contactDetailsLead")}
      formTitle={tCatalog("contactFormTitle")}
      formLead={tCatalog("contactFormLead")}
      formEmpty={tCatalog("contactFormEmpty")}
      socialLabels={{
        facebook: tCatalog("socialFacebook"),
        instagram: tCatalog("socialInstagram"),
        linkedin: tCatalog("socialLinkedin"),
        twitter: tCatalog("socialTwitter"),
      }}
      whatsappMessage={tCatalog("contactWhatsappMessage")}
    />
  );
}
