import { catalogSearchHref } from "@/lib/seo/catalog";
import { offplanSearchHref } from "@/lib/seo/offplan-catalog";

export type SearchIntent = "buy" | "rent" | "offplan";

export function homeSearchHref(intent: SearchIntent, query = "") {
  const q = query.trim() || undefined;
  if (intent === "offplan") return offplanSearchHref({ q });
  return catalogSearchHref(intent === "rent" ? "rent" : "sale", { q });
}

export const PRIMARY_NAV = [
  { href: homeSearchHref("buy"), key: "buy", match: "buy" },
  { href: homeSearchHref("rent"), key: "rent", match: "rent" },
  { href: homeSearchHref("offplan"), key: "offplan", match: "offplan" },
] as const;

export const SECONDARY_NAV = [
  { href: "/developers", key: "developers" },
  { href: "/communities", key: "communities" },
  { href: "/agents", key: "agents" },
  { href: "/services", key: "services" },
  { href: "/blog", key: "blog" },
  { href: "/contact", key: "contact" },
] as const;

// Owner path — Contact until Client Portal exists. Kept off SECONDARY_NAV
// so it does not sit next to Contact as a second directory item.
export const SELL_NAV = { href: "/contact", key: "sell" } as const;

export function isPrimaryNavActive(match: (typeof PRIMARY_NAV)[number]["match"], pathname: string, status: string | null) {
  if (match === "offplan") return pathname === "/projects" || pathname.startsWith("/projects/");
  // Index only — a listing slug has no status in the URL, so marking Buy
  // (or Rent) there would lie about which catalog the visitor is in.
  if (pathname !== "/properties") return false;
  if (match === "rent") return status === "rent";
  return status !== "rent";
}

export function isSecondaryNavActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isCatalogIndexPath(pathname: string) {
  return pathname === "/properties" || pathname === "/projects";
}
