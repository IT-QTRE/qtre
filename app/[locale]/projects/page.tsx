import type { Metadata } from "next";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Link } from "@/i18n/navigation";
import { CatalogEmpty } from "@/components/public/catalog-empty";
import { CatalogPagination } from "@/components/public/catalog-pagination";
import { CATALOG_PAGE_SIZE, parseCatalogPage } from "@/lib/catalog-page";
import { CatalogResults } from "@/components/public/catalog-results";
import { listingCardViewFrom } from "@/components/public/listing-card";
import { ListingCardView } from "@/components/public/listing-card-view";
import { catalogViewFromCookies } from "@/lib/catalog-view";
import { ContactCloser } from "@/components/public/contact-closer";
import { OffplanFilterBar } from "@/components/public/offplan-filter-bar";
import { JsonLd } from "@/components/public/json-ld";
import { pickLocalized } from "@/lib/i18n/localized";
import { publicGutter } from "@/lib/public-layout";
import type { AppLocale } from "@/i18n/routing";
import {
  offplanAbsoluteUrl,
  offplanFiltersFromSearch,
  offplanHasNarrowingFilters,
  offplanLanguageAlternates,
  offplanQueryArgs,
  offplanSearchHref,
} from "@/lib/seo/offplan-catalog";
import { siteUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

type Search = {
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  beds?: string;
  construction?: string;
  developer?: string;
  page?: string;
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Search>;
}): Promise<Metadata> {
  const search = await searchParams;
  const filters = offplanFiltersFromSearch(search);
  const page = parseCatalogPage(search.page);
  const [localeRaw, t, tBrand] = await Promise.all([
    getLocale(),
    getTranslations("catalog"),
    getTranslations("brand"),
  ]);
  const locale = localeRaw as AppLocale;
  const title = filters.q
    ? t("offplanMetaTitleQuery", { query: filters.q, brand: tBrand("name") })
    : t("offplanMetaTitle", { brand: tBrand("name") });
  const description = t("offplanMetaDescription");
  const canonical = offplanHasNarrowingFilters(filters)
    ? offplanAbsoluteUrl(locale)
    : offplanAbsoluteUrl(locale, page);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: offplanLanguageAlternates(offplanHasNarrowingFilters(filters) ? 1 : page),
    },
    robots: offplanHasNarrowingFilters(filters) ? { index: false, follow: true } : { index: true, follow: true },
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

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const search = await searchParams;
  const filters = offplanFiltersFromSearch(search);
  const requestedPage = parseCatalogPage(search.page);
  const cookieStorePromise = cookies();
  const [listingPage, developers, settings, localeRaw, t, tNav, cookieStore] = await Promise.all([
    fetchPublicQuery(api.publicCatalog.listPublishedProjectsPage, {
      page: requestedPage,
      pageSize: CATALOG_PAGE_SIZE,
      ...offplanQueryArgs(filters),
    }),
    fetchPublicQuery(api.publicCatalog.listPublishedProjectDevelopers, {}),
    fetchPublicQuery(api.websiteSettings.publicGet, {}),
    getLocale(),
    getTranslations("catalog"),
    getTranslations("nav"),
    cookieStorePromise,
  ]);
  const locale = localeRaw as AppLocale;
  const initialView = catalogViewFromCookies((name) => cookieStore.get(name)?.value);
  if (requestedPage > 1 && listingPage.total === 0) {
    redirect(`/${locale}${offplanSearchHref(filters)}`);
  }
  if (requestedPage > listingPage.pageCount && listingPage.pageCount > 0) {
    redirect(`/${locale}${offplanSearchHref(filters, listingPage.pageCount)}`);
  }
  const projects = listingPage.items;
  const heading = t("offplanHeading");
  const intro = t("offplanIntro");
  const crumb = tNav("offplan");
  const canonicalPath = offplanSearchHref();
  const pageUrl = offplanAbsoluteUrl(locale, listingPage.page);
  const hasFilters = offplanHasNarrowingFilters(filters);
  const queryOnly =
    Boolean(filters.q) &&
    filters.minPrice == null &&
    filters.maxPrice == null &&
    filters.beds == null &&
    !filters.construction &&
    !filters.developer;
  const emptyMessage = !hasFilters
    ? t("emptyOffplan")
    : queryOnly
      ? t("emptyOffplanQuery", { query: filters.q ?? "" })
      : t("emptyOffplanFiltered");
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
        <link rel="prev" href={`${siteUrl}/${locale}${offplanSearchHref(filters, listingPage.page - 1)}`} />
      ) : null}
      {listingPage.page < listingPage.pageCount ? (
        <link rel="next" href={`${siteUrl}/${locale}${offplanSearchHref(filters, listingPage.page + 1)}`} />
      ) : null}
      {projects.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: heading,
            description: intro,
            numberOfItems: listingPage.total,
            url: pageUrl,
            itemListElement: projects.map((listing, index) => ({
              "@type": "ListItem",
              position: rangeFrom + index,
              url: `${siteUrl}/${locale}/projects/${listing.slug}`,
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

      <OffplanFilterBar filters={filters} developers={developers} />

      {projects.length === 0 ? (
        <div className={cn("max-w-prose py-10", publicGutter)}>
          <CatalogEmpty>{emptyMessage}</CatalogEmpty>
          <p className="mt-4 text-sm">
            {hasFilters ? (
              <Link href={canonicalPath} className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {t("clearOffplanSearch")}
              </Link>
            ) : (
              <Link href="/contact" className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {t("speakAdvisor")}
              </Link>
            )}
          </p>
        </div>
      ) : (
        <div className={cn("py-10", publicGutter)}>
          <CatalogResults
            listLabel={t("offplanListLabel")}
            countLabel={
              listingPage.pageCount > 1
                ? t("projectRange", { from: rangeFrom, to: rangeTo, total: listingPage.total })
                : t("projectCount", { count: listingPage.total })
            }
            initialView={initialView}
            viewGroupLabel={t("viewGroup")}
            viewGridLabel={t("viewGrid")}
            viewListLabel={t("viewList")}
          >
            {projects.map((listing, index) => (
              <ListingCardView
                key={listing.slug}
                headingLevel="h2"
                priority={index < 3}
                listing={listingCardViewFrom(
                  {
                    href: `/projects/${listing.slug}`,
                    title: listing.title,
                    location: listing.communityName ?? listing.city,
                    price: listing.startingPrice,
                    pricePrefix: listing.startingPrice != null,
                    constructionStatus: listing.constructionStatus,
                    completionDate: listing.completionDate,
                    bedroomTypes: listing.bedroomTypes,
                    developerName: listing.developerName,
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
            hrefForPage={(page) => offplanSearchHref(filters, page)}
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
