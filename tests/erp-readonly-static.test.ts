import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const erpRepositoryTs = readFileSync(join(process.cwd(), "src", "lib", "erp", "read-only-reference.ts"), "utf8");

const publicErpTargets = [
  "products",
  "vendors",
  "order_lines",
  "pricing_rules",
  "v_monthly_sales",
  "v_vendor_receivables",
  "v_product_sales",
];

describe("ERP read-only reference repository static checks", () => {
  it("uses public ERP tables and views only through explicit select queries", () => {
    expect(erpRepositoryTs).toContain('schema("public")');
    for (const target of publicErpTargets) {
      expect(erpRepositoryTs).toContain(`.from("${target}")`);
    }
    expect(erpRepositoryTs).toContain(".select(");
  });

  it("does not expose public ERP writes from the lookup repository", () => {
    expect(erpRepositoryTs).not.toMatch(/\.(insert|update|delete|upsert|rpc)\s*\(/);
    expect(erpRepositoryTs).not.toMatch(/from\("products"\)[\s\S]*?\.(insert|update|delete|upsert)\s*\(/);
    expect(erpRepositoryTs).not.toMatch(/from\("vendors"\)[\s\S]*?\.(insert|update|delete|upsert)\s*\(/);
    expect(erpRepositoryTs).not.toMatch(/from\("order_lines"\)[\s\S]*?\.(insert|update|delete|upsert)\s*\(/);
    expect(erpRepositoryTs).not.toMatch(/from\("pricing_rules"\)[\s\S]*?\.(insert|update|delete|upsert)\s*\(/);
  });

  it("keeps ERP match candidate creation as cn_sales payload data", () => {
    expect(erpRepositoryTs).toContain("buildCustomerErpMatchCandidate");
    expect(erpRepositoryTs).toContain("buildProductErpMatchCandidate");
    expect(erpRepositoryTs).toContain('entity_type: "customer"');
    expect(erpRepositoryTs).toContain('entity_type: "product"');
    expect(erpRepositoryTs).toContain('status: "pending"');
  });
});
