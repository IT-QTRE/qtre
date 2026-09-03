"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { BackLink } from "@/components/admin/back-link";

type UnsavedChangesContextValue = {
  setDirty: (dirty: boolean) => void;
  requestLeave: (href: string) => void;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(null);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const requestLeave = useCallback(
    (href: string) => {
      if (!dirty) {
        router.push(href);
        return;
      }
      setPendingHref(href);
    },
    [dirty, router],
  );

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  return (
    <UnsavedChangesContext.Provider value={{ setDirty, requestLeave }}>
      {children}
      <AlertDialog open={pendingHref !== null} onOpenChange={(open) => { if (!open) setPendingHref(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>Edits on this page will be lost.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="grid grid-cols-1 sm:grid sm:grid-cols-2">
            <AlertDialogCancel className="min-h-11 w-full sm:min-w-0">Keep editing</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="min-h-11 w-full sm:min-w-0"
              onClick={() => {
                if (!pendingHref) return;
                const href = pendingHref;
                setPendingHref(null);
                setDirty(false);
                router.push(href);
              }}
            >
              Discard edits
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext);
}

export function GuardedBackLink({ href, label }: { href: string; label: string }) {
  const unsaved = useUnsavedChanges();
  if (!unsaved) {
    return <BackLink href={href} label={label} />;
  }
  return (
    <Button
      type="button"
      variant="ghost"
      className="-ms-3 mb-2 min-h-11 px-3 text-muted-foreground"
      onClick={() => unsaved.requestLeave(href)}
    >
      <ArrowLeft className="size-4" aria-hidden />
      {label}
    </Button>
  );
}
