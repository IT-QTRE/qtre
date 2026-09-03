"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { communitySchema } from "@/lib/validation/communities";
import { compactLocalized, compactSeoFields, publishingFieldsSchema, optionalLocalizedTextSchema } from "@/lib/validation/shared";
import { formLocalized, formSeo } from "@/lib/admin/form-values";
import { communityHasLocaleCopy, communityPublishNotes } from "@/lib/admin/community-publish";
import { uploadMediaFile } from "@/lib/media/uploadMediaFile";
import { slugFromTitle } from "@/lib/format/slug";
import { AdminStickyActions } from "@/components/admin/admin-sticky-actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LocalizedTextField } from "@/components/forms/localized-text-field";
import { FormLocaleProvider, FormLocaleSwitch, useFormLocale, type FormLocale } from "@/components/forms/form-locale";
import { SeoFieldsSection } from "@/components/forms/seo-fields-section";
import { FieldHint } from "@/components/forms/field-hint";
import { CitySelect } from "@/components/forms/city-select";
import { CountryCodeSelect } from "@/components/forms/country-code-select";
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaPicker, type PendingMediaFile } from "@/components/media/media-picker";
import { AdminSection } from "@/components/admin/admin-section";
import { useUnsavedChanges } from "@/components/admin/unsaved-changes";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

const LIST_HREF = "/admin/communities";

const communityFormSchema = z.object({
  name: communitySchema.shape.name,
  city: communitySchema.shape.city,
  countryCode: communitySchema.shape.countryCode,
  description: optionalLocalizedTextSchema,
  seo: communitySchema.shape.seo,
  slug: publishingFieldsSchema.shape.slug,
  status: publishingFieldsSchema.shape.status,
});

type CommunityFormValues = z.infer<typeof communityFormSchema>;

const DEFAULT_VALUES: CommunityFormValues = {
  name: formLocalized(undefined),
  city: formLocalized(undefined),
  countryCode: "",
  description: formLocalized(undefined),
  seo: formSeo(undefined),
  slug: "",
  status: "draft",
};

function toFormValues(community: Doc<"communities">): CommunityFormValues {
  return {
    name: formLocalized(community.name),
    city: formLocalized(community.city),
    countryCode: community.countryCode,
    description: formLocalized(community.description),
    seo: formSeo(community.seo),
    slug: community.publishing.slug,
    status: community.publishing.status,
  };
}

function firstErrorPath(errors: FieldErrors, prefix = ""): string | null {
  for (const [key, value] of Object.entries(errors)) {
    if (!value || typeof value !== "object") continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if ("message" in value && value.message) return path;
    const nested = firstErrorPath(value as FieldErrors, path);
    if (nested) return nested;
  }
  return null;
}

