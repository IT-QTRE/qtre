/** Strip everything except digits. Used so a display value like `1,200,000` can round-trip to the form's numeric string. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Group a digit string with commas (`1200000` → `1,200,000`). Empty stays empty. */
export function formatGroupedDigits(digits: string): string {
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** Map a caret position counted in digits onto the formatted display string. */
export function caretInFormatted(digitsBeforeCaret: number, formatted: string): number {
  if (digitsBeforeCaret <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index++) {
    if (formatted[index] >= "0" && formatted[index] <= "9") {
      seen += 1;
      if (seen === digitsBeforeCaret) return index + 1;
    }
  }
  return formatted.length;
}
