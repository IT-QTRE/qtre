"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { caretInFormatted, digitsOnly, formatGroupedDigits } from "@/lib/format/grouped-number";

export function FormattedNumberInput({
  id,
  value,
  onChange,
  placeholder,
  prefix,
  invalid,
}: {
  id?: string;
  /** Digit string stored on the form (`1200000`), not the displayed `1,200,000`. */
  value: string;
  onChange: (digits: string) => void;
  placeholder?: string;
  prefix?: string;
  invalid?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<number | null>(null);
  const display = formatGroupedDigits(value);

  useLayoutEffect(() => {
    const node = inputRef.current;
    const caret = caretRef.current;
    if (!node || caret == null) return;
    node.setSelectionRange(caret, caret);
    caretRef.current = null;
  }, [display]);

  return (
    <div className="relative">
      {prefix ? (
        <span className="pointer-events-none absolute inset-y-0 start-3 z-10 flex items-center text-sm text-muted-foreground">
          {prefix}
        </span>
      ) : null}
      <Input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        className={cn(prefix ? "ps-14" : undefined, "tabular-nums")}
        value={display}
        onChange={(event) => {
          const next = event.target.value;
          const caret = event.target.selectionStart ?? next.length;
          const digits = digitsOnly(next);
          caretRef.current = caretInFormatted(digitsOnly(next.slice(0, caret)).length, formatGroupedDigits(digits));
          onChange(digits);
        }}
      />
    </div>
  );
}
