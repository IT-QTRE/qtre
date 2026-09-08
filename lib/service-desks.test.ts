import { describe, expect, it } from "vitest";
import { SERVICE_DESK_KEYS } from "../convex/lib/serviceDesks";
import { SERVICE_DESKS, serviceDeskAdminLabel } from "./service-desks";

describe("service desks", () => {
  it("keeps Convex keys in lockstep with the public catalog", () => {
    const publicKeys = SERVICE_DESKS.map((desk) => `${desk.group}/${desk.slug}`).toSorted();
    const convexKeys = SERVICE_DESK_KEYS.map((desk) => `${desk.group}/${desk.desk}`).toSorted();
    expect(convexKeys).toEqual(publicKeys);
  });

  it("labels known desks in English for admin", () => {
    expect(serviceDeskAdminLabel("visa", "golden")).toBe("Golden Visa");
    expect(serviceDeskAdminLabel("license", "renewal")).toBe("License renewal");
  });
});
