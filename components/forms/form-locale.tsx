"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { AdminFilterGroup } from "@/components/admin/admin-filter-group";

export const FORM_LOCALES = [
  { code: "en", label: "English", dir: "ltr" as const },
  { code: "ar", label: "Arabic", dir: "rtl" as const },
  { code: "tr", label: "Turkish", dir: "ltr" as const },
] as const;

export type FormLocale = (typeof FORM_LOCALES)[number]["code"];

type FormLocaleContextValue = {
  locale: FormLocale;
  setLocale: (locale: FormLocale) => void;
};

const FormLocaleContext = createContext<FormLocaleContextValue | null>(null);

export function FormLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<FormLocale>("en");
  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return <FormLocaleContext.Provider value={value}>{children}</FormLocaleContext.Provider>;
}

export function useFormLocale() {
  return useContext(FormLocaleContext);
}

export function FormLocaleSwitch({
  filled,
}: {
  /** When set, each locale chip shows a filled/empty mark. English stays required. */
  filled?: Partial<Record<FormLocale, boolean>>;
} = {}) {
  const context = useFormLocale();
  if (!context) return null;

  return (
    <div className="space-y-1">
      <AdminFilterGroup
        label="Authoring language"
        value={context.locale}
        onChange={context.setLocale}
        options={FORM_LOCALES.map((item) => {
          const hasContent = filled?.[item.code] ?? false;
          const required = item.code === "en";
          return {
            id: item.code,
            ariaLabel: `${item.label}, ${required ? "required" : "optional"}, ${hasContent ? "has content" : "empty"}`,
            label: (
              <span className="inline-flex items-center gap-1.5">
                {item.label}
                {filled ? (
                  <span
                    className={
                      hasContent
                        ? "size-1.5 rounded-full bg-current"
                        : "size-1.5 rounded-full border border-current opacity-50"
                    }
                    aria-hidden
                  />
                ) : null}
              </span>
            ),
          };
        })}
      />
      {filled ? (
        <p className="text-xs text-muted-foreground">
          English is required. Arabic and Turkish are optional — the public site falls back to English where they&apos;re
          blank.
        </p>
      ) : null}
    </div>
  );
}
