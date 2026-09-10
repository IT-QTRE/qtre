import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { HeroMedia } from "@/components/public/hero-media";
import { HomeSearch } from "@/components/public/home-search";
import { ListingCard, ListingRail } from "@/components/public/listing-card";
import { CatalogStage } from "@/components/public/catalog-stage";
import { CatalogEmptyLink } from "@/components/public/catalog-empty";
import { CommunityShowcase } from "@/components/public/community-showcase";
import { groupFeaturedCommunities, marketLabelKey } from "@/lib/home-community-markets";
import { DeveloperRoster, type DeveloperRow } from "@/components/public/developer-roster";
import { BlogNotes } from "@/components/public/blog-notes";
import { pickLocalized } from "@/lib/i18n/localized";
import { VisaBand } from "@/components/public/visa-band";
import { IdentityPlate } from "@/components/public/identity-plate";
import { ContactCloser } from "@/components/public/contact-closer";
import { SellWithUs } from "@/components/public/sell-with-us";
import { GoldRule } from "@/components/public/gold-rule";
import type { AppLocale } from "@/i18n/routing";
import type { SearchIntent } from "@/lib/public-nav";
import { catalogSearchHref } from "@/lib/seo/catalog";

function communityMarkets(
  communities: {
    _id: string;
    slug: string;
    countryCode: string;
    name: { en: string; ar?: string; tr?: string };
    city: { en: string; ar?: string; tr?: string };
    imageUrl: string | null;
  }[],
  locale: AppLocale,
  labelFor: (code: string) => string,
) {
  return groupFeaturedCommunities(communities, locale).map((market) => ({
    ...market,
    label: labelFor(market.countryCode),
  }));
}

function developerRows(
  developers: {
    _id: string;
    slug: string;
    name: { en: string; ar?: string; tr?: string };
    imageUrl: string | null;
  }[],
  locale: AppLocale,
): DeveloperRow[] {
  return developers.map((developer) => ({
    id: developer._id,
    name: pickLocalized(developer.name, locale),
    imageUrl: developer.imageUrl,
    href: `/developers/${developer.slug}`,
  }));
}

function featuredIntent(forSale: number, forRent: number, projects: number): SearchIntent {
  if (forSale > 0) return "buy";
  if (forRent > 0) return "rent";
  if (projects > 0) return "offplan";
  return "buy";
}

