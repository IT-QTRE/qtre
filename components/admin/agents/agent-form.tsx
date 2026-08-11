"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { agentSchema } from "@/lib/validation/agents";
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

// One form serves both Create and Edit — see developer-form.tsx for the
// rationale. `userId` stays excluded here too — it's a read-only display
// (see LinkedAccount below), not editable from this form.
const agentFormSchema = z.object({
  name: agentSchema.shape.name,
  bio: agentSchema.shape.bio,
  email: agentSchema.shape.email,
  phone: agentSchema.shape.phone,
  seo: agentSchema.shape.seo,
  slug: publishingFieldsSchema.shape.slug,
  status: publishingFieldsSchema.shape.status,
});

type AgentFormValues = z.infer<typeof agentFormSchema>;

const DEFAULT_VALUES: AgentFormValues = {
  name: "",
  bio: undefined,
  email: "",
  phone: undefined,
  seo: undefined,
  slug: "",
  status: "draft",
};

function toFormValues(agent: Doc<"agents">): AgentFormValues {
  return {
    name: agent.name,
    bio: agent.bio,
    email: agent.email,
    phone: agent.phone,
    seo: agent.seo,
    slug: agent.publishing.slug,
    status: agent.publishing.status,
  };
}

function LinkedAccount({ userId }: { userId: Doc<"agents">["userId"] }) {
  const linkedUser = useQuery(api.users.getById, userId ? { id: userId } : "skip");

  if (!userId) {
    return <p className="text-sm text-muted-foreground">No linked account.</p>;
  }

  return (
    <p className="text-sm text-muted-foreground">
      {linkedUser === undefined ? "Loading…" : (linkedUser?.email ?? "Linked account not found.")}
    </p>
  );
}

type AgentFormProps = { mode: "edit"; agent: Doc<"agents"> } | { mode: "create" };

export function AgentForm(props: AgentFormProps) {
  const router = useRouter();
  const createAgent = useMutation(api.agents.create);
  const updateAgent = useMutation(api.agents.update);
  const createMediaItem = useMutation(api.mediaItems.create);
  const [pendingPhoto, setPendingPhoto] = useState<PendingMediaFile[]>([]);
  const form = useForm<AgentFormValues>(
    props.mode === "edit"
      ? { resolver: zodResolver(agentFormSchema), values: toFormValues(props.agent) }
      : { resolver: zodResolver(agentFormSchema), defaultValues: DEFAULT_VALUES },
  );

  async function onSubmit(values: AgentFormValues) {
    try {
      if (props.mode === "edit") {
        await updateAgent({ id: props.agent._id, ...values });
        toast.success("Agent saved");
      } else {
        const id = await createAgent(values);
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
            toast.warning(`Agent created, but the photo failed to upload — add it from the edit page.`);
          } else {
            toast.success("Agent created");
          }
        } else {
          toast.success("Agent created");
        }
        router.push(`/admin/agents/${id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save agent");
    }
  }

  return (
    <div className="space-y-8">
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="agent-name">Name *</Label>
            <Input id="agent-name" placeholder="e.g. Jane Doe" {...form.register("name")} />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <LocalizedTextField
            name="bio"
            label="Bio"
            multiline
            hint="Optional — shown on the public agent profile."
            placeholder="A short bio highlighting the agent's experience…"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="agent-slug">Slug *</Label>
              <Input id="agent-slug" placeholder="jane-doe" {...form.register("slug")} />
              <FieldHint>Used in the page URL. Lowercase letters, numbers, and dashes only.</FieldHint>
              {form.formState.errors.slug && <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="agent-email">Email *</Label>
              <Input id="agent-email" type="email" placeholder="jane@example.com" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="agent-phone">Phone</Label>
              <Input id="agent-phone" placeholder="+971 50 123 4567" {...form.register("phone")} />
              <FieldHint>Optional — shown on the public profile if provided.</FieldHint>
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

          {props.mode === "edit" && (
            <>
              <Separator />
              <div>
                <h2 className="text-sm font-medium text-muted-foreground">Linked account</h2>
                <LinkedAccount userId={props.agent.userId} />
              </div>
            </>
          )}

          <Separator />
          <h2 className="text-sm font-medium text-muted-foreground">SEO overrides</h2>
          <SeoFieldsSection
            idPrefix="agent"
            titlePlaceholder="e.g. Jane Doe | QuickTalk Real Estate"
            descriptionPlaceholder="A search-engine-friendly summary…"
            canonicalPlaceholder="/agents/jane-doe"
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? props.mode === "edit"
                  ? "Saving…"
                  : "Creating…"
                : props.mode === "edit"
                  ? "Save Changes"
                  : "Create Agent"}
            </Button>
          </div>
        </form>
      </FormProvider>

      <Separator />
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Photo</h2>
        {props.mode === "edit" ? (
          <MediaUploader entityType="agent" entityId={props.agent._id} />
        ) : (
          <MediaPicker entityType="agent" value={pendingPhoto} onChange={setPendingPhoto} />
        )}
      </div>
    </div>
  );
}
