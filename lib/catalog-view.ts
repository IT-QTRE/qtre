export const CATALOG_VIEW_COOKIE = "qtre-catalog-view:v1";
const CATALOG_VIEW_COOKIE_LEGACY = "qtre-catalog-view";

export type CatalogView = "grid" | "list";

export function parseCatalogView(value: string | undefined | null): CatalogView {
  return value === "list" ? "list" : "grid";
}

export function catalogViewFromCookies(read: (name: string) => string | undefined) {
  return parseCatalogView(read(CATALOG_VIEW_COOKIE) ?? read(CATALOG_VIEW_COOKIE_LEGACY));
}

export function persistCatalogView(view: CatalogView) {
  try {
    document.cookie = `${CATALOG_VIEW_COOKIE}=${view}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    // Cookie writes can throw in locked-down browsers.
  }
}
