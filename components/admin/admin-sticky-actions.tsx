"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAdminFooterSlot } from "@/components/admin/admin-workspace";

const STICKY_BUTTON = "min-h-11 touch-manipulation";

export function AdminStickyActions({
  disabled,
  draftLabel,
  publishLabel,
  onCancel,
  onSaveDraft,
  onPublish,
}: {
  disabled: boolean;
  draftLabel?: ReactNode;
  publishLabel: ReactNode;
  onCancel: () => void;
  onSaveDraft?: () => void;
  onPublish: () => void;
}) {
  const slot = useAdminFooterSlot();
  const hasDraft = onSaveDraft != null;

  const bar = (
    <div className="border-t border-border bg-background px-6 py-3 md:px-8 md:py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <Button type="button" variant="outline" className={cn(STICKY_BUTTON, "w-full sm:w-auto")} onClick={onCancel}>
          Cancel
        </Button>
        <div className={cn(hasDraft ? "grid grid-cols-2 gap-2 sm:flex sm:w-auto sm:justify-end" : "sm:flex sm:justify-end")}>
          {hasDraft ? (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(STICKY_BUTTON, "w-full sm:min-w-28")}
              onClick={onSaveDraft}
            >
              {draftLabel}
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={disabled}
            className={cn(STICKY_BUTTON, "w-full sm:min-w-28")}
            onClick={onPublish}
          >
            {publishLabel}
          </Button>
        </div>
      </div>
    </div>
  );

  if (!slot) return null;
  return createPortal(bar, slot);
}
