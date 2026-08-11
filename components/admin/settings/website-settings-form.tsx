"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { websiteSettingsSchema } from "@/lib/validation/websiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SeoFieldsSection } from "@/components/forms/seo-fields-section";

// Form field is `seo` (matches SeoFieldsSection's hardcoded paths); renamed
// to `defaultSeo` only when building the upsert payload.
const websiteSettingsFormSchema = z.object({
  siteName: websiteSettingsSchema.shape.siteName,
  contactEmail: websiteSettingsSchema.shape.contactEmail,
  contactPhone: websiteSettingsSchema.shape.contactPhone,
  socialLinks: websiteSettingsSchema.shape.socialLinks,
  seo: websiteSettingsSchema.shape.defaultSeo,
});
type WebsiteSettingsFormValues = z.infer<typeof websiteSettingsFormSchema>;

const EMPTY_DEFAULTS: WebsiteSettingsFormValues = {
  siteName: "",
  contactEmail: undefined,
  contactPhone: undefined,
  socialLinks: undefined,
  seo: undefined,
};

function toFormValues(settings: Doc<"websiteSettings">): WebsiteSettingsFormValues {
  return {
    siteName: settings.siteName,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    socialLinks: settings.socialLinks,
    seo: settings.defaultSeo,
  };
}

function SettingsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-1/2" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-2/3" />
    </div>
  );
}

function WebsiteSettingsFormInner({ settings }: { settings: Doc<"websiteSettings"> | null }) {
  const upsert = useMutation(api.websiteSettings.upsert);
  const form = useForm<WebsiteSettingsFormValues>({
    resolver: zodResolver(websiteSettingsFormSchema),
    values: settings ? toFormValues(settings) : EMPTY_DEFAULTS,
  });

  async function onSubmit(values: WebsiteSettingsFormValues) {
    const { seo, ...rest } = values;
    const payload = { ...rest, defaultSeo: seo };
    try {
      await upsert(payload);
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    }
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="settings-site-name">Site Name *</Label>
            <Input id="settings-site-name" {...form.register("siteName")} />
            {form.formState.errors.siteName && (
              <p className="text-sm text-destructive">{form.formState.errors.siteName.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="settings-contact-email">Contact Email</Label>
            <Input id="settings-contact-email" type="email" {...form.register("contactEmail")} />
            {form.formState.errors.contactEmail && (
              <p className="text-sm text-destructive">{form.formState.errors.contactEmail.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="settings-contact-phone">Contact Phone</Label>
            <Input id="settings-contact-phone" {...form.register("contactPhone")} />
            {form.formState.errors.contactPhone && (
              <p className="text-sm text-destructive">{form.formState.errors.contactPhone.message}</p>
            )}
          </div>
        </div>

        <Separator />
        <h2 className="text-sm font-medium text-muted-foreground">Social Links</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="settings-facebook">Facebook</Label>
            <Input
              id="settings-facebook"
              placeholder="https://..."
              {...form.register("socialLinks.facebook")}
            />
            {form.formState.errors.socialLinks?.facebook && (
              <p className="text-sm text-destructive">
                {form.formState.errors.socialLinks.facebook.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="settings-instagram">Instagram</Label>
            <Input
              id="settings-instagram"
              placeholder="https://..."
              {...form.register("socialLinks.instagram")}
            />
            {form.formState.errors.socialLinks?.instagram && (
              <p className="text-sm text-destructive">
                {form.formState.errors.socialLinks.instagram.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="settings-linkedin">LinkedIn</Label>
            <Input
              id="settings-linkedin"
              placeholder="https://..."
              {...form.register("socialLinks.linkedin")}
            />
            {form.formState.errors.socialLinks?.linkedin && (
              <p className="text-sm text-destructive">
                {form.formState.errors.socialLinks.linkedin.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="settings-twitter">Twitter</Label>
            <Input
              id="settings-twitter"
              placeholder="https://..."
              {...form.register("socialLinks.twitter")}
            />
            {form.formState.errors.socialLinks?.twitter && (
              <p className="text-sm text-destructive">
                {form.formState.errors.socialLinks.twitter.message}
              </p>
            )}
          </div>
        </div>

        <Separator />
        <h2 className="text-sm font-medium text-muted-foreground">Default SEO</h2>
        <SeoFieldsSection
          idPrefix="settings"
          titlePlaceholder="e.g. QuickTalk Real Estate | Dubai Property Listings"
          descriptionPlaceholder="A search-engine-friendly summary of the whole site…"
          canonicalPlaceholder="/"
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving…" : "Save Settings"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

export function WebsiteSettingsForm() {
  const settings = useQuery(api.websiteSettings.get);

  if (settings === undefined) {
    return <SettingsSkeleton />;
  }

  return <WebsiteSettingsFormInner settings={settings} />;
}
