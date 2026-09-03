import type { ReactNode } from "react";

export function AdminSection({
  title,
  hint,
  children,
  collapsible = false,
  id,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  collapsible?: boolean;
  id?: string;
}) {
  const heading = (
    <>
      <h2 className="font-heading text-sm font-semibold tracking-tight">{title}</h2>
      {hint ? <p className="mt-1 text-xs font-normal text-muted-foreground">{hint}</p> : null}
    </>
  );

  if (collapsible) {
    return (
      <details id={id} className="border border-border bg-background open:[&>summary]:border-b open:[&>summary]:border-border">
        <summary className="cursor-pointer px-4 py-4 sm:px-5 sm:py-5">{heading}</summary>
        <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">{children}</div>
      </details>
    );
  }

  return (
    <section className="border border-border bg-background p-4 sm:p-5">
      {heading}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
