import { Children, type ReactNode } from "react";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function AgentFolio({
  breadcrumb,
  identity,
  contact,
  children,
}: {
  breadcrumb: ReactNode;
  identity: ReactNode;
  contact?: ReactNode;
  children?: ReactNode;
}) {
  const body = Children.toArray(children).filter(Boolean);
  const hasBody = Boolean(contact || body.length > 0);

  return (
    <main id="main" className="w-full">
      <header className="relative -mt-24 bg-primary pt-24 text-primary-foreground sm:-mt-26 sm:pt-26">
        <div className={cn("pt-5 pb-8 sm:pt-6 sm:pb-10", publicGutter)}>{breadcrumb}</div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-secondary" />
      </header>

      <div className={cn("pt-10 pb-20 sm:pt-12 sm:pb-24 lg:pt-16 lg:pb-28", publicGutter)}>
        {identity}
        {hasBody ? (
          <div
            className={cn(
              "mt-12 sm:mt-16",
              contact &&
                "flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-16 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-x-20",
            )}
          >
            {body.length > 0 ? <div className="min-w-0 space-y-16">{body}</div> : <div className="min-w-0" />}
            {contact ? <aside className="mt-12 lg:mt-0 lg:sticky lg:top-28">{contact}</aside> : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}
