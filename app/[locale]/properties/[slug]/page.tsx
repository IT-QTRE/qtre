import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/i18n/localized";
import { formatAed } from "@/lib/format/aed";
import { formatSqftRange, formatSqmRange } from "@/lib/format/area";
import type { AppLocale } from "@/i18n/routing";
import { catalogSearchHref } from "@/lib/seo/catalog";
import { siteUrl } from "@/lib/site";
import { PublicListingMap } from "@/components/maps/public-listing-map";
import { ListingAmenities } from "@/components/public/listing-amenities";
import { ListingFolio } from "@/components/public/listing-folio";
import { ListingGallery } from "@/components/public/listing-gallery";
import { ListingIdentity } from "@/components/public/listing-identity";
import { ListingInquireForm } from "@/components/public/listing-inquire-form";
import { ListingKeyFacts } from "@/components/public/listing-key-facts";
import { ListingReadMore } from "@/components/public/listing-read-more";
import { ListingSection } from "@/components/public/listing-section";
import { RelatedName } from "@/components/public/related-name";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [localeRaw, tBrand, property] = await Promise.all([
    getLocale(),
    getTranslations("brand"),
    fetchPublicQuery(api.publicCatalog.getPublishedPropertyBySlug, { slug }),
  ]);
  if (!property) return { title: tBrand("name") };
  const locale = localeRaw as AppLocale;
  const title = pickLocalized(property.title, locale);
  const description = pickLocalized(property.description, locale).replace(/\s+/g, " ").trim().slice(0, 160);
  const canonical = `${siteUrl}/${locale}/properties/${slug}`;
  return {
    title: `${title} | ${tBrand("name")}`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: property.imageUrl ? [{ url: property.imageUrl }] : undefined,
    },
  };
}

