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
import { agentSchema } from "@/lib/validation/agents";
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

const LIST_HREF = "/admin/agents";

const agentFormSchema = z.object({
  name: agentSchema.shape.name,
  position: agentSchema.shape.position,
  bio: optionalLocalizedTextSchema,
  email: agentSchema.shape.email,
  phone: agentSchema.shape.phone,
  seo: agentSchema.shape.seo,
  slug: publishingFieldsSchema.shape.slug,
  status: publishingFieldsSchema.shape.status,
});

type AgentFormValues = z.infer<typeof agentFormSchema>;

const DEFAULT_VALUES: AgentFormValues = {
  name: "",
  position: "",
  bio: formLocalized(undefined),
  email: "",
  phone: "",
  seo: formSeo(undefined),
  slug: "",
  status: "draft",
};

function toFormValues(agent: Doc<"agents">): AgentFormValues {
  return {
    name: agent.name,
    position: agent.position ?? "",
    bio: formLocalized(agent.bio),
    email: agent.email,
    phone: agent.phone ?? "",
    seo: formSeo(agent.seo),
    slug: agent.publishing.slug,
    status: agent.publishing.status,
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

function localeHasCopy(name: string, bio: AgentFormValues["bio"], locale: FormLocale) {
  if (locale === "en") return Boolean(name.trim() || bio?.en?.trim());
  return Boolean(bio?.[locale]?.trim());
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

function LinkedAccount({ userId }: { userId: Doc<"agents">["userId"] }) {
  const linkedUser = useAuthedQuery(api.users.getById, userId ? { id: userId } : "skip");

  if (!userId) {
    return <p className="text-sm text-muted-foreground">No Clerk account is linked to this profile.</p>;
  }

  return (
    <p className="text-sm text-muted-foreground">
      {linkedUser === undefined ? "Loading…" : (linkedUser?.email ?? "Linked account not found.")}
    </p>
  );
}

type AgentFormProps = { mode: "edit"; agent: Doc<"agents"> } | { mode: "create" };

function AgentFormFields(props: AgentFormProps) {
  const router = useRouter();
  const unsaved = useUnsavedChanges();
  const formLocale = useFormLocale();
  const savedPhotos = useAuthedQuery(
    api.mediaItems.listByEntity,
    props.mode === "edit" ? { entityType: "agent", entityId: props.agent._id } : "skip",
  );
  const createAgent = useMutation(api.agents.create);
  const updateAgent = useMutation(api.agents.update);
  const createMediaItem = useMutation(api.mediaItems.create);
  const [pendingPhoto, setPendingPhoto] = useState<PendingMediaFile[]>([]);
  const [confirm, setConfirm] = useState<"publish" | "unpublish" | null>(null);
  const [saveIntent, setSaveIntent] = useState<"draft" | "published" | null>(null);
  const slugEdited = useRef(props.mode === "edit");
  const form = useForm<AgentFormValues>(
    props.mode === "edit"
      ? {
          resolver: zodResolver(agentFormSchema),
          defaultValues: toFormValues(props.agent),
          values: toFormValues(props.agent),
        }
      : { resolver: zodResolver(agentFormSchema), defaultValues: DEFAULT_VALUES },
  );

  const name = form.watch("name");
  const bio = form.watch("bio");
  const slug = form.watch("slug");
  const savedStatus = props.mode === "edit" ? props.agent.publishing.status : "draft";
  const photoCount = props.mode === "create" ? pendingPhoto.length : savedPhotos === undefined ? null : savedPhotos.length;
  const missingArabic = !localeHasCopy(name, bio, "ar");
  const missingTurkish = !localeHasCopy(name, bio, "tr");

  useEffect(() => {
    unsaved?.setDirty(form.formState.isDirty || pendingPhoto.length > 0);
  }, [form.formState.isDirty, pendingPhoto.length, unsaved]);

  useEffect(() => {
    if (slugEdited.current) return;
    const next = slugFromTitle(name);
    if (next && next !== slug) {
      form.setValue("slug", next, { shouldDirty: false, shouldValidate: true });
    }
  }, [form, slug, name]);

  function onInvalid(errors: FieldErrors<AgentFormValues>) {
    setSaveIntent(null);
    const path = firstErrorPath(errors);
    if (!path) return;
    formLocale?.setLocale(localeFromPath(path));
    if (path === "seo" || path.startsWith("seo.")) {
      document.getElementById("agent-seo")?.setAttribute("open", "");
    }
    void form.setFocus(path as Parameters<typeof form.setFocus>[0]);
    requestAnimationFrame(() => {
      document.querySelector("[aria-invalid='true'], .text-destructive")?.scrollIntoView({ block: "center" });
    });
  }

  async function onSubmit(values: AgentFormValues) {
    const payload = {
      name: values.name.trim(),
      position: values.position?.trim() ? values.position.trim() : undefined,
      bio: compactLocalized(values.bio),
      email: values.email.trim(),
      phone: values.phone?.trim() ? values.phone.trim() : undefined,
      seo: compactSeoFields(values.seo),
      slug: values.slug,
      status: values.status,
    };

    try {
      if (props.mode === "edit") {
        await updateAgent({ id: props.agent._id, ...payload });
        form.reset(form.getValues());
        unsaved?.setDirty(false);
        toast.success(values.status === "published" ? "Agent is live" : "Draft saved");
      } else {
        const id = await createAgent(payload);
        if (pendingPhoto.length > 0) {
          const results = await Promise.allSettled(
            pendingPhoto.map(async (pending) => {
              const uploaded = await uploadMediaFile(pending.file, "agent", id);
              await createMediaItem({ entityType: "agent", entityId: id, ...uploaded });
              URL.revokeObjectURL(pending.previewUrl);
            }),
          );
          const failedCount = results.filter((result) => result.status === "rejected").length;
          if (failedCount > 0) {
            toast.warning("Agent created, but the photo failed to upload — add it from the edit page.");
          } else {
            toast.success(values.status === "published" ? "Agent is live" : "Draft saved");
          }
        } else {
          toast.success(values.status === "published" ? "Agent is live" : "Draft saved");
        }
        unsaved?.setDirty(false);
        router.push(`/admin/agents/${id}`);
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      toast.error(
        detail && detail !== "Failed to save agent"
          ? detail
          : "Couldn't save this agent. Check the highlighted fields and try again.",
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

  const publicPath = slug ? `/en/agents/${slug}` : "/en/agents/…";
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
              en: localeHasCopy(name, bio, "en"),
              ar: localeHasCopy(name, bio, "ar"),
              tr: localeHasCopy(name, bio, "tr"),
            }}
          />
        </div>

        <AdminSection title="Agent" hint="Name and title stay in one language. Bio can be translated.">
          <div className="space-y-1">
            <Label htmlFor="agent-name">Name *</Label>
            <Input
              id="agent-name"
              autoComplete="off"
              placeholder="e.g. Jane Doe"
              {...form.register("name")}
            />
            <FieldError message={form.formState.errors.name?.message} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="agent-position">Position</Label>
            <Input
              id="agent-position"
              autoComplete="off"
              placeholder="e.g. Sales Manager"
              {...form.register("position")}
            />
            <FieldHint>Optional — shown on the public profile under the name.</FieldHint>
            <FieldError message={form.formState.errors.position?.message} />
          </div>
          <LocalizedTextField
            name="bio"
            label="Bio"
            multiline
            placeholder="A short bio highlighting the agent's experience…"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="agent-email">Email *</Label>
              <Input id="agent-email" type="email" autoComplete="off" placeholder="jane@example.com" {...form.register("email")} />
              <FieldHint>Shown on the public profile.</FieldHint>
              <FieldError message={form.formState.errors.email?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="agent-phone">Phone</Label>
              <Input id="agent-phone" type="tel" autoComplete="off" placeholder="+971 50 123 4567" {...form.register("phone")} />
              <FieldHint>Optional — shown on the public profile if provided.</FieldHint>
            </div>
          </div>
        </AdminSection>

        {props.mode === "edit" ? (
          <AdminSection title="Linked account" hint="Set when this profile is tied to a Clerk login. Not edited here.">
            <LinkedAccount userId={props.agent.userId} />
          </AdminSection>
        ) : null}

        <AdminSection
          title="Photo"
          hint={
            props.mode === "edit"
              ? "Public profile uses a 3:4 portrait. Uploads immediately — you'll frame head to shoulders before it saves."
              : "Public profile uses a 3:4 portrait. You'll frame head to shoulders; it uploads when you save."
          }
        >
          {props.mode === "edit" ? (
            <MediaUploader entityType="agent" entityId={props.agent._id} />
          ) : (
            <MediaPicker entityType="agent" value={pendingPhoto} onChange={setPendingPhoto} />
          )}
        </AdminSection>

        <AdminSection title="Publishing">
          <div className="space-y-1">
            <Label htmlFor="agent-slug">Slug *</Label>
            <Input
              id="agent-slug"
              placeholder="jane-doe…"
              autoComplete="off"
              spellCheck={false}
              translate="no"
              {...slugField}
              onChange={(event) => {
                slugEdited.current = true;
                void slugField.onChange(event);
              }}
            />
            <p className="font-mono text-xs text-muted-foreground" translate="no">
              {publicPath}
            </p>
            <FieldHint>Live URL for English. Arabic and Turkish use the same slug under /ar and /tr.</FieldHint>
            <FieldError message={form.formState.errors.slug?.message} />
          </div>
        </AdminSection>

        <AdminSection id="agent-seo" title="SEO" hint="Leave blank to fall back to the agent name and bio." collapsible>
          <SeoFieldsSection
            idPrefix="agent"
            titlePlaceholder="e.g. Jane Doe | QuickTalk Real Estate"
            descriptionPlaceholder="A search-engine-friendly summary…"
            canonicalPlaceholder="/agents/jane-doe"
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

      <AlertDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "unpublish" ? "Hide this agent?" : "Publish this agent?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "unpublish" ? (
                "It will be removed from the public catalog. You can publish it again later."
              ) : (
                <>
                  Live at {publicPath}. /ar and /tr use the same slug and fall back to English where a translation is blank.
                  {photoCount === 0 ? " No photo yet — the profile will go live without one." : null}
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

export function AgentForm(props: AgentFormProps) {
  return (
    <FormLocaleProvider>
      <AgentFormFields {...props} />
    </FormLocaleProvider>
  );
}
