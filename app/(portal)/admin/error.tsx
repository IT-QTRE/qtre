"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

// Convex throws (e.g. a `ForbiddenError` from `requireRole`, including the
// dynamic Admin-access override in websiteSettings.disabledAdminResources)
// surface here as an uncaught render error — Convex's own docs recommend
// wrapping `useQuery` consumers in an Error Boundary for this reason. Nav
// already hides restricted tabs, but this catches direct URL navigation or
// a tab left open when a Super Admin disables it mid-session.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const isForbidden =
    error.name === "ForbiddenError" ||
    /forbidden|disabled for admin|not authenticated/i.test(error.message);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <ShieldAlert className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{isForbidden ? "Access Restricted" : "Something went wrong"}</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {isForbidden
            ? "You don't have access to this page. If you believe this is a mistake, contact your Super Admin."
            : "An unexpected error occurred while loading this page."}
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => reset()}>
          Try again
        </Button>
        <Button render={<Link href="/admin" />} nativeButton={false}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
