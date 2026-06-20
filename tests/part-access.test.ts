import { describe, expect, it } from "vitest";
import {
  canAccessSalesPart,
  getAllowedSalesPartsForRole,
  parseManagedPartCodes,
  supportedSalesPartCodes,
  validateSalesPartAccess,
} from "@/lib/auth/part-access";

describe("central sales part access contract", () => {
  it("allows admin access to every supported part and blocks unsupported parts", () => {
    expect(getAllowedSalesPartsForRole("ADMIN")).toEqual([...supportedSalesPartCodes]);
    for (const partCode of supportedSalesPartCodes) {
      expect(canAccessSalesPart({ role: "ADMIN", requestedPart: partCode })).toBe(true);
    }
    expect(validateSalesPartAccess({ role: "ADMIN", partCode: "2" })).toMatchObject({
      ok: false,
      blockedReasons: ["PART_UNSUPPORTED"],
    });
  });

  it("allows sales reps only for their assigned part", () => {
    expect(canAccessSalesPart({ role: "SALES_REP_PART_1", requestedPart: "1" })).toBe(true);
    expect(validateSalesPartAccess({ role: "SALES_REP_PART_1", partCode: "4" })).toMatchObject({
      ok: false,
      allowedParts: ["1"],
      blockedReasons: ["PART_SCOPE_FORBIDDEN"],
    });
    expect(canAccessSalesPart({ role: "SALES_REP_PART_11", requestedPart: "11" })).toBe(true);
  });

  it("allows part leads only for managed supported parts", () => {
    const managedParts = parseManagedPartCodes("1, 4 11 unsupported 2");
    expect(managedParts).toEqual(["1", "4", "11"]);
    expect(canAccessSalesPart({ role: "PART_LEAD", requestedPart: "4", managedParts })).toBe(true);
    expect(validateSalesPartAccess({ role: "PART_LEAD", partCode: "7", managedParts })).toMatchObject({
      ok: false,
      allowedParts: ["1", "4", "11"],
      blockedReasons: ["PART_SCOPE_FORBIDDEN"],
    });
  });
});
