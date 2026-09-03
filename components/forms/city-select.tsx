"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { FieldHint } from "@/components/forms/field-hint";
import type { FormLocale } from "@/components/forms/form-locale";
import { citiesForCountry, cityLabel, matchCuratedCity, type CuratedCity } from "@/lib/constants/cities";
import { cn } from "@/lib/utils";

const OTHER_VALUE = "__other__";

type LocalizedCity = { en: string; ar?: string; tr?: string };

export function CitySelect({
  countryCode,
  value,
  onChange,
  locale,
  invalid,
  id = "property-city",
}: {
  countryCode: string;
  value: LocalizedCity;
  onChange: (next: LocalizedCity) => void;
  locale: FormLocale;
  invalid?: boolean;
  id?: string;
}) {
  const options = citiesForCountry(countryCode);
  const matched = matchCuratedCity(countryCode, value.en);
  const [forceCustom, setForceCustom] = useState(false);
  const showCustom = forceCustom || Boolean(value.en?.trim() && !matched);
  const requiredHere = locale === "en";
  const dir = locale === "ar" ? "rtl" : "ltr";

  const display = showCustom
    ? "Other…"
    : matched
      ? cityLabel(matched, locale)
      : options.length > 0
        ? "Select a city…"
        : "Type a city…";

  function applyCurated(city: CuratedCity) {
    setForceCustom(false);
    onChange({ en: city.en, ar: city.ar, tr: city.tr });
  }

  function handleSelect(next: string | null) {
    if (!next) return;
    if (next === OTHER_VALUE) {
      setForceCustom(true);
      return;
    }
    const city = options.find((option) => option.en === next);
    if (city) applyCurated(city);
  }

  function handleCustomChange(next: string) {
    onChange({ ...value, [locale]: next });
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={id}>
        City
        {requiredHere ? <span className="text-destructive"> *</span> : null}
      </Label>
      {requiredHere ? null : <FieldHint>Optional — English shows if blank.</FieldHint>}
      {options.length > 0 ? (
        <Select value={showCustom ? OTHER_VALUE : (matched?.en ?? "")} onValueChange={handleSelect}>
          <SelectTrigger id={id} className="w-full" aria-invalid={invalid || undefined}>
            <span
              className={cn(
                "flex flex-1 truncate text-left",
                !showCustom && !matched ? "text-muted-foreground" : undefined,
              )}
            >
              {display}
            </span>
          </SelectTrigger>
          <SelectContent>
            {options.map((city) => (
              <SelectItem key={city.en} value={city.en}>
                {cityLabel(city, locale)}
              </SelectItem>
            ))}
            <SelectItem value={OTHER_VALUE}>Other…</SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          dir={dir}
          value={value[locale] ?? ""}
          placeholder="e.g. Dubai"
          aria-invalid={invalid || undefined}
          onChange={(event) => handleCustomChange(event.target.value)}
        />
      )}
      {showCustom && options.length > 0 ? (
        <Input
          dir={dir}
          value={value[locale] ?? ""}
          placeholder="e.g. Dubai"
          aria-invalid={invalid || undefined}
          onChange={(event) => handleCustomChange(event.target.value)}
        />
      ) : null}
      {options.length > 0 ? (
        <FieldHint>Suggestions follow Market. Other… if the city is not listed.</FieldHint>
      ) : (
        <FieldHint>Pick a market to see city suggestions, or type the city.</FieldHint>
      )}
    </div>
  );
}
