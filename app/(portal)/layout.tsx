import type { Metadata } from "next";
import { Geist_Mono, Inter, Poppins } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "../globals.css";
import { cn } from "@/lib/utils";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: {
    default: "QuickTalk Real Estate",
    template: "%s | QuickTalk Real Estate",
  },
};

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

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", inter.variable, poppins.variable, geistMono.variable, "font-sans")}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden">
        <ClerkProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
