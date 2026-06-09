export const CLAIM_MEDIA_BUCKET = "cn-sales-claim-media";

export type ClaimMediaType = "image" | "video" | "file";

export interface ClaimMediaStorageInput {
  companyId: string;
  claimId: string;
  fileName: string;
  now?: Date;
  id?: string;
}

export function sanitizeClaimMediaFileName(fileName: string) {
  const sanitized = fileName
    .normalize("NFKC")
    .trim()
    .replace(/[^\w가-힣().,@=+$!;& -]/g, "_")
    .replace(/\s+/g, " ");

  return sanitized || "claim-media";
}

export function createClaimMediaStoragePath(input: ClaimMediaStorageInput) {
  const day = (input.now ?? new Date()).toISOString().slice(0, 10);
  const id = input.id ?? crypto.randomUUID();
  return `${input.companyId}/claims/${input.claimId}/${day}/${id}-${sanitizeClaimMediaFileName(input.fileName)}`;
}

export function buildClaimMediaAttachmentMetadata(input: {
  companyId: string;
  claimId: string;
  storagePath: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  mediaType: ClaimMediaType;
  uploadedBy?: string | null;
}) {
  return {
    company_id: input.companyId,
    claim_id: input.claimId,
    storage_bucket: CLAIM_MEDIA_BUCKET,
    storage_path: input.storagePath,
    file_name: input.fileName,
    mime_type: input.mimeType,
    file_size: input.fileSize,
    media_type: input.mediaType,
    uploaded_by: input.uploadedBy ?? null,
  };
}
