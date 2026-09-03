import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function ProfileBreadcrumb({
  label,
  homeLabel,
  parentHref,
  parentLabel,
  current,
  tone = "default",
}: {
  label: string;
  homeLabel: string;
  parentHref: string;
  parentLabel: string;
  current: ReactNode;
  tone?: "default" | "onPrimary";
}) {
  const onPrimary = tone === "onPrimary";

  return (
    <nav aria-label={label}>
      <ol
        className={cn(
          "flex flex-wrap items-center gap-2 text-sm",
          onPrimary ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
      >
        <li>
          <Link
            href="/"
            className={cn(
              "focus-visible:outline-none focus-visible:ring-2",
              onPrimary
                ? "hover:text-secondary focus-visible:ring-secondary"
                : "hover:text-foreground focus-visible:ring-ring",
            )}
          >
            {homeLabel}
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li>
          <Link
            href={parentHref}
            className={cn(
              "focus-visible:outline-none focus-visible:ring-2",
              onPrimary
                ? "hover:text-secondary focus-visible:ring-secondary"
                : "hover:text-foreground focus-visible:ring-ring",
            )}
          >
            {parentLabel}
          </Link>
        </li>
        <li aria-hidden>/</li>
        <li className={onPrimary ? "text-primary-foreground" : "text-foreground"}>
          <span className="font-medium">{current}</span>
        </li>
      </ol>
    </nav>
  );
}
