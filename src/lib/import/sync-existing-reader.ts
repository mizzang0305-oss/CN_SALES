import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { SupabaseImportRepository } from "@/lib/import/supabase-repository";
import type { LedgerSyncRow } from "@/lib/import/sync-key";
import type { LedgerSyncScope } from "@/lib/import/sync-diff";
import type { LedgerRowType } from "@/lib/types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const existingLedgerRowsPageSize = 500;
const existingLedgerRowsMaxPages = 20;
const existingLedgerRowsColumns = "id, row_index, ledger_date, row_type, identity_hash, content_hash, sales_amount, receipt_amount, receipt_discount";

export interface ExistingLedgerRowsReadDiagnostics {
  paged: true;
  pageSize: number;
  pagesRead: number;
  fetchedRows: number;
  expectedCount: number | null;
  countMatchesFetchedRows: boolean | null;
  rawRowsReturned: false;
}

export interface ExistingLedgerRowsReadResult {
  rows: LedgerSyncRow[];
  readExecuted: boolean;
  readBlockedReason: string | null;
  diagnostics: ExistingLedgerRowsReadDiagnostics | null;
}

export async function readExistingLedgerRowsForSync(scope: LedgerSyncScope): Promise<ExistingLedgerRowsReadResult> {
  if (process.env.NODE_ENV === "test") {
    return blocked("SYNC_DIFF_DB_READ_DISABLED_IN_TEST");
  }

  const adminProfileId = process.env.CN_SALES_ADMIN_AUTH_USER_ID;
  if (!adminProfileId || !uuidPattern.test(adminProfileId)) {
    return blocked("CN_SALES_ADMIN_AUTH_USER_ID_MISSING");
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return blocked("SUPABASE_READ_CLIENT_UNAVAILABLE");
  }

  const context = await SupabaseImportRepository.loadContextForProfile(supabase, adminProfileId);
  const partId = context.partIdByCode.get(scope.partCode);
  if (!partId) {
    return {
      rows: [],
      readExecuted: true,
      readBlockedReason: null,
      diagnostics: diagnostics(0, 0, 0, true),
    };
  }

  const rows: LedgerSyncRow[] = [];
  let expectedCount: number | null = null;
  let pagesRead = 0;
  let reachedEnd = false;

  for (let pageIndex = 0; pageIndex < existingLedgerRowsMaxPages; pageIndex += 1) {
    const from = pageIndex * existingLedgerRowsPageSize;
    const to = from + existingLedgerRowsPageSize - 1;
    const { data, error, count } = await supabase
      .schema("cn_sales")
      .from("ledger_rows")
      .select(existingLedgerRowsColumns, { count: "exact" })
      .eq("company_id", context.companyId)
      .eq("part_id", partId)
      .gte("ledger_date", scope.dateFrom)
      .lte("ledger_date", scope.dateTo)
      .order("ledger_date", { ascending: true })
      .order("row_index", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);

    pagesRead = pageIndex + 1;

    if (error) {
      return blocked("SYNC_DIFF_DB_READ_FAILED");
    }

    if (count !== null) {
      expectedCount = count;
    }

    const pageRows = data ?? [];
    rows.push(...pageRows.map((row) => ({
      naturalKey: `schema_identity_v1:${String(row.identity_hash)}`,
      occurrenceIndexWithinNaturalKey: 1,
      identityHash: String(row.identity_hash),
      contentHash: String(row.content_hash),
      syncKey: String(row.identity_hash),
      syncContentHash: String(row.content_hash),
      keyVersion: "schema_identity_v1" as const,
      partCode: scope.partCode,
      ledgerDate: String(row.ledger_date ?? scope.dateTo),
      rowType: row.row_type as LedgerRowType,
      rowIndex: Number(row.row_index ?? 0),
      amountTotal: Number(row.sales_amount ?? 0) + Number(row.receipt_amount ?? 0) + Number(row.receipt_discount ?? 0),
    })));

    if (pageRows.length < existingLedgerRowsPageSize || (expectedCount !== null && rows.length >= expectedCount)) {
      reachedEnd = true;
      break;
    }
  }

  const countMatchesFetchedRows = expectedCount === null ? null : rows.length === expectedCount;
  const readDiagnostics = diagnostics(pagesRead, rows.length, expectedCount, countMatchesFetchedRows);
  if (!reachedEnd || countMatchesFetchedRows === false) {
    return {
      rows: [],
      readExecuted: true,
      readBlockedReason: "SYNC_DIFF_DB_READ_INCOMPLETE",
      diagnostics: readDiagnostics,
    };
  }

  return {
    readExecuted: true,
    readBlockedReason: null,
    diagnostics: readDiagnostics,
    rows,
  };
}

function blocked(readBlockedReason: string): ExistingLedgerRowsReadResult {
  return {
    rows: [],
    readExecuted: false,
    readBlockedReason,
    diagnostics: null,
  };
}

function diagnostics(
  pagesRead: number,
  fetchedRows: number,
  expectedCount: number | null,
  countMatchesFetchedRows: boolean | null,
): ExistingLedgerRowsReadDiagnostics {
  return {
    paged: true,
    pageSize: existingLedgerRowsPageSize,
    pagesRead,
    fetchedRows,
    expectedCount,
    countMatchesFetchedRows,
    rawRowsReturned: false,
  };
}
