"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRightIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { publicGutter } from "@/lib/public-layout";
import { cn } from "@/lib/utils";
import { defaultMarketCode } from "@/lib/constants/countries";
import { communitiesHref, marketChipClassName } from "@/lib/home-community-markets";

export type CommunitySlide = {
  id: string;
  name: string;
  city: string;
  imageUrl: string;
  href: string;
};

export type CommunityMarket = {
  countryCode: string;
  label: string;
  slides: CommunitySlide[];
};

const easeOutQuart = "duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:duration-0";
const AUTO_ADVANCE_MS = 5500;

function scrollCardInRow(
  scroller: HTMLUListElement,
  item: HTMLElement,
  alignEnd: boolean,
  rtl: boolean,
) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollerBox = scroller.getBoundingClientRect();
  const itemBox = item.getBoundingClientRect();
  const styles = getComputedStyle(scroller);
  const padStart = Number.parseFloat(styles.paddingInlineStart) || 0;
  const padEnd = Number.parseFloat(styles.paddingInlineEnd) || 0;

  let delta: number;
  if (rtl) {
    delta = alignEnd
      ? itemBox.left - scrollerBox.left - padEnd
      : itemBox.right - scrollerBox.right + padStart;
  } else {
    delta = alignEnd
      ? itemBox.right - scrollerBox.right + padEnd
      : itemBox.left - scrollerBox.left - padStart;
  }

  scroller.scrollBy({
    left: delta,
    behavior: reduced ? "auto" : "smooth",
  });
}

