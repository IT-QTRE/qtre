import { describe, expect, it } from "vitest";
import { whatsappHref } from "./whatsapp-href";

describe("whatsappHref", () => {
  it("builds wa.me from an international number", () => {
    expect(whatsappHref("+971 50 123 4567")).toBe("https://wa.me/971501234567");
  });

  it("accepts official WhatsApp https URLs", () => {
    expect(whatsappHref("https://wa.me/971501234567")).toBe("https://wa.me/971501234567");
  });

  it("rejects empty, http, and other hosts", () => {
    expect(whatsappHref("")).toBeNull();
    expect(whatsappHref("http://wa.me/971501234567")).toBeNull();
    expect(whatsappHref("https://evil.example/wa")).toBeNull();
    expect(whatsappHref("123")).toBeNull();
  });

  it("appends a prefilled text query", () => {
    expect(whatsappHref("+971 50 123 4567", "Hello, QTRE")).toBe(
      "https://wa.me/971501234567?text=Hello%2C+QTRE",
    );
  });
});
