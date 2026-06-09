import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryTs = readFileSync(join(process.cwd(), "src", "lib", "import", "supabase-repository.ts"), "utf8");

describe("Supabase import repository Phase 4-A master-data wiring", () => {
  it("auto-upserts ledger-derived parts instead of requiring seed-only parts", () => {
    expect(repositoryTs).toContain("upsertSalesPart");
    expect(repositoryTs).toContain("defaultPartName");
    expect(repositoryTs).toContain("source: \"ledger\"");
  });

  it("writes normalized customer and product master data plus aliases", () => {
    expect(repositoryTs).toContain("normalizeMasterName");
    expect(repositoryTs).toContain("raw_customer_name");
    expect(repositoryTs).toContain("normalized_customer_name");
    expect(repositoryTs).toContain("customer_aliases");
    expect(repositoryTs).toContain("raw_product_name");
    expect(repositoryTs).toContain("normalized_product_name");
    expect(repositoryTs).toContain("product_aliases");
  });

  it("updates customer-product usage from item_detail rows", () => {
    expect(repositoryTs).toContain("upsertCustomerProductUsage");
    expect(repositoryTs).toContain("customer_product_usage");
    expect(repositoryTs).toContain("usage_status");
  });
});
