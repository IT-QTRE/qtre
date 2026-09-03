"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { ADMIN_TOGGLEABLE_RESOURCES, type ToggleableResource } from "@/convex/lib/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const RESOURCE_LABELS: Record<ToggleableResource, string> = {
  properties: "Properties",
  projects: "Projects",
  developers: "Developers",
  agents: "Agents",
  communities: "Communities",
  leads: "Leads",
  blogPosts: "Blog",
  mediaItems: "Media Library",
  users: "Users & Roles",
  websiteSettings: "Website Settings",
  auditLogs: "Audit Logs",
};

function toToggleableSet(resources: string[] | undefined): Set<ToggleableResource> {
  return new Set(
    (resources ?? []).filter((resource): resource is ToggleableResource =>
      (ADMIN_TOGGLEABLE_RESOURCES as readonly string[]).includes(resource),
    ),
  );
}

// Super Admin only — this dialog is only ever rendered for rows where
// `user.role === "admin"` (see user-list.tsx), and `updateResourceAccess`
// independently enforces the same super_admin-only + admin-target-only
// rule server-side regardless of what the client renders.
export function ManageAccessDialog({ user }: { user: Doc<"users"> }) {
  const updateResourceAccess = useMutation(api.users.updateResourceAccess);
  const [open, setOpen] = useState(false);
  const [disabled, setDisabled] = useState<Set<ToggleableResource>>(() => toToggleableSet(user.disabledResources));
  const [isSaving, setIsSaving] = useState(false);

  function toggle(resource: ToggleableResource) {
    setDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(resource)) {
        next.delete(resource);
      } else {
        next.add(resource);
      }
      return next;
    });
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await updateResourceAccess({ id: user._id, disabledResources: Array.from(disabled) });
      toast.success(`Access updated for ${user.name}`);
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update access");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDisabled(toToggleableSet(user.disabledResources));
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" className="min-h-11 touch-manipulation" />}>
        <ShieldCheck className="size-4" aria-hidden />
        Manage Access
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Access — {user.name}</DialogTitle>
          <DialogDescription>
            Choose which sections this Admin account can see and use. This never affects Super Admin.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ADMIN_TOGGLEABLE_RESOURCES.map((resource) => {
            const isEnabled = !disabled.has(resource);
            return (
              <button
                key={resource}
                type="button"
                aria-pressed={isEnabled}
                onClick={() => toggle(resource)}
                className={cn(
                  "flex min-h-11 items-center justify-between border p-3 text-left text-sm transition-colors hover:bg-muted/50",
                  !isEnabled && "border-destructive/30 bg-destructive/5",
                )}
              >
                <span>{RESOURCE_LABELS[resource]}</span>
                <Badge variant={isEnabled ? "secondary" : "outline"}>{isEnabled ? "Enabled" : "Disabled"}</Badge>
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <DialogClose disabled={isSaving} render={<Button variant="outline" className="min-h-11" />}>
            Cancel
          </DialogClose>
          <Button className="min-h-11" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
