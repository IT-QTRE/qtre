import type { LucideIcon } from "lucide-react";
import {
  Award,
  Baby,
  Briefcase,
  Calendar,
  Check,
  Clapperboard,
  GraduationCap,
  Heart,
  Home,
  Landmark,
  MapPin,
  Monitor,
  Palette,
  Receipt,
  User,
  Users,
  UsersRound,
} from "lucide-react";
import { ProfileBreadcrumb } from "@/components/public/profile-breadcrumb";
import { Link } from "@/i18n/navigation";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";

export type DeskMark =
  | "award"
  | "baby"
  | "briefcase"
  | "calendar"
  | "clapperboard"
  | "graduation"
  | "heart"
  | "home"
  | "landmark"
  | "mapPin"
  | "monitor"
  | "palette"
  | "receipt"
  | "user"
  | "users"
  | "usersRound";

export type DeskType = { title: string; body: string; mark?: DeskMark };
type Sibling = { href: string; name: string; current: boolean };

const DESK_MARKS: Record<DeskMark, LucideIcon> = {
  award: Award,
  baby: Baby,
  briefcase: Briefcase,
  calendar: Calendar,
  clapperboard: Clapperboard,
  graduation: GraduationCap,
  heart: Heart,
  home: Home,
  landmark: Landmark,
  mapPin: MapPin,
  monitor: Monitor,
  palette: Palette,
  receipt: Receipt,
  user: User,
  users: Users,
  usersRound: UsersRound,
};

function ApplyLink({
  label,
  tone,
  headingId,
}: {
  label: string;
  tone: "onPrimary" | "onPaper";
  headingId?: string;
}) {
  if (tone === "onPrimary") {
    return (
      <Link
        href="/contact"
        className="inline-flex min-h-12 items-center justify-center bg-secondary px-6 font-heading text-sm font-medium tracking-[0.14em] text-primary uppercase transition-colors hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      >
        {label}
      </Link>
    );
  }

  return (
    <Link
      href="/contact"
      className="group inline-flex min-h-11 flex-col items-start justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        id={headingId}
        className="font-heading text-sm font-medium tracking-[0.16em] text-secondary uppercase"
      >
        {label}
      </span>
      <span className="mt-3 h-px w-10 bg-secondary transition-[width] duration-300 ease-out group-hover:w-16 motion-reduce:transition-none" />
    </Link>
  );
}

function DossierHeading({ id, children }: { id: string; children: string }) {
  return (
    <>
      <h2 id={id} className="font-heading text-xl font-semibold tracking-tight text-balance sm:text-2xl">
        {children}
      </h2>
      <div className="mt-4 h-px w-10 bg-secondary" />
    </>
  );
}

