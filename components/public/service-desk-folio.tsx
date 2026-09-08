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
import { getTranslations } from "next-intl/server";
import { ProfileBreadcrumb } from "@/components/public/profile-breadcrumb";
import { ServiceInquiryWizard } from "@/components/public/service-inquiry-wizard";
import { Link } from "@/i18n/navigation";
import { publicGutter } from "@/lib/public-layout";
import type { ServiceGroup } from "@/lib/service-desks";
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

export async function ServiceDeskFolio({
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
  breadcrumbLabel,
  homeLabel,
  parentLabel,
  siblingsTitle,
  siblings,
  inquiryGroup,
  inquiryDesk,
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
  breadcrumbLabel: string;
  homeLabel: string;
  parentLabel: string;
  siblingsTitle: string;
  siblings: Sibling[];
  inquiryGroup: ServiceGroup;
  inquiryDesk: string;
}) {
  const tServices = await getTranslations("servicesPage");
  const tInquiry = await getTranslations("serviceInquiry");
  const dossierLede = about && about !== intro ? about : undefined;
  const hasDossier = Boolean(
    dossierLede ||
      (types && types.length > 0) ||
      (documents && documents.length > 0) ||
      (process && process.length > 0) ||
      (extraLists && extraLists.length > 0) ||
      (covers && covers.length > 0),
  );
  const points = [
    tInquiry("deskPointProcess"),
    inquiryGroup === "visa" ? tServices("visaPoint3") : tServices("licensePoint3"),
  ];
  const note = inquiryGroup === "visa" ? tServices("visaNote") : tServices("licenseNote");
  const badge = inquiryGroup === "visa" ? tServices("visaBadge") : tServices("licenseBadge");

  return (
    <main id="main">
      <header
        id="service-inquiry"
        className={cn(
          "relative -mt-24 scroll-mt-28 bg-primary pt-24 text-primary-foreground sm:-mt-26 sm:pt-26",
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
              <p className="inline-flex items-center gap-2 border border-secondary px-3 py-1 font-heading text-[0.7rem] font-medium tracking-[0.14em] text-secondary uppercase">
                <span className="size-1.5 shrink-0 bg-secondary" aria-hidden />
                {badge}
              </p>
              <h1
                id="service-desk-heading"
                className="mt-5 max-w-[12ch] font-heading text-[clamp(2.25rem,7vw,4.25rem)] font-semibold leading-[1.04] tracking-tight text-balance sm:mt-6"
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
              <p className="mt-6 max-w-prose text-base leading-relaxed text-pretty text-primary-foreground/85 sm:text-lg">
                {intro}
              </p>
              <ul className="mt-8 space-y-3">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-pretty sm:text-base">
                    <Check className="mt-0.5 size-4 shrink-0 text-secondary" strokeWidth={2.25} aria-hidden />
                    <span className="min-w-0 text-primary-foreground/80">{point}</span>
                  </li>
                ))}
              </ul>
              <aside className="mt-8 border border-secondary/40 bg-primary-foreground/8 px-5 py-5">
                <p className="font-heading text-[0.65rem] font-medium tracking-[0.14em] text-secondary uppercase">
                  {tServices("inquiryNoteLabel")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-pretty text-primary-foreground/80">{note}</p>
              </aside>
            </div>
            <div className="text-foreground lg:border-s lg:border-secondary lg:ps-12 xl:ps-16">
              <ServiceInquiryWizard initialGroup={inquiryGroup} initialDesk={inquiryDesk} />
            </div>
          </div>
        </div>
      </header>

      {hasDossier ? (
        <section className="relative bg-background text-foreground" aria-labelledby="service-desk-heading">
          <div className={cn("py-14 sm:py-16 lg:py-20", publicGutter)}>
            {dossierLede ? (
              <p className="max-w-prose text-base leading-relaxed text-pretty text-foreground/80 sm:text-lg">
                {dossierLede}
              </p>
            ) : null}

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
    </main>
  );
}
