import type { ReactNode } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pickLocalized, type LocalizedText } from "@/lib/i18n/localized";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

function PlaceWell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative aspect-3/4 overflow-hidden rounded-xl bg-accent", className)}>
      {children}
    </div>
  );
}

function PlaceFallback({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-foreground/80">
      <ImageIcon className="size-6" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

function PlaceCaption({ name, city }: { name: string; city: string }) {
  return (
    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-foreground/80 via-foreground/35 to-transparent px-4 pb-4 pt-16">
      <p className="font-heading text-lg font-semibold tracking-tight text-balance text-background">{name}</p>
      <p className="mt-1 text-sm text-background/80">{city}</p>
    </div>
  );
}

export async function CommunityTeaser({
  href,
  name,
  city,
  imageUrl,
  imageAlt,
}: {
  href: string;
  name: LocalizedText;
  city: LocalizedText;
  imageUrl: string | null;
  imageAlt: LocalizedText | null;
}) {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("catalog");
  const heading = pickLocalized(name, locale);
  const place = pickLocalized(city, locale);
  const alt = imageAlt ? pickLocalized(imageAlt, locale) : heading;

  return (
    <article>
      <Link
        href={href}
        className="group block overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <PlaceWell>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={alt}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              sizes="(min-width: 1024px) 28vw, (min-width: 640px) 45vw, 85vw"
            />
          ) : (
            <PlaceFallback label={t("placeholderImage")} />
          )}
          <PlaceCaption name={heading} city={place} />
        </PlaceWell>
      </Link>
    </article>
  );
}

const SAMPLES = [
  { nameKey: "sampleCommunity1" as const, cityKey: "sampleCommunityCity" as const },
  { nameKey: "sampleCommunity2" as const, cityKey: "sampleCommunityCity" as const },
  { nameKey: "sampleCommunity3" as const, cityKey: "sampleCommunityCity" as const },
];

export async function CommunityTeaserScaffold({ sample }: { sample: 0 | 1 | 2 }) {
  const tHome = await getTranslations("home");
  const tCatalog = await getTranslations("catalog");
  const row = SAMPLES[sample];

  return (
    <article aria-hidden className="select-none">
      <PlaceWell>
        <PlaceFallback label={tCatalog("scaffoldPhoto")} />
        <PlaceCaption name={tHome(row.nameKey)} city={tHome(row.cityKey)} />
      </PlaceWell>
    </article>
  );
}
