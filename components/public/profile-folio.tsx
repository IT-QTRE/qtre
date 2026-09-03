import type { ReactNode } from "react";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function ProfileFolio({
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
  return (
    <main id="main" className="w-full">
      <div className={cn("pt-5 pb-4 sm:pt-6", publicGutter)}>{breadcrumb}</div>
      <div className={cn("pt-8 pb-20 sm:pt-10 sm:pb-24 lg:pt-12 lg:pb-28", publicGutter)}>
        {identity}
        {contact}
        {children ? <div className="mt-12 space-y-16 lg:mt-16">{children}</div> : null}
      </div>
    </main>
  );
}
