"use client";

import { useEffect, useId, useState, type KeyboardEvent } from "react";
import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import type { AppLocale } from "@/i18n/routing";
import { filterSearchPlaces, type SearchPlaceKind } from "@/lib/search-places";
import { cn } from "@/lib/utils";

export function PlaceSearchField({
  id,
  name = "q",
  kind,
  value,
  onChange,
  onPick,
  placeholder,
  label,
  inputClassName,
}: {
  id: string;
  name?: string;
  kind: SearchPlaceKind;
  value: string;
  onChange: (value: string) => void;
  onPick: (name: string) => void;
  placeholder: string;
  label: string;
  inputClassName?: string;
}) {
  const t = useTranslations("catalog");
  const locale = useLocale() as AppLocale;
  const listId = useId();
  const places = useQuery(api.publicCatalog.listSearchPlaces, { kind }) ?? [];
  const matches = filterSearchPlaces(places, value, locale);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const showList = open && matches.length > 0;
  const active = showList ? matches[activeIndex] : undefined;

  useEffect(() => {
    setOpen(false);
    setActiveIndex(0);
  }, [kind]);

  useEffect(() => {
    setActiveIndex((current) => (current >= matches.length ? 0 : current));
  }, [matches.length]);

  function pick(label: string) {
    setOpen(false);
    onPick(label);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => (showList ? (current + 1) % matches.length : 0));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) =>
        showList ? (current - 1 + matches.length) % matches.length : Math.max(matches.length - 1, 0),
      );
      return;
    }
    if (event.key === "Enter" && showList && active) {
      event.preventDefault();
      pick(active.label);
    }
  }

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        name={name}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active ? `${listId}-${active._id}` : undefined}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={cn(
          "min-w-0 w-full border-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground",
          inputClassName,
        )}
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("searchPlaces")}
          className="absolute inset-x-0 top-full z-60 mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-background py-1 shadow-[0_12px_40px_color-mix(in_oklab,var(--foreground)_18%,transparent)]"
        >
          {matches.map((place, index) => {
            const selected = index === activeIndex;
            return (
              <li key={place._id} role="presentation">
                <button
                  type="button"
                  id={`${listId}-${place._id}`}
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex w-full flex-col px-3 py-2 text-start",
                    selected ? "bg-muted text-foreground" : "text-foreground hover:bg-muted/70",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pick(place.label)}
                >
                  <span className="font-heading text-sm font-medium tracking-tight">{place.label}</span>
                  {place.cityLabel && place.cityLabel !== place.label ? (
                    <span className="text-xs text-muted-foreground">{place.cityLabel}</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
