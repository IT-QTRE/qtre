import type { ReactNode } from "react";

export function ListingSection({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="font-heading text-lg font-semibold tracking-tight text-pretty">{title}</h2>
        {aside ? <div className="text-sm text-muted-foreground tabular-nums">{aside}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
