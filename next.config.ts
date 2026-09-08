import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** GHL chat loader, form iframe, and white-label form host. */
const GHL_HTTPS_HOSTS = [
  "widgets.leadconnectorhq.com",
  "*.leadconnectorhq.com",
  "msgsndr.com",
  "*.msgsndr.com",
  "go.quicktalkbusiness.com",
] as const;

function cspValue(parts: string[]) {
  return parts.join("; ");
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      ...GHL_HTTPS_HOSTS.map((hostname) => ({ protocol: "https" as const, hostname })),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: cspValue([
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
              "connect-src 'self' https: wss: ws:",
              "img-src 'self' data: blob: https:",
              "style-src 'self' 'unsafe-inline' https:",
              "font-src 'self' data: https:",
              "frame-src 'self' https:",
              "form-action 'self' https:",
              "media-src 'self' blob: https:",
              "worker-src 'self' blob:",
            ]),
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
