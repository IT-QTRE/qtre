import { Link } from "@/i18n/navigation";

export function CatalogEmpty({ children }: { children: string }) {
  return <p className="max-w-prose text-base leading-relaxed text-foreground">{children}</p>;
}

export function CatalogEmptyLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
    </Link>
  );
}
