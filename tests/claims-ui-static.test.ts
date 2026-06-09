import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const claimsPageTsx = readFileSync(join(process.cwd(), "src", "app", "(pc)", "claims", "page.tsx"), "utf8");
const mobileClaimsPageTsx = readFileSync(join(process.cwd(), "src", "app", "m", "claims", "new", "page.tsx"), "utf8");

describe("Phase 4-B claims form UI static wiring", () => {
  it("includes product, issue, resolution, prevention, and media attachment fields", () => {
    expect(claimsPageTsx).toContain("productId");
    expect(claimsPageTsx).toContain("issueType");
    expect(claimsPageTsx).toContain("finalResolution");
    expect(claimsPageTsx).toContain("preventionNote");
    expect(claimsPageTsx).toContain("claimMedia");
  });

  it("allows multiple private-storage evidence files without public URLs", () => {
    expect(claimsPageTsx).toContain('type="file"');
    expect(claimsPageTsx).toContain('accept="image/*,video/*,application/pdf,application/octet-stream"');
    expect(claimsPageTsx).toContain("multiple");
    expect(claimsPageTsx).toContain("cn-sales-claim-media");
    expect(claimsPageTsx).not.toContain("getPublicUrl");
    expect(claimsPageTsx).not.toContain("publicUrl");
  });

  it("renders resolution and solution-guide workflow controls", () => {
    expect(claimsPageTsx).toContain("causeType");
    expect(claimsPageTsx).toContain("actionType");
    expect(claimsPageTsx).toContain("solutionGuideId");
    expect(claimsPageTsx).toContain("claimResolutionHistory");
    expect(claimsPageTsx).toContain("productSolutionGuides");
  });

  it("keeps the mobile claim route wired to the claim entry experience", () => {
    expect(mobileClaimsPageTsx).toContain("claimMedia");
    expect(mobileClaimsPageTsx).toContain("finalResolution");
    expect(mobileClaimsPageTsx).toContain('accept="image/*,video/*,application/pdf,application/octet-stream"');
  });
});
