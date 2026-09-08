"use client";

import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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

type ServiceLeadDeleteActionProps = {
  leadId: Id<"serviceLeads">;
  leadName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ServiceLeadDeleteAction({ leadId, leadName, open, onOpenChange }: ServiceLeadDeleteActionProps) {
  const removeLead = useMutation(api.serviceLeads.remove);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this inquiry?</AlertDialogTitle>
          <AlertDialogDescription>
            {leadName}&apos;s visa or license inquiry will be removed. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={async () => {
              try {
                await removeLead({ id: leadId });
                toast.success("Inquiry deleted");
                onOpenChange(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to delete inquiry");
              }
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
