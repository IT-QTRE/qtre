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

type AgentDeleteActionProps = {
  agentId: Id<"agents">;
  agentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Fully controlled by the caller (see `useRowMenuDelete`), which only flips
// `open` to true once the row's "..." menu has confirmed — via Base UI's
// `onOpenChangeComplete` — that it has completely finished closing. Opening
// this dialog any earlier races with the menu's own close/focus-restoration
// handling and can get it dismissed before it's interactable.
export function AgentDeleteAction({ agentId, agentName, open, onOpenChange }: AgentDeleteActionProps) {
  const removeAgent = useMutation(api.agents.remove);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {agentName}?</AlertDialogTitle>
          <AlertDialogDescription>This permanently removes the agent profile. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={async () => {
              try {
                await removeAgent({ id: agentId });
                toast.success("Agent deleted");
                onOpenChange(false);
              } catch (error) {
                // Keep the dialog open on failure so the error toast is
                // actually readable instead of the whole dialog vanishing
                // at the same instant.
                toast.error(error instanceof Error ? error.message : "Failed to delete agent");
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
