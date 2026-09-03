export type FormLocalized = { en: string; ar: string; tr: string };

export type FormSeo = {
  seoTitle: FormLocalized;
  seoDescription: FormLocalized;
  canonicalPath: string;
};

export const emptyFormLocalized = (): FormLocalized => ({ en: "", ar: "", tr: "" });

export function formLocalized(text: { en?: string; ar?: string; tr?: string } | undefined): FormLocalized {
  return {
    en: text?.en ?? "",
    ar: text?.ar ?? "",
    tr: text?.tr ?? "",
  };
}

export function formSeo(
  seo:
    | {
        seoTitle?: { en?: string; ar?: string; tr?: string };
        seoDescription?: { en?: string; ar?: string; tr?: string };
        canonicalPath?: string;
      }
    | undefined,
): FormSeo {
  return {
    seoTitle: formLocalized(seo?.seoTitle),
    seoDescription: formLocalized(seo?.seoDescription),
    canonicalPath: seo?.canonicalPath ?? "",
  };
}
