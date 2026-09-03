"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { developerSchema } from "@/lib/validation/developers";
import { compactLocalized, compactSeoFields, publishingFieldsSchema, optionalLocalizedTextSchema } from "@/lib/validation/shared";
import { formLocalized, formSeo } from "@/lib/admin/form-values";
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
import { MediaUploader } from "@/components/media/media-uploader";
import { MediaPicker, type PendingMediaFile } from "@/components/media/media-picker";
import { AdminSection } from "@/components/admin/admin-section";
import { useUnsavedChanges } from "@/components/admin/unsaved-changes";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

const LIST_HREF = "/admin/developers";

const developerFormSchema = z.object({
  name: developerSchema.shape.name,
  description: optionalLocalizedTextSchema,
  website: developerSchema.shape.website,
  phone: developerSchema.shape.phone,
  email: developerSchema.shape.email,
  seo: developerSchema.shape.seo,
  slug: publishingFieldsSchema.shape.slug,
  status: publishingFieldsSchema.shape.status,
});

type DeveloperFormValues = z.infer<typeof developerFormSchema>;

const DEFAULT_VALUES: DeveloperFormValues = {
  name: formLocalized(undefined),
  description: formLocalized(undefined),
  website: "",
  phone: "",
  email: "",
  seo: formSeo(undefined),
  slug: "",
  status: "draft",
};

