"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { SearchIcon } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { IntentMark } from "@/components/public/intent-mark";
import { PlaceSearchField } from "@/components/public/place-search-field";
import { cn } from "@/lib/utils";
import { homeSearchHref, type SearchIntent } from "@/lib/public-nav";
import { searchPlaceKind } from "@/lib/search-places";

const INTENTS: SearchIntent[] = ["buy", "rent", "offplan"];

const instrumentShadow =
  "shadow-[0_12px_40px_color-mix(in_oklab,var(--foreground)_28%,transparent)]";

export function HomeSearch({
  defaultIntent = "buy",
  defaultQuery = "",
}: {
  defaultIntent?: SearchIntent;
  defaultQuery?: string;
}) {
  const t = useTranslations("home");
  const router = useRouter();
  const [intent, setIntent] = useState<SearchIntent>(defaultIntent);
  const [query, setQuery] = useState(defaultQuery);
  const [isPending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    startTransition(() => {
      router.push(homeSearchHref(intent, query));
    });
  }

  function pickPlace(name: string) {
    if (isPending) return;
    setQuery(name);
    startTransition(() => {
      router.push(homeSearchHref(intent, name));
    });
  }

  return (
    <form onSubmit={onSubmit} className="qtre-settle w-full max-w-3xl" aria-busy={isPending}>
      <div
        className={cn(
          "flex flex-col bg-background text-foreground sm:flex-row sm:items-stretch",
          "rounded-xl",
          instrumentShadow,
        )}
      >
        <div
          className="flex min-w-0 shrink-0 items-stretch border-b border-border sm:border-b-0 sm:border-e"
          role="group"
          aria-label={t("intentGroup")}
        >
          {INTENTS.map((value) => {
            const active = intent === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setIntent(value)}
                aria-pressed={active}
                className={cn(
                  "min-h-12 flex-1 cursor-pointer px-4 font-heading text-sm font-medium tracking-tight transition-colors duration-200 ease-out motion-reduce:transition-none sm:flex-none sm:px-5",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="relative inline-block py-3">
                  {t(value)}
                  <IntentMark layoutId="home-search-intent" selected={active} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="group/field flex min-w-0 flex-1 items-center gap-2.5 px-4 focus-within:bg-muted">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground group-focus-within/field:text-primary" aria-hidden />
          <PlaceSearchField
            id="home-location"
            kind={searchPlaceKind(intent)}
            value={query}
            onChange={setQuery}
            onPick={pickPlace}
            placeholder={t("searchPlaceholder")}
            label={t("locationLabel")}
            inputClassName="min-h-12"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          aria-live="polite"
          className="m-1.5 min-h-12 min-w-24 shrink-0 cursor-pointer rounded-lg bg-primary px-5 font-heading text-sm font-semibold tracking-tight text-primary-foreground transition-colors duration-200 ease-out motion-reduce:transition-none hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-wait disabled:opacity-80"
        >
          {isPending ? t("searching") : t("search")}
        </button>
      </div>
    </form>
  );
}
