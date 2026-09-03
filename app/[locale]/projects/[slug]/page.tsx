import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { Link } from "@/i18n/navigation";
import { pickLocalized } from "@/lib/i18n/localized";
import { formatAed } from "@/lib/format/aed";
import { formatCompletionDate } from "@/lib/format/completion-date";
import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";
import { PublicListingMap } from "@/components/maps/public-listing-map";
import { ListingAmenities } from "@/components/public/listing-amenities";
import { ListingGallery } from "@/components/public/listing-gallery";
import { ListingInquireForm } from "@/components/public/listing-inquire-form";
import { ListingPaymentPlan } from "@/components/public/listing-payment-plan";
import { ListingKeyFacts } from "@/components/public/listing-key-facts";
import { ListingReadMore } from "@/components/public/listing-read-more";
import { ListingSection } from "@/components/public/listing-section";
import { ProjectFolio } from "@/components/public/project-folio";
import { ProjectIdentity } from "@/components/public/project-identity";
import { ProjectJump, type ProjectJumpLink } from "@/components/public/project-jump";
import { ProjectUnitTypes } from "@/components/public/project-unit-types";
import { RelatedName } from "@/components/public/related-name";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [localeRaw, tBrand, project] = await Promise.all([
    getLocale(),
    getTranslations("brand"),
    fetchPublicQuery(api.publicCatalog.getPublishedProjectBySlug, { slug }),
  ]);
  if (!project) return { title: tBrand("name") };
  const locale = localeRaw as AppLocale;
  const title = pickLocalized(project.title, locale);
  const description = pickLocalized(project.description, locale).replace(/\s+/g, " ").trim().slice(0, 160);
  const canonical = `${siteUrl}/${locale}/projects/${slug}`;
  return {
    title: `${title} | ${tBrand("name")}`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: project.imageUrl ? [{ url: project.imageUrl }] : undefined,
    },
  };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [localeRaw, t, tNav, project, settings] = await Promise.all([
    getLocale(),
    getTranslations("catalog"),
    getTranslations("nav"),
    fetchPublicQuery(api.publicCatalog.getPublishedProjectBySlug, { slug }),
    fetchPublicQuery(api.websiteSettings.publicGet, {}),
  ]);
  const locale = localeRaw as AppLocale;
  if (!project) notFound();

  const title = pickLocalized(project.title, locale);
  const location = pickLocalized(project.communityName ?? project.city, locale);
  const description = pickLocalized(project.description, locale);
  const constructionLabel = t(`construction.${project.constructionStatus}`);
  const bedroomTypes = project.bedroomTypes ?? [];
  const unitTypeSpecs = project.unitTypes ?? [];
  const units = project.units ?? [];
  const images = (project.images ?? []).map((image) => ({
    url: image.url,
    alt: image.alt ? pickLocalized(image.alt, locale) : title,
  }));
  const amenities = project.amenities ?? [];
  const paymentPlan = project.paymentPlan ?? [];
  const hasAbout = description.trim().length > 0;
  const hasTypes = bedroomTypes.length > 0 || units.length > 0;
  const hasPayment = paymentPlan.length > 0;
  const hasLocation = project.coordinates != null;
  const jumpLinks: ProjectJumpLink[] = [
    { id: "overview", label: t("overview") },
    ...(hasAbout ? [{ id: "about", label: t("projectAbout") }] : []),
    ...(hasTypes ? [{ id: "types", label: t("unitTypes") }] : []),
    ...(hasPayment ? [{ id: "payment", label: t("paymentPlanHeading") }] : []),
    ...(hasLocation ? [{ id: "location", label: t("locationHeading") }] : []),
  ];
  const inquire = (
    <ListingInquireForm
      projectId={project._id}
      heading={t("speakAdvisor")}
      body={t("projectInquireBody", { title })}
      nameLabel={t("inquireName")}
      emailLabel={t("inquireEmail")}
      phoneLabel={t("inquirePhone")}
      messageLabel={t("inquireMessage")}
      submitLabel={t("inquireSubmit")}
      pendingLabel={t("inquirePending")}
      successTitle={t("inquireSuccessTitle")}
      successBody={t("inquireSuccessBodyProject")}
      errorLabel={t("inquireError")}
      emailFallback={settings?.contactEmail}
      phoneFallback={settings?.contactPhone}
      emphasis
    />
  );

  return (
    <ProjectFolio
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
              <Link href="/projects" className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {tNav("offplan")}
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
      jump={<ProjectJump label={t("onThisPage")} links={jumpLinks} />}
      identity={
        <ProjectIdentity
          price={project.startingPrice != null ? t("fromPrice", { price: formatAed(project.startingPrice, locale) }) : null}
          title={title}
          location={location}
          status={constructionLabel}
        />
      }
      specs={
        project.completionDate ? (
          <ListingKeyFacts
            rows={[
              {
                key: "completion",
                label: t("factCompletion"),
                value: formatCompletionDate(project.completionDate, locale),
              },
            ]}
          />
        ) : null
      }
      inquire={inquire}
    >
      {hasAbout ? (
        <div id="about" className="scroll-mt-28">
          <ListingSection title={t("projectAbout")}>
            <ListingReadMore text={description} />
          </ListingSection>
        </div>
      ) : null}

      {amenities.length > 0 ? (
        <ListingSection title={t("amenitiesHeading")}>
          <ListingAmenities amenities={amenities} />
        </ListingSection>
      ) : null}

      {hasTypes ? (
        <div id="types" className="scroll-mt-28">
          <ProjectUnitTypes
            heading={t("unitTypes")}
            listed={units.length > 0 ? t("listingCount", { count: units.length }) : undefined}
            types={unitTypeSpecs.length > 0 ? unitTypeSpecs.map((spec) => spec.bedrooms) : bedroomTypes}
            specs={unitTypeSpecs}
            studio={t("studio")}
            fourPlus={t("bedsPlus")}
            bedLabel={(count) => t("beds", { count })}
            fromPrice={(price) => t("fromPrice", { price })}
            locale={locale}
            sqftUnit={t("areaUnit")}
            sqmUnit={t("areaUnitSqm")}
            units={units.map((listing) => ({
              href: `/properties/${listing.slug}`,
              title: pickLocalized(listing.title, locale),
              baths: listing.bathrooms != null ? t("baths", { count: listing.bathrooms }) : null,
              price: listing.price != null ? formatAed(listing.price, locale) : null,
              priceAmount: listing.price,
              areaSqft: listing.areaSqft,
              bedrooms: listing.bedrooms,
              imageUrl: listing.imageUrl,
            }))}
          />
        </div>
      ) : null}

      {hasPayment ? (
        <div id="payment" className="scroll-mt-28">
          <ListingPaymentPlan
            rows={paymentPlan}
            percentLabel={(percent) => t("paymentPlanPercent", { percent })}
            heading={t("paymentPlanHeading")}
            band
          />
        </div>
      ) : null}

      {project.coordinates ? (
        <div id="location" className="scroll-mt-28">
          <ListingSection title={t("locationHeading")}>
            <PublicListingMap coordinates={project.coordinates} placeId={project.placeId} />
          </ListingSection>
        </div>
      ) : null}

      {project.communityName || project.developerName ? (
        <ListingSection title={t("relatedHeadingProject")}>
          <dl className="flex flex-wrap gap-x-12 gap-y-6">
            {project.developerName ? (
              <div>
                <dt className="text-xs text-muted-foreground">{t("relatedDeveloper")}</dt>
                <dd className="mt-1.5">
                  <RelatedName href={project.developerSlug ? `/developers/${project.developerSlug}` : null}>
                    {pickLocalized(project.developerName, locale)}
                  </RelatedName>
                </dd>
              </div>
            ) : null}
            {project.communityName ? (
              <div>
                <dt className="text-xs text-muted-foreground">{t("relatedCommunity")}</dt>
                <dd className="mt-1.5 font-heading text-base font-medium">{pickLocalized(project.communityName, locale)}</dd>
              </div>
            ) : null}
          </dl>
        </ListingSection>
      ) : null}
    </ProjectFolio>
  );
}
