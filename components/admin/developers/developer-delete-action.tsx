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

type DeveloperDeleteActionProps = {
  developerId: Id<"developers">;
  developerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Fully controlled by the caller (see `useRowMenuDelete`), which only flips
// `open` to true once the row's "..." menu has confirmed — via Base UI's
// `onOpenChangeComplete` — that it has completely finished closing. Opening
// this dialog any earlier races with the menu's own close/focus-restoration
// handling and can get it dismissed before it's interactable.
export function DeveloperDeleteAction({ developerId, developerName, open, onOpenChange }: DeveloperDeleteActionProps) {
  const removeDeveloper = useMutation(api.developers.remove);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {developerName}?</AlertDialogTitle>
          <AlertDialogDescription>This permanently removes the developer profile. This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={async () => {
              try {
                await removeDeveloper({ id: developerId });
                toast.success("Developer deleted");
                onOpenChange(false);
              } catch (error) {
                // Keep the dialog open on failure (e.g. blocked by the
                // referential-integrity guard) so the error toast is
                // actually readable instead of the whole dialog vanishing
                // at the same instant, which looked like the delete
                // silently failed with no explanation.
                toast.error(error instanceof Error ? error.message : "Failed to delete developer");
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
