import type { ReactNode } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { pickLocalized, type LocalizedText } from "@/lib/i18n/localized";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const localeTags: Record<AppLocale, string> = {
  en: "en-AE",
  ar: "ar-AE",
  tr: "tr-TR",
};

function formatPublishedAt(ms: number, locale: AppLocale) {
  return new Intl.DateTimeFormat(localeTags[locale], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(ms));
}

function PhotoWell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative aspect-16/10 overflow-hidden rounded-xl bg-accent", className)}>
      {children}
    </div>
  );
}

function PhotoFallback({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-foreground/80">
      <ImageIcon className="size-6" aria-hidden />
      <span className="max-sm:hidden">{label}</span>
    </div>
  );
}

export async function BlogTeaser({
  href,
  title,
  publishedAt,
  imageUrl,
  imageAlt,
}: {
  href: string;
  title: LocalizedText;
  publishedAt: number;
  imageUrl: string | null;
  imageAlt: LocalizedText | null;
}) {
  const locale = (await getLocale()) as AppLocale;
  const t = await getTranslations("catalog");
  const heading = pickLocalized(title, locale);
  const alt = imageAlt ? pickLocalized(imageAlt, locale) : heading;

  return (
    <article>
      <Link
        href={href}
        className="group flex items-start gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:block"
      >
        <PhotoWell className="w-32 shrink-0 sm:w-auto">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={alt}
              fill
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              sizes="(min-width: 1024px) 28vw, (min-width: 640px) 30vw, 8rem"
            />
          ) : (
            <PhotoFallback label={t("placeholderImage")} />
          )}
        </PhotoWell>
        <div className="min-w-0">
          <p className="text-sm text-foreground/80 sm:mt-4">{formatPublishedAt(publishedAt, locale)}</p>
          <h3 className="mt-1 font-heading text-base font-semibold tracking-tight text-balance text-foreground group-hover:text-primary sm:mt-2 sm:text-lg">
            {heading}
          </h3>
        </div>
      </Link>
    </article>
  );
}

const SAMPLES = [
  { titleKey: "sampleBlogTitle1" as const, publishedAt: Date.UTC(2026, 2, 12) },
  { titleKey: "sampleBlogTitle2" as const, publishedAt: Date.UTC(2026, 0, 28) },
  { titleKey: "sampleBlogTitle3" as const, publishedAt: Date.UTC(2025, 10, 4) },
];

export async function BlogTeaserScaffold({ sample }: { sample: 0 | 1 | 2 }) {
  const tHome = await getTranslations("home");
  const tCatalog = await getTranslations("catalog");
  const locale = (await getLocale()) as AppLocale;
  const row = SAMPLES[sample];

  return (
    <article aria-hidden className="select-none">
      <div className="flex items-start gap-4 sm:block">
        <PhotoWell className="w-32 shrink-0 sm:w-auto">
          <PhotoFallback label={tCatalog("scaffoldPhoto")} />
        </PhotoWell>
        <div className="min-w-0">
          <p className="text-sm text-foreground/80 sm:mt-4">{formatPublishedAt(row.publishedAt, locale)}</p>
          <h3 className="mt-1 font-heading text-base font-semibold tracking-tight text-balance text-foreground sm:mt-2 sm:text-lg">
            {tHome(row.titleKey)}
          </h3>
        </div>
      </div>
    </article>
  );
}
