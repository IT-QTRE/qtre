import type { ReactNode } from "react";
import { CatalogEmpty } from "@/components/public/catalog-empty";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function DirectoryIndex({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children?: ReactNode;
}) {
  return (
    <main id="main" className={cn("w-full py-16 sm:py-20", publicGutter)}>
      <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">{title}</h1>
      <div className="mt-5 h-px w-10 bg-secondary" />
      <div className="mt-8">{children ?? <CatalogEmpty>{empty}</CatalogEmpty>}</div>
    </main>
  );
}
