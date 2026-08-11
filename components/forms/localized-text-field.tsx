"use client";

import { Controller, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldHint } from "@/components/forms/field-hint";
import { RichTextEditor } from "@/components/forms/rich-text-editor";

// Mirrors `convex/lib/localizedText.ts`'s `localizedTextValidator` shape
// (`en` required, `ar`/`tr` optional) — every entity's translated fields
// (name/title/description/city/etc.) use this same en/ar/tr set.
const LOCALES = [
  { code: "en", label: "English", dir: "ltr" as const },
  { code: "ar", label: "Arabic", dir: "rtl" as const },
  { code: "tr", label: "Turkish", dir: "ltr" as const },
];

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
};

export function LocalizedTextField({
  name,
  label,
  required,
  multiline,
  richText,
  hint,
  placeholder,
  recommendedMaxLength,
}: LocalizedTextFieldProps) {
  const { control } = useFormContext();

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {hint && <FieldHint>{hint}</FieldHint>}
      <Tabs defaultValue="en">
        <TabsList>
          {LOCALES.map((locale) => (
            <TabsTrigger key={locale.code} value={locale.code}>
              {locale.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {LOCALES.map((locale) => (
          <TabsContent key={locale.code} value={locale.code}>
            <Controller
              control={control}
              name={`${name}.${locale.code}`}
              render={({ field, fieldState }) => {
                const length = (field.value ?? "").length;
                const overLimit = recommendedMaxLength !== undefined && length > recommendedMaxLength;
                return (
                  <div className="space-y-1">
                    {richText ? (
                      <RichTextEditor
                        dir={locale.dir}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    ) : multiline ? (
                      <Textarea dir={locale.dir} rows={5} placeholder={placeholder} {...field} value={field.value ?? ""} />
                    ) : (
                      <Input dir={locale.dir} placeholder={placeholder} {...field} value={field.value ?? ""} />
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
