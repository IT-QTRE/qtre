export const CATALOG_PAGE_SIZE = 12;

export function parseCatalogPage(value: string | undefined) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function catalogPageWindow(current: number, total: number): Array<number | "gap"> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const keep = new Set([1, total, current, current - 1, current + 1]);
  const numbers = [...keep].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
  const window: Array<number | "gap"> = [];
  for (const page of numbers) {
    const prev = window.at(-1);
    if (typeof prev === "number" && page - prev > 1) window.push("gap");
    window.push(page);
  }
  return window;
}
