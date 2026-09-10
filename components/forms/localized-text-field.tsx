"use client";

import { Controller, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldHint } from "@/components/forms/field-hint";
import { RichTextEditor } from "@/components/forms/rich-text-editor";
import { FORM_LOCALES, useFormLocale } from "@/components/forms/form-locale";

type LocalizedTextFieldProps = {
  /** Dot-path to the LocalizedText field on the form, e.g. "name" or "seo.seoTitle". */
  name: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
  /**
   * When true, each locale tab renders a rich-text editor instead of a plain
   * input/textarea. Takes precedence over `multiline` if both are set.
   */
  richText?: boolean;
  /** Applies to the field as a whole (not per-locale) — rendered once, under the tab group. */
  hint?: string;
  /** Example text shown in every locale tab's input (same example, since it's illustrative rather than translated copy). */
  placeholder?: string;
  /**
   * Soft guidance only (e.g. the ~60/~155 char points where Google tends to
   * truncate title/description in search results) — shown as a live
   * per-locale counter, never blocks typing or submission.
   */
  recommendedMaxLength?: number;
  /** When linking from a post body, hide that post in the catalog picker. */
  excludePostId?: string;
};

function LocaleInput({
  name,
  code,
  dir,
  multiline,
  richText,
  placeholder,
  recommendedMaxLength,
  excludePostId,
}: {
  name: string;
  code: string;
  dir: "ltr" | "rtl";
  multiline?: boolean;
  richText?: boolean;
  placeholder?: string;
  recommendedMaxLength?: number;
  excludePostId?: string;
}) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={`${name}.${code}`}
      render={({ field, fieldState }) => {
        const length = (field.value ?? "").length;
        const overLimit = recommendedMaxLength !== undefined && length > recommendedMaxLength;
        return (
          <div className="space-y-1">
            {richText ? (
              <RichTextEditor dir={dir} value={field.value ?? ""} onChange={field.onChange} excludePostId={excludePostId} />
            ) : multiline ? (
              <Textarea
                dir={dir}
                rows={5}
                placeholder={placeholder}
                className="max-h-64 overflow-y-auto overscroll-y-contain"
                {...field}
                value={field.value ?? ""}
              />
            ) : (
              <Input dir={dir} placeholder={placeholder} {...field} value={field.value ?? ""} />
            )}
            {recommendedMaxLength !== undefined && (
              <p className={cn("text-xs", overLimit ? "text-destructive" : "text-muted-foreground")}>
                {length}/{recommendedMaxLength} characters
                {overLimit ? " — likely to be truncated in search results" : ""}
              </p>
            )}
            {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
          </div>
        );
      }}
    />
  );
}

export function LocalizedTextField({
  name,
  label,
  required,
  multiline,
  richText,
  hint,
  placeholder,
  recommendedMaxLength,
  excludePostId,
}: LocalizedTextFieldProps) {
  const formLocale = useFormLocale();
  const requiredHere = Boolean(required && (!formLocale || formLocale.locale === "en"));
  const optionalLocale = Boolean(required && formLocale && formLocale.locale !== "en");

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {requiredHere ? <span className="text-destructive"> *</span> : null}
      </Label>
      {optionalLocale ? <FieldHint>Optional — English shows if blank.</FieldHint> : null}
      {hint && <FieldHint>{hint}</FieldHint>}
      {formLocale ? (
        <LocaleInput
          name={name}
          code={formLocale.locale}
          dir={FORM_LOCALES.find((item) => item.code === formLocale.locale)?.dir ?? "ltr"}
          multiline={multiline}
          richText={richText}
          placeholder={placeholder}
          recommendedMaxLength={recommendedMaxLength}
          excludePostId={excludePostId}
        />
      ) : (
        <Tabs defaultValue="en">
          <TabsList>
            {FORM_LOCALES.map((locale) => (
              <TabsTrigger key={locale.code} value={locale.code}>
                {locale.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {FORM_LOCALES.map((locale) => (
            <TabsContent key={locale.code} value={locale.code}>
              <LocaleInput
                name={name}
                code={locale.code}
                dir={locale.dir}
                multiline={multiline}
                richText={richText}
                placeholder={placeholder}
                recommendedMaxLength={recommendedMaxLength}
                excludePostId={excludePostId}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
