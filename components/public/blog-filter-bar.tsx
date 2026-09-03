"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { SearchIcon } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { publicGutter } from "@/lib/public-layout";
import { blogHasFilters, blogSearchHref, type BlogSearch } from "@/lib/blog-search";
import { cn } from "@/lib/utils";

const ALL_TOPICS = "__all__";

const chipTrigger =
  "h-11 min-h-11 min-w-28 touch-manipulation rounded-lg border border-border bg-background px-3 shadow-none data-[size=default]:h-11";

export function BlogFilterBar({
  search,
  topics,
}: {
  search: BlogSearch;
  topics: { slug: string; name: string }[];
}) {
  const t = useTranslations("catalog");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(search.q ?? "");
  const [topic, setTopic] = useState(search.topic ?? ALL_TOPICS);
  const hasFilters = blogHasFilters(search);

  useEffect(() => {
    setQuery(search.q ?? "");
    setTopic(search.topic ?? ALL_TOPICS);
  }, [search.q, search.topic]);

  function hrefFrom(nextQuery: string, nextTopic: string) {
    return blogSearchHref({
      q: nextQuery.trim() || undefined,
      topic: nextTopic === ALL_TOPICS ? undefined : nextTopic,
    });
  }

  function apply(nextQuery: string, nextTopic: string) {
    startTransition(() => {
      router.push(hrefFrom(nextQuery, nextTopic), { scroll: false });
    });
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply(query, topic);
  }

  const selectedName =
    topic === ALL_TOPICS
      ? t("blogAllTopics")
      : (topics.find((row) => row.slug === topic)?.name ?? topic);
  const topicOptions =
    topic === ALL_TOPICS || topics.some((row) => row.slug === topic)
      ? topics
      : [...topics, { slug: topic, name: topic }];

  return (
    <form
      onSubmit={onSubmit}
      aria-busy={isPending}
      className={cn("flex flex-col gap-2 py-3 sm:flex-row sm:flex-wrap sm:items-center", publicGutter)}
    >
      <label htmlFor="blog-title-search" className="sr-only">
        {t("blogSearchTitles")}
      </label>
      <div className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 sm:min-w-52 sm:flex-1">
        <SearchIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <input
          id="blog-title-search"
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("blogSearchTitles")}
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 border-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex gap-2">
        <Select
          value={topic}
          onValueChange={(next) => {
            const value = next ?? ALL_TOPICS;
            setTopic(value);
            apply(query, value);
          }}
        >
          <SelectTrigger aria-label={t("blogFilterTopic")} className={cn(chipTrigger, "min-w-0 flex-1")}>
            <span className="truncate">{selectedName}</span>
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false} className="min-w-48">
            <SelectItem value={ALL_TOPICS}>{t("blogAllTopics")}</SelectItem>
            {topicOptions.map((row) => (
              <SelectItem key={row.slug} value={row.slug}>
                {row.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "inline-flex min-h-11 shrink-0 cursor-pointer touch-manipulation items-center gap-2 rounded-lg bg-primary px-4 font-heading text-sm font-semibold tracking-tight text-primary-foreground",
            "transition-colors duration-200 ease-out motion-reduce:transition-none hover:bg-primary/90",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:pointer-events-none disabled:cursor-wait disabled:opacity-80",
          )}
        >
          <SearchIcon className="size-4" aria-hidden />
          {isPending ? t("filterApplying") : t("filterApply")}
        </button>
      </div>
      {hasFilters ? (
        <Link
          href={blogSearchHref()}
          scroll={false}
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("blogClearFilters")}
        </Link>
      ) : null}
    </form>
  );
}
