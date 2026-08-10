import { describe, expect, it } from "vitest";
import { userSchema } from "./users";
import { ROLES } from "../../convex/lib/roles";

describe("userSchema", () => {
  it("restricts role to the four Convex-defined roles", () => {
    for (const role of ROLES) {
      expect(userSchema.safeParse({ email: "a@b.com", name: "A", role }).success).toBe(true);
    }
    expect(userSchema.safeParse({ email: "a@b.com", name: "A", role: "superuser" }).success).toBe(false);
  });
});
