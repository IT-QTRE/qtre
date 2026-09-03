import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function RelatedName({ href, children }: { href?: string | null; children: ReactNode }) {
  if (!href) {
    return <span className="font-heading text-base font-medium">{children}</span>;
  }
  return (
    <Link
      href={href}
      className="font-heading text-base font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}
