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
import { communitySchema } from "@/lib/validation/communities";
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
import { CountryCodeSelect } from "@/components/forms/country-code-select";
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaPicker, type PendingMediaFile } from "@/components/media/media-picker";

// One form serves both Create and Edit — see developer-form.tsx for the
// rationale.
const communityFormSchema = z.object({
  name: communitySchema.shape.name,
  city: communitySchema.shape.city,
  countryCode: communitySchema.shape.countryCode,
  description: communitySchema.shape.description,
  seo: communitySchema.shape.seo,
  slug: publishingFieldsSchema.shape.slug,
  status: publishingFieldsSchema.shape.status,
});

type CommunityFormValues = z.infer<typeof communityFormSchema>;

const DEFAULT_VALUES: CommunityFormValues = {
  name: { en: "" },
  city: { en: "" },
  countryCode: "",
  description: undefined,
  seo: undefined,
  slug: "",
  status: "draft",
};

function toFormValues(community: Doc<"communities">): CommunityFormValues {
  return {
    name: community.name,
    city: community.city,
    countryCode: community.countryCode,
    description: community.description,
    seo: community.seo,
    slug: community.publishing.slug,
    status: community.publishing.status,
  };
}

type CommunityFormProps = { mode: "edit"; community: Doc<"communities"> } | { mode: "create" };

export function CommunityForm(props: CommunityFormProps) {
  const router = useRouter();
  const createCommunity = useMutation(api.communities.create);
  const updateCommunity = useMutation(api.communities.update);
  const createMediaItem = useMutation(api.mediaItems.create);
  const [pendingHeroImage, setPendingHeroImage] = useState<PendingMediaFile[]>([]);
  const form = useForm<CommunityFormValues>(
    props.mode === "edit"
      ? { resolver: zodResolver(communityFormSchema), values: toFormValues(props.community) }
      : { resolver: zodResolver(communityFormSchema), defaultValues: DEFAULT_VALUES },
  );

  async function onSubmit(values: CommunityFormValues) {
    try {
      if (props.mode === "edit") {
        await updateCommunity({ id: props.community._id, ...values });
        toast.success("Community saved");
      } else {
        const id = await createCommunity(values);
        if (pendingHeroImage.length > 0) {
          const results = await Promise.allSettled(
            pendingHeroImage.map(async (pending) => {
              const uploaded = await uploadMediaFile(pending.file, "community", id);
              await createMediaItem({ entityType: "community", entityId: id, ...uploaded });
              URL.revokeObjectURL(pending.previewUrl);
            }),
          );
          const failedCount = results.filter((result) => result.status === "rejected").length;
          if (failedCount > 0) {
            toast.warning(`Community created, but the hero image failed to upload — add it from the edit page.`);
          } else {
            toast.success("Community created");
          }
        } else {
          toast.success("Community created");
        }
        router.push(`/admin/communities/${id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save community");
    }
  }

  return (
    <div className="space-y-8">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <LocalizedTextField name="name" label="Name" required placeholder="e.g. Downtown Dubai" />
          <LocalizedTextField name="city" label="City" required placeholder="e.g. Dubai" />
          <LocalizedTextField
            name="description"
            label="Description"
            multiline
            placeholder="A short description of the community…"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="community-country">Country Code *</Label>
              <Controller
                control={form.control}
                name="countryCode"
                render={({ field }) => (
                  <CountryCodeSelect id="community-country" value={field.value} onChange={field.onChange} />
                )}
              />
              {form.formState.errors.countryCode && (
                <p className="text-sm text-destructive">{form.formState.errors.countryCode.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="community-slug">Slug *</Label>
              <Input id="community-slug" placeholder="downtown-dubai" {...form.register("slug")} />
              <FieldHint>Used in the page URL. Lowercase letters, numbers, and dashes only.</FieldHint>
              {form.formState.errors.slug && <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>}
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
            idPrefix="community"
            titlePlaceholder="e.g. Downtown Dubai | QuickTalk Real Estate"
            descriptionPlaceholder="A search-engine-friendly summary…"
            canonicalPlaceholder="/communities/downtown-dubai"
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? props.mode === "edit"
                  ? "Saving…"
                  : "Creating…"
                : props.mode === "edit"
                  ? "Save Changes"
                  : "Create Community"}
            </Button>
          </div>
        </form>
      </FormProvider>

      <Separator />
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Hero Image</h2>
        {props.mode === "edit" ? (
          <MediaUploader entityType="community" entityId={props.community._id} />
        ) : (
          <MediaPicker entityType="community" value={pendingHeroImage} onChange={setPendingHeroImage} />
        )}
      </div>
    </div>
  );
}
