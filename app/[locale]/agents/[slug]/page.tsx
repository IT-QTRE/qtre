import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/convex/_generated/api";
import { AgentFolio } from "@/components/public/agent-folio";
import { AgentIdentity } from "@/components/public/agent-identity";
import { DirectoryContact } from "@/components/public/developer-contact";
import { ListingCard } from "@/components/public/listing-card";
import { ListingReadMore } from "@/components/public/listing-read-more";
import { ListingSection } from "@/components/public/listing-section";
import { ProfileBreadcrumb } from "@/components/public/profile-breadcrumb";
import { telHref } from "@/components/public/profile-contact";
import { pickLocalized } from "@/lib/i18n/localized";
import type { AppLocale } from "@/i18n/routing";
import { siteUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [localeRaw, tBrand, t, agent] = await Promise.all([
    getLocale(),
    getTranslations("brand"),
    getTranslations("catalog"),
    fetchPublicQuery(api.publicCatalog.getPublishedAgentBySlug, { slug }),
  ]);
  if (!agent) return { title: tBrand("name") };
  const locale = localeRaw as AppLocale;
  const description = agent.bio
    ? pickLocalized(agent.bio, locale).replace(/\s+/g, " ").trim().slice(0, 160)
    : t("agentProfileFallback");
  const canonical = `${siteUrl}/${locale}/agents/${slug}`;
  return {
    title: `${agent.name} | ${tBrand("name")}`,
    description,
    alternates: { canonical },
    openGraph: {
      title: agent.name,
      description,
      url: canonical,
      images: agent.imageUrl ? [{ url: agent.imageUrl }] : undefined,
    },
  };
}

export default async function AgentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [localeRaw, t, tNav, agent] = await Promise.all([
    getLocale(),
    getTranslations("catalog"),
    getTranslations("nav"),
    fetchPublicQuery(api.publicCatalog.getPublishedAgentBySlug, { slug }),
  ]);
  const locale = localeRaw as AppLocale;
  if (!agent) notFound();

  const bio = agent.bio ? pickLocalized(agent.bio, locale) : "";
  const hasBio = bio.trim().length > 0;
  const hasContact = Boolean(agent.email || (agent.phone && telHref(agent.phone)));
  const listingCols = hasContact
    ? "grid grid-cols-1 gap-10 sm:grid-cols-2"
    : "grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3";

  const contact = hasContact ? (
    <DirectoryContact
      email={agent.email}
      phone={agent.phone}
      websiteLabel={t("profileWebsite")}
      emailLabel={t("inquireEmail")}
      phoneLabel={t("inquirePhone")}
    />
  ) : undefined;

  return (
    <AgentFolio
      breadcrumb={
        <ProfileBreadcrumb
          label={t("breadcrumb")}
          homeLabel={tNav("home")}
          parentHref="/agents"
          parentLabel={tNav("agents")}
          current={agent.name}
          tone="onPrimary"
        />
      }
      identity={<AgentIdentity title={agent.name} position={agent.position} imageUrl={agent.imageUrl} />}
      contact={contact}
    >
      {hasBio ? (
        <ListingSection title={t("listingAbout")}>
          <ListingReadMore text={bio} />
        </ListingSection>
      ) : null}

      {agent.properties.length > 0 ? (
        <ListingSection
          title={t("listingsHeading")}
          aside={t("listingCount", { count: agent.properties.length })}
        >
          <div className={listingCols}>
            {agent.properties.map((listing) => (
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
    </AgentFolio>
  );
}
