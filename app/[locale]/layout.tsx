import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist_Mono, IBM_Plex_Sans_Arabic, Inter, Poppins } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { ClerkProvider } from "@clerk/nextjs";
import "../globals.css";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { CatalogChromeProvider } from "@/components/public/catalog-chrome";
import { SiteHeader } from "@/components/public/site-header";
import { SiteFooter, SiteFooterFallback } from "@/components/public/site-footer";
import { PublicGhlChatWidget } from "@/components/public/ghl-chat-widget";
import { siteUrl } from "@/lib/site";
import { clerkAppearance } from "@/lib/clerk-appearance";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-sans" });

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "QuickTalk Real Estate | Dubai Properties",
    template: "%s",
  },
  description:
    "Explore properties for sale and rent, off-plan developments, and real estate investment opportunities in Dubai.",
  appleWebApp: {
    title: "QTRE",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({ children }: LayoutProps<"/[locale]">) {
  // Reads from next/root-params under the hood (via i18n/request.ts, where
  // the locale is validated) rather than the `params` prop — this is the
  // next-intl-recommended pattern as of Next.js 16.3's next/root-params,
  // which also means generateStaticParams below is enough for static
  // rendering on its own; no setRequestLocale call needed anymore.
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={cn(
        "h-full antialiased font-sans",
        inter.variable,
        poppins.variable,
        geistMono.variable,
        locale === "ar" && ibmPlexArabic.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <ClerkProvider afterSignOutUrl="/sign-in" appearance={clerkAppearance}>
            <ConvexClientProvider>
              <CatalogChromeProvider>
                <SiteHeader />
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
                <Suspense fallback={<SiteFooterFallback />}>
                  <SiteFooter />
                </Suspense>
                <Suspense fallback={null}>
                  <PublicGhlChatWidget />
                </Suspense>
              </CatalogChromeProvider>
            </ConvexClientProvider>
          </ClerkProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
