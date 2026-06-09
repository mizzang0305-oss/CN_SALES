import { describe, expect, it } from "vitest";
import {
  buildClaimResolutionHistory,
  buildClaimResolutionUpdate,
  classifyClaimMediaType,
  rankProductSolutionGuides,
} from "@/lib/claims/resolution";

const doneStatus = "처리완료";

describe("claims resolution helpers", () => {
  it("classifies claim media from MIME type", () => {
    expect(classifyClaimMediaType("image/jpeg")).toBe("image");
    expect(classifyClaimMediaType("video/mp4")).toBe("video");
    expect(classifyClaimMediaType("application/pdf")).toBe("file");
    expect(classifyClaimMediaType("")).toBe("file");
  });

  it("requires final resolution when a claim is completed", () => {
    expect(() => buildClaimResolutionUpdate({ status: doneStatus, finalResolution: "  " })).toThrow("final_resolution");
    expect(buildClaimResolutionUpdate({ status: doneStatus, finalResolution: "교환 완료" })).toMatchObject({
      status: doneStatus,
      final_resolution: "교환 완료",
    });
  });

  it("builds resolution history payload without raw files or public URLs", () => {
    const history = buildClaimResolutionHistory({
      claimId: "claim-1",
      status: doneStatus,
      actionSummary: "회수 후 확인",
      finalResolution: "재출고 완료",
      preventionNote: "입고 검수 강화",
      createdBy: "profile-1",
    });

    expect(history).toMatchObject({
      claim_id: "claim-1",
      status: doneStatus,
      action_summary: "회수 후 확인",
      resolution_summary: "재출고 완료",
      prevention_note: "입고 검수 강화",
      created_by: "profile-1",
    });
    expect(JSON.stringify(history)).not.toMatch(/publicUrl|rawFile|service_role/i);
  });

  it("returns top three same-product issue guides by use count and recency", () => {
    const guides = rankProductSolutionGuides({
      productId: "product-1",
      issueType: "quality",
      referenceDate: "2026-06-09",
      guides: [
        { id: "old", productId: "product-1", issueType: "quality", recommendedAction: "old", useCount: 50, updatedAt: "2026-01-01" },
        { id: "a", productId: "product-1", issueType: "quality", recommendedAction: "a", useCount: 2, updatedAt: "2026-06-08" },
        { id: "b", productId: "product-1", issueType: "quality", recommendedAction: "b", useCount: 8, updatedAt: "2026-05-20" },
        { id: "c", productId: "product-1", issueType: "quality", recommendedAction: "c", useCount: 3, updatedAt: "2026-05-28" },
        { id: "other-product", productId: "product-2", issueType: "quality", recommendedAction: "x", useCount: 99, updatedAt: "2026-06-08" },
        { id: "other-issue", productId: "product-1", issueType: "delivery", recommendedAction: "x", useCount: 99, updatedAt: "2026-06-08" },
      ],
    });

    expect(guides.map((guide) => guide.id)).toEqual(["b", "c", "a"]);
  });
});
