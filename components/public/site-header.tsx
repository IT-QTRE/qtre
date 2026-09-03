"use client";

import Image from "next/image";
import { Suspense, useState, type ReactElement, type ReactNode } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ChevronDownIcon, MenuIcon, XIcon } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  SELL_NAV,
  isCatalogIndexPath,
  isPrimaryNavActive,
  isSecondaryNavActive,
} from "@/lib/public-nav";
import { desksInGroup, serviceDeskPath } from "@/lib/service-desks";
import { LocaleSwitcher } from "@/components/public/locale-switcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { publicGutter } from "@/lib/public-layout";
import { useCatalogChrome } from "@/components/public/catalog-chrome";

function HeaderBar({ children }: { children: ReactNode }) {
  const t = useTranslations("nav");
  const tBrand = useTranslations("brand");
  const pathname = usePathname();
  const { filterReachesNav } = useCatalogChrome();
  const isHome = pathname === "/";
  const isCatalogIndex = isCatalogIndexPath(pathname);
  const headerMode = isHome ? "overlay" : isCatalogIndex ? "flow" : "fixed";

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:inset-s-4 focus:top-3 focus:z-60 focus:rounded-lg focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {t("skipToContent")}
      </a>
      <header
        data-site-header
        className={cn(
          headerMode === "flow"
            ? "sticky top-0 z-40 bg-background pt-3 sm:pt-4"
            : "fixed inset-x-0 top-0 z-40 pt-3 sm:pt-4",
          "transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
          headerMode === "flow" && filterReachesNav && "-translate-y-full pointer-events-none",
          publicGutter,
        )}
        aria-hidden={headerMode === "flow" && filterReachesNav ? true : undefined}
        inert={headerMode === "flow" && filterReachesNav ? true : undefined}
      >
        <div
          className={cn(
            "mx-auto flex w-full items-center justify-between gap-4 px-4 py-2 sm:px-6",
            "rounded-xl border border-border bg-background",
            "shadow-[0_12px_40px_color-mix(in_oklab,var(--foreground)_28%,transparent)]",
          )}
        >
          <Link href="/" className="flex shrink-0 items-center" aria-label={tBrand("name")}>
            <Image
              src="/brand/qtre-no-bg.png"
              alt={tBrand("name")}
              width={820}
              height={304}
              className="h-16 w-auto object-contain sm:h-18"
              sizes="(min-width: 640px) 12rem, 11rem"
              priority
              loading="eager"
            />
          </Link>
          {children}
        </div>
      </header>
      {headerMode === "fixed" ? (
        <div data-site-header-spacer="" className="h-24 sm:h-26" aria-hidden />
      ) : null}
    </>
  );
}

function GoldMark({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "border-b-2 pb-1 transition-[border-color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
        active ? "border-secondary" : "border-transparent hover:border-secondary/55",
      )}
    >
      {children}
    </span>
  );
}

