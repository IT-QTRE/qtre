"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteAgentDialog() {
  const inviteAgent = useAction(api.agentInvitations.inviteAgent);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && !isSubmitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await inviteAgent({ email: trimmed });
      toast.success("Invitation sent");
      setEmail("");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setEmail("");
        }
      }}
    >
      <DialogTrigger render={<Button />}>
        <UserPlus className="size-4" />
        Invite Agent
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <DialogHeader>
            <DialogTitle>Invite Agent</DialogTitle>
            <DialogDescription>
              Send a Clerk invitation email. The invitee will join with the Agent role.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="invite-agent-email">Email address</Label>
            <Input
              id="invite-agent-email"
              type="email"
              autoComplete="email"
              placeholder="agent@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <DialogFooter>
            <DialogClose disabled={isSubmitting} render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "Sending…" : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
