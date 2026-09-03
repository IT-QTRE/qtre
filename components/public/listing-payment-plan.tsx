export function ListingPaymentPlan({
  rows,
  percentLabel,
  heading,
  band = false,
}: {
  rows: { label: string; percentage: number; note: string | null }[];
  percentLabel: (percent: number) => string;
  heading?: string;
  band?: boolean;
}) {
  if (rows.length === 0) return null;

  const list = (
    <ol className="grid grid-cols-2 gap-x-6 gap-y-8 md:flex md:flex-row md:flex-wrap md:gap-0">
      {rows.map((row, index) => (
        <li
          key={`${row.label}-${index}`}
          className="border-t-2 border-secondary pt-5 md:flex-1 md:pt-6 md:pe-8"
        >
          <p
            className={
              band
                ? "font-heading text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl"
                : "font-heading text-3xl font-semibold tracking-tight tabular-nums"
            }
          >
            {percentLabel(row.percentage)}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-pretty">{row.label}</p>
          {row.note ? (
            <p className="mt-1 text-sm leading-relaxed text-pretty text-muted-foreground">{row.note}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );

  if (!band) return list;

  return (
    <section className="bg-muted px-5 py-8 sm:px-8 sm:py-10">
      {heading ? (
        <h2 className="font-heading text-lg font-semibold tracking-tight text-pretty">{heading}</h2>
      ) : null}
      <div className={heading ? "mt-8" : undefined}>{list}</div>
    </section>
  );
}
