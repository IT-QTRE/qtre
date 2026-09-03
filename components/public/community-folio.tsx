import type { ReactNode } from "react";
import { CatalogStage } from "@/components/public/catalog-stage";
import { CommunityFeaturedProject } from "@/components/public/community-featured-project";
import { CommunityIdentityHero } from "@/components/public/community-identity-hero";
import { ListingReadMore } from "@/components/public/listing-read-more";
import { ListingSection } from "@/components/public/listing-section";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function CommunityFolio({
  breadcrumb,
  title,
  city,
  intro,
  photoLabel,
  headingId,
  imageUrl,
  imageAlt,
  aboutLabel,
  aboutBody,
  photosLabel,
  gallery,
  stockHeading,
  seeAllLabel,
  seeAllHrefs,
  intentGroupLabel,
  buyLabel,
  rentLabel,
  salePanel,
  rentPanel,
  featured,
  offplanTitle,
  offplanPanel,
  offplanAside,
  closer,
}: {
  breadcrumb: ReactNode;
  title: string;
  city: string;
  intro: string;
  photoLabel: string;
  headingId: string;
  imageUrl?: string | null;
  imageAlt?: string;
  aboutLabel: string;
  aboutBody?: string;
  photosLabel?: string;
  gallery?: ReactNode;
  stockHeading: string;
  seeAllLabel: string;
  seeAllHrefs?: { buy?: string; rent?: string };
  intentGroupLabel: string;
  buyLabel: string;
  rentLabel: string;
  salePanel?: ReactNode;
  rentPanel?: ReactNode;
  featured?: {
    label: string;
    name: string;
    developer?: string;
    price?: string;
    body?: string;
    cta: string;
    href: string;
    imageUrl?: string | null;
  };
  offplanTitle: string;
  offplanPanel?: ReactNode;
  offplanAside?: ReactNode;
  closer: ReactNode;
}) {
  const stockIntents = [
    ...(salePanel ? (["buy"] as const) : []),
    ...(rentPanel ? (["rent"] as const) : []),
  ];

  return (
    <main id="main">
      <CommunityIdentityHero
        breadcrumb={breadcrumb}
        title={title}
        city={city}
        intro={intro}
        photoLabel={photoLabel}
        headingId={headingId}
        imageUrl={imageUrl}
        imageAlt={imageAlt}
      />

      {gallery ? (
        <section className={cn("bg-background py-8 sm:py-14", publicGutter)} aria-label={photosLabel}>
          {gallery}
        </section>
      ) : null}

      {aboutBody ? (
        <section className={cn("bg-background py-10 sm:py-20", publicGutter)} aria-labelledby="community-about-heading">
          <div className="lg:border-s lg:border-secondary lg:ps-12 xl:ps-16">
            <p
              id="community-about-heading"
              className="font-heading text-sm font-medium tracking-[0.16em] text-primary uppercase"
            >
              {aboutLabel}
            </p>
            <div className="mt-6">
              <ListingReadMore text={aboutBody} />
            </div>
          </div>
        </section>
      ) : null}

      {stockIntents.length > 0 ? (
        <CatalogStage
          heading={stockHeading}
          seeAllLabel={seeAllLabel}
          seeAllHrefs={seeAllHrefs}
          intentGroupLabel={intentGroupLabel}
          labels={{ buy: buyLabel, rent: rentLabel, offplan: offplanTitle }}
          intents={stockIntents}
          markId="community-stock-intent"
          panels={{ buy: salePanel, rent: rentPanel }}
        />
      ) : null}

      {featured ? (
        <CommunityFeaturedProject
          label={featured.label}
          name={featured.name}
          developer={featured.developer}
          price={featured.price}
          body={featured.body}
          cta={featured.cta}
          href={featured.href}
          imageUrl={featured.imageUrl}
          photoLabel={photoLabel}
        />
      ) : null}

      {offplanPanel ? (
        <div className={cn("py-10 sm:py-20", publicGutter)}>
          <ListingSection title={offplanTitle} aside={offplanAside}>
            {offplanPanel}
          </ListingSection>
        </div>
      ) : null}

      {closer}
    </main>
  );
}
