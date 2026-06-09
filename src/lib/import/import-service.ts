import { parseLedgerRows, summarizePreview } from "@/lib/ledger/rules";
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
    const rawRows = await this.options.parseRows({
      file: input.file,
      storagePath: stored.path,
      partCode: input.partCode,
      periodEnd: input.periodEnd,
    });

    const firstPass = parseLedgerRows({
      rows: rawRows,
      partCode: input.partCode,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
    });
    const existingHashes = await this.options.repository.getExistingContentHashes(firstPass.map((row) => row.identityHash));
    const rows = parseLedgerRows({
      rows: rawRows,
      partCode: input.partCode,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      existingHashes,
    });
    const summary = summarizePreview({
      fileName: stored.fileName,
      partCode: input.partCode,
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
      partCode: input.partCode,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      summary,
      rows,
      rowTypeCounts,
      sampleRows: rows.slice(0, 20),
      blockedReasons: this.options.blockedReasons ?? [],
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

    if ((this.options.blockedReasons ?? []).length > 0) {
      return {
        status: "blocked" as const,
        previewId,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        missingCandidates: 0,
        normalized: { salesTransactions: 0, receiptTransactions: 0, arSnapshots: 0 },
        blockedReasons: this.options.blockedReasons ?? [],
      };
    }

    return this.options.repository.confirmPreview(preview);
  }
}
