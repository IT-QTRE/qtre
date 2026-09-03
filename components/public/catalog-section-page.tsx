import type { ReactNode } from "react";
import { CatalogEmpty } from "@/components/public/catalog-empty";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export function CatalogSectionPage({ title, body, extra }: { title: string; body: string; extra?: ReactNode }) {
  return (
    <main id="main" className={cn("w-full py-16 sm:py-20", publicGutter)}>
      <div className="max-w-3xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance">{title}</h1>
        <div className="mt-5 h-px w-10 bg-secondary" />
        <div className="mt-6">
          <CatalogEmpty>{body}</CatalogEmpty>
        </div>
        {extra}
      </div>
    </main>
  );
}
