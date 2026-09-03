import type { ReactNode } from "react";
import { CatalogEmpty } from "@/components/public/catalog-empty";
import { CommunityPlaceCard } from "@/components/public/community-place-card";
import { GoldRule } from "@/components/public/gold-rule";
import { Link } from "@/i18n/navigation";
import { marketChipClassName } from "@/lib/home-community-markets";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export type CommunityDirectoryItem = {
  href: string;
  name: string;
  city: string;
  excerpt: string;
  imageUrl: string | null;
  imageAlt?: string;
};

export type CommunityDirectoryMarket = {
  countryCode: string;
  label: string;
  href: string;
};

export function CommunityDirectory({
  breadcrumb,
  title,
  headingId,
  intro,
  empty,
  countLabel,
  listLabel,
  photoLabel,
  places,
  marketGroupLabel,
  markets,
  selectedMarket,
}: {
  breadcrumb: ReactNode;
  title: string;
  headingId: string;
  intro: string;
  empty: string;
  countLabel?: string | null;
  listLabel: string;
  photoLabel: string;
  places: CommunityDirectoryItem[];
  marketGroupLabel: string;
  markets: CommunityDirectoryMarket[];
  selectedMarket?: string | null;
}) {
  const showMarketTabs = markets.length > 1;

  return (
    <main id="main">
      <header className={cn("py-10 sm:py-12", publicGutter)}>
        {breadcrumb}
        <h1
          id={headingId}
          className="mt-8 max-w-[14ch] scroll-mt-24 font-heading text-3xl font-semibold tracking-tight text-pretty sm:text-4xl"
        >
          {title}
        </h1>
        <GoldRule draw className="mt-5 w-10" />
        {showMarketTabs ? (
          <nav className="mt-8 flex flex-wrap items-center gap-2.5" aria-label={marketGroupLabel}>
            {markets.map((market) => {
              const selected = market.countryCode === selectedMarket;
              return (
                <Link
                  key={market.countryCode}
                  href={market.href}
                  aria-current={selected ? "page" : undefined}
                  className={marketChipClassName(selected, "onPaper")}
                >
                  {market.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
        <p className="mt-6 max-w-prose text-base leading-relaxed text-pretty text-foreground/80">{intro}</p>
        {countLabel ? <p className="mt-3 text-sm text-muted-foreground tabular-nums">{countLabel}</p> : null}
      </header>

      {places.length === 0 ? (
        <div className={cn("pb-20 sm:pb-24", publicGutter)}>
          <CatalogEmpty>{empty}</CatalogEmpty>
        </div>
      ) : (
        <section aria-label={listLabel} className={cn("pb-20 sm:pb-24", publicGutter)}>
          <ul className="grid grid-cols-2 gap-4 sm:gap-10 lg:grid-cols-3 xl:grid-cols-4">
            {places.map((place, index) => (
              <li key={`${place.href}-${place.name}`}>
                <CommunityPlaceCard
                  href={place.href}
                  name={place.name}
                  city={place.city}
                  excerpt={place.excerpt}
                  imageUrl={place.imageUrl}
                  imageAlt={place.imageAlt}
                  photoLabel={photoLabel}
                  eager={index < 4}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
