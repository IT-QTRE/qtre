import type { ReactNode } from "react";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function ListingFolio({
  breadcrumb,
  gallery,
  identity,
  specs,
  inquire,
  children,
}: {
  breadcrumb: ReactNode;
  gallery: ReactNode;
  identity: ReactNode;
  specs?: ReactNode;
  inquire: ReactNode;
  children: ReactNode;
}) {
  return (
    <main id="main" className="w-full">
      <div className={cn("pt-5 pb-4 sm:pt-6", publicGutter)}>{breadcrumb}</div>
      <div className="w-full">{gallery}</div>
      <div className={cn("pt-8 pb-20 sm:pt-10 sm:pb-24 lg:pt-12 lg:pb-28", publicGutter)}>
        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-x-16 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-x-20">
          <div className="min-w-0">
            {identity}
            {specs ? <div className="mt-8">{specs}</div> : null}
            <div className="mt-12 space-y-16 lg:mt-16">{children}</div>
          </div>
          <aside className="mt-12 lg:mt-0 lg:sticky lg:top-28">{inquire}</aside>
        </div>
      </div>
    </main>
  );
}
