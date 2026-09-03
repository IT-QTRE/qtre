import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { linksFromPrimaryNav, NotFoundPage } from "@/components/public/not-found-page";

export async function generateMetadata(): Promise<Metadata> {
  const [t, tBrand] = await Promise.all([getTranslations("notFound"), getTranslations("brand")]);
  return {
    title: `${t("metaTitle")} | ${tBrand("name")}`,
  };
}

export default async function LocaleNotFound() {
  const [t, tNav, tBrand] = await Promise.all([
    getTranslations("notFound"),
    getTranslations("nav"),
    getTranslations("brand"),
  ]);

  return (
    <NotFoundPage
      brandName={tBrand("name")}
      title={t("title")}
      body={t("body")}
      homeLabel={t("home")}
      linksLabel={t("links")}
      links={linksFromPrimaryNav({
        buy: tNav("buy"),
        rent: tNav("rent"),
        offplan: tNav("offplan"),
      })}
    />
  );
}
