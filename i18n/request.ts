import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { routing } from "./routing";
import en from "../messages/en.json";
import ar from "../messages/ar.json";
import tr from "../messages/tr.json";

const messagesByLocale = { en, ar, tr } as const;

export default getRequestConfig(async () => {
  const paramValue = await rootParams.locale();

  let locale: (typeof routing.locales)[number];
  if (hasLocale(routing.locales, paramValue)) {
    locale = paramValue;
  } else {
    // Belt-and-suspenders: proxy.ts's middleware normally redirects unknown
    // locales to the default before this ever runs, but next/root-params can
    // theoretically be reached without the middleware in the loop.
    notFound();
  }

  return {
    locale,
    // Pinned so date/number formatting matches on every environment (dev, CI,
    // Vercel prod) instead of falling back to the host machine's system time
    // zone — this is a Dubai property site, so UTC+4 is the correct default
    // regardless of where the server actually runs.
    timeZone: "Asia/Dubai",
    messages: messagesByLocale[locale],
  };
});
