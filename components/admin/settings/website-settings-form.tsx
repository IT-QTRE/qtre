"use client";

import { useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { compactSeoFields } from "@/lib/validation/shared";
import { formSeo } from "@/lib/admin/form-values";
import { websiteSettingsSchema } from "@/lib/validation/websiteSettings";
import { safeGhlFormUrl } from "@/lib/ghl-form-url";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeoFieldsSection } from "@/components/forms/seo-fields-section";
import { FieldHint } from "@/components/forms/field-hint";
import { AdminSection } from "@/components/admin/admin-section";
import { AdminStickyActions } from "@/components/admin/admin-sticky-actions";
import { useUnsavedChanges } from "@/components/admin/unsaved-changes";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

const websiteSettingsFormSchema = z.object({
  siteName: websiteSettingsSchema.shape.siteName,
  contactEmail: websiteSettingsSchema.shape.contactEmail,
  contactPhone: websiteSettingsSchema.shape.contactPhone,
  contactWhatsapp: websiteSettingsSchema.shape.contactWhatsapp,
  contactFormUrl: websiteSettingsSchema.shape.contactFormUrl,
  socialLinks: websiteSettingsSchema.shape.socialLinks,
  seo: websiteSettingsSchema.shape.defaultSeo,
});
type WebsiteSettingsFormValues = z.infer<typeof websiteSettingsFormSchema>;

const EMPTY_DEFAULTS: WebsiteSettingsFormValues = {
  siteName: "",
  contactEmail: "",
  contactPhone: "",
  contactWhatsapp: "",
  contactFormUrl: "",
  socialLinks: { facebook: "", instagram: "", linkedin: "", twitter: "" },
  seo: formSeo(undefined),
};

