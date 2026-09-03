import { describe, expect, it } from "vitest";
import {
  desksInGroup,
  getServiceDesk,
  SERVICE_DESKS,
  serviceDeskPath,
} from "./service-desks";

describe("service desks", () => {
  it("resolves residence and rejects unknown slugs", () => {
    expect(getServiceDesk("visa", "residence")?.dossier).toBe("residence");
    expect(getServiceDesk("visa", "dependent")?.dossier).toBe("dependent");
    expect(getServiceDesk("visa", "remote-work")?.dossier).toBe("remote-work");
    expect(getServiceDesk("visa", "golden")?.dossier).toBe("golden");
    expect(getServiceDesk("visa", "freelance")?.dossier).toBe("freelance");
    expect(getServiceDesk("license", "renewal")?.dossier).toBe("renewal");
    expect(getServiceDesk("license", "modification")?.dossier).toBe("modification");
    expect(getServiceDesk("license", "cancellation")?.dossier).toBe("cancellation");
    expect(getServiceDesk("license", "freezing")?.dossier).toBe("freezing");
    expect(getServiceDesk("visa", "tabs")).toBeNull();
    expect(getServiceDesk("company", "residence")).toBeNull();
  });

  it("keeps visa and license lists in nav order", () => {
    expect(desksInGroup("visa").map((desk) => desk.slug)).toEqual([
      "residence",
      "dependent",
      "remote-work",
      "golden",
      "freelance",
    ]);
    expect(desksInGroup("license").map((desk) => desk.slug)).toEqual([
      "renewal",
      "modification",
      "cancellation",
      "freezing",
    ]);
  });

  it("builds dedicated URLs, not tab queries", () => {
    expect(serviceDeskPath({ group: "visa", slug: "residence" })).toBe("/services/visa/residence");
    expect(SERVICE_DESKS.every((desk) => serviceDeskPath(desk).includes("?"))).toBe(false);
  });
});
