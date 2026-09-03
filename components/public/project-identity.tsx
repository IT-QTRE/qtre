export function ProjectIdentity({
  price,
  title,
  location,
  status,
  compact = false,
}: {
  price?: string | null;
  title: string;
  location: string;
  status: string;
  compact?: boolean;
}) {
  return (
    <header
      className={
        compact
          ? "flex flex-col gap-4"
          : "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12"
      }
    >
      <div className="min-w-0">
        <p className="text-sm text-foreground/70">{location}</p>
        <h1
          className={
            compact
              ? "mt-2 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:leading-[1.1]"
              : "mt-3 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.15rem] lg:leading-[1.08]"
          }
        >
          {title}
        </h1>
        <p className="mt-3 font-heading text-base font-medium text-primary">{status}</p>
      </div>
      {price ? (
        <p
          className={
            compact
              ? "shrink-0 font-heading text-2xl font-semibold tracking-tight text-pretty tabular-nums text-primary sm:text-3xl"
              : "shrink-0 font-heading text-3xl font-semibold tracking-tight text-pretty tabular-nums text-primary sm:text-4xl lg:pb-1 lg:text-end"
          }
        >
          {price}
        </p>
      ) : null}
    </header>
  );
}
