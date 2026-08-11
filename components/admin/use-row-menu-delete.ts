"use client";

import { useRef, useState } from "react";

/**
 * Coordinates a row's "..." actions menu with a delete-confirmation dialog
 * triggered from one of its items.
 *
 * Opening the confirmation dialog synchronously (or even on the next tick)
 * from the menu item's `onClick` races with Base UI's Menu close/focus-
 * restoration handling: the menu's own closing animation and focus
 * restoration can run *after* that tick and steal focus/dismiss the
 * freshly-opened dialog. `onOpenChangeComplete` is the menu's own
 * deterministic "I have fully finished closing, animation included" signal,
 * so gating the dialog open on that event — instead of a timeout guess —
 * can't race no matter how long the menu's close transition takes.
 */
export function useRowMenuDelete() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pendingDeleteRef = useRef(false);

  function requestDelete() {
    pendingDeleteRef.current = true;
    setMenuOpen(false);
  }

  function onMenuOpenChangeComplete(open: boolean) {
    if (!open && pendingDeleteRef.current) {
      pendingDeleteRef.current = false;
      setConfirmOpen(true);
    }
  }

  return {
    menuOpen,
    setMenuOpen,
    confirmOpen,
    setConfirmOpen,
    requestDelete,
    onMenuOpenChangeComplete,
  };
}
