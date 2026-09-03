import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { PRIMARY_NAV } from "@/lib/public-nav";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

type PageLink = {
  href: string;
  label: string;
};

const homeLinkClass =
  "group mt-10 inline-flex min-h-11 max-w-full items-center gap-3 rounded-full bg-secondary py-1.5 ps-6 pe-1.5 font-heading text-sm font-semibold text-secondary-foreground touch-manipulation transition-[transform,background-color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[color-mix(in_oklch,var(--secondary),white_10%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary active:scale-[0.98] motion-reduce:transition-none";

const navLinkClass =
  "group flex min-h-11 items-center py-3 font-heading text-base font-medium tracking-tight text-primary-foreground/80 touch-manipulation transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-primary motion-reduce:transition-none";

function PlotCorner({
  placement,
}: {
  placement: "start-top" | "end-top" | "start-bottom" | "end-bottom";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute h-10 w-10 border-secondary sm:h-12 sm:w-12",
        placement === "start-top" && "start-0 top-0 border-s border-t",
        placement === "end-top" && "end-0 top-0 border-e border-t",
        placement === "start-bottom" && "start-0 bottom-0 border-b border-s",
        placement === "end-bottom" && "end-0 bottom-0 border-e border-b",
      )}
    />
  );
}

export function NotFoundPage({
  brandName,
  title,
  body,
  homeLabel,
  linksLabel,
  links,
}: {
  brandName: string;
  title: string;
  body: string;
  homeLabel: string;
  linksLabel: string;
  links: PageLink[];
}) {
  return (
    <main
      id="main"
      data-not-found-page=""
      className="fixed inset-0 z-50 overflow-x-hidden overflow-y-auto bg-primary text-primary-foreground"
    >
      <div
        className={cn(
          "relative z-10 flex min-h-dvh flex-col pt-6 pb-[max(4rem,env(safe-area-inset-bottom))] sm:pt-8",
          publicGutter,
        )}
      >
        <Link href="/" className="inline-flex w-fit touch-manipulation" aria-label={brandName}>
          <Image
            src="/brand/qtre-no-bg.png"
            alt=""
            width={820}
            height={304}
            className="h-10 w-auto object-contain brightness-0 invert sm:h-11"
            sizes="11rem"
            priority
          />
        </Link>
        <div className="min-h-12 flex-1" />
        <div className="not-found-copy grid min-w-0 grid-cols-1 content-end items-end gap-14 pb-2 sm:gap-16 lg:grid-cols-12">
          <div className="relative min-w-0 px-6 py-8 sm:px-8 sm:py-10 lg:col-span-7">
            <PlotCorner placement="start-top" />
            <PlotCorner placement="end-top" />
            <PlotCorner placement="start-bottom" />
            <PlotCorner placement="end-bottom" />
            <h1 className="max-w-[14ch] font-heading text-4xl font-semibold tracking-tight text-balance wrap-break-word sm:text-5xl sm:leading-[1.12] lg:text-6xl">
              {title}
            </h1>
            <p className="mt-7 max-w-[65ch] text-base leading-relaxed text-pretty text-primary-foreground/88 sm:text-lg">
              {body}
            </p>
            <Link href="/" className={homeLinkClass}>
              {homeLabel}
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/18 text-primary transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 motion-reduce:transition-none">
                <ArrowRight className="size-4 rtl:rotate-180" strokeWidth={1.75} aria-hidden />
              </span>
            </Link>
          </div>
          <nav aria-label={linksLabel} className="min-w-0 lg:col-span-4 lg:col-start-9">
            <ul className="flex max-w-xs flex-col">
              {links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={navLinkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </main>
  );
}

export function linksFromPrimaryNav(labels: Record<(typeof PRIMARY_NAV)[number]["key"], string>): PageLink[] {
  return PRIMARY_NAV.map((item) => ({ href: item.href, label: labels[item.key] }));
}
