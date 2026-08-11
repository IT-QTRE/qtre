"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Clickable pills instead of a free-text comma list (the previous UI) —
// prevents inconsistent values ("Pool" vs "pool" vs "Swimming Pool") so the
// public site can eventually filter/facet by amenity reliably. Any value
// already on `value` that isn't in `options` (typed before this picker
// existed, or added via "Other" below) still renders as a selected pill —
// nothing is silently dropped on load.
export function AmenityPicker({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: readonly string[];
}) {
  const [customInput, setCustomInput] = useState("");
  const extras = value.filter((item) => !options.includes(item));
  const allPills = [...options, ...extras];

  function toggle(amenity: string) {
    if (value.includes(amenity)) {
      onChange(value.filter((item) => item !== amenity));
    } else {
      onChange([...value, amenity]);
    }
  }

  function addCustom() {
    const trimmed = customInput.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setCustomInput("");
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {allPills.map((amenity) => {
          const selected = value.includes(amenity);
          return (
            <button
              key={amenity}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(amenity)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {amenity}
              {selected && <X className="size-3" />}
            </button>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Input
          value={customInput}
          onChange={(event) => setCustomInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
          placeholder="Other amenity…"
          className="max-w-xs"
        />
        <Button type="button" variant="outline" size="sm" onClick={addCustom}>
          Add
        </Button>
      </div>
    </div>
  );
}