function TypeGrid({
  id,
  title,
  items,
}: {
  id: string;
  title: string;
  items: DeskType[];
}) {
  return (
    <div className="mt-14 sm:mt-16 first:mt-0">
      <DossierHeading id={id}>{title}</DossierHeading>
      <ul
        className={cn(
          "mt-8 grid border-t border-foreground/10 sm:grid-cols-2 sm:gap-x-10",
          items.length > 4 && "xl:grid-cols-3 xl:gap-x-12",
        )}
      >
        {items.map((item) => {
          const Mark = item.mark ? DESK_MARKS[item.mark] : null;
          return (
            <li key={item.title} className="border-b border-foreground/10 py-5">
              <h3 className="flex items-start gap-2.5 font-heading text-base font-semibold tracking-tight text-balance sm:text-lg">
                {Mark ? (
                  <Mark className="mt-1 size-4 shrink-0 text-secondary" strokeWidth={1.75} aria-hidden />
                ) : null}
                <span className="min-w-0">{item.title}</span>
              </h3>
              <p className={cn("text-sm leading-relaxed text-pretty text-foreground/80", Mark ? "mt-2 ps-6.5" : "mt-2")}>
                {item.body}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ProcessList({ title, items }: { title: string; items: string[] }) {
  const singleRow = items.length <= 5;
  return (
    <div className="mt-14 sm:mt-16">
      <DossierHeading id="service-desk-process-heading">{title}</DossierHeading>
      <ol
        className={cn(
          "mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2",
          singleRow ? "lg:flex lg:gap-0" : "lg:grid-cols-3",
        )}
      >
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li
              key={item}
              className={cn("relative min-w-0 pt-4", singleRow && "lg:flex lg:min-w-0 lg:flex-1 lg:items-stretch")}
            >
              <div className="relative min-w-0 flex-1 border border-foreground/10 bg-background px-5 pb-6 pt-8 shadow-[2px_3px_12px_rgba(31,31,31,0.06)]">
                <span className="absolute inset-s-4 -top-3 flex size-8 items-center justify-center bg-secondary font-heading text-sm font-semibold tabular-nums text-primary sm:size-9 sm:text-base">
                  {index + 1}
                </span>
                <p className="text-base leading-snug text-pretty text-foreground/85 sm:text-lg sm:leading-snug">
                  {item}
                </p>
              </div>
              {last || !singleRow ? null : (
                <span
                  aria-hidden
                  className="mx-1 hidden w-5 shrink-0 self-center border-t-2 border-dashed border-secondary lg:block xl:mx-1.5 xl:w-6"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function FactList({ id, title, items }: { id: string; title: string; items: string[] }) {
  return (
    <div className="mt-14 sm:mt-16 first:mt-0">
      <DossierHeading id={id}>{title}</DossierHeading>
      <ul className="mt-8 grid border-t border-foreground/10 sm:grid-cols-2 sm:gap-x-10">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 border-b border-foreground/10 py-3.5 text-sm leading-relaxed text-pretty text-foreground/80 sm:text-base"
          >
            <Check className="mt-1 size-4 shrink-0 text-secondary" strokeWidth={2.25} aria-hidden />
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServiceDeskFolio({
  title,
  intro,
  about,
  timeframeTitle,
  timeframe,
  typesTitle,
  types,
  documentsTitle,
  documents,
  processTitle,
  process,
  extraLists,
  coversTitle,
  covers,
  applyLabel,
  contactLabel,
  breadcrumbLabel,
  homeLabel,
  parentLabel,
  siblingsTitle,
  siblings,
}: {
  title: string;
  intro: string;
  about?: string;
  timeframeTitle?: string;
  timeframe?: string;
  typesTitle?: string;
  types?: DeskType[];
  documentsTitle?: string;
  documents?: string[];
  processTitle?: string;
  process?: string[];
  extraLists?: { id: string; title: string; items: string[] }[];
  coversTitle?: string;
  covers?: DeskType[];
  applyLabel?: string;
  contactLabel: string;
  breadcrumbLabel: string;
  homeLabel: string;
  parentLabel: string;
  siblingsTitle: string;
  siblings: Sibling[];
}) {
  const closeLabel = applyLabel ?? contactLabel;
  const lede = about ?? intro;
  const hasDossier = Boolean(
    (types && types.length > 0) ||
      (documents && documents.length > 0) ||
      (process && process.length > 0) ||
      (extraLists && extraLists.length > 0) ||
      (covers && covers.length > 0),
  );

  return (
    <main id="main">
      <header
        className={cn(
          "relative -mt-24 bg-primary pt-24 text-primary-foreground sm:-mt-26 sm:pt-26",
          publicGutter,
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-secondary" />
        <div className="relative py-12 sm:py-16 lg:py-20">
          <ProfileBreadcrumb
            label={breadcrumbLabel}
            homeLabel={homeLabel}
            parentHref="/services"
            parentLabel={parentLabel}
            current={title}
            tone="onPrimary"
          />
          <div className="mt-10 grid gap-10 lg:mt-12 lg:grid-cols-2 lg:items-start lg:gap-x-16 xl:gap-x-24">
            <div>
              <h1
                id="service-desk-heading"
                className="max-w-[12ch] font-heading text-[clamp(2.25rem,7vw,4.25rem)] font-semibold leading-[1.04] tracking-tight text-balance"
              >
                {title}
              </h1>
              <div className="mt-6 h-px w-20 bg-secondary sm:mt-8 sm:w-28" />
              {timeframe ? (
                <p className="mt-6 font-heading text-xl font-medium tracking-tight text-secondary sm:text-2xl">
                  {timeframe}
                  {timeframeTitle ? (
                    <span className="mt-1 block font-sans text-sm font-normal tracking-normal text-primary-foreground/75">
                      {timeframeTitle}
                    </span>
                  ) : null}
                </p>
              ) : null}
              {applyLabel ? (
                <div className="mt-8">
                  <ApplyLink label={applyLabel} tone="onPrimary" />
                </div>
              ) : null}
            </div>
            <p className="max-w-prose text-base leading-relaxed text-pretty text-primary-foreground/85 sm:text-lg lg:border-s lg:border-secondary lg:ps-12 xl:ps-16">
              {lede}
            </p>
          </div>
        </div>
      </header>

      {hasDossier ? (
        <section className="relative bg-background text-foreground" aria-labelledby="service-desk-heading">
          <div className={cn("py-14 sm:py-16 lg:py-20", publicGutter)}>
            {types && types.length > 0 && typesTitle ? (
              <TypeGrid id="service-desk-types-heading" title={typesTitle} items={types} />
            ) : null}

            {documents && documents.length > 0 && documentsTitle ? (
              <FactList id="service-desk-docs-heading" title={documentsTitle} items={documents} />
            ) : null}

            {extraLists?.map((list) => (
              <FactList key={list.id} id={list.id} title={list.title} items={list.items} />
            ))}

            {covers && covers.length > 0 && coversTitle ? (
              <TypeGrid id="service-desk-covers-heading" title={coversTitle} items={covers} />
            ) : null}

            {process && process.length > 0 && processTitle ? (
              <ProcessList title={processTitle} items={process} />
            ) : null}
          </div>
        </section>
      ) : null}

      {siblings.length > 1 ? (
        <section className="relative bg-background text-foreground" aria-labelledby="service-desk-siblings-heading">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-foreground/10" />
          <div className={cn("py-10 sm:py-12", publicGutter)}>
            <h2
              id="service-desk-siblings-heading"
              className="font-heading text-lg font-semibold tracking-tight text-balance sm:text-xl"
            >
              {siblingsTitle}
            </h2>
            <div className="mt-4 h-px w-10 bg-secondary" />
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
              {siblings.map((item) => (
                <li key={item.href}>
                  {item.current ? (
                    <span className="font-heading text-sm font-medium text-foreground">{item.name}</span>
                  ) : (
                    <Link
                      href={item.href}
                      className="font-heading text-sm text-foreground/70 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="relative bg-background text-foreground" aria-labelledby="service-desk-contact-heading">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-secondary" />
        <div className={cn("py-12 sm:py-14", publicGutter)}>
          <ApplyLink label={closeLabel} tone="onPaper" headingId="service-desk-contact-heading" />
        </div>
      </section>
    </main>
  );
}