function emptyToUndef(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function toFormValues(settings: Doc<"websiteSettings">): WebsiteSettingsFormValues {
  return {
    siteName: settings.siteName,
    contactEmail: settings.contactEmail ?? "",
    contactPhone: settings.contactPhone ?? "",
    contactWhatsapp: settings.contactWhatsapp ?? "",
    contactFormUrl: settings.contactFormUrl ?? "",
    socialLinks: {
      facebook: settings.socialLinks?.facebook ?? "",
      instagram: settings.socialLinks?.instagram ?? "",
      linkedin: settings.socialLinks?.linkedin ?? "",
      twitter: settings.socialLinks?.twitter ?? "",
    },
    seo: formSeo(settings.defaultSeo),
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

function compactSocial(links: WebsiteSettingsFormValues["socialLinks"]) {
  const facebook = emptyToUndef(links?.facebook);
  const instagram = emptyToUndef(links?.instagram);
  const linkedin = emptyToUndef(links?.linkedin);
  const twitter = emptyToUndef(links?.twitter);
  if (!facebook && !instagram && !linkedin && !twitter) return undefined;
  return { facebook, instagram, linkedin, twitter };
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-40 border border-border bg-muted/60" />
      <div className="h-40 border border-border bg-muted/60" />
    </div>
  );
}

function WebsiteSettingsFormInner({ settings }: { settings: Doc<"websiteSettings"> | null }) {
  const unsaved = useUnsavedChanges();
  const upsert = useMutation(api.websiteSettings.upsert);
  const form = useForm<WebsiteSettingsFormValues>({
    resolver: zodResolver(websiteSettingsFormSchema),
    defaultValues: settings ? toFormValues(settings) : EMPTY_DEFAULTS,
    values: settings ? toFormValues(settings) : EMPTY_DEFAULTS,
  });

  useEffect(() => {
    unsaved?.setDirty(form.formState.isDirty);
  }, [form.formState.isDirty, unsaved]);

  async function onSubmit(values: WebsiteSettingsFormValues) {
    try {
      await upsert({
        siteName: values.siteName.trim(),
        contactEmail: emptyToUndef(values.contactEmail),
        contactPhone: emptyToUndef(values.contactPhone),
        contactWhatsapp: emptyToUndef(values.contactWhatsapp),
        contactFormUrl: safeGhlFormUrl(values.contactFormUrl) ?? emptyToUndef(values.contactFormUrl),
        socialLinks: compactSocial(values.socialLinks),
        defaultSeo: compactSeoFields(values.seo),
      });
      form.reset(form.getValues());
      unsaved?.setDirty(false);
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    }
  }

  return (
    <FormProvider {...form}>
      <form
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit(onSubmit, () => {
            requestAnimationFrame(() => {
              document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
            });
          })();
        }}
        className="flex scroll-mb-32 flex-col gap-4"
      >
        <AdminSection title="Site" hint="Shown on the public site and in fallback SEO.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="settings-site-name">Site name *</Label>
              <Input
                id="settings-site-name"
                autoComplete="off"
                {...form.register("siteName")}
                aria-invalid={form.formState.errors.siteName ? true : undefined}
              />
              <FieldError message={form.formState.errors.siteName?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="settings-contact-email">Contact email</Label>
              <Input
                id="settings-contact-email"
                type="email"
                autoComplete="off"
                spellCheck={false}
                placeholder="hello@example.com…"
                {...form.register("contactEmail")}
                aria-invalid={form.formState.errors.contactEmail ? true : undefined}
              />
              <FieldHint>Optional — public contact address.</FieldHint>
              <FieldError message={form.formState.errors.contactEmail?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="settings-contact-phone">Contact phone</Label>
              <Input
                id="settings-contact-phone"
                type="tel"
                autoComplete="off"
                placeholder="+971 4 000 0000…"
                {...form.register("contactPhone")}
                aria-invalid={form.formState.errors.contactPhone ? true : undefined}
              />
              <FieldHint>Optional — public contact number.</FieldHint>
              <FieldError message={form.formState.errors.contactPhone?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="settings-contact-whatsapp">WhatsApp</Label>
              <Input
                id="settings-contact-whatsapp"
                type="tel"
                autoComplete="off"
                placeholder="+971 50 000 0000…"
                {...form.register("contactWhatsapp")}
                aria-invalid={form.formState.errors.contactWhatsapp ? true : undefined}
              />
              <FieldHint>Optional — international number or wa.me link. Shown on Contact.</FieldHint>
              <FieldError message={form.formState.errors.contactWhatsapp?.message} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="settings-contact-form-url">Contact form URL</Label>
              <Input
                id="settings-contact-form-url"
                type="text"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                placeholder="https://go.quicktalkbusiness.com/widget/form/…"
                {...form.register("contactFormUrl")}
                aria-invalid={form.formState.errors.contactFormUrl ? true : undefined}
              />
              <FieldHint>
                Optional — paste the iframe src or the whole embed. White-label hosts like go.quicktalkbusiness.com are allowed. Submissions stay in GHL, not Leads.
              </FieldHint>
              <FieldError message={form.formState.errors.contactFormUrl?.message} />
            </div>
          </div>
        </AdminSection>

        <AdminSection title="Social" hint="Leave blank to hide a network.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="settings-facebook">Facebook</Label>
              <Input
                id="settings-facebook"
                type="url"
                inputMode="url"
                placeholder="https://…"
                autoComplete="off"
                spellCheck={false}
                {...form.register("socialLinks.facebook")}
                aria-invalid={form.formState.errors.socialLinks?.facebook ? true : undefined}
              />
              <FieldError message={form.formState.errors.socialLinks?.facebook?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="settings-instagram">Instagram</Label>
              <Input
                id="settings-instagram"
                type="url"
                inputMode="url"
                placeholder="https://…"
                autoComplete="off"
                spellCheck={false}
                {...form.register("socialLinks.instagram")}
                aria-invalid={form.formState.errors.socialLinks?.instagram ? true : undefined}
              />
              <FieldError message={form.formState.errors.socialLinks?.instagram?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="settings-linkedin">LinkedIn</Label>
              <Input
                id="settings-linkedin"
                type="url"
                inputMode="url"
                placeholder="https://…"
                autoComplete="off"
                spellCheck={false}
                {...form.register("socialLinks.linkedin")}
                aria-invalid={form.formState.errors.socialLinks?.linkedin ? true : undefined}
              />
              <FieldError message={form.formState.errors.socialLinks?.linkedin?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="settings-twitter">X / Twitter</Label>
              <Input
                id="settings-twitter"
                type="url"
                inputMode="url"
                placeholder="https://…"
                autoComplete="off"
                spellCheck={false}
                {...form.register("socialLinks.twitter")}
                aria-invalid={form.formState.errors.socialLinks?.twitter ? true : undefined}
              />
              <FieldError message={form.formState.errors.socialLinks?.twitter?.message} />
            </div>
          </div>
        </AdminSection>

        <AdminSection title="Default SEO" hint="Used when a page has no listing-specific title or description." collapsible>
          <SeoFieldsSection
            idPrefix="settings"
            titlePlaceholder="e.g. QuickTalk Real Estate | Dubai Property Listings"
            descriptionPlaceholder="A search-engine-friendly summary of the whole site…"
            canonicalPlaceholder="/"
          />
        </AdminSection>

        <AdminStickyActions
          disabled={form.formState.isSubmitting}
          publishLabel={form.formState.isSubmitting ? "Saving…" : "Save"}
          onCancel={() => {
            form.reset(settings ? toFormValues(settings) : EMPTY_DEFAULTS);
            unsaved?.setDirty(false);
          }}
          onPublish={() => void form.handleSubmit(onSubmit)()}
        />
      </form>
    </FormProvider>
  );
}

export function WebsiteSettingsForm() {
  const settings = useAuthedQuery(api.websiteSettings.get, {});

  if (settings === undefined) {
    return <SettingsSkeleton />;
  }

  return <WebsiteSettingsFormInner settings={settings} />;
}