function FeaturedEmpty({
  message,
  actions,
}: {
  message: string;
  actions: { href: string; label: string }[];
}) {
  return (
    <div className="mt-10 max-w-prose">
      <p className="text-sm leading-relaxed text-foreground/80">{message}</p>
      {actions.length > 0 ? (
        <p className="mt-4 text-sm">
          {actions.map((action, index) => (
            <span key={action.href}>
              {index > 0 ? <span className="text-muted-foreground"> · </span> : null}
              <CatalogEmptyLink href={action.href}>{action.label}</CatalogEmptyLink>
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const t = await getTranslations("home");
  const tBrand = await getTranslations("brand");
  const tSection = await getTranslations("section");
  const tCatalog = await getTranslations("catalog");
  const locale = (await getLocale()) as AppLocale;
  const [forSale, forRent, projects, communities, developers, posts, settings] = await Promise.all([
    fetchPublicQuery(api.publicCatalog.listPublishedProperties, { listingStatus: "for_sale" }),
    fetchPublicQuery(api.publicCatalog.listPublishedProperties, { listingStatus: "for_rent" }),
    fetchPublicQuery(api.publicCatalog.featuredProjects, {}),
    fetchPublicQuery(api.publicCatalog.featuredCommunities, {}),
    fetchPublicQuery(api.publicCatalog.featuredDevelopers, {}),
    fetchPublicQuery(api.publicCatalog.featuredBlogPosts, {}),
    fetchPublicQuery(api.websiteSettings.publicGet, {}),
  ]);
  const markets = communityMarkets(communities, locale, (code) => {
    const key = marketLabelKey(code);
    return key ? t(key) : code;
  });
  const roster = developerRows(developers, locale);
  const buyEmptyActions = [
    ...(forRent.length > 0 ? [{ href: catalogSearchHref("rent"), label: tCatalog("emptySeeRent") }] : []),
    ...(projects.length > 0 ? [{ href: "/projects", label: tCatalog("emptySeeOffplan") }] : []),
    { href: "/contact", label: tCatalog("speakAdvisor") },
  ];
  const rentEmptyActions = [
    ...(forSale.length > 0 ? [{ href: catalogSearchHref("sale"), label: tCatalog("emptySeeBuy") }] : []),
    ...(projects.length > 0 ? [{ href: "/projects", label: tCatalog("emptySeeOffplan") }] : []),
    { href: "/contact", label: tCatalog("speakAdvisor") },
  ];
  const offplanEmptyActions = [
    ...(forRent.length > 0 ? [{ href: catalogSearchHref("rent"), label: tCatalog("emptySeeRent") }] : []),
    ...(forSale.length > 0 ? [{ href: catalogSearchHref("sale"), label: tCatalog("emptySeeBuy") }] : []),
    { href: "/contact", label: tCatalog("speakAdvisor") },
  ];

  return (
    <main id="main">
      <section className="relative flex min-h-svh flex-col bg-primary">
        <HeroMedia />
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-end gap-6 px-4 pb-12 pt-24 sm:gap-8 sm:px-6 sm:pb-16 sm:pt-32">
          <h1 className="relative max-w-[42ch] text-pretty text-center font-heading text-[clamp(1.25rem,2.4vw,1.75rem)] font-semibold leading-[1.4] tracking-[0.02em] text-primary-foreground">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-[-12%] inset-y-[-0.55em] -z-10 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--foreground)_68%,transparent)_0%,transparent_70%)]"
            />
            <span className="sr-only">{tBrand("tagline")}</span>
            <span
              aria-hidden
              className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
            >
              <span className="[text-shadow:0_1px_0_color-mix(in_oklab,var(--foreground)_85%,transparent),0_2px_14px_color-mix(in_oklab,var(--foreground)_50%,transparent)]">
                {tBrand("taglineFirst")}
              </span>
              <GoldRule draw origin="center" className="w-10 shrink-0 sm:w-8" />
              <span className="[text-shadow:0_1px_0_color-mix(in_oklab,var(--foreground)_85%,transparent),0_2px_14px_color-mix(in_oklab,var(--foreground)_50%,transparent)]">
                {tBrand("taglineSecond")}
              </span>
            </span>
          </h1>
          <HomeSearch />
        </div>
      </section>

      <CatalogStage
        heading={t("inventoryTitle")}
        seeAllLabel={t("seeAll")}
        intentGroupLabel={t("intentGroup")}
        initialIntent={featuredIntent(forSale.length, forRent.length, projects.length)}
        labels={{ buy: t("buy"), rent: t("rent"), offplan: t("offplan") }}
        panels={{
          buy:
            forSale.length === 0 ? (
              <FeaturedEmpty message={tCatalog("emptyBuy")} actions={buyEmptyActions} />
            ) : (
              <ListingRail label={t("buy")}>
                {forSale.slice(0, 3).map((listing) => (
                  <ListingCard
                    key={listing._id}
                    listing={{
                      href: `/properties/${listing.slug}`,
                      title: listing.title,
                      location: listing.communityName ?? listing.city,
                      price: listing.price,
                      bedrooms: listing.bedrooms,
                      bathrooms: listing.bathrooms,
                      areaSqft: listing.areaSqft,
                      listingStatus: listing.listingStatus,
                      imageUrl: listing.imageUrl,
                      imageAlt: listing.imageAlt,
                      description: listing.description,
                    }}
                  />
                ))}
              </ListingRail>
            ),
          rent:
            forRent.length === 0 ? (
              <FeaturedEmpty message={tCatalog("emptyRent")} actions={rentEmptyActions} />
            ) : (
              <ListingRail label={t("rent")}>
                {forRent.slice(0, 3).map((listing) => (
                  <ListingCard
                    key={listing._id}
                    listing={{
                      href: `/properties/${listing.slug}`,
                      title: listing.title,
                      location: listing.communityName ?? listing.city,
                      price: listing.price,
                      bedrooms: listing.bedrooms,
                      bathrooms: listing.bathrooms,
                      areaSqft: listing.areaSqft,
                      listingStatus: listing.listingStatus,
                      imageUrl: listing.imageUrl,
                      imageAlt: listing.imageAlt,
                      description: listing.description,
                    }}
                  />
                ))}
              </ListingRail>
            ),
          offplan:
            projects.length === 0 ? (
              <FeaturedEmpty message={t("emptyProjects")} actions={offplanEmptyActions} />
            ) : (
              <ListingRail label={t("offplan")}>
                {projects.slice(0, 3).map((listing) => (
                  <ListingCard
                    key={listing._id}
                    listing={{
                      href: `/projects/${listing.slug}`,
                      title: listing.title,
                      location: listing.communityName ?? listing.city,
                      price: listing.startingPrice,
                      pricePrefix: listing.startingPrice != null,
                      listingStatus: "offplan",
                      constructionStatus: listing.constructionStatus,
                      completionDate: listing.completionDate,
                      bedroomTypes: listing.bedroomTypes,
                      developerName: listing.developerName,
                      imageUrl: listing.imageUrl,
                      imageAlt: listing.imageAlt,
                    }}
                  />
                ))}
              </ListingRail>
            ),
        }}
      />

      {markets.length > 0 ? (
        <CommunityShowcase
          heading={t("communities")}
          viewLabel={t("viewListings")}
          marketGroupLabel={t("marketGroup")}
          markets={markets}
        />
      ) : null}

      {roster.length > 0 ? (
        <DeveloperRoster
          heading={t("developers")}
          body={t("developersBody")}
          seeAllLabel={t("seeAll")}
          developers={roster}
        />
      ) : null}

      <IdentityPlate title={t("identityTitle")} body={tSection("aboutBody")} />

      <SellWithUs />

      {posts.length > 0 ? (
        <BlogNotes
          heading={t("blog")}
          seeAllLabel={t("seeAll")}
          notes={posts.slice(0, 5).map((post) => ({
            id: post._id,
            title: pickLocalized(post.title, locale),
            publishedAt: post.publishedAt,
            href: `/blog/${post.slug}`,
            imageUrl: post.imageUrl,
            imageAlt: post.imageAlt ? pickLocalized(post.imageAlt, locale) : null,
          }))}
        />
      ) : null}

      <VisaBand headingLevel="h2" columnHref="/services" />
      <ContactCloser email={settings?.contactEmail} phone={settings?.contactPhone} />
    </main>
  );
}
