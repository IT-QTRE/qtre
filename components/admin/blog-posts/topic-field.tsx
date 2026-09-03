"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldHint } from "@/components/forms/field-hint";
import { cn } from "@/lib/utils";

export function TopicField({
  id,
  value,
  onChange,
  options,
  disabled = false,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const needle = value.trim().toLowerCase();
  const matches = useMemo(() => {
    if (!needle) return options;
    return options.filter((name) => name.toLowerCase().includes(needle));
  }, [needle, options]);

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>Topic</Label>
      <div className="relative">
        <Input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          value={value}
          disabled={disabled}
          placeholder="Visa, Property, Project…"
          autoComplete="off"
          spellCheck={false}
          maxLength={80}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120);
          }}
        />
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="absolute top-1/2 right-2 -translate-y-1/2"
            aria-label="Clear topic"
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            <X />
          </Button>
        ) : null}
        {open && matches.length > 0 ? (
          <ul
            id={`${id}-list`}
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-3xl bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/5"
          >
            {matches.map((name) => (
              <li key={name} role="option" aria-selected={name.toLowerCase() === needle}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full rounded-2xl px-3 py-2 text-left text-sm font-medium",
                    "hover:bg-accent hover:text-accent-foreground",
                    name.toLowerCase() === needle ? "bg-accent text-accent-foreground" : undefined,
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <FieldHint>Visa, Property, Project, or type a new name.</FieldHint>
    </div>
  );
}
