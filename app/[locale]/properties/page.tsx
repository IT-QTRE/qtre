import type { Metadata } from "next";
import type { ReactElement } from "react";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { Link } from "@/i18n/navigation";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CatalogEmpty, CatalogEmptyLink } from "@/components/public/catalog-empty";
import { CatalogPagination } from "@/components/public/catalog-pagination";
import { CATALOG_PAGE_SIZE, parseCatalogPage } from "@/lib/catalog-page";
import { CatalogResults } from "@/components/public/catalog-results";
import { listingCardViewFrom } from "@/components/public/listing-card";
import { ListingCardView } from "@/components/public/listing-card-view";
import { catalogViewFromCookies } from "@/lib/catalog-view";
import { ContactCloser } from "@/components/public/contact-closer";
import { CatalogFilterBar } from "@/components/public/catalog-filter-bar";
import { JsonLd } from "@/components/public/json-ld";
import { pickLocalized } from "@/lib/i18n/localized";
import { publicGutter } from "@/lib/public-layout";
import type { AppLocale } from "@/i18n/routing";
import {
  catalogAbsoluteUrl,
  catalogFiltersFromSearch,
  catalogHasNarrowingFilters,
  catalogIntentFromStatus,
  catalogLanguageAlternates,
  catalogListingStatus,
  catalogQueryArgs,
  catalogSearchHref,
} from "@/lib/seo/catalog";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

