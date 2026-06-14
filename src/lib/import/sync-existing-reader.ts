import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { SupabaseImportRepository } from "@/lib/import/supabase-repository";
import type { LedgerSyncRow } from "@/lib/import/sync-key";
import type { LedgerSyncScope } from "@/lib/import/sync-diff";
import type { LedgerRowType } from "@/lib/types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ExistingLedgerRowsReadResult {
  rows: LedgerSyncRow[];
  readExecuted: boolean;
  readBlockedReason: string | null;
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
    return { rows: [], readExecuted: true, readBlockedReason: null };
  }

  const { data, error } = await supabase
    .schema("cn_sales")
    .from("ledger_rows")
    .select("id, row_index, ledger_date, row_type, identity_hash, content_hash")
    .eq("company_id", context.companyId)
    .eq("part_id", partId)
    .gte("ledger_date", scope.dateFrom)
    .lte("ledger_date", scope.dateTo);

  if (error) {
    return blocked("SYNC_DIFF_DB_READ_FAILED");
  }

  return {
    readExecuted: true,
    readBlockedReason: null,
    rows: (data ?? []).map((row) => ({
      syncKey: String(row.identity_hash),
      syncContentHash: String(row.content_hash),
      partCode: scope.partCode,
      ledgerDate: String(row.ledger_date ?? scope.dateTo),
      rowType: row.row_type as LedgerRowType,
      rowIndex: Number(row.row_index ?? 0),
    })),
  };
}

function blocked(readBlockedReason: string): ExistingLedgerRowsReadResult {
  return {
    rows: [],
    readExecuted: false,
    readBlockedReason,
  };
}
