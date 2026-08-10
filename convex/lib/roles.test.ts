import { describe, expect, it } from "vitest";
import { PERMISSION_MATRIX, RESOURCES, ROLES, can } from "./roles";

describe("PERMISSION_MATRIX", () => {
  it("has an entry for every role and every resource", () => {
    for (const role of ROLES) {
      for (const resource of RESOURCES) {
        expect(PERMISSION_MATRIX[role][resource]).toBeInstanceOf(Array);
      }
    }
  });

  it("gives super_admin full access to every resource except read-only auditLogs", () => {
    for (const resource of RESOURCES) {
      const actions = PERMISSION_MATRIX.super_admin[resource];
      if (resource === "auditLogs") {
        expect(actions).toEqual(["read"]);
      } else {
        expect(actions).toEqual(["read", "create", "update", "delete"]);
      }
    }
  });

  it("gives client no access to properties directly, only their own submissions", () => {
    expect(PERMISSION_MATRIX.client.properties).toEqual([]);
    expect(PERMISSION_MATRIX.client.propertySubmissions).toEqual(["read", "create", "update"]);
  });

  it("gives agent read/update on properties and leads but no delete", () => {
    expect(PERMISSION_MATRIX.agent.properties).toEqual(["read", "update"]);
    expect(PERMISSION_MATRIX.agent.leads).toEqual(["read", "update"]);
  });
});

describe("can", () => {
  it("checks the matrix for a given role/resource/action", () => {
    expect(can("admin", "properties", "delete")).toBe(true);
    expect(can("client", "properties", "delete")).toBe(false);
  });
});
