export function ListingIdentity({
  price,
  title,
  location,
  status,
}: {
  price?: string | null;
  title: string;
  location: string;
  status?: string | null;
}) {
  return (
    <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
      <div className="min-w-0">
        <p className="text-sm text-foreground/70">{location}</p>
        <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.15rem] lg:leading-[1.08]">
          {title}
        </h1>
        {status ? <p className="mt-4 font-heading text-base font-medium text-primary">{status}</p> : null}
      </div>
      {price ? (
        <p className="shrink-0 font-heading text-3xl font-semibold tracking-tight text-pretty tabular-nums text-primary sm:text-4xl lg:pb-1 lg:text-end">
          {price}
        </p>
      ) : null}
    </header>
  );
}
