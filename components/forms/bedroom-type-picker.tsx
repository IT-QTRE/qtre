"use client";

import { cn } from "@/lib/utils";
import { BEDROOM_TYPE_LABELS, BEDROOM_TYPE_VALUES, type BedroomType } from "@/lib/format/bedroom-types";

export function BedroomTypePicker({
  value,
  onChange,
}: {
  value: number[];
  onChange: (next: BedroomType[]) => void;
}) {
  const selected = new Set(value);

  function toggle(type: BedroomType) {
    if (selected.has(type)) {
      onChange(BEDROOM_TYPE_VALUES.filter((item) => item !== type && selected.has(item)));
      return;
    }
    onChange(BEDROOM_TYPE_VALUES.filter((item) => item === type || selected.has(item)));
  }

  return (
    <div className="flex flex-wrap gap-2">
      {BEDROOM_TYPE_VALUES.map((type) => {
        const isOn = selected.has(type);
        return (
          <button
            key={type}
            type="button"
            aria-pressed={isOn}
            onClick={() => toggle(type)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-3 text-sm transition-colors",
              isOn
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {BEDROOM_TYPE_LABELS[type]}
          </button>
        );
      })}
    </div>
  );
}
