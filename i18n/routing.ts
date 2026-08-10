import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar", "tr"],
  defaultLocale: "en",
});

export type AppLocale = (typeof routing.locales)[number];
