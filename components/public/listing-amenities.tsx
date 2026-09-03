"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

const PREVIEW_COUNT = 8;

export function ListingAmenities({ amenities }: { amenities: string[] }) {
  const t = useTranslations("catalog");
  const [expanded, setExpanded] = useState(false);
  const canToggle = amenities.length > PREVIEW_COUNT;
  const visible = expanded || !canToggle ? amenities : amenities.slice(0, PREVIEW_COUNT);

  return (
    <div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-3 sm:gap-x-10">
        {visible.map((amenity) => (
          <li key={amenity} className="flex items-start gap-2 sm:gap-3">
            <Check className="mt-0.5 size-4 shrink-0 text-secondary" strokeWidth={2.25} aria-hidden />
            <span className="min-w-0 font-heading text-sm font-medium leading-relaxed text-pretty">{amenity}</span>
          </li>
        ))}
      </ul>
      {canToggle ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          className="mt-4 min-h-11 font-heading text-sm font-medium text-primary touch-manipulation hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? t("listingShowLess") : t("listingShowMore")}
        </button>
      ) : null}
    </div>
  );
}
