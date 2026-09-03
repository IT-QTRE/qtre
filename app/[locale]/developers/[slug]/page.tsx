import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { DeveloperContact } from "@/components/public/developer-contact";
import { DeveloperFolio } from "@/components/public/developer-folio";
import { DeveloperIdentity } from "@/components/public/developer-identity";
import { ListingCard } from "@/components/public/listing-card";
import { ListingGallery } from "@/components/public/listing-gallery";
import { ListingReadMore } from "@/components/public/listing-read-more";
import { ListingSection } from "@/components/public/listing-section";
import { ProfileBreadcrumb } from "@/components/public/profile-breadcrumb";
import { telHref, websiteHref } from "@/components/public/profile-contact";
import { pickLocalized } from "@/lib/i18n/localized";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";
import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [localeRaw, tBrand, t, developer] = await Promise.all([
    getLocale(),
    getTranslations("brand"),
    getTranslations("catalog"),
    fetchPublicQuery(api.publicCatalog.getPublishedDeveloperBySlug, { slug }),
  ]);
  if (!developer) return { title: tBrand("name") };
  const locale = localeRaw as AppLocale;
  const title = pickLocalized(developer.name, locale);
  const description = developer.description
    ? pickLocalized(developer.description, locale).replace(/\s+/g, " ").trim().slice(0, 160)
    : t("developerProfileFallback");
  const canonical = `${siteUrl}/${locale}/developers/${slug}`;
  return {
    title: `${title} | ${tBrand("name")}`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: developer.imageUrl ? [{ url: developer.imageUrl }] : undefined,
    },
  };
}

export default async function DeveloperDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [localeRaw, t, tNav, developer] = await Promise.all([
    getLocale(),
    getTranslations("catalog"),
    getTranslations("nav"),
    fetchPublicQuery(api.publicCatalog.getPublishedDeveloperBySlug, { slug }),
  ]);
  const locale = localeRaw as AppLocale;
  if (!developer) notFound();

  const title = pickLocalized(developer.name, locale);
  const description = developer.description ? pickLocalized(developer.description, locale) : "";
  const hasAbout = description.trim().length > 0;
  const extraImages = (developer.images ?? [])
    .filter((image) => image.url !== developer.imageUrl)
    .map((image) => ({
      url: image.url,
      alt: image.alt ? pickLocalized(image.alt, locale) : title,
    }));
  const hasContact = Boolean(
    (developer.website && websiteHref(developer.website)) ||
      developer.email ||
      (developer.phone && telHref(developer.phone)),
  );
  const listingCols = hasContact
    ? "grid grid-cols-1 gap-10 sm:grid-cols-2"
    : "grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3";

  const contact = hasContact ? (
    <DeveloperContact
      website={developer.website}
      email={developer.email}
      phone={developer.phone}
      websiteLabel={t("profileWebsite")}
      emailLabel={t("inquireEmail")}
      phoneLabel={t("inquirePhone")}
    />
  ) : undefined;

  return (
    <DeveloperFolio
      breadcrumb={
        <ProfileBreadcrumb
          label={t("breadcrumb")}
          homeLabel={tNav("home")}
          parentHref="/developers"
          parentLabel={tNav("developers")}
          current={title}
          tone="onPrimary"
        />
      }
      identity={<DeveloperIdentity title={title} imageUrl={developer.imageUrl} />}
      gallery={
        extraImages.length > 0 ? (
          <div className={cn("w-full bg-muted py-6 sm:py-8", publicGutter)}>
            <ListingGallery images={extraImages} tone="project" />
          </div>
        ) : null
      }
      contact={contact}
    >
      {hasAbout ? (
        <ListingSection title={t("listingAbout")}>
          <ListingReadMore text={description} />
        </ListingSection>
      ) : null}

      {developer.projects.length > 0 ? (
        <ListingSection
          title={tNav("offplan")}
          aside={t("projectCount", { count: developer.projects.length })}
        >
          <div className={listingCols}>
            {developer.projects.map((listing) => (
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
          </div>
        </ListingSection>
      ) : null}

      {developer.properties.length > 0 ? (
        <ListingSection
          title={tNav("properties")}
          aside={t("listingCount", { count: developer.properties.length })}
        >
          <div className={listingCols}>
            {developer.properties.map((listing) => (
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
          </div>
        </ListingSection>
      ) : null}
    </DeveloperFolio>
  );
}
