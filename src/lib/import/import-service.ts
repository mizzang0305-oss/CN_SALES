import { parseLedgerRows, summarizePreview } from "@/lib/ledger/rules";
import { PART_REQUIRED, resolveImportPartCode } from "@/lib/import/master-data";
import type { ImportPreviewRecord, ImportRepository } from "@/lib/import/types";
import type { LedgerRawRow } from "@/lib/types";
import type { UploadStorageAdapter } from "@/lib/storage/types";

export class ImportService {
  constructor(
    private readonly options: {
      repository: ImportRepository;
      storage: UploadStorageAdapter;
      parseRows: (input: { file: File; storagePath: string; partCode: string; periodEnd: string }) => Promise<LedgerRawRow[]>;
      blockedReasons?: string[];
    },
  ) {}

  async preview(input: { file: File; partCode: string; periodStart: string; periodEnd: string }): Promise<ImportPreviewRecord> {
    const stored = await this.options.storage.save(input.file);
    const selectedPartCode = input.partCode?.trim() ?? "";
    const rawRows = await this.options.parseRows({
      file: input.file,
      storagePath: stored.path,
      partCode: selectedPartCode,
      periodEnd: input.periodEnd,
    });
    const partResolution = resolveImportPartCode({
      selectedPartCode,
      fileName: stored.fileName || input.file.name,
      rows: rawRows,
    });
    const partCode = partResolution.partCode || PART_REQUIRED;
    const blockedReasons = [...(this.options.blockedReasons ?? []), ...partResolution.blockedReasons];

    const firstPass = parseLedgerRows({
      rows: rawRows,
      partCode,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    });
    const existingHashes = await this.options.repository.getExistingContentHashes(firstPass.map((row) => row.identityHash));
    const rows = parseLedgerRows({
      rows: rawRows,
      partCode,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      existingHashes,
    });
    const summary = summarizePreview({
      fileName: stored.fileName,
      partCode: partResolution.partCode,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      rows,
    });
    const rowTypeCounts = rows.reduce<Record<string, number>>((counts, row) => {
      counts[row.rowType] = (counts[row.rowType] ?? 0) + 1;
      return counts;
    }, {});

    return this.options.repository.createPreview({
      fileName: stored.fileName,
      storagePath: stored.path,
      partCode: partResolution.partCode,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      summary: {
        ...summary,
        canCommit: summary.canCommit && blockedReasons.length === 0,
      },
      rows,
      rowTypeCounts,
      sampleRows: rows.slice(0, 20),
      blockedReasons,
    });
  }

  async confirm(previewId: string) {
    const preview = await this.options.repository.getPreview(previewId);
    if (!preview) {
      return {
        status: "rejected" as const,
        previewId,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: 1,
        missingCandidates: 0,
        normalized: { salesTransactions: 0, receiptTransactions: 0, arSnapshots: 0 },
        blockedReasons: ["Preview result was not found."],
      };
    }

    const blockedReasons = [...(this.options.blockedReasons ?? []), ...preview.blockedReasons];
    if (blockedReasons.length > 0) {
      return {
        status: "blocked" as const,
        previewId,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        missingCandidates: 0,
        normalized: { salesTransactions: 0, receiptTransactions: 0, arSnapshots: 0 },
        blockedReasons,
      };
    }

    return this.options.repository.confirmPreview(preview);
  }
}
