import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { CommunityFolio } from "@/components/public/community-folio";
import { ContactCloser } from "@/components/public/contact-closer";
import { ListingCard, ListingRail } from "@/components/public/listing-card";
import { ListingGallery } from "@/components/public/listing-gallery";
import { ProfileBreadcrumb } from "@/components/public/profile-breadcrumb";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/i18n/localized";
import { communitiesHref } from "@/lib/home-community-markets";
import { formatAed } from "@/lib/format/aed";
import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [localeRaw, tBrand, t, community] = await Promise.all([
    getLocale(),
    getTranslations("brand"),
    getTranslations("catalog"),
    fetchPublicQuery(api.publicCatalog.getPublishedCommunityBySlug, { slug }),
  ]);
  if (!community) return { title: tBrand("name") };
  const locale = localeRaw as AppLocale;
  const title = community.seo?.seoTitle
    ? pickLocalized(community.seo.seoTitle, locale)
    : pickLocalized(community.name, locale);
  const description = community.seo?.seoDescription
    ? pickLocalized(community.seo.seoDescription, locale)
    : community.description
      ? pickLocalized(community.description, locale).replace(/\s+/g, " ").trim().slice(0, 160)
      : t("communityProfileFallback");
  const canonical = `${siteUrl}/${locale}/communities/${slug}`;
  return {
    title: `${title} | ${tBrand("name")}`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: community.imageUrl ? [{ url: community.imageUrl }] : undefined,
    },
  };
}

export default async function CommunityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [localeRaw, tPage, tNav, tHome, tCatalog, community] = await Promise.all([
    getLocale(),
    getTranslations("communityPage"),
    getTranslations("nav"),
    getTranslations("home"),
    getTranslations("catalog"),
    fetchPublicQuery(api.publicCatalog.getPublishedCommunityBySlug, { slug }),
  ]);
  const locale = localeRaw as AppLocale;
  if (!community) notFound();

  const title = pickLocalized(community.name, locale);
  const aboutBody = community.description ? pickLocalized(community.description, locale) : "";
  const query = encodeURIComponent(title);
  const sale = community.properties.filter((listing) => listing.listingStatus === "for_sale");
  const rent = community.properties.filter((listing) => listing.listingStatus === "for_rent");
  const featured = community.projects[0] ?? null;
  const images = (community.images ?? []).map((image) => ({
    url: image.url,
    alt: image.alt ? pickLocalized(image.alt, locale) : title,
  }));

  return (
    <CommunityFolio
      breadcrumb={
        <ProfileBreadcrumb
          label={tCatalog("breadcrumb")}
          homeLabel={tNav("home")}
          parentHref={communitiesHref(community.countryCode)}
          parentLabel={tNav("communities")}
          current={title}
          tone="onPrimary"
        />
      }
      title={title}
      city={pickLocalized(community.city, locale)}
      intro={tPage("heroIntro")}
      photoLabel={tCatalog("scaffoldPhoto")}
      headingId="community-heading"
      imageUrl={community.imageUrl}
      imageAlt={community.imageAlt ? pickLocalized(community.imageAlt, locale) : title}
      aboutLabel={tPage("aboutLabel")}
      aboutBody={aboutBody.trim() || undefined}
      photosLabel={tPage("photosLabel")}
      gallery={images.length > 1 ? <ListingGallery images={images} tone="place" /> : undefined}
      stockHeading={tPage("stockHeading")}
      seeAllLabel={tHome("seeAll")}
      seeAllHrefs={{
        buy: `/properties?status=sale&q=${query}`,
        rent: `/properties?status=rent&q=${query}`,
      }}
      intentGroupLabel={tHome("intentGroup")}
      buyLabel={tHome("buy")}
      rentLabel={tHome("rent")}
      salePanel={
        sale.length > 0 ? (
          <ListingRail compact label={tHome("buy")}>
            {sale.map((listing) => (
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
        ) : undefined
      }
      rentPanel={
        rent.length > 0 ? (
          <ListingRail compact label={tHome("rent")}>
            {rent.map((listing) => (
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
        ) : undefined
      }
      featured={
        featured
          ? {
              label: tPage("featuredLabel"),
              name: pickLocalized(featured.title, locale),
              developer: featured.developerName ? pickLocalized(featured.developerName, locale) : undefined,
              price:
                featured.startingPrice != null
                  ? tCatalog("fromPrice", { price: formatAed(featured.startingPrice, locale) })
                  : undefined,
              body: pickLocalized(featured.description, locale) || undefined,
              cta: tPage("viewProject"),
              href: `/projects/${featured.slug}`,
              imageUrl: featured.imageUrl,
            }
          : undefined
      }
      offplanTitle={tPage("offplanTitle")}
      offplanPanel={
        community.projects.length > 0 ? (
          <ListingRail compact label={tPage("offplanTitle")}>
            {community.projects.map((listing) => (
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
                  description: listing.description,
                }}
              />
            ))}
          </ListingRail>
        ) : undefined
      }
      offplanAside={
        community.projects.length > 0 ? (
          <Link
            href={`/projects?q=${query}`}
            className="text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {tHome("seeAll")}
          </Link>
        ) : undefined
      }
      closer={<ContactCloser compact />}
    />
  );
}
