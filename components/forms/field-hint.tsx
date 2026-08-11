// Shared helper-text slot for form fields — same position/spacing as the
// error-message `<p>` every form already renders, so a hint and an error
// never fight for the same line (the hint is static guidance; the error,
// when present, is more urgent and rendered separately, below this).
export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>;
}
