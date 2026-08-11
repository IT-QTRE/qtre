"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { formatDate } from "@/lib/format/date";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type LeadEditFormProps = { lead: Doc<"leads"> };

const leadEditSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "closed"]),
  assignedAgentId: z.string().optional(),
});
type LeadEditValues = z.infer<typeof leadEditSchema>;

function toFormValues(lead: Doc<"leads">): LeadEditValues {
  return { status: lead.status, assignedAgentId: lead.assignedAgentId };
}

// A `Select` needs a non-empty string to show its placeholder correctly for
// an unset optional relation — `""` (rather than `undefined`) is what we
// feed its `value` prop, then translated back to `undefined` on submit.
function OptionalRelationSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string | undefined;
  onChange: (value: string | null) => void;
  placeholder: string;
  options: { id: string; label: string }[];
}) {
  return (
    <Select value={value ?? ""} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
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
  // `getName` (rather than `get`) — a lead can point at any Admin's
  // property/project, and Properties/Projects are otherwise Admin-scoped.
  const property = useQuery(api.properties.getName, lead.propertyId ? { id: lead.propertyId } : "skip");
  const project = useQuery(api.projects.getName, lead.projectId ? { id: lead.projectId } : "skip");

  if (lead.propertyId) {
    if (property === undefined) return <span className="text-muted-foreground">Loading…</span>;
    if (property === null) return <span className="text-muted-foreground">Deleted property</span>;
    return <span>{property.title}</span>;
  }

  if (lead.projectId) {
    if (project === undefined) return <span className="text-muted-foreground">Loading…</span>;
    if (project === null) return <span className="text-muted-foreground">Deleted project</span>;
    return <span>{project.title}</span>;
  }

  return <span className="text-muted-foreground">General inquiry</span>;
}

export function LeadEditForm({ lead }: LeadEditFormProps) {
  const agents = useQuery(api.agents.list) ?? [];
  const agentOptions = agents.map((agent) => ({ id: agent._id, label: agent.name }));
  // The assigned agent may have been deleted since this lead was last
  // assigned — surface that explicitly instead of letting the Select
  // silently show as empty/unset while the orphaned id is still stored.
  if (lead.assignedAgentId && !agentOptions.some((option) => option.id === lead.assignedAgentId)) {
    agentOptions.unshift({ id: lead.assignedAgentId, label: "Deleted agent" });
  }
  const updateLead = useMutation(api.leads.update);
  const form = useForm<LeadEditValues>({
    resolver: zodResolver(leadEditSchema),
    values: toFormValues(lead),
  });

  async function onSubmit(values: LeadEditValues) {
    try {
      await updateLead({
        id: lead._id,
        status: values.status,
        assignedAgentId: values.assignedAgentId ? (values.assignedAgentId as Id<"agents">) : undefined,
      });
      toast.success("Lead updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update lead");
    }
  }

  return (
    <div className="space-y-8">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">Name</dt>
          <dd className="text-sm">{lead.name}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">Email</dt>
          <dd className="text-sm">{lead.email}</dd>
        </div>
        {lead.phone ? (
          <div className="space-y-1">
            <dt className="text-sm font-medium text-muted-foreground">Phone</dt>
            <dd className="text-sm">{lead.phone}</dd>
          </div>
        ) : null}
        {lead.message ? (
          <div className="space-y-1 sm:col-span-2">
            <dt className="text-sm font-medium text-muted-foreground">Message</dt>
            <dd>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.message}</p>
            </dd>
          </div>
        ) : null}
        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">Regarding</dt>
          <dd className="text-sm">
            <RegardingValue lead={lead} />
          </dd>
        </div>
        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">Submitted</dt>
          <dd className="text-sm text-muted-foreground">{formatDate(lead._creationTime)}</dd>
        </div>
      </dl>

      <Separator />

      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label>Assigned Agent</Label>
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

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
