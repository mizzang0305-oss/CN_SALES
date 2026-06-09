import type { ClaimMediaType } from "@/lib/storage/claim-media";

const completedStatuses = new Set(["처리완료", "완료"]);

export interface ClaimResolutionInput {
  status: string;
  finalResolution?: string | null;
  preventionNote?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  solutionGuideId?: string | null;
}

export interface ClaimResolutionHistoryInput {
  companyId?: string;
  claimId: string;
  status: string;
  actionSummary?: string | null;
  finalResolution?: string | null;
  preventionNote?: string | null;
  createdBy?: string | null;
}

export interface ProductSolutionGuide {
  id: string;
  productId: string;
  issueType: string;
  recommendedAction: string;
  useCount: number;
  updatedAt: string;
}

export function classifyClaimMediaType(mimeType: string): ClaimMediaType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "file";
}

export function buildClaimResolutionUpdate(input: ClaimResolutionInput) {
  const finalResolution = normalizeOptionalText(input.finalResolution);
  if (completedStatuses.has(input.status) && !finalResolution) {
    throw new Error("final_resolution is required when completing a claim.");
  }

  return {
    status: input.status,
    final_resolution: finalResolution,
    prevention_note: normalizeOptionalText(input.preventionNote),
    resolved_by: input.resolvedBy ?? null,
    resolved_at: completedStatuses.has(input.status) ? input.resolvedAt ?? new Date().toISOString() : input.resolvedAt ?? null,
    solution_guide_id: input.solutionGuideId ?? null,
  };
}

export function buildClaimResolutionHistory(input: ClaimResolutionHistoryInput) {
  return {
    company_id: input.companyId,
    claim_id: input.claimId,
    status: input.status,
    action_summary: normalizeOptionalText(input.actionSummary),
    resolution_summary: normalizeOptionalText(input.finalResolution),
    prevention_note: normalizeOptionalText(input.preventionNote),
    created_by: input.createdBy ?? null,
  };
}

export function rankProductSolutionGuides(input: {
  productId: string;
  issueType: string;
  referenceDate: string;
  guides: ProductSolutionGuide[];
}) {
  const referenceTime = Date.parse(input.referenceDate);
  const cutoffTime = Number.isFinite(referenceTime) ? referenceTime - 90 * 86_400_000 : Number.NEGATIVE_INFINITY;

  return input.guides
    .filter((guide) => guide.productId === input.productId && guide.issueType === input.issueType)
    .filter((guide) => {
      const updated = Date.parse(guide.updatedAt);
      return !Number.isFinite(updated) || updated >= cutoffTime;
    })
    .sort((left, right) => right.useCount - left.useCount || Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .slice(0, 3);
}

function normalizeOptionalText(value?: string | null) {
  const text = value?.trim();
  return text ? text : null;
}
