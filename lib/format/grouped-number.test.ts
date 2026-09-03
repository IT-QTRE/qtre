import { describe, expect, it } from "vitest";
import { caretInFormatted, digitsOnly, formatGroupedDigits } from "./grouped-number";

describe("formatGroupedDigits", () => {
  it("groups thousands with commas", () => {
    expect(formatGroupedDigits("1200000")).toBe("1,200,000");
    expect(formatGroupedDigits("500")).toBe("500");
    expect(formatGroupedDigits("")).toBe("");
  });
});

describe("digitsOnly", () => {
  it("strips commas and other non-digits", () => {
    expect(digitsOnly("1,200,000")).toBe("1200000");
    expect(digitsOnly("AED 1,200")).toBe("1200");
  });
});

describe("caretInFormatted", () => {
  it("keeps the caret after the same digit when commas are inserted", () => {
    expect(caretInFormatted(4, "1,200,000")).toBe(5);
    expect(caretInFormatted(1, "1,200,000")).toBe(1);
    expect(caretInFormatted(7, "1,200,000")).toBe(9);
  });
});
