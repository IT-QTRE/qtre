"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CURATED_COUNTRIES } from "@/lib/constants/countries";

const OTHER_VALUE = "__other__";

// A dropdown of the business's actual markets beats free-typing an ISO code
// for the common case, but the field isn't a closed enum server-side — a
// code entered before this component existed, or a market outside the
// curated list, still needs a way in/out. "Other…" reveals the same
// free-text + uppercase-transform input the field used to be, so nothing
// that previously round-tripped stops working.
export function CountryCodeSelect({ value, onChange, id }: { value: string; onChange: (next: string) => void; id?: string }) {
  const isCurated = CURATED_COUNTRIES.some((country) => country.code === value);
  const [showCustom, setShowCustom] = useState(() => value !== "" && !isCurated);

  function handleSelect(next: string | null) {
    if (!next) return;
    if (next === OTHER_VALUE) {
      setShowCustom(true);
      onChange("");
      return;
    }
    setShowCustom(false);
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <Select value={showCustom ? OTHER_VALUE : value} onValueChange={handleSelect}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder="Select a market…" />
        </SelectTrigger>
        <SelectContent>
          {CURATED_COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.label} ({country.code})
            </SelectItem>
          ))}
          <SelectItem value={OTHER_VALUE}>Other…</SelectItem>
        </SelectContent>
      </Select>
      {showCustom && (
        <Input
          placeholder="AE"
          maxLength={2}
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
      )}
    </div>
  );
}
