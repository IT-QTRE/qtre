import type { Metadata } from "next";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { CommunityDirectory } from "@/components/public/community-directory";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/i18n/routing";
import {
  communitiesHref,
  marketCodesFromCommunities,
  marketLabelKey,
  resolveMarketCode,
} from "@/lib/home-community-markets";
import { siteUrl } from "@/lib/site";

type Search = { market?: string };

type HomeTranslate = Awaited<ReturnType<typeof getTranslations<"home">>>;

function marketLabel(code: string, t: HomeTranslate) {
  const key = marketLabelKey(code);
  return key ? t(key) : code;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const search = await searchParams;
  const [localeRaw, tHome, tSection, tCatalog, tBrand, communities] = await Promise.all([
    getLocale(),
    getTranslations("home"),
    getTranslations("section"),
    getTranslations("catalog"),
    getTranslations("brand"),
    fetchPublicQuery(api.publicCatalog.listPublishedCommunities, {}),
  ]);
  const locale = localeRaw as AppLocale;
  const codes = marketCodesFromCommunities(communities);
  const selected = resolveMarketCode(search.market, codes);
  const title = tSection("communitiesTitle");
  const description =
    communities.length > 0 ? tCatalog("communitiesMetaDescription") : tSection("communitiesBody");
  const canonical = `${siteUrl}/${locale}/communities`;
  const marketName = selected ? marketLabel(selected, tHome) : null;
  return {
    title: marketName ? `${title} · ${marketName} | ${tBrand("name")}` : `${title} | ${tBrand("name")}`,
    description,
    alternates: { canonical },
  };
}

export default async function CommunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const [localeRaw, tSection, tPage, tNav, tCatalog, tHome, communities] = await Promise.all([
    getLocale(),
    getTranslations("section"),
    getTranslations("communityPage"),
    getTranslations("nav"),
    getTranslations("catalog"),
    getTranslations("home"),
    fetchPublicQuery(api.publicCatalog.listPublishedCommunities, {}),
  ]);
  const locale = localeRaw as AppLocale;
  const codes = marketCodesFromCommunities(communities);
  const selected = resolveMarketCode(search.market, codes);
  const inMarket = selected ? communities.filter((community) => community.countryCode === selected) : communities;
  const selectedLabel = selected ? marketLabel(selected, tHome) : "";

  return (
    <CommunityDirectory
      breadcrumb={
        <nav aria-label={tCatalog("breadcrumb")}>
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {tNav("home")}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="font-medium text-foreground">{tNav("communities")}</li>
          </ol>
        </nav>
      }
      title={tSection("communitiesTitle")}
      headingId="communities-heading"
      intro={selectedLabel ? tPage("indexIntro", { market: selectedLabel }) : tPage("indexIntroFallback")}
      empty={tSection("communitiesBody")}
      countLabel={inMarket.length > 0 ? tCatalog("communityCount", { count: inMarket.length }) : null}
      listLabel={tPage("listLabel")}
      photoLabel={tCatalog("scaffoldPhoto")}
      marketGroupLabel={tHome("marketGroup")}
      selectedMarket={selected ?? null}
      markets={codes.map((code) => ({
        countryCode: code,
        label: marketLabel(code, tHome),
        href: communitiesHref(code),
      }))}
      places={inMarket.map((community) => ({
        href: `/communities/${community.slug}`,
        name: pickLocalized(community.name, locale),
        city: pickLocalized(community.city, locale),
        excerpt: community.description ? pickLocalized(community.description, locale) : "",
        imageUrl: community.imageUrl,
        imageAlt: community.imageAlt ? pickLocalized(community.imageAlt, locale) : undefined,
      }))}
    />
  );
}
