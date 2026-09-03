export function ListingKeyFacts({
  rows,
  extras = [],
}: {
  rows: { key: string; label: string; value: string }[];
  extras?: { key: string; label: string; value: string }[];
}) {
  if (rows.length === 0 && extras.length === 0) return null;

  return (
    <div>
      {rows.length > 0 ? (
        <dl className="flex flex-col md:flex-row md:flex-wrap">
          {rows.map((row) => (
            <div
              key={row.key}
              className="border-s-2 border-secondary py-1 ps-5 not-last:pb-6 md:min-w-36 md:flex-1 md:border-s-0 md:border-t-2 md:py-0 md:ps-0 md:pt-5 md:pe-8 md:not-last:pb-0"
            >
              <dd className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">{row.value}</dd>
              <dt className="mt-2 text-sm text-muted-foreground">{row.label}</dt>
            </div>
          ))}
        </dl>
      ) : null}
      {extras.length > 0 ? (
        <dl className={rows.length > 0 ? "mt-8 flex flex-wrap gap-x-12 gap-y-6" : "flex flex-wrap gap-x-12 gap-y-6"}>
          {extras.map((row) => (
            <div key={row.key}>
              <dt className="text-xs text-muted-foreground">{row.label}</dt>
              <dd className="mt-1.5 font-heading text-base font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