function localeFromPath(path: string): FormLocale {
  if (path.includes(".ar")) return "ar";
  if (path.includes(".tr")) return "tr";
  return "en";
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

type CommunityFormProps = { mode: "edit"; community: Doc<"communities"> } | { mode: "create" };

function CommunityFormFields(props: CommunityFormProps) {
  const router = useRouter();
  const unsaved = useUnsavedChanges();
  const formLocale = useFormLocale();
  const savedPhotos = useAuthedQuery(
    api.mediaItems.listByEntity,
    props.mode === "edit" ? { entityType: "community", entityId: props.community._id } : "skip",
  );
  const createCommunity = useMutation(api.communities.create);
  const updateCommunity = useMutation(api.communities.update);
  const createMediaItem = useMutation(api.mediaItems.create);
  const [pendingHeroImage, setPendingHeroImage] = useState<PendingMediaFile[]>([]);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | null>(null);
  const [saveIntent, setSaveIntent] = useState<"draft" | "published" | null>(null);
  const slugEdited = useRef(props.mode === "edit");
  const form = useForm<CommunityFormValues>(
    props.mode === "edit"
      ? {
          resolver: zodResolver(communityFormSchema),
          defaultValues: toFormValues(props.community),
          values: toFormValues(props.community),
        }
      : { resolver: zodResolver(communityFormSchema), defaultValues: DEFAULT_VALUES },
  );

  const name = form.watch("name");
  const description = form.watch("description");
  const city = form.watch("city");
  const slug = form.watch("slug");
  const countryCode = form.watch("countryCode");
  const savedStatus = props.mode === "edit" ? props.community.publishing.status : "draft";
  const nameEn = name.en;
  const photoCount = props.mode === "create" ? pendingHeroImage.length : savedPhotos === undefined ? null : savedPhotos.length;
  const publishNotes = communityPublishNotes({ photoCount, name, description, city });

  useEffect(() => {
    unsaved?.setDirty(form.formState.isDirty || pendingHeroImage.length > 0);
  }, [form.formState.isDirty, pendingHeroImage.length, unsaved]);

  useEffect(() => {
    if (slugEdited.current) return;
    const next = slugFromTitle(nameEn ?? "");
    if (next && next !== slug) {
      form.setValue("slug", next, { shouldDirty: false, shouldValidate: true });
    }
  }, [form, slug, nameEn]);

  function onInvalid(errors: FieldErrors<CommunityFormValues>) {
    setSaveIntent(null);
    const path = firstErrorPath(errors);
    if (!path) return;
    formLocale?.setLocale(localeFromPath(path));
    if (path === "seo" || path.startsWith("seo.")) {
      document.getElementById("community-seo")?.setAttribute("open", "");
    }
    void form.setFocus(path as Parameters<typeof form.setFocus>[0]);
    requestAnimationFrame(() => {
      document.querySelector("[aria-invalid='true'], .text-destructive")?.scrollIntoView({ block: "center" });
    });
  }

  async function onSubmit(values: CommunityFormValues) {
    const payload = {
      name: values.name,
      city: values.city,
      countryCode: values.countryCode,
      description: compactLocalized(values.description),
      seo: compactSeoFields(values.seo),
      slug: values.slug,
      status: values.status,
    };

    try {
      if (props.mode === "edit") {
        await updateCommunity({ id: props.community._id, ...payload });
        form.reset(form.getValues());
        unsaved?.setDirty(false);
        toast.success(values.status === "published" ? "Community is live" : "Draft saved");
      } else {
        const id = await createCommunity(payload);
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
            toast.warning("Community created, but the photo failed to upload — add it from the edit page.");
          } else {
            toast.success(values.status === "published" ? "Community is live" : "Draft saved");
          }
        } else {
          toast.success(values.status === "published" ? "Community is live" : "Draft saved");
        }
        unsaved?.setDirty(false);
        router.push(`/admin/communities/${id}`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      toast.error(
        detail && detail !== "Failed to save community"
          ? detail
          : "Couldn't save this community. Check the highlighted fields and try again.",
      );
    } finally {
      setSaveIntent(null);
    }
  }

  function requestSave(status: "draft" | "published") {
    form.setValue("status", status, { shouldDirty: true });
    if (status === "published" && savedStatus !== "published") {
      void form.handleSubmit(() => {
        setConfirm("publish");
      }, onInvalid)();
      return;
    }
    if (status === "draft" && savedStatus === "published") {
      void form.handleSubmit(() => {
        setConfirm("unpublish");
      }, onInvalid)();
      return;
    }
    setSaveIntent(status);
    void form.handleSubmit(onSubmit, onInvalid)();
  }

  const publicPath = slug ? `/en/communities/${slug}` : "/en/communities/…";
  const slugField = form.register("slug");

  return (
    <FormProvider {...form}>
      <form
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          requestSave(savedStatus === "published" ? "published" : "draft");
        }}
        className="flex flex-col gap-4 [&_input]:scroll-mb-32 [&_textarea]:scroll-mb-32 **:data-[slot=select-trigger]:scroll-mb-32"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FormLocaleSwitch
            filled={{
              en: communityHasLocaleCopy(name, description, city, "en"),
              ar: communityHasLocaleCopy(name, description, city, "ar"),
              tr: communityHasLocaleCopy(name, description, city, "tr"),
            }}
          />
        </div>

        <AdminSection title="Community">
          <LocalizedTextField name="name" label="Name" required placeholder="e.g. Downtown Dubai" />
          <LocalizedTextField
            name="description"
            label="Description"
            multiline
            placeholder="A short description of the community…"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="community-country">Market *</Label>
              <Controller
                control={form.control}
                name="countryCode"
                render={({ field, fieldState }) => (
                  <CountryCodeSelect
                    id="community-country"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(fieldState.error)}
                  />
                )}
              />
              <FieldError message={form.formState.errors.countryCode?.message} />
            </div>
            <Controller
              control={form.control}
              name="city"
              render={({ field, fieldState }) => (
                <div>
                  <CitySelect
                    id="community-city"
                    countryCode={countryCode}
                    value={field.value}
                    onChange={field.onChange}
                    locale={formLocale?.locale ?? "en"}
                    invalid={Boolean(fieldState.error)}
                  />
                  <FieldError message={form.formState.errors.city?.en?.message} />
                </div>
              )}
            />
          </div>
        </AdminSection>

        <AdminSection
          title="Photos"
          hint={
            props.mode === "edit"
              ? "First photo is the community image. Uploads immediately — drag to reorder."
              : "First photo is the community image. Photos upload when you save."
          }
        >
          {props.mode === "edit" ? (
            <MediaUploader entityType="community" entityId={props.community._id} />
          ) : (
            <MediaPicker entityType="community" value={pendingHeroImage} onChange={setPendingHeroImage} />
          )}
        </AdminSection>

        <AdminSection title="Publishing">
          <div className="space-y-1">
            <Label htmlFor="community-slug">Slug *</Label>
            <Input
              id="community-slug"
              placeholder="downtown-dubai…"
              autoComplete="off"
              spellCheck={false}
              translate="no"
              {...slugField}
              onChange={(event) => {
                slugEdited.current = true;
                void slugField.onChange(event);
              }}
            />
            <p className="font-mono text-xs text-muted-foreground" translate="no">{publicPath}</p>
            {savedStatus === "published" && slug ? (
              <a
                href={`/en/communities/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                View public
              </a>
            ) : null}
            <FieldHint>
              Public URL is /communities/{slug || "…"}. Unique in this market. A live community in any market cannot reuse it.
            </FieldHint>
            <FieldError message={form.formState.errors.slug?.message} />
          </div>
        </AdminSection>

        <AdminSection id="community-seo" title="SEO" hint="Leave blank to fall back to the community name and description." collapsible>
          <SeoFieldsSection
            idPrefix="community"
            titlePlaceholder="e.g. Downtown Dubai | QuickTalk Real Estate"
            descriptionPlaceholder="A search-engine-friendly summary…"
            canonicalPlaceholder="/communities/downtown-dubai"
          />
        </AdminSection>

        <AdminStickyActions
          disabled={form.formState.isSubmitting}
          draftLabel={form.formState.isSubmitting && saveIntent === "draft" ? "Saving…" : "Save draft"}
          publishLabel={
            form.formState.isSubmitting && saveIntent === "published"
              ? savedStatus === "published"
                ? "Saving…"
                : "Publishing…"
              : savedStatus === "published"
                ? "Save"
                : "Publish"
          }
          onCancel={() => {
            if (unsaved) unsaved.requestLeave(LIST_HREF);
            else router.push(LIST_HREF);
          }}
          onSaveDraft={() => requestSave("draft")}
          onPublish={() => requestSave("published")}
        />
      </form>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => { if (!open) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "unpublish" ? "Hide this community?" : "Publish this community?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "unpublish" ? (
                "It will be removed from the public catalog. You can publish it again later."
              ) : (
                <>
                  Live at {publicPath}. /ar and /tr use the same slug and fall back to English where a translation is blank.
                  {publishNotes.length > 0 ? ` ${publishNotes.join(" ")}` : null}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const nextStatus = confirm === "unpublish" ? "draft" : "published";
                setConfirm(null);
                setSaveIntent(nextStatus);
                void form.handleSubmit(onSubmit, onInvalid)();
              }}
            >
              {confirm === "unpublish" ? "Save as draft" : "Publish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  );
}

export function CommunityForm(props: CommunityFormProps) {
  return (
    <FormLocaleProvider>
      <CommunityFormFields {...props} />
    </FormLocaleProvider>
  );
}
