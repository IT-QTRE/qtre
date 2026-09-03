"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const PREVIEW_LINES = "line-clamp-6";

export function ListingReadMore({ text }: { text: string }) {
  const t = useTranslations("catalog");
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [canToggle, setCanToggle] = useState(false);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node || expanded) return;
    setCanToggle(node.scrollHeight > node.clientHeight + 2);
  }, [text, expanded]);

  return (
    <div>
      <p
        ref={ref}
        className={cn(
          "max-w-prose text-base leading-relaxed text-pretty whitespace-pre-wrap",
          expanded ? null : PREVIEW_LINES,
        )}
      >
        {text}
      </p>
      {canToggle ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          className="mt-3 min-h-11 font-heading text-sm font-medium text-primary touch-manipulation hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {expanded ? t("listingReadLess") : t("listingReadMore")}
        </button>
      ) : null}
    </div>
  );
}