function toFormValues(developer: Doc<"developers">): DeveloperFormValues {
  return {
    name: formLocalized(developer.name),
    description: formLocalized(developer.description),
    website: developer.website ?? "",
    phone: developer.phone ?? "",
    email: developer.email ?? "",
    seo: formSeo(developer.seo),
    slug: developer.publishing.slug,
    status: developer.publishing.status,
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

function localeHasCopy(
  name: DeveloperFormValues["name"],
  description: DeveloperFormValues["description"],
  locale: FormLocale,
) {
  return Boolean(name[locale]?.trim() || description?.[locale]?.trim());
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

type DeveloperFormProps = { mode: "edit"; developer: Doc<"developers"> } | { mode: "create" };

function DeveloperFormFields(props: DeveloperFormProps) {
  const router = useRouter();
  const unsaved = useUnsavedChanges();
  const formLocale = useFormLocale();
  const savedPhotos = useAuthedQuery(
    api.mediaItems.listByEntity,
    props.mode === "edit" ? { entityType: "developer", entityId: props.developer._id } : "skip",
  );
  const createDeveloper = useMutation(api.developers.create);
  const updateDeveloper = useMutation(api.developers.update);
  const createMediaItem = useMutation(api.mediaItems.create);
  const [pendingLogo, setPendingLogo] = useState<PendingMediaFile[]>([]);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | null>(null);
  const [saveIntent, setSaveIntent] = useState<"draft" | "published" | null>(null);
  const slugEdited = useRef(props.mode === "edit");
  const form = useForm<DeveloperFormValues>(
    props.mode === "edit"
      ? {
          resolver: zodResolver(developerFormSchema),
          defaultValues: toFormValues(props.developer),
          values: toFormValues(props.developer),
        }
      : { resolver: zodResolver(developerFormSchema), defaultValues: DEFAULT_VALUES },
  );

  const name = form.watch("name");
  const description = form.watch("description");
  const slug = form.watch("slug");
  const savedStatus = props.mode === "edit" ? props.developer.publishing.status : "draft";
  const nameEn = name.en;
  const photoCount = props.mode === "create" ? pendingLogo.length : savedPhotos === undefined ? null : savedPhotos.length;
  const missingArabic = !localeHasCopy(name, description, "ar");
  const missingTurkish = !localeHasCopy(name, description, "tr");

  useEffect(() => {
    unsaved?.setDirty(form.formState.isDirty || pendingLogo.length > 0);
  }, [form.formState.isDirty, pendingLogo.length, unsaved]);

  useEffect(() => {
    if (slugEdited.current) return;
    const next = slugFromTitle(nameEn ?? "");
    if (next && next !== slug) {
      form.setValue("slug", next, { shouldDirty: false, shouldValidate: true });
    }
  }, [form, slug, nameEn]);

  function onInvalid(errors: FieldErrors<DeveloperFormValues>) {
    setSaveIntent(null);
    const path = firstErrorPath(errors);
    if (!path) return;
    formLocale?.setLocale(localeFromPath(path));
    if (path === "seo" || path.startsWith("seo.")) {
      document.getElementById("developer-seo")?.setAttribute("open", "");
    }
    void form.setFocus(path as Parameters<typeof form.setFocus>[0]);
    requestAnimationFrame(() => {
      document.querySelector("[aria-invalid='true'], .text-destructive")?.scrollIntoView({ block: "center" });
    });
  }

  async function onSubmit(values: DeveloperFormValues) {
    const payload = {
      name: values.name,
      description: compactLocalized(values.description),
      website: values.website?.trim() ? values.website.trim() : undefined,
      phone: values.phone?.trim() ? values.phone.trim() : undefined,
      email: values.email?.trim() ? values.email.trim() : undefined,
      seo: compactSeoFields(values.seo),
      slug: values.slug,
      status: values.status,
    };

    try {
      if (props.mode === "edit") {
        await updateDeveloper({ id: props.developer._id, ...payload });
        form.reset(form.getValues());
        unsaved?.setDirty(false);
        toast.success(values.status === "published" ? "Developer is live" : "Draft saved");
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
            toast.warning("Developer created, but the logo failed to upload — add it from the edit page.");
          } else {
            toast.success(values.status === "published" ? "Developer is live" : "Draft saved");
          }
        } else {
          toast.success(values.status === "published" ? "Developer is live" : "Draft saved");
        }
        unsaved?.setDirty(false);
        router.push(`/admin/developers/${id}`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      toast.error(
        detail && detail !== "Failed to save developer"
          ? detail
          : "Couldn't save this developer. Check the highlighted fields and try again.",
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

  const publicPath = slug ? `/en/developers/${slug}` : "/en/developers/…";
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
              en: localeHasCopy(name, description, "en"),
              ar: localeHasCopy(name, description, "ar"),
              tr: localeHasCopy(name, description, "tr"),
            }}
          />
        </div>

        <AdminSection title="Developer">
          <LocalizedTextField name="name" label="Name" required placeholder="e.g. Emaar Properties" />
          <LocalizedTextField
            name="description"
            label="Description"
            multiline
            placeholder="A short description of the developer…"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="dev-website">Website</Label>
              <Input id="dev-website" inputMode="url" autoComplete="off" placeholder="https://example.com" {...form.register("website")} />
              <FieldHint>Optional — shown on the public profile if provided.</FieldHint>
              <FieldError message={form.formState.errors.website?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dev-email">Email</Label>
              <Input id="dev-email" type="email" autoComplete="off" placeholder="name@example.com" {...form.register("email")} />
              <FieldHint>Optional — shown on the public profile if provided.</FieldHint>
              <FieldError message={form.formState.errors.email?.message} />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="dev-phone">Phone</Label>
              <Input id="dev-phone" type="tel" autoComplete="off" placeholder="+971 4 123 4567" {...form.register("phone")} />
              <FieldHint>Optional — shown on the public profile if provided.</FieldHint>
            </div>
          </div>
        </AdminSection>

        <AdminSection
          title="Logo"
          hint={
            props.mode === "edit"
              ? "Shown on the public profile. Uploads immediately."
              : "Shown on the public profile. Uploads when you save."
          }
        >
          {props.mode === "edit" ? (
            <MediaUploader entityType="developer" entityId={props.developer._id} />
          ) : (
            <MediaPicker entityType="developer" value={pendingLogo} onChange={setPendingLogo} />
          )}
        </AdminSection>

        <AdminSection title="Publishing">
          <div className="space-y-1">
            <Label htmlFor="dev-slug">Slug *</Label>
            <Input
              id="dev-slug"
              placeholder="emaar-properties…"
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
            <FieldHint>Live URL for English. Arabic and Turkish use the same slug under /ar and /tr.</FieldHint>
            <FieldError message={form.formState.errors.slug?.message} />
          </div>
        </AdminSection>

        <AdminSection id="developer-seo" title="SEO" hint="Leave blank to fall back to the developer name and description." collapsible>
          <SeoFieldsSection
            idPrefix="dev"
            titlePlaceholder="e.g. Emaar Properties | QuickTalk Real Estate"
            descriptionPlaceholder="A search-engine-friendly summary…"
            canonicalPlaceholder="/developers/emaar-properties"
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
            <AlertDialogTitle>{confirm === "unpublish" ? "Hide this developer?" : "Publish this developer?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "unpublish" ? (
                "It will be removed from the public catalog. You can publish it again later."
              ) : (
                <>
                  Live at {publicPath}. /ar and /tr use the same slug and fall back to English where a translation is blank.
                  {photoCount === 0 ? " No logo yet — the profile will go live without one." : null}
                  {missingArabic ? " Arabic is empty." : null}
                  {missingTurkish ? " Turkish is empty." : null}
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

export function DeveloperForm(props: DeveloperFormProps) {
  return (
    <FormLocaleProvider>
      <DeveloperFormFields {...props} />
    </FormLocaleProvider>
  );
}
