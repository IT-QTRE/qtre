import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AdminFilterOption<T extends string> = {
  id: T;
  label: ReactNode;
  ariaLabel?: string;
};

export function AdminFilterGroup<T extends string>({
  options,
  value,
  onChange,
  label,
  layout = "bar",
}: {
  options: readonly AdminFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  layout?: "bar" | "wrap";
}) {
  const wrap = layout === "wrap";

  return (
    <div
      className={cn(wrap ? "flex flex-wrap gap-1" : "inline-flex border border-border")}
      role="group"
      aria-label={label}
    >
      {options.map((option, index) => {
        const selected = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            aria-label={option.ariaLabel}
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "inline-flex min-h-11 touch-manipulation items-center px-3 text-xs font-medium transition-colors",
              "focus-visible:relative focus-visible:z-10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
              wrap
                ? "border border-border"
                : index > 0
                  ? "border-s border-border"
                  : "",
              selected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