function ServicesNavMenu({
  pathname,
  onItem,
}: {
  pathname: string;
  onItem?: (node: ReactElement) => ReactNode;
}) {
  const t = useTranslations("nav");
  const tServices = useTranslations("servicesPage");
  const locale = useLocale();
  const active = isSecondaryNavActive("/services", pathname);
  const wrap = onItem ?? ((node: ReactElement) => node);
  const [openGroup, setOpenGroup] = useState<"visa" | "license" | null>(null);
  const submenuSide = locale === "ar" ? "left" : "right";

  const deskLink = (href: string, name: string) =>
    wrap(
      <Link
        href={href}
        className={cn(
          "inline-flex min-h-11 items-center text-base",
          pathname === href ? "text-foreground" : "text-muted-foreground",
        )}
        aria-current={pathname === href ? "page" : undefined}
      >
        {name}
      </Link>,
    );

  if (onItem) {
    return (
      <div className="flex flex-col gap-1">
        {wrap(
          <Link
            href="/services"
            className={cn(
              "inline-flex min-h-11 items-center text-base",
              active ? "text-foreground" : "text-muted-foreground",
            )}
            aria-current={pathname === "/services" ? "page" : undefined}
          >
            {t("services")}
          </Link>,
        )}
        {(["visa", "license"] as const).map((group) => {
          const open = openGroup === group;
          const title = group === "visa" ? tServices("visaTitle") : tServices("licenseTitle");
          return (
            <div key={group}>
              <button
                type="button"
                aria-expanded={open}
                className="flex min-h-11 w-full items-center justify-between gap-3 pt-1 font-heading text-xs font-medium tracking-[0.16em] text-secondary uppercase"
                onClick={() => setOpenGroup(open ? null : group)}
              >
                {title}
                <ChevronDownIcon
                  className={cn("size-3.5 transition-transform duration-200 ease-out motion-reduce:transition-none", open && "rotate-180")}
                  aria-hidden
                />
              </button>
              {open
                ? desksInGroup(group).map((desk) => (
                    <div key={desk.slug} className="ps-3">
                      {deskLink(serviceDeskPath(desk), tServices(desk.nameKey))}
                    </div>
                  ))
                : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        openOnHover
        delay={80}
        closeDelay={200}
        className={cn(
          "group inline-flex min-h-11 items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <GoldMark active={active}>{t("services")}</GoldMark>
        <ChevronDownIcon
          className="size-3.5 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none group-data-popup-open:rotate-180"
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-44 rounded-xl p-2 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        sideOffset={8}
      >
        <DropdownMenuItem render={<Link href="/services" />}>{tServices("overview")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        {(["visa", "license"] as const).map((group) => (
          <DropdownMenuSub key={group}>
            <DropdownMenuSubTrigger>
              {group === "visa" ? tServices("visaTitle") : tServices("licenseTitle")}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              side={submenuSide}
              className="min-w-48 rounded-xl p-2 duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
            >
              {desksInGroup(group).map((desk) => (
                <DropdownMenuItem key={desk.slug} render={<Link href={serviceDeskPath(desk)} />}>
                  {tServices(desk.nameKey)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SiteHeaderNav() {
  const t = useTranslations("nav");
  const tBrand = useTranslations("brand");
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const query = searchParams.toString();

  return (
    <>
      <nav
        className="hidden min-w-0 flex-1 items-center justify-center md:flex"
        aria-label={tBrand("name")}
      >
        <div className="flex items-center gap-5 lg:gap-6">
          {PRIMARY_NAV.map((item) => {
            const active = isPrimaryNavActive(item.match, pathname, status);
            return (
              <Link
                key={item.key}
                href={item.href}
                className="inline-flex min-h-11 items-center font-heading text-base font-medium tracking-tight text-foreground transition-colors hover:text-primary"
                aria-current={active ? "page" : undefined}
              >
                <GoldMark active={active}>{t(item.key)}</GoldMark>
              </Link>
            );
          })}
        </div>
        <div className="mx-5 hidden h-4 w-px shrink-0 bg-border lg:mx-7 lg:block" aria-hidden />
        <div className="hidden items-center gap-4 text-sm lg:flex">
          {SECONDARY_NAV.map((item) => {
            if (item.key === "services") {
              return <ServicesNavMenu key={item.key} pathname={pathname} />;
            }
            const active = isSecondaryNavActive(item.href, pathname);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "inline-flex min-h-11 items-center transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <GoldMark active={active}>{t(item.key)}</GoldMark>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex items-center gap-1">
        <Link
          href={SELL_NAV.href}
          className="me-8 hidden min-h-11 items-center rounded-md border border-primary px-3.5 font-heading text-sm font-medium tracking-tight text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:inline-flex"
        >
          {t(SELL_NAV.key)}
        </Link>
        <LocaleSwitcher query={query} />
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon-lg"
                className="min-h-11 min-w-11 lg:hidden"
                aria-label={t("openMenu")}
              />
            }
          >
            <MenuIcon />
          </SheetTrigger>
          <SheetContent
            side={locale === "ar" ? "left" : "right"}
            showCloseButton={false}
            className="overflow-hidden bg-background"
          >
            <SheetClose
              render={
                <Button
                  variant="ghost"
                  size="icon-lg"
                  className="absolute top-4 inset-e-4 z-10 min-h-11 min-w-11"
                  aria-label={t("closeMenu")}
                />
              }
            >
              <XIcon />
            </SheetClose>
            <SheetHeader className="shrink-0 pe-14">
              <SheetTitle>{tBrand("name")}</SheetTitle>
            </SheetHeader>
            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] touch-pan-y">
              {PRIMARY_NAV.map((item) => {
                const active = isPrimaryNavActive(item.match, pathname, status);
                return (
                  <SheetClose
                    key={item.key}
                    nativeButton={false}
                    render={
                      <Link
                        href={item.href}
                        className="inline-flex min-h-11 items-center font-heading text-lg font-medium text-foreground"
                        aria-current={active ? "page" : undefined}
                      />
                    }
                  >
                    <GoldMark active={active}>{t(item.key)}</GoldMark>
                  </SheetClose>
                );
              })}
              <div className="my-3 h-px bg-border" />
              {SECONDARY_NAV.map((item) => {
                if (item.key === "services") {
                  return (
                    <ServicesNavMenu
                      key={item.key}
                      pathname={pathname}
                      onItem={(node) => (
                        <SheetClose nativeButton={false} render={node} />
                      )}
                    />
                  );
                }
                const active = isSecondaryNavActive(item.href, pathname);
                return (
                  <SheetClose
                    key={item.key}
                    nativeButton={false}
                    render={
                      <Link
                        href={item.href}
                        className={cn(
                          "inline-flex min-h-11 items-center text-base",
                          active ? "text-foreground" : "text-muted-foreground",
                        )}
                        aria-current={active ? "page" : undefined}
                      />
                    }
                  >
                    {t(item.key)}
                  </SheetClose>
                );
              })}
              <div className="my-3 h-px bg-border" />
              <SheetClose
                nativeButton={false}
                render={
                  <Link
                    href={SELL_NAV.href}
                    className="mt-1 inline-flex min-h-11 items-center justify-center rounded-md border border-primary px-3.5 font-heading text-base font-medium text-primary"
                  />
                }
              >
                {t(SELL_NAV.key)}
              </SheetClose>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export function SiteHeader() {
  return (
    <Suspense
      fallback={
        <HeaderBar>
          <div className="hidden flex-1 md:block" />
          <div className="h-16 w-36 sm:h-18" />
        </HeaderBar>
      }
    >
      <HeaderBar>
        <SiteHeaderNav />
      </HeaderBar>
    </Suspense>
  );
}
