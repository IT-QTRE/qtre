import { describe, expect, it } from "vitest";
import { safeGhlChatWidgetId } from "./ghl-chat-widget-id";

const SAMPLE_ID = "6a9fad037e179c4b66ba50e7";

describe("safeGhlChatWidgetId", () => {
  it("accepts a bare widget ID", () => {
    expect(safeGhlChatWidgetId(SAMPLE_ID)).toBe(SAMPLE_ID);
  });

  it("extracts data-widget-id from a GHL loader snippet", () => {
    const snippet = `<script src="https://widgets.leadconnectorhq.com/loader.js" data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js" data-widget-id="${SAMPLE_ID}"></script>`;
    expect(safeGhlChatWidgetId(snippet)).toBe(SAMPLE_ID);
  });

  it("rejects empty, URLs, and junk", () => {
    expect(safeGhlChatWidgetId("")).toBeNull();
    expect(safeGhlChatWidgetId(undefined)).toBeNull();
    expect(safeGhlChatWidgetId("https://widgets.leadconnectorhq.com/loader.js")).toBeNull();
    expect(safeGhlChatWidgetId("javascript:alert(1)")).toBeNull();
    expect(safeGhlChatWidgetId("short")).toBeNull();
  });
});
