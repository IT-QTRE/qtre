"use client";

import { Children, useState, type CSSProperties, type ReactNode } from "react";
import { LayoutGrid, List } from "lucide-react";
import { persistCatalogView, type CatalogView } from "@/lib/catalog-view";
import { cn } from "@/lib/utils";

export function CatalogResults({
  children,
  countLabel,
  listLabel,
  initialView,
  viewGroupLabel,
  viewGridLabel,
  viewListLabel,
}: {
  children: ReactNode;
  countLabel: string;
  listLabel: string;
  initialView: CatalogView;
  viewGroupLabel: string;
  viewGridLabel: string;
  viewListLabel: string;
}) {
  const [view, setView] = useState<CatalogView>(initialView);

  function choose(next: CatalogView) {
    setView(next);
    persistCatalogView(next);
  }

  return (
    <section aria-label={listLabel}>
      <div className="flex items-center justify-between gap-4">
        <p aria-live="polite" className="min-w-0 text-sm tabular-nums text-muted-foreground">
          {countLabel}
        </p>
        <div role="group" aria-label={viewGroupLabel} className="flex shrink-0 items-center rounded-lg border border-border p-0.5">
          <ViewButton pressed={view === "grid"} label={viewGridLabel} onClick={() => choose("grid")}>
            <LayoutGrid className="size-4" aria-hidden />
          </ViewButton>
          <ViewButton pressed={view === "list"} label={viewListLabel} onClick={() => choose("list")}>
            <List className="size-4" aria-hidden />
          </ViewButton>
        </div>
      </div>
      <div
        data-view={view}
        className={cn(
          "group/results qtre-stagger mt-6",
          view === "grid" ? "grid gap-6 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3" : "flex flex-col gap-4 sm:gap-6",
        )}
      >
        {Children.map(children, (child, index) => (
          <div style={{ "--i": index } as CSSProperties}>{child}</div>
        ))}
      </div>
    </section>
  );
}

function ViewButton({
  pressed,
  label,
  onClick,
  children,
}: {
  pressed: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 cursor-pointer touch-manipulation items-center justify-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors duration-200 ease-out motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        pressed ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}
