import { describe, expect, it } from "vitest";
import { localizedTextValidator } from "./localizedText";

describe("localizedTextValidator", () => {
  it("requires an `en` field and allows optional `ar`/`tr`", () => {
    expect(Object.keys(localizedTextValidator.fields).sort()).toEqual(["ar", "en", "tr"]);
    expect(localizedTextValidator.fields.en.isOptional).toBe("required");
    expect(localizedTextValidator.fields.ar.isOptional).toBe("optional");
    expect(localizedTextValidator.fields.tr.isOptional).toBe("optional");
  });
});
