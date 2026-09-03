import type { ReactNode } from "react";
import { Bath, Bed, Maximize2 } from "lucide-react";

export function ListingFacts({
  bedsValue,
  bathsValue,
  areaValue,
  areaUnit,
  bedsLabel,
  bathsLabel,
  areaLabel,
}: {
  bedsValue?: number;
  bathsValue?: number;
  areaValue?: string;
  areaUnit?: string;
  bedsLabel?: string;
  bathsLabel?: string;
  areaLabel?: string;
}) {
  const specs: { key: string; icon: ReactNode; value: string; unit?: string; label: string }[] = [
    bedsValue != null
      ? {
          key: "beds",
          icon: <Bed className="size-4" aria-hidden />,
          value: bedsValue === 0 ? (bedsLabel ?? String(bedsValue)) : String(bedsValue),
          label: bedsLabel ?? String(bedsValue),
        }
      : null,
    bathsValue != null
      ? { key: "baths", icon: <Bath className="size-4" aria-hidden />, value: String(bathsValue), label: bathsLabel ?? String(bathsValue) }
      : null,
    areaValue
      ? {
          key: "area",
          icon: <Maximize2 className="size-4" aria-hidden />,
          value: areaValue,
          unit: areaUnit,
          label: areaLabel ?? `${areaValue} ${areaUnit ?? ""}`.trim(),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item != null);

  if (specs.length === 0) return null;

  return (
    <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 border-y border-border py-5">
      {specs.map((spec) => (
        <li key={spec.key} className="inline-flex items-center gap-2.5">
          <span className="text-primary">{spec.icon}</span>
          <span className="font-heading text-base font-medium tracking-tight">{spec.label}</span>
        </li>
      ))}
    </ul>
  );
}