export function CommunityShowcase({
  heading,
  viewLabel,
  marketGroupLabel,
  markets,
}: {
  heading: string;
  viewLabel: string;
  marketGroupLabel: string;
  markets: CommunityMarket[];
}) {
  const t = useTranslations("home");
  const locale = useLocale();
  const rtl = locale === "ar";
  const [marketCode, setMarketCode] = useState(
    () => defaultMarketCode(markets.map((market) => market.countryCode)) ?? "",
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const pausedRef = useRef(false);
  const skipScrollRef = useRef(true);
  const selectedMarket = markets.find((market) => market.countryCode === marketCode) ?? markets[0];
  const slides = selectedMarket?.slides ?? [];
  const active = slides[activeIndex] ?? slides[0];
  const showMarketTabs = markets.length > 1;

  useEffect(() => {
    if (slides.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      setActiveIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(id);
  }, [activeIndex, slides.length]);

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    const id = slides[activeIndex]?.id;
    if (!id) return;
    const scroller = scrollerRef.current;
    const tab = scroller?.querySelector(`#community-tab-${id}`);
    const item = tab?.closest("li");
    if (!scroller || !(item instanceof HTMLElement)) return;
    scrollCardInRow(scroller, item, activeIndex === slides.length - 1, locale === "ar");
  }, [activeIndex, locale, slides]);

  if (!active) return null;

  const selectIndex = (index: number) => {
    if (index < 0 || index >= slides.length) return;
    setActiveIndex(index);
  };

  const selectMarket = (code: string) => {
    if (code === marketCode) return;
    skipScrollRef.current = true;
    setMarketCode(code);
    setActiveIndex(0);
  };

  const onMarketTabListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const codes = markets.map((market) => market.countryCode);
    const index = codes.indexOf(marketCode);
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const forward = event.key === "ArrowRight";
      const delta = forward === rtl ? -1 : 1;
      const next = codes[(index + delta + codes.length) % codes.length];
      if (next) selectMarket(next);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      if (codes[0]) selectMarket(codes[0]);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      const last = codes[codes.length - 1];
      if (last) selectMarket(last);
    }
  };

  return (
    <section
      aria-labelledby="communities-heading"
      className="relative isolate min-h-112 overflow-hidden bg-primary [overflow-anchor:none] sm:min-h-136 lg:min-h-160"
    >
      <div className="absolute inset-0" aria-hidden>
        {slides.map((slide, index) => (
          <Image
            key={slide.id}
            src={slide.imageUrl}
            alt=""
            fill
            priority={index === 0}
            loading={index === 0 ? "eager" : "lazy"}
            sizes="100vw"
            className={cn(
              "object-cover transition-opacity",
              easeOutQuart,
              index === activeIndex ? "z-1 opacity-100" : "z-0 opacity-0",
            )}
          />
        ))}
        <div className="absolute inset-0 z-2 bg-foreground/45" />
      </div>

      <div className="relative z-10 flex min-h-112 flex-col justify-between gap-8 py-12 sm:min-h-136 sm:gap-10 sm:py-16 lg:min-h-160">
        <div className={cn(publicGutter)}>
          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:max-w-none lg:text-start">
            <h2 id="communities-heading" className="font-heading text-sm font-medium tracking-[0.16em] text-secondary uppercase">
              {heading}
            </h2>
            <div
              className={cn(
                "mt-5 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap",
                showMarketTabs ? "lg:justify-between" : "lg:justify-start",
                "justify-center lg:items-center",
              )}
            >
            {showMarketTabs ? (
              <div
                className="flex flex-wrap items-center justify-center gap-2.5 lg:justify-start"
                role="tablist"
                aria-label={marketGroupLabel}
                onKeyDown={onMarketTabListKeyDown}
              >
                {markets.map((market) => {
                  const selected = market.countryCode === selectedMarket?.countryCode;
                  return (
                    <button
                      key={market.countryCode}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls="community-stage"
                      id={`community-market-tab-${market.countryCode}`}
                      tabIndex={selected ? 0 : -1}
                      onClick={() => selectMarket(market.countryCode)}
                      className={cn(marketChipClassName(selected, "onPrimary"), easeOutQuart)}
                    >
                      {market.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
              {selectedMarket ? (
                <Link
                  href={communitiesHref(selectedMarket.countryCode)}
                  className={cn(
                    "inline-flex min-h-12 items-center gap-2 rounded-md border border-secondary bg-secondary px-4 font-heading text-base font-medium tracking-tight text-primary-foreground",
                    easeOutQuart,
                    "hover:bg-secondary/90",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
                  )}
                >
                  {t("seeAllMarket", { market: selectedMarket.label })}
                  <ArrowRightIcon className="size-4 rtl:rotate-180" aria-hidden />
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8 sm:gap-10">
        <div className={cn(publicGutter)}>
          <div className="mx-auto max-w-xl text-center text-primary-foreground lg:mx-0 lg:text-start">
            <p className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{active.name}</p>
            <p className="mt-2 text-base text-primary-foreground/80">{active.city}</p>
            <Button
              variant="secondary"
              size="lg"
              nativeButton={false}
              className="mt-6"
              render={<Link href={active.href} />}
            >
              {viewLabel}
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "min-w-0 overflow-hidden",
            "[mask-image:linear-gradient(to_right,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)]",
            "[-webkit-mask-image:linear-gradient(to_right,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)]",
            "rtl:[mask-image:linear-gradient(to_left,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)]",
            "rtl:[-webkit-mask-image:linear-gradient(to_left,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)]",
            "lg:absolute lg:top-1/2 lg:start-1/2 lg:end-20 lg:-translate-y-1/2 xl:end-22",
          )}
          onPointerEnter={() => {
            pausedRef.current = true;
          }}
          onPointerLeave={() => {
            pausedRef.current = false;
          }}
        >
          <ul
            ref={scrollerRef}
            role="tablist"
            aria-label={heading}
            className="flex w-full gap-3 overflow-x-auto overscroll-x-contain ps-10 pe-10 pb-1 snap-x snap-mandatory scroll-ps-10 scroll-pe-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:ps-0 lg:pe-0 lg:scroll-ps-0 lg:scroll-pe-0"
            onKeyDown={(event) => {
              const rtl = locale === "ar";
              let next = activeIndex;
              if (event.key === "ArrowRight") {
                event.preventDefault();
                next = rtl ? activeIndex - 1 : activeIndex + 1;
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                next = rtl ? activeIndex + 1 : activeIndex - 1;
              } else {
                return;
              }
              selectIndex(next);
            }}
          >
            {slides.map((slide, index) => {
              const selected = index === activeIndex;
              return (
                <li key={slide.id} className="w-44 shrink-0 snap-start sm:w-52">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls="community-stage"
                    id={`community-tab-${slide.id}`}
                    tabIndex={selected ? 0 : -1}
                    onClick={() => selectIndex(index)}
                    className={cn(
                      "relative block w-full rounded-lg p-0.5 text-start transition-colors",
                      easeOutQuart,
                      selected ? "bg-secondary" : "bg-primary-foreground/45",
                      "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                    )}
                  >
                    <span className="relative block aspect-4/3 overflow-hidden rounded-[calc(var(--radius-lg)-2px)] bg-primary">
                      <Image
                        src={slide.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 16rem, (min-width: 640px) 14rem, 11rem"
                        className="object-cover"
                      />
                      <span
                        className={cn(
                          "absolute inset-0 bg-foreground/25 transition-opacity",
                          easeOutQuart,
                          selected ? "opacity-0" : "opacity-100",
                        )}
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-foreground/80 to-transparent px-2 pb-2 pt-8 text-center sm:px-3 lg:text-start">
                        <span className="block font-heading text-xs font-semibold tracking-tight text-balance text-background sm:text-sm">
                          {slide.name}
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        </div>

        <div id="community-stage" role="tabpanel" aria-labelledby={`community-tab-${active.id}`} className="sr-only">
          {active.name}
        </div>
      </div>
    </section>
  );
}