export default async function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [localeRaw, t, tNav, property, settings] = await Promise.all([
    getLocale(),
    getTranslations("catalog"),
    getTranslations("nav"),
    fetchPublicQuery(api.publicCatalog.getPublishedPropertyBySlug, { slug }),
    fetchPublicQuery(api.websiteSettings.publicGet, {}),
  ]);
  const locale = localeRaw as AppLocale;
  if (!property) notFound();

  const title = pickLocalized(property.title, locale);
  const location = pickLocalized(property.communityName ?? property.city, locale);
  const description = pickLocalized(property.description, locale);
  const isRent = property.listingStatus === "for_rent";
  const catalogHref = catalogSearchHref(isRent ? "rent" : "sale");
  const catalogLabel = isRent ? tNav("rent") : tNav("buy");
  const images = (property.images ?? []).map((image) => ({
    url: image.url,
    alt: image.alt ? pickLocalized(image.alt, locale) : title,
  }));
  const specRows = [
    { key: "beds", label: t("factBeds"), value: property.bedrooms === 0 ? t("studio") : String(property.bedrooms) },
    { key: "baths", label: t("factBaths"), value: String(property.bathrooms) },
    {
      key: "area",
      label: t("factArea"),
      value: `${formatSqftRange(property.areaSqft, property.areaSqft, locale, t("areaUnit"))} · ${formatSqmRange(property.areaSqft, property.areaSqft, locale, t("areaUnitSqm"))}`,
    },
  ];
  const extraFacts = [
    property.propertyType
      ? { key: "type", label: t("factType"), value: t(`type.${property.propertyType}`) }
      : null,
    property.furnishing
      ? { key: "furnishing", label: t("factFurnishing"), value: t(`furnishing.${property.furnishing}`) }
      : null,
    isRent && property.rentalPeriod
      ? { key: "rentalPeriod", label: t("factRentalPeriod"), value: t(`rentalPeriod.${property.rentalPeriod}`) }
      : null,
  ].filter((row): row is { key: string; label: string; value: string } => row != null);
  const inquire = (
    <ListingInquireForm
      propertyId={property._id}
      heading={t("speakAdvisor")}
      body={t("listingInquireBody", { title })}
      nameLabel={t("inquireName")}
      emailLabel={t("inquireEmail")}
      phoneLabel={t("inquirePhone")}
      messageLabel={t("inquireMessage")}
      submitLabel={t("inquireSubmit")}
      pendingLabel={t("inquirePending")}
      successTitle={t("inquireSuccessTitle")}
      successBody={t("inquireSuccessBody")}
      errorLabel={t("inquireError")}
      emailFallback={settings?.contactEmail}
      phoneFallback={settings?.contactPhone}
      emphasis
    />
  );

  return (
    <ListingFolio
      breadcrumb={
        <nav aria-label={t("breadcrumb")}>
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {tNav("home")}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={catalogHref} className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {catalogLabel}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-foreground">
              <span className="font-medium">{title}</span>
            </li>
          </ol>
        </nav>
      }
      gallery={<ListingGallery images={images} tone="project" />}
      identity={
        <ListingIdentity
          price={property.price != null ? formatAed(property.price, locale) : null}
          title={title}
          location={location}
          status={isRent ? t("forRent") : t("forSale")}
        />
      }
      specs={<ListingKeyFacts rows={specRows} extras={extraFacts} />}
      inquire={inquire}
    >
      {description.trim() ? (
        <ListingSection title={t("listingAbout")}>
          <ListingReadMore text={description} />
        </ListingSection>
      ) : null}

      {(property.amenities ?? []).length > 0 ? (
        <ListingSection title={t("amenitiesHeading")}>
          <ListingAmenities amenities={property.amenities ?? []} />
        </ListingSection>
      ) : null}

      {property.coordinates ? (
        <ListingSection title={t("locationHeading")}>
          <PublicListingMap coordinates={property.coordinates} placeId={property.placeId} />
        </ListingSection>
      ) : null}

      {property.project || property.communityName || property.developerName ? (
        <ListingSection title={t("relatedHeading")}>
          <dl className="flex flex-wrap gap-x-12 gap-y-6">
            {property.project ? (
              <div>
                <dt className="text-xs text-muted-foreground">{t("relatedProject")}</dt>
                <dd className="mt-1.5">
                  <Link
                    href={`/projects/${property.project.slug}`}
                    className="font-heading text-base font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {pickLocalized(property.project.title, locale)}
                  </Link>
                </dd>
              </div>
            ) : null}
            {property.communityName ? (
              <div>
                <dt className="text-xs text-muted-foreground">{t("relatedCommunity")}</dt>
                <dd className="mt-1.5 font-heading text-base font-medium">{pickLocalized(property.communityName, locale)}</dd>
              </div>
            ) : null}
            {property.developerName ? (
              <div>
                <dt className="text-xs text-muted-foreground">{t("relatedDeveloper")}</dt>
                <dd className="mt-1.5">
                  <RelatedName href={property.developerSlug ? `/developers/${property.developerSlug}` : null}>
                    {pickLocalized(property.developerName, locale)}
                  </RelatedName>
                </dd>
              </div>
            ) : null}
          </dl>
        </ListingSection>
      ) : null}

      {property.agent ? (
        <ListingSection title={t("agentHeading")}>
          <Link
            href={`/agents/${property.agent.slug}`}
            className="flex items-center gap-4 touch-manipulation hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {property.agent.imageUrl ? (
              <div className="relative size-16 shrink-0 overflow-hidden bg-accent">
                <Image
                  src={property.agent.imageUrl}
                  alt={property.agent.imageAlt ? pickLocalized(property.agent.imageAlt, locale) : property.agent.name}
                  fill
                  className="object-cover object-top"
                  sizes="64px"
                />
              </div>
            ) : null}
            <div className="min-w-0">
              <p className="font-heading text-lg font-medium">{property.agent.name}</p>
              {property.agent.position ? (
                <p className="mt-1 text-sm text-muted-foreground">{property.agent.position}</p>
              ) : null}
            </div>
          </Link>
        </ListingSection>
      ) : null}
    </ListingFolio>
  );
}
