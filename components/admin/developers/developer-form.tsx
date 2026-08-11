"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { developerSchema } from "@/lib/validation/developers";
import { publishingFieldsSchema } from "@/lib/validation/shared";
import { uploadMediaFile } from "@/lib/media/uploadMediaFile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocalizedTextField } from "@/components/forms/localized-text-field";
import { SeoFieldsSection } from "@/components/forms/seo-fields-section";
import { FieldHint } from "@/components/forms/field-hint";
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaPicker, type PendingMediaFile } from "@/components/media/media-picker";

// One form serves both Create and Edit — a full page (not a modal) has no
// height constraint, so there's no more reason to defer fields to a later
// edit step. `create`/`update` also take the exact same argument shape
// server-side (see convex/developers.ts), so the only real difference
// between modes is which mutation runs and whether Media has an entity to
// attach to yet.
const developerFormSchema = z.object({
  name: developerSchema.shape.name,
  description: developerSchema.shape.description,
  website: developerSchema.shape.website,
  phone: developerSchema.shape.phone,
  email: developerSchema.shape.email,
  seo: developerSchema.shape.seo,
  slug: publishingFieldsSchema.shape.slug,
  status: publishingFieldsSchema.shape.status,
});

type DeveloperFormValues = z.infer<typeof developerFormSchema>;

const DEFAULT_VALUES: DeveloperFormValues = {
  name: { en: "" },
  description: undefined,
  website: undefined,
  phone: undefined,
  email: undefined,
  seo: undefined,
  slug: "",
  status: "draft",
};

function toFormValues(developer: Doc<"developers">): DeveloperFormValues {
  return {
    name: developer.name,
    description: developer.description,
    website: developer.website,
    phone: developer.phone,
    email: developer.email,
    seo: developer.seo,
    slug: developer.publishing.slug,
    status: developer.publishing.status,
  };
}

type DeveloperFormProps = { mode: "edit"; developer: Doc<"developers"> } | { mode: "create" };

export function DeveloperForm(props: DeveloperFormProps) {
  const router = useRouter();
  const createDeveloper = useMutation(api.developers.create);
  const updateDeveloper = useMutation(api.developers.update);
  const createMediaItem = useMutation(api.mediaItems.create);
  const [pendingLogo, setPendingLogo] = useState<PendingMediaFile[]>([]);
  const form = useForm<DeveloperFormValues>(
    props.mode === "edit"
      ? { resolver: zodResolver(developerFormSchema), values: toFormValues(props.developer) }
      : { resolver: zodResolver(developerFormSchema), defaultValues: DEFAULT_VALUES },
  );

  async function onSubmit(values: DeveloperFormValues) {
    const payload = {
      ...values,
      website: values.website || undefined,
      email: values.email || undefined,
    };
    try {
      if (props.mode === "edit") {
        await updateDeveloper({ id: props.developer._id, ...payload });
        toast.success("Developer saved");
      } else {
        const id = await createDeveloper(payload);
        if (pendingLogo.length > 0) {
          const results = await Promise.allSettled(
            pendingLogo.map(async (pending) => {
              const uploaded = await uploadMediaFile(pending.file, "developer", id);
              await createMediaItem({ entityType: "developer", entityId: id, ...uploaded });
              URL.revokeObjectURL(pending.previewUrl);
            }),
          );
          const failedCount = results.filter((result) => result.status === "rejected").length;
          if (failedCount > 0) {
            toast.warning(`Developer created, but the logo failed to upload — add it from the edit page.`);
          } else {
            toast.success("Developer created");
          }
        } else {
          toast.success("Developer created");
        }
        router.push(`/admin/developers/${id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save developer");
    }
  }

  return (
    <div className="space-y-8">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <LocalizedTextField name="name" label="Name" required placeholder="e.g. Emaar Properties" />
          <LocalizedTextField
            name="description"
            label="Description"
            multiline
            placeholder="A short description of the developer…"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="dev-slug">Slug *</Label>
              <Input id="dev-slug" placeholder="emaar-properties" {...form.register("slug")} />
              <FieldHint>Used in the page URL. Lowercase letters, numbers, and dashes only.</FieldHint>
              {form.formState.errors.slug && <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="dev-website">Website</Label>
              <Input id="dev-website" placeholder="https://example.com" {...form.register("website")} />
              <FieldHint>Optional — shown on the public profile if provided.</FieldHint>
              {form.formState.errors.website && <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="dev-phone">Phone</Label>
              <Input id="dev-phone" placeholder="+971 4 123 4567" {...form.register("phone")} />
              <FieldHint>Optional — shown on the public profile if provided.</FieldHint>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dev-email">Email</Label>
              <Input id="dev-email" type="email" placeholder="name@example.com" {...form.register("email")} />
              <FieldHint>Optional — shown on the public profile if provided.</FieldHint>
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldHint>Draft is hidden from the public site. Published is live. Archived is hidden but kept for records.</FieldHint>
            </div>
          </div>

          <Separator />
          <h2 className="text-sm font-medium text-muted-foreground">SEO overrides</h2>
          <SeoFieldsSection
            idPrefix="dev"
            titlePlaceholder="e.g. Emaar Properties | QuickTalk Real Estate"
            descriptionPlaceholder="A search-engine-friendly summary…"
            canonicalPlaceholder="/developers/emaar-properties"
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? props.mode === "edit"
                  ? "Saving…"
                  : "Creating…"
                : props.mode === "edit"
                  ? "Save Changes"
                  : "Create Developer"}
            </Button>
          </div>
        </form>
      </FormProvider>

      <Separator />
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Logo</h2>
        {props.mode === "edit" ? (
          <MediaUploader entityType="developer" entityId={props.developer._id} />
        ) : (
          <MediaPicker entityType="developer" value={pendingLogo} onChange={setPendingLogo} />
        )}
      </div>
    </div>
  );
}
