"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { formatDate } from "@/lib/format/date";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminSection } from "@/components/admin/admin-section";
import { AdminStickyActions } from "@/components/admin/admin-sticky-actions";
import { useUnsavedChanges } from "@/components/admin/unsaved-changes";
import { useAuthedQuery } from "@/components/admin/use-authed-query";

const LIST_HREF = "/admin/leads";
const NONE_VALUE = "__none__";

const STATUS_LABEL = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  closed: "Closed",
} as const;

type LeadEditFormProps = { lead: Doc<"leads"> };

const leadEditSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "closed"]),
  assignedAgentId: z.string().optional(),
});
type LeadEditValues = z.infer<typeof leadEditSchema>;

function toFormValues(lead: Doc<"leads">): LeadEditValues {
  return { status: lead.status, assignedAgentId: lead.assignedAgentId ?? "" };
}

function OptionalRelationSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder: string;
  options: { id: string; label: string }[];
}) {
  return (
    <Select value={value || NONE_VALUE} onValueChange={(next) => onChange(!next || next === NONE_VALUE ? "" : next)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RegardingValue({ lead }: { lead: Doc<"leads"> }) {
  const property = useAuthedQuery(api.properties.getName, lead.propertyId ? { id: lead.propertyId } : "skip");
  const project = useAuthedQuery(api.projects.getName, lead.projectId ? { id: lead.projectId } : "skip");

  if (lead.propertyId) {
    if (property === undefined) return <span className="text-muted-foreground">Loading…</span>;
    if (property === null) return <span className="text-muted-foreground">Deleted property</span>;
    return (
      <Link href={`/admin/properties/${property._id}`} className="underline-offset-4 hover:underline">
        {property.title}
      </Link>
    );
  }

  if (lead.projectId) {
    if (project === undefined) return <span className="text-muted-foreground">Loading…</span>;
    if (project === null) return <span className="text-muted-foreground">Deleted project</span>;
    return (
      <Link href={`/admin/projects/${project._id}`} className="underline-offset-4 hover:underline">
        {project.title}
      </Link>
    );
  }

  return <span className="text-muted-foreground">General inquiry</span>;
}

export function LeadEditForm({ lead }: LeadEditFormProps) {
  const router = useRouter();
  const unsaved = useUnsavedChanges();
  const agents = useAuthedQuery(api.agents.list, {}) ?? [];
  const agentOptions = agents.map((agent) => ({ id: agent._id, label: agent.name }));
  if (lead.assignedAgentId && !agentOptions.some((option) => option.id === lead.assignedAgentId)) {
    agentOptions.unshift({ id: lead.assignedAgentId, label: "Deleted agent" });
  }
  const updateLead = useMutation(api.leads.update);
  const form = useForm<LeadEditValues>({
    resolver: zodResolver(leadEditSchema),
    defaultValues: toFormValues(lead),
    values: toFormValues(lead),
  });

  useEffect(() => {
    unsaved?.setDirty(form.formState.isDirty);
  }, [form.formState.isDirty, unsaved]);

  async function onSubmit(values: LeadEditValues) {
    try {
      await updateLead({
        id: lead._id,
        status: values.status,
        assignedAgentId: values.assignedAgentId ? (values.assignedAgentId as Id<"agents">) : undefined,
      });
      unsaved?.setDirty(false);
      toast.success("Lead updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update lead");
    }
  }

  return (
    <FormProvider {...form}>
      <form
        autoComplete="off"
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit(onSubmit)();
        }}
        className="flex flex-col gap-4"
      >
        <AdminSection title="Inquiry" hint="What they sent. These fields cannot be edited.">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">Name</dt>
              <dd className="text-sm">{lead.name}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">Email</dt>
              <dd className="text-sm">
                <a href={`mailto:${lead.email}`} className="underline-offset-4 hover:underline">
                  {lead.email}
                </a>
              </dd>
            </div>
            {lead.phone ? (
              <div className="space-y-1">
                <dt className="text-xs font-medium text-muted-foreground">Phone</dt>
                <dd className="text-sm">
                  <a href={`tel:${lead.phone}`} className="underline-offset-4 hover:underline">
                    {lead.phone}
                  </a>
                </dd>
              </div>
            ) : null}
            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">Regarding</dt>
              <dd className="text-sm">
                <RegardingValue lead={lead} />
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium text-muted-foreground">Submitted</dt>
              <dd className="text-sm text-muted-foreground">{formatDate(lead._creationTime)}</dd>
            </div>
            {lead.message ? (
              <div className="space-y-1 sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Message</dt>
                <dd>
                  <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
                </dd>
              </div>
            ) : null}
          </dl>
        </AdminSection>

        <AdminSection title="Follow-up" hint="Status and who owns the conversation.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="lead-status">Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="lead-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(STATUS_LABEL) as Array<keyof typeof STATUS_LABEL>).map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>Assigned agent</Label>
              <Controller
                control={form.control}
                name="assignedAgentId"
                render={({ field }) => (
                  <OptionalRelationSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Unassigned"
                    options={agentOptions}
                  />
                )}
              />
            </div>
          </div>
        </AdminSection>

        <AdminStickyActions
          disabled={form.formState.isSubmitting}
          publishLabel={form.formState.isSubmitting ? "Saving…" : "Save"}
          onCancel={() => {
            if (unsaved) unsaved.requestLeave(LIST_HREF);
            else router.push(LIST_HREF);
          }}
          onPublish={() => void form.handleSubmit(onSubmit)()}
        />
      </form>
    </FormProvider>
  );
}
