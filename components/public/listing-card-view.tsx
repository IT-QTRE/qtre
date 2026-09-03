import type { ReactNode } from "react";
import Image from "next/image";
import { Bath, Bed, Calendar, ImageIcon, MapPin, Maximize2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type ListingCardViewModel = {
  href: string;
  title: string;
  location: string;
  alt: string;
  priceLabel: string | null;
  developerBy?: string;
  bedsLabel?: string;
  bathsLabel?: string;
  areaLabel?: string;
  bedsMix?: string;
  bedsValue?: number;
  bathsValue?: number;
  areaValue?: string;
  areaUnit?: string;
  completionLabel?: string;
  completionAria?: string;
  badgeText: string | null;
  imageUrl: string | null;
  placeholderImage: string;
  description?: string;
};

const listingCardChrome =
  "overflow-hidden rounded-xl border border-border bg-background shadow-[0_10px_32px_color-mix(in_oklab,var(--foreground)_14%,transparent)]";

export function ListingCardView({
  listing,
  headingLevel = "h3",
  layout = "grid",
  priority = false,
}: {
  listing: ListingCardViewModel;
  headingLevel?: "h2" | "h3";
  layout?: "grid" | "list";
  priority?: boolean;
}) {
  const Heading = headingLevel;
  const forceList = layout === "list";
  const specs: { key: string; icon: ReactNode; value: string; unit?: string; label?: string; numeric?: boolean }[] = [
    listing.bedsMix
      ? {
          key: "beds",
          icon: <Bed className="size-3.5" aria-hidden />,
          value: listing.bedsMix,
          label: listing.bedsLabel,
          numeric: false,
        }
      : listing.bedsValue != null
        ? {
            key: "beds",
            icon: <Bed className="size-3.5" aria-hidden />,
            value: listing.bedsValue === 0 ? (listing.bedsLabel ?? String(listing.bedsValue)) : String(listing.bedsValue),
            label: listing.bedsValue === 0 ? undefined : listing.bedsLabel,
            numeric: listing.bedsValue !== 0,
          }
        : null,
    listing.bathsValue != null
      ? { key: "baths", icon: <Bath className="size-3.5" aria-hidden />, value: String(listing.bathsValue), label: listing.bathsLabel }
      : null,
    listing.areaValue
      ? {
          key: "area",
          icon: <Maximize2 className="size-3.5" aria-hidden />,
          value: listing.areaValue,
          unit: listing.areaUnit,
          label: listing.areaLabel,
        }
      : null,
    listing.completionLabel
      ? {
          key: "completion",
          icon: <Calendar className="size-3.5" aria-hidden />,
          value: listing.completionLabel,
          label: listing.completionAria,
          numeric: false,
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item != null);

  return (
    <article className="scroll-mt-28">
      <Link
        href={listing.href}
        className={cn(
          listingCardChrome,
          "group block touch-manipulation transition-[box-shadow,border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          "hover:border-secondary/50 hover:shadow-[0_16px_40px_color-mix(in_oklab,var(--foreground)_18%,transparent)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "group-data-[view=list]/results:flex group-data-[view=list]/results:flex-row",
          forceList && "flex flex-row",
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden bg-accent aspect-16/10 sm:aspect-4/3",
            "group-data-[view=list]/results:aspect-auto group-data-[view=list]/results:w-[min(42%,10.5rem)] group-data-[view=list]/results:min-h-28 group-data-[view=list]/results:shrink-0",
            "group-data-[view=list]/results:sm:w-[min(42%,22rem)] group-data-[view=list]/results:sm:min-h-56",
            forceList && "aspect-auto w-[min(42%,10.5rem)] min-h-28 shrink-0 sm:w-[min(42%,22rem)] sm:min-h-56",
          )}
        >
          {listing.imageUrl ? (
            <Image
              src={listing.imageUrl}
              alt={listing.alt}
              fill
              priority={priority}
              className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              sizes={
                forceList
                  ? "(min-width: 640px) 22rem, 42vw"
                  : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              }
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-foreground/80">
              <ImageIcon className="size-7" aria-hidden />
              <span>{listing.placeholderImage}</span>
            </div>
          )}
          {listing.badgeText ? (
            <div className="absolute inset-s-3 top-3">
              <span className="rounded-md bg-background px-2 py-1 font-heading text-xs font-medium tracking-tight text-primary">
                {listing.badgeText}
              </span>
            </div>
          ) : null}
        </div>
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col px-4 pb-4 pt-3 sm:px-5 sm:pb-5 sm:pt-4",
            "group-data-[view=list]/results:justify-center group-data-[view=list]/results:px-4 group-data-[view=list]/results:py-3",
            "group-data-[view=list]/results:sm:px-7 group-data-[view=list]/results:sm:py-6",
            forceList && "justify-center px-4 py-3 sm:px-7 sm:py-6",
          )}
        >
          {listing.priceLabel ? (
            <p className="font-heading text-lg font-semibold tracking-tight text-pretty tabular-nums text-primary sm:text-xl">
              {listing.priceLabel}
            </p>
          ) : null}
          <Heading className="mt-2 font-heading text-base font-medium tracking-tight text-pretty text-foreground line-clamp-2">
            {listing.title}
          </Heading>
          {listing.developerBy ? (
            <p className="mt-1 text-sm text-pretty text-foreground/80 line-clamp-1">{listing.developerBy}</p>
          ) : null}
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
            <span className="min-w-0 truncate">{listing.location}</span>
          </p>
          {specs.length > 0 ? (
            <>
              <div
                className="mt-4 h-px w-10 origin-left bg-secondary transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-[1.6] motion-reduce:transition-none rtl:origin-right"
                aria-hidden
              />
              <ul className="mt-3 flex flex-wrap items-center text-sm text-foreground">
                {specs.map((spec, index) => (
                  <Spec
                    key={spec.key}
                    icon={spec.icon}
                    value={spec.value}
                    unit={spec.unit}
                    label={spec.label}
                    numeric={spec.numeric}
                    divider={index > 0}
                  />
                ))}
              </ul>
            </>
          ) : null}
          {listing.description ? (
            <div
              className={cn(
                "mt-3 hidden",
                "group-data-[view=list]/results:sm:block",
                forceList && "sm:block",
              )}
            >
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground line-clamp-2">
                {listing.description}
              </p>
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}

function Spec({
  icon,
  value,
  unit,
  label,
  numeric = true,
  divider,
}: {
  icon: ReactNode;
  value: string;
  unit?: string;
  label?: string;
  numeric?: boolean;
  divider: boolean;
}) {
  return (
    <li className="inline-flex items-center">
      {divider ? <span className="mx-3 h-4 w-px bg-border" aria-hidden /> : null}
      <span className="inline-flex items-center gap-1.5">
        <span className="text-primary">{icon}</span>
        <span className={cn("font-heading text-sm font-semibold", numeric && "tabular-nums")}>{value}</span>
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
        {label ? <span className="sr-only">{label}</span> : null}
      </span>
    </li>
  );
}
