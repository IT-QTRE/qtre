"use client";

import { useEffect } from "react";
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
import { serviceLeadRegarding } from "./service-lead-list";

const LIST_HREF = "/admin/service-leads";
const NONE_VALUE = "__none__";

const STATUS_LABEL = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  closed: "Closed",
} as const;

type ServiceLeadEditFormProps = { lead: Doc<"serviceLeads"> };

const editSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "closed"]),
  assignedUserId: z.string().optional(),
});
type EditValues = z.infer<typeof editSchema>;

function toFormValues(lead: Doc<"serviceLeads">): EditValues {
  return { status: lead.status, assignedUserId: lead.assignedUserId ?? "" };
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

export function ServiceLeadEditForm({ lead }: ServiceLeadEditFormProps) {
  const router = useRouter();
  const unsaved = useUnsavedChanges();
  const assignees = useAuthedQuery(api.serviceLeads.listAssignees, {}) ?? [];
  const assigneeOptions = assignees.map((user) => ({
    id: user._id,
    label: user.name || user.email,
  }));
  if (lead.assignedUserId && !assigneeOptions.some((option) => option.id === lead.assignedUserId)) {
    assigneeOptions.unshift({ id: lead.assignedUserId, label: "Deleted admin" });
  }
  const updateLead = useMutation(api.serviceLeads.update);
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: toFormValues(lead),
    values: toFormValues(lead),
  });

  useEffect(() => {
    unsaved?.setDirty(form.formState.isDirty);
  }, [form.formState.isDirty, unsaved]);

  async function onSubmit(values: EditValues) {
    try {
      await updateLead({
        id: lead._id,
        status: values.status,
        assignedUserId: values.assignedUserId ? (values.assignedUserId as Id<"users">) : undefined,
      });
      unsaved?.setDirty(false);
      toast.success("Inquiry updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update inquiry");
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
              <dt className="text-xs font-medium text-muted-foreground">Desk</dt>
              <dd className="text-sm">{serviceLeadRegarding(lead)}</dd>
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

        <AdminSection title="Follow-up" hint="Status and which Admin owns the conversation.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="service-lead-status">Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="service-lead-status" className="w-full">
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
              <Label>Assigned admin</Label>
              <Controller
                control={form.control}
                name="assignedUserId"
                render={({ field }) => (
                  <OptionalRelationSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Unassigned"
                    options={assigneeOptions}
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
