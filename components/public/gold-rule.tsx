import { cn } from "@/lib/utils";

export function GoldRule({
  className,
  draw = false,
  origin = "start",
}: {
  className?: string;
  draw?: boolean;
  origin?: "start" | "center";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "h-px bg-secondary",
        draw && "qtre-gold-draw",
        draw && origin === "center" && "qtre-gold-draw-center",
        className,
      )}
    />
  );
}
