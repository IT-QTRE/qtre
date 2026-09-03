import { describe, expect, it } from "vitest";
import { completionYearOptions, formatCompletionDate, parseCompletionDate } from "./completion-date";

describe("formatCompletionDate", () => {
  it("formats the portal quarter style in each locale", () => {
    const date = { quarter: 4 as const, year: 2027 };
    expect(formatCompletionDate(date, "en")).toBe("Q4 2027");
    expect(formatCompletionDate(date, "tr")).toBe("2027 4. çeyrek");
    expect(formatCompletionDate(date, "ar")).toBe("الربع الرابع 2027");
  });
});

describe("parseCompletionDate", () => {
  it("requires both quarter and year", () => {
    expect(parseCompletionDate("4", "2027")).toEqual({ quarter: 4, year: 2027 });
    expect(parseCompletionDate("4", "")).toBeUndefined();
    expect(parseCompletionDate("", "2027")).toBeUndefined();
  });
});

describe("completionYearOptions", () => {
  it("keeps a stored year that sits outside the default window", () => {
    const years = completionYearOptions(new Date("2026-08-24"), 2023);
    expect(years[0]).toBe(2023);
    expect(years).toContain(2026);
    expect(years).toContain(2041);
  });
});
