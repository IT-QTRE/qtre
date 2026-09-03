import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { api } from "@/convex/_generated/api";
import { fetchPublicQuery } from "@/lib/convex/fetch-public-query";
import { websiteHref } from "@/components/public/profile-contact";
import { SOCIAL_ORDER, SocialMark } from "@/components/public/social-marks";
import { PRIMARY_NAV, SECONDARY_NAV, SELL_NAV } from "@/lib/public-nav";
import { publicGutter } from "@/lib/public-layout";
import { whatsappHref } from "@/lib/whatsapp-href";
import { cn } from "@/lib/utils";

const SOCIAL_LABEL = {
  facebook: "socialFacebook",
  instagram: "socialInstagram",
  linkedin: "socialLinkedin",
  twitter: "socialTwitter",
} as const;

export function SiteFooterFallback() {
  return (
    <footer className="border-t border-border bg-background" aria-hidden>
      <div className={cn("mx-auto w-full py-14 sm:py-16", publicGutter)}>
        <div className="h-44 sm:h-48" />
      </div>
    </footer>
  );
}

export async function SiteFooter() {
  const [t, tBrand, tFooter, tCatalog, settings] = await Promise.all([
    getTranslations("nav"),
    getTranslations("brand"),
    getTranslations("footer"),
    getTranslations("catalog"),
    fetchPublicQuery(api.websiteSettings.publicGet, {}),
  ]);
  const year = new Date().getFullYear();
  const whatsappLink = settings?.contactWhatsapp
    ? whatsappHref(settings.contactWhatsapp, tCatalog("contactWhatsappMessage"))
    : null;
  const socials = SOCIAL_ORDER.flatMap((key) => {
    const raw = settings?.socialLinks?.[key];
    if (!raw) return [];
    const href = websiteHref(raw);
    if (!href) return [];
    return [{ key, href, label: tCatalog(SOCIAL_LABEL[key]) }];
  });

  return (
    <footer className="border-t border-border bg-background">
      <div className={cn("mx-auto w-full py-14 sm:py-16", publicGutter)}>
        <div
          className={cn(
            "flex flex-col items-center gap-10 text-center",
            "md:flex-row md:items-start md:justify-between md:text-start",
          )}
        >
          <div className="flex max-w-sm flex-col items-center md:items-start">
            <Link href="/" className="inline-flex shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={tBrand("name")}>
              <Image
                src="/brand/qtre-no-bg.png"
                alt=""
                width={820}
                height={304}
                className="h-12 w-auto object-contain sm:h-14"
              />
            </Link>
            <div className="mt-5 h-px w-10 bg-secondary" />
            <p className="mt-5 text-sm leading-relaxed text-foreground/80">{tBrand("tagline")}</p>
            {settings?.contactEmail ? (
              <a href={`mailto:${settings.contactEmail}`} className="mt-4 text-sm text-primary hover:underline">
                {settings.contactEmail}
              </a>
            ) : null}
            {settings?.contactPhone ? (
              <a href={`tel:${settings.contactPhone}`} className="mt-1 text-sm text-primary hover:underline">
                {settings.contactPhone}
              </a>
            ) : null}
            {whatsappLink ? (
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 text-sm text-primary hover:underline"
              >
                {tCatalog("contactWhatsapp")}
              </a>
            ) : null}
          </div>
          <nav className="flex flex-col items-center gap-5 text-sm md:items-start md:pt-2" aria-label={tBrand("name")}>
            {socials.length > 0 ? (
              <div>
                <p className="font-heading text-xs font-medium tracking-[0.16em] text-secondary uppercase">
                  {tFooter("social")}
                </p>
                <ul className="mt-3 flex flex-wrap justify-center gap-2 md:justify-start">
                  {socials.map((row) => (
                    <li key={row.key}>
                      <a
                        href={row.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-12 min-w-12 items-center justify-center text-foreground/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={row.label}
                      >
                        <SocialMark network={row.key} className="size-6" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 md:justify-start">
              {PRIMARY_NAV.map((item) => (
                <Link key={item.key} href={item.href} className="font-heading font-medium text-foreground transition-colors hover:text-primary">
                  {t(item.key)}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 md:justify-start">
              {SECONDARY_NAV.map((item) => (
                <Link key={item.key} href={item.href} className="text-foreground/60 transition-colors hover:text-primary">
                  {t(item.key)}
                </Link>
              ))}
              <Link href="/about" className="text-foreground/60 transition-colors hover:text-primary">
                {t("about")}
              </Link>
              <Link href={SELL_NAV.href} className="text-foreground/60 transition-colors hover:text-primary">
                {t(SELL_NAV.key)}
              </Link>
            </div>
          </nav>
        </div>
        <p className="mt-12 text-center text-xs text-foreground/50 md:text-start">© {year} {tFooter("rights")}</p>
        <nav
          aria-label={tFooter("legal")}
          className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-foreground/50 md:justify-start"
        >
          <Link href="/privacy" className="hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {tFooter("privacy")}
          </Link>
          <Link href="/terms" className="hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {tFooter("terms")}
          </Link>
        </nav>
        <p
          aria-hidden
          className="mt-4 select-text text-center text-xs text-transparent selection:bg-transparent selection:text-foreground/50"
        >
          D.RW
        </p>
      </div>
    </footer>
  );
}
