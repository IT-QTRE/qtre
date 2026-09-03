"use client";

import { motion, useReducedMotion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

export function IntentMark({ layoutId, selected }: { layoutId: string; selected: boolean }) {
  const reduced = useReducedMotion() ?? false;
  if (!selected) return null;
  if (reduced) {
    return <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" aria-hidden />;
  }
  return (
    <motion.span
      layoutId={layoutId}
      className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
      transition={{ duration: 0.28, ease }}
      aria-hidden
    />
  );
}