type Search = {
  status?: string;
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  beds?: string;
  baths?: string;
  minArea?: string;
  maxArea?: string;
  page?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const search = await searchParams;
  const intent = catalogIntentFromStatus(search.status);
  const filters = catalogFiltersFromSearch(search);
  const page = parseCatalogPage(search.page);
  const [localeRaw, t, tBrand] = await Promise.all([
    getLocale(),
    getTranslations("catalog"),
    getTranslations("brand"),
  ]);
  const locale = localeRaw as AppLocale;
  const title = filters.q
    ? t(intent === "rent" ? "rentMetaTitleQuery" : "buyMetaTitleQuery", { query: filters.q, brand: tBrand("name") })
    : t(intent === "rent" ? "rentMetaTitle" : "buyMetaTitle", { brand: tBrand("name") });
  const description = t(intent === "rent" ? "rentMetaDescription" : "buyMetaDescription");
  const canonical = catalogHasNarrowingFilters(filters)
    ? catalogAbsoluteUrl(locale, intent)
    : catalogAbsoluteUrl(locale, intent, page);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: catalogLanguageAlternates(intent, catalogHasNarrowingFilters(filters) ? 1 : page),
    },
    robots: catalogHasNarrowingFilters(filters) ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      locale,
      type: "website",
      siteName: tBrand("name"),
    },
  };
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const intent = catalogIntentFromStatus(search.status);
  const filters = catalogFiltersFromSearch(search);
  const listingStatus = catalogListingStatus(intent);
  const otherIntent = intent === "rent" ? "sale" : "rent";
  const requestedPage = parseCatalogPage(search.page);
  const cookieStorePromise = cookies();
  const [listingPage, otherStock, settings, localeRaw, t, tNav, cookieStore] = await Promise.all([
    fetchPublicQuery(api.publicCatalog.listPublishedPropertiesPage, {
      listingStatus,
      page: requestedPage,
      pageSize: CATALOG_PAGE_SIZE,
      ...catalogQueryArgs(filters),
    }),
    fetchPublicQuery(api.publicCatalog.listPublishedPropertiesPage, {
      listingStatus: catalogListingStatus(otherIntent),
      page: 1,
      pageSize: 1,
    }),
    fetchPublicQuery(api.websiteSettings.publicGet, {}),
    getLocale(),
    getTranslations("catalog"),
    getTranslations("nav"),
    cookieStorePromise,
  ]);
  const locale = localeRaw as AppLocale;
  const initialView = catalogViewFromCookies((name) => cookieStore.get(name)?.value);
  if (requestedPage > 1 && listingPage.total === 0) {
    redirect(`/${locale}${catalogSearchHref(intent, filters)}`);
  }
  if (requestedPage > listingPage.pageCount && listingPage.pageCount > 0) {
    redirect(`/${locale}${catalogSearchHref(intent, filters, listingPage.pageCount)}`);
  }
  const properties = listingPage.items;

  const isRent = intent === "rent";
  const heading = isRent ? t("rentHeading") : t("buyHeading");
  const intro = isRent ? t("rentIntro") : t("buyIntro");
  const crumb = isRent ? tNav("rent") : tNav("buy");
  const listLabel = isRent ? t("rentListLabel") : t("buyListLabel");
  const canonicalPath = catalogSearchHref(intent);
  const pageUrl = catalogAbsoluteUrl(locale, intent, listingPage.page);
  const hasFilters = catalogHasNarrowingFilters(filters);
  const queryOnly =
    Boolean(filters.q) &&
    filters.minPrice == null &&
    filters.maxPrice == null &&
    filters.beds == null &&
    filters.baths == null &&
    filters.minArea == null &&
    filters.maxArea == null;
  const emptyMessage = !hasFilters
    ? t(isRent ? "emptyRent" : "emptyBuy")
    : queryOnly
      ? t(isRent ? "emptyRentQuery" : "emptyBuyQuery", { query: filters.q ?? "" })
      : t(isRent ? "emptyRentFiltered" : "emptyBuyFiltered");
  const otherHasStock = otherStock.total > 0;
  const emptyActions = [
    hasFilters ? (
      <CatalogEmptyLink key="clear" href={canonicalPath}>
        {t(isRent ? "clearRentSearch" : "clearBuySearch")}
      </CatalogEmptyLink>
    ) : null,
    otherHasStock ? (
      <CatalogEmptyLink key="other" href={catalogSearchHref(otherIntent)}>
        {isRent ? t("emptySeeBuy") : t("emptySeeRent")}
      </CatalogEmptyLink>
    ) : null,
    !hasFilters ? (
      <CatalogEmptyLink key="contact" href="/contact">
        {t("speakAdvisor")}
      </CatalogEmptyLink>
    ) : null,
  ].filter((node): node is ReactElement => node != null);
  const rangeFrom = listingPage.total === 0 ? 0 : (listingPage.page - 1) * listingPage.pageSize + 1;
  const rangeTo = Math.min(listingPage.total, listingPage.page * listingPage.pageSize);

  return (
    <main id="main" className="w-full">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: tNav("home"),
              item: `${siteUrl}/${locale}`,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: crumb,
              item: pageUrl,
            },
          ],
        }}
      />
      {listingPage.page > 1 ? (
        <link rel="prev" href={`${siteUrl}/${locale}${catalogSearchHref(intent, filters, listingPage.page - 1)}`} />
      ) : null}
      {listingPage.page < listingPage.pageCount ? (
        <link rel="next" href={`${siteUrl}/${locale}${catalogSearchHref(intent, filters, listingPage.page + 1)}`} />
      ) : null}
      {properties.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: heading,
            description: intro,
            numberOfItems: listingPage.total,
            url: pageUrl,
            itemListElement: properties.map((listing, index) => ({
              "@type": "ListItem",
              position: rangeFrom + index,
              url: `${siteUrl}/${locale}/properties/${listing.slug}`,
              name: pickLocalized(listing.title, locale),
            })),
          }}
        />
      ) : null}

      <header className={cn("py-10 sm:py-12", publicGutter)}>
        <div className="max-w-3xl">
        <nav aria-label={t("breadcrumb")}>
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {tNav("home")}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-foreground">
              <Link
                href={canonicalPath}
                aria-current="page"
                className="font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {crumb}
              </Link>
            </li>
          </ol>
        </nav>
        <h1 className="mt-6 scroll-mt-24 font-heading text-3xl font-semibold tracking-tight text-pretty sm:text-4xl">
          {heading}
        </h1>
        <div className="mt-5 h-px w-10 bg-secondary" />
        <p className="mt-6 max-w-prose text-base leading-relaxed text-pretty text-foreground/80">{intro}</p>
        </div>
      </header>

      <CatalogFilterBar intent={intent} filters={filters} />

      {properties.length === 0 ? (
        <div className={cn("max-w-prose py-10", publicGutter)}>
          <CatalogEmpty>{emptyMessage}</CatalogEmpty>
          {emptyActions.length > 0 ? (
            <p className="mt-4 text-sm">
              {emptyActions.map((action, index) => (
                <span key={action.key}>
                  {index > 0 ? <span className="text-muted-foreground"> · </span> : null}
                  {action}
                </span>
              ))}
            </p>
          ) : null}
        </div>
      ) : (
        <div className={cn("py-10", publicGutter)}>
          <CatalogResults
            listLabel={listLabel}
            countLabel={
              listingPage.pageCount > 1
                ? t("listingRange", { from: rangeFrom, to: rangeTo, total: listingPage.total })
                : t("listingCount", { count: listingPage.total })
            }
            initialView={initialView}
            viewGroupLabel={t("viewGroup")}
            viewGridLabel={t("viewGrid")}
            viewListLabel={t("viewList")}
          >
            {properties.map((listing, index) => (
              <ListingCardView
                key={listing.slug}
                headingLevel="h2"
                priority={index < 3}
                listing={listingCardViewFrom(
                  {
                    href: `/properties/${listing.slug}`,
                    title: listing.title,
                    location: listing.communityName ?? listing.city,
                    price: listing.price,
                    bedrooms: listing.bedrooms,
                    bathrooms: listing.bathrooms,
                    areaSqft: listing.areaSqft,
                    imageUrl: listing.imageUrl,
                    imageAlt: listing.imageAlt,
                    description: listing.description,
                  },
                  locale,
                  t,
                )}
              />
            ))}
          </CatalogResults>
          <CatalogPagination
            page={listingPage.page}
            pageCount={listingPage.pageCount}
            hrefForPage={(page) => catalogSearchHref(intent, filters, page)}
            label={t("paginationLabel")}
            prevLabel={t("paginationPrev")}
            nextLabel={t("paginationNext")}
          />
        </div>
      )}
      <ContactCloser
        compact
        email={settings?.contactEmail}
        phone={settings?.contactPhone}
        title={t("closerTitle")}
        body={t("closerBody")}
      />
    </main>
  );
}
