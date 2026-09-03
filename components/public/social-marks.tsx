import { cn } from "@/lib/utils";

export type SocialKey = "facebook" | "instagram" | "linkedin" | "twitter";

export const SOCIAL_ORDER: SocialKey[] = ["facebook", "instagram", "linkedin", "twitter"];

export function SocialMark({ network, className }: { network: SocialKey; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-4 shrink-0", className)} aria-hidden>
      <path fill="currentColor" d={PATHS[network]} />
    </svg>
  );
}

const PATHS: Record<SocialKey, string> = {
  facebook:
    "M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95",
  instagram:
    "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5m10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3m-5 3.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 0 1 12 7.5m0 2A2.5 2.5 0 1 0 14.5 12 2.5 2.5 0 0 0 12 9.5M17.25 6.5a1 1 0 1 1-1 1 1 1 0 0 1 1-1",
  linkedin:
    "M6.5 21.5h-5v-13h5zm.45-17.1A2.55 2.55 0 1 1 4.4 1.85 2.55 2.55 0 0 1 6.95 4.4M21.5 21.5h-5v-6.3c0-1.9-.7-3.1-2.4-3.1-1.3 0-2 .9-2.3 1.7-.1.3-.1.7-.1 1.1v6.6h-5s.1-10.6 0-11.7h5v1.7c.7-1 1.9-2.4 4.6-2.4 3.4 0 5.9 2.2 5.9 6.9z",
  twitter:
    "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.835L2.15 2.25h6.8l4.261 5.662zm-1.161 17.52h1.833L7.084 4.126H5.117z",
};
