import type { Metadata } from "next";
import { Geist_Mono, Inter, Poppins } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { ClerkProvider } from "@clerk/nextjs";
import "../globals.css";
import { cn } from "@/lib/utils";
import { routing } from "@/i18n/routing";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuickTalk Real Estate | Dubai Properties",
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
      className={cn("h-full", "antialiased", inter.variable, poppins.variable, geistMono.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider>
          <ClerkProvider>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </ClerkProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
