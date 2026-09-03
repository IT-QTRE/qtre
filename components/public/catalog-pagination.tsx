import { Link } from "@/i18n/navigation";
import { catalogPageWindow } from "@/lib/catalog-page";
import { cn } from "@/lib/utils";

export function CatalogPagination({
  page,
  pageCount,
  hrefForPage,
  label,
  prevLabel,
  nextLabel,
}: {
  page: number;
  pageCount: number;
  hrefForPage: (page: number) => string;
  label: string;
  prevLabel: string;
  nextLabel: string;
}) {
  if (pageCount <= 1) return null;

  const pages = catalogPageWindow(page, pageCount);

  return (
    <nav aria-label={label} className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link
          href={hrefForPage(page - 1)}
          rel="prev"
          className={pageLinkClass}
        >
          {prevLabel}
        </Link>
      ) : (
        <span className={cn(pageLinkClass, "pointer-events-none opacity-40")} aria-disabled="true">
          {prevLabel}
        </span>
      )}
      {pages.map((item, index) =>
        item === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-muted-foreground" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={item}
            href={hrefForPage(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(pageLinkClass, item === page && "bg-primary text-primary-foreground")}
          >
            {item}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link href={hrefForPage(page + 1)} rel="next" className={pageLinkClass}>
          {nextLabel}
        </Link>
      ) : (
        <span className={cn(pageLinkClass, "pointer-events-none opacity-40")} aria-disabled="true">
          {nextLabel}
        </span>
      )}
    </nav>
  );
}

const pageLinkClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
