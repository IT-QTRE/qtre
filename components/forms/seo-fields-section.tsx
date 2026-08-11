"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldHint } from "@/components/forms/field-hint";
import { LocalizedTextField } from "@/components/forms/localized-text-field";

type SeoFieldsSectionProps = {
  /** Prefix for the canonical-path input id (e.g. "dev" → `dev-canonical`). */
  idPrefix: string;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  canonicalPlaceholder: string;
};

/**
 * Shared SEO-overrides block used by every entity form that stores
 * `seo.seoTitle` / `seo.seoDescription` / `seo.canonicalPath`. Callers keep
 * their own outer wrapper (untabbed heading or `<TabsContent value="seo">`).
 */
export function SeoFieldsSection({
  idPrefix,
  titlePlaceholder,
  descriptionPlaceholder,
  canonicalPlaceholder,
}: SeoFieldsSectionProps) {
  const { register } = useFormContext();
  const canonicalId = `${idPrefix}-canonical`;

  return (
    <>
      <LocalizedTextField
        name="seo.seoTitle"
        label="SEO Title"
        hint="Leave blank to fall back to the main Title."
        placeholder={titlePlaceholder}
        recommendedMaxLength={60}
      />
      <LocalizedTextField
        name="seo.seoDescription"
        label="SEO Description"
        multiline
        hint="Leave blank to fall back to the main Description."
        recommendedMaxLength={155}
        placeholder={descriptionPlaceholder}
      />
      <div className="space-y-1">
        <Label htmlFor={canonicalId}>Canonical Path</Label>
        <Input id={canonicalId} placeholder={canonicalPlaceholder} {...register("seo.canonicalPath")} />
        <FieldHint>Only set this if this content is a duplicate of another page — leave blank otherwise.</FieldHint>
      </div>
    </>
  );
}
