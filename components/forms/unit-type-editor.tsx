"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { BedroomTypePicker } from "@/components/forms/bedroom-type-picker";
import { FieldHint } from "@/components/forms/field-hint";
import { FormattedNumberInput } from "@/components/forms/formatted-number-input";
import { BEDROOM_TYPE_LABELS, BEDROOM_TYPE_VALUES, type BedroomType } from "@/lib/format/bedroom-types";

export type UnitTypeFormRow = {
  bedrooms: BedroomType;
  minAreaSqm: string;
  maxAreaSqm: string;
  minPrice: string;
  maxPrice: string;
};

export function emptyUnitTypeRow(bedrooms: BedroomType): UnitTypeFormRow {
  return { bedrooms, minAreaSqm: "", maxAreaSqm: "", minPrice: "", maxPrice: "" };
}

function unitTypeHasSpecs(row: UnitTypeFormRow) {
  return Boolean(row.minAreaSqm || row.maxAreaSqm || row.minPrice || row.maxPrice);
}

function DigitRange({
  idPrefix,
  minLabel,
  maxLabel,
  min,
  max,
  onMin,
  onMax,
  prefix,
}: {
  idPrefix: string;
  minLabel: string;
  maxLabel: string;
  min: string;
  max: string;
  onMin: (digits: string) => void;
  onMax: (digits: string) => void;
  prefix?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-min`}>{minLabel}</Label>
        <FormattedNumberInput id={`${idPrefix}-min`} value={min} onChange={onMin} prefix={prefix} />
      </div>
      <span className="pb-3 text-muted-foreground" aria-hidden>
        –
      </span>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-max`}>{maxLabel}</Label>
        <FormattedNumberInput id={`${idPrefix}-max`} value={max} onChange={onMax} prefix={prefix} />
      </div>
    </div>
  );
}

export function UnitTypeEditor({
  value,
  onChange,
  currency,
}: {
  value: UnitTypeFormRow[];
  onChange: (next: UnitTypeFormRow[]) => void;
  currency: string;
}) {
  const selected = value.map((row) => row.bedrooms);
  const rows = BEDROOM_TYPE_VALUES.flatMap((type) => value.filter((row) => row.bedrooms === type));
  const specCount = value.filter(unitTypeHasSpecs).length;
  const [rangesOpen, setRangesOpen] = useState(() => specCount > 0);

  function setTypes(nextTypes: BedroomType[]) {
    onChange(
      nextTypes.map((bedrooms) => value.find((row) => row.bedrooms === bedrooms) ?? emptyUnitTypeRow(bedrooms)),
    );
  }

  function patch(bedrooms: BedroomType, next: Partial<UnitTypeFormRow>) {
    onChange(value.map((row) => (row.bedrooms === bedrooms ? { ...row, ...next } : row)));
  }

  return (
    <div className="space-y-4">
      <BedroomTypePicker value={selected} onChange={setTypes} />
      <FieldHint>Select the mix. Size and price per type are optional.</FieldHint>
      {rows.length > 0 ? (
        <details
          className="border-t border-border pt-4"
          open={rangesOpen}
          onToggle={(event) => setRangesOpen(event.currentTarget.open)}
        >
          <summary className="cursor-pointer text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Size and price per type{specCount > 0 ? ` (${specCount} filled)` : ""}
          </summary>
          <ul className="mt-3 space-y-6">
            {rows.map((row) => (
              <li key={row.bedrooms} className="space-y-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
                <p className="text-sm font-medium">{BEDROOM_TYPE_LABELS[row.bedrooms]}</p>
                <DigitRange
                  idPrefix={`unit-${row.bedrooms}-sqm`}
                  minLabel="Min sq m"
                  maxLabel="Max sq m"
                  min={row.minAreaSqm}
                  max={row.maxAreaSqm}
                  onMin={(minAreaSqm) => patch(row.bedrooms, { minAreaSqm })}
                  onMax={(maxAreaSqm) => patch(row.bedrooms, { maxAreaSqm })}
                />
                <DigitRange
                  idPrefix={`unit-${row.bedrooms}-price`}
                  minLabel="Min price"
                  maxLabel="Max price"
                  min={row.minPrice}
                  max={row.maxPrice}
                  onMin={(minPrice) => patch(row.bedrooms, { minPrice })}
                  onMax={(maxPrice) => patch(row.bedrooms, { maxPrice })}
                  prefix={currency}
                />
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <FieldHint>
              Leave the high end empty for a single size or price. Linked published units can widen the public price
              range. The public page shows square feet converted from square metres.
            </FieldHint>
          </div>
        </details>
      ) : null}
    </div>
  );
}
