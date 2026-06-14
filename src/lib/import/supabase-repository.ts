import type { SupabaseClient } from "@supabase/supabase-js";
import type { LimitedApplyRowSelection } from "@/lib/import/limited-apply";
import { createNormalizedRows } from "@/lib/import/normalization";
import { isCommittablePreviewRow } from "@/lib/import/row-classification";
import { classifyUsageStatus, defaultPartName, normalizeMasterName } from "@/lib/import/master-data";
import type { ConfirmResult, DashboardTotals, ImportPreviewRecord, ImportRepository } from "@/lib/import/types";
import type { ParsedLedgerRow } from "@/lib/types";

interface SupabaseContext {
  companyId: string;
  profileId: string;
  role: string;
  partIdByCode: Map<string, string>;
}

export interface LimitedInsertLedgerRowsResult {
  importBatchId: string;
  createdAt: string;
  committedAt: string;
  insertedRows: number;
  updatedRows: 0;
  deletedRows: 0;
  normalizedTableWrite: false;
  readBackRows: Array<{
    id: string;
    upload_id: string;
    part_id: string;
    row_index: number;
    ledger_date: string;
    row_type: string;
    identity_hash: string;
    content_hash: string;
  }>;
}

export class SupabaseImportRepository implements ImportRepository {
  private contextPromise: Promise<SupabaseContext>;

  constructor(
    private readonly supabase: SupabaseClient,
    contextPromise?: Promise<SupabaseContext>,
  ) {
    this.contextPromise = contextPromise ?? SupabaseImportRepository.loadContext(this.supabase);
  }

  private db() {
    return this.supabase.schema("cn_sales");
  }

  async createPreview(input: Parameters<ImportRepository["createPreview"]>[0]): Promise<ImportPreviewRecord> {
    const context = await this.contextPromise;
    const partId = await this.upsertSalesPart(context, input.partCode);

    const { data: upload, error: uploadError } = await this.db()
      .from("ledger_uploads")
      .insert({
        company_id: context.companyId,
        part_id: partId,
        file_name: input.fileName,
        storage_path: input.storagePath,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        status: "preview",
        summary_json: input.summary,
        created_by: context.profileId,
      })
      .select("id, created_at")
      .single();
    if (uploadError) throw new Error(`Create upload failed: ${uploadError.message}`);

    const previewPayload = {
      summary: input.summary,
      row_type_counts: input.rowTypeCounts,
      sample_rows: input.sampleRows,
      blocked_reasons: input.blockedReasons,
    };

    const { data: preview, error: previewError } = await this.db()
      .from("upload_preview_results")
      .insert({
        upload_id: upload.id,
        summary_json: previewPayload,
        row_results_json: input.rows,
      })
      .select("id")
      .single();
    if (previewError) throw new Error(`Create preview failed: ${previewError.message}`);

    return {
      previewId: preview.id,
      uploadId: upload.id,
      uploadRecordId: upload.id,
      storagePath: input.storagePath,
      createdAt: upload.created_at ?? new Date().toISOString(),
      summary: input.summary,
      rows: input.rows,
      blockedReasons: input.blockedReasons,
      rowTypeCounts: input.rowTypeCounts,
      sampleRows: input.sampleRows,
    };
  }

  async getExistingContentHashes(identityHashes: string[]) {
    const context = await this.contextPromise;
    if (identityHashes.length === 0) return {};

    const { data, error } = await this.db()
      .from("ledger_rows")
      .select("identity_hash, content_hash")
      .eq("company_id", context.companyId)
      .in("identity_hash", identityHashes);
    if (error) throw new Error(`Fetch existing hashes failed: ${error.message}`);

    return Object.fromEntries((data ?? []).map((row) => [row.identity_hash, row.content_hash]));
  }

  async getPreview(previewId: string): Promise<ImportPreviewRecord | null> {
    const { data, error } = await this.db()
      .from("upload_preview_results")
      .select("id, upload_id, summary_json, row_results_json, ledger_uploads(file_name, storage_path, created_at)")
      .eq("id", previewId)
      .single();
    if (error) return null;

    const summaryJson = data.summary_json as {
      summary: ImportPreviewRecord["summary"];
      row_type_counts: Record<string, number>;
      sample_rows: ImportPreviewRecord["sampleRows"];
      blocked_reasons: string[];
    };
    const upload = Array.isArray(data.ledger_uploads) ? data.ledger_uploads[0] : data.ledger_uploads;

    return {
      previewId: data.id,
      uploadId: data.upload_id,
      uploadRecordId: data.upload_id,
      storagePath: upload?.storage_path ?? "",
      createdAt: upload?.created_at ?? "",
      summary: summaryJson.summary,
      rows: data.row_results_json as ImportPreviewRecord["rows"],
      blockedReasons: summaryJson.blocked_reasons ?? [],
      rowTypeCounts: summaryJson.row_type_counts ?? {},
      sampleRows: summaryJson.sample_rows ?? [],
    };
  }

  async confirmPreview(preview: ImportPreviewRecord): Promise<ConfirmResult> {
    const context = await this.contextPromise;
    const partId = await this.upsertSalesPart(context, preview.summary.partCode);

    if (preview.summary.errorRows > 0 || preview.summary.warningRows > 0) {
      return {
        status: "rejected",
        previewId: preview.previewId,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: preview.summary.errorRows + preview.summary.warningRows,
        missingCandidates: 0,
        normalized: { salesTransactions: 0, receiptTransactions: 0, arSnapshots: 0 },
        blockedReasons: ["Preview contains error rows."],
      };
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const changedRows: Array<ParsedLedgerRow & { id: string }> = [];

    for (const row of preview.rows.filter(isCommittablePreviewRow)) {
      const customerId = await this.upsertCustomer(context.companyId, partId, row.customerName);
      const productId = row.productName ? await this.upsertProduct(context.companyId, row.productName) : null;
      const { data: existing, error: existingError } = await this.db()
        .from("ledger_rows")
        .select("id, content_hash, raw_row_json")
        .eq("company_id", context.companyId)
        .eq("identity_hash", row.identityHash)
        .maybeSingle();
      if (existingError) throw new Error(`Fetch ledger row failed: ${existingError.message}`);

      if (!existing) {
        const { data: insertedRow, error } = await this.db()
          .from("ledger_rows")
          .insert(this.toLedgerRowInsert(row, context.companyId, preview.uploadRecordId, partId, customerId, productId))
          .select("id")
          .single();
        if (error) throw new Error(`Insert ledger row failed: ${error.message}`);
        changedRows.push({ ...row, id: insertedRow.id });
        if (row.rowType === "item_detail" && customerId && productId) {
          await this.upsertCustomerProductUsage(context.companyId, partId, customerId, productId, row);
        }
        inserted += 1;
        continue;
      }

      if (existing.content_hash === row.contentHash) {
        skipped += 1;
        continue;
      }

      const { error: versionError } = await this.db().from("ledger_row_versions").insert({
        ledger_row_id: existing.id,
        previous_content_hash: existing.content_hash,
        next_content_hash: row.contentHash,
        previous_raw_row_json: existing.raw_row_json,
        next_raw_row_json: row.rawRowJson,
        changed_by: context.profileId,
      });
      if (versionError) throw new Error(`Insert ledger row version failed: ${versionError.message}`);

      await this.deleteNormalizedForLedgerRow(existing.id);
      const { error: updateError } = await this.db()
        .from("ledger_rows")
        .update(this.toLedgerRowUpdate(row, customerId, productId))
        .eq("id", existing.id);
      if (updateError) throw new Error(`Update ledger row failed: ${updateError.message}`);

      changedRows.push({ ...row, id: existing.id });
      if (row.rowType === "item_detail" && customerId && productId) {
        await this.upsertCustomerProductUsage(context.companyId, partId, customerId, productId, row);
      }
      updated += 1;
    }

    const normalized = createNormalizedRows(changedRows);
    await this.insertNormalized(context.companyId, partId, normalized);
    await this.db().from("ledger_uploads").update({ status: "committed", committed_at: new Date().toISOString() }).eq("id", preview.uploadRecordId);

    return {
      status: "committed",
      previewId: preview.previewId,
      inserted,
      updated,
      skipped,
      errors: 0,
      missingCandidates: 0,
      normalized: {
        salesTransactions: normalized.salesTransactions.length,
        receiptTransactions: normalized.receiptTransactions.length,
        arSnapshots: normalized.arSnapshots.length,
      },
      blockedReasons: [],
    };
  }

  async limitedInsertLedgerRows(input: {
    fileName: string;
    partCode: string;
    periodStart: string;
    periodEnd: string;
    sourceFileHash: string;
    previewChecksum: string;
    operator: string;
    selectedRows: LimitedApplyRowSelection[];
    summary: {
      stage: "G-6B";
      totalRows: number;
      normalRows: number;
      excludedRows: number;
      warningRows: number;
      errorRows: number;
      requestedRows: number;
      maxRows: number;
    };
  }): Promise<LimitedInsertLedgerRowsResult> {
    const context = await this.contextPromise;
    const partId = context.partIdByCode.get(input.partCode);
    if (!partId) throw new Error("Selected sales part is missing.");

    const committedAt = new Date().toISOString();
    const { data: upload, error: uploadError } = await this.db()
      .from("ledger_uploads")
      .insert({
        company_id: context.companyId,
        part_id: partId,
        file_name: input.fileName,
        storage_path: null,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        status: "committed",
        committed_at: committedAt,
        summary_json: {
          stage: input.summary.stage,
          applyMode: "limited-apply",
          sourceFileHash: input.sourceFileHash,
          previewChecksum: input.previewChecksum,
          operator: input.operator,
          requestedRows: input.summary.requestedRows,
          maxRows: input.summary.maxRows,
          totalRows: input.summary.totalRows,
          normalRows: input.summary.normalRows,
          excludedRows: input.summary.excludedRows,
          warningRows: input.summary.warningRows,
          errorRows: input.summary.errorRows,
          normalizedTableWrite: false,
        },
        created_by: context.profileId,
      })
      .select("id, created_at, committed_at")
      .single();
    if (uploadError) throw new Error(`Create limited apply upload failed: ${uploadError.message}`);

    const rowsToInsert = input.selectedRows.map((selection) => {
      const rowWithSyncHashes = {
        ...selection.row,
        identityHash: selection.identityHash,
        contentHash: selection.contentHash,
      };
      return this.toLedgerRowInsert(rowWithSyncHashes, context.companyId, upload.id, partId, null, null);
    });

    const { data: inserted, error: insertError } = await this.db()
      .from("ledger_rows")
      .insert(rowsToInsert)
      .select("id, upload_id, part_id, row_index, ledger_date, row_type, identity_hash, content_hash");
    if (insertError) throw new Error(`Insert limited ledger rows failed: ${insertError.message}`);

    const insertedIds = (inserted ?? []).map((row) => row.id as string);
    const { data: readBackRows, error: readBackError } = await this.db()
      .from("ledger_rows")
      .select("id, upload_id, part_id, row_index, ledger_date, row_type, identity_hash, content_hash")
      .in("id", insertedIds)
      .order("row_index", { ascending: true });
    if (readBackError) throw new Error(`Read back limited ledger rows failed: ${readBackError.message}`);

    return {
      importBatchId: upload.id as string,
      createdAt: String(upload.created_at ?? committedAt),
      committedAt: String(upload.committed_at ?? committedAt),
      insertedRows: readBackRows?.length ?? 0,
      updatedRows: 0,
      deletedRows: 0,
      normalizedTableWrite: false,
      readBackRows: (readBackRows ?? []).map((row) => ({
        id: String(row.id),
        upload_id: String(row.upload_id),
        part_id: String(row.part_id),
        row_index: Number(row.row_index),
        ledger_date: String(row.ledger_date),
        row_type: String(row.row_type),
        identity_hash: String(row.identity_hash),
        content_hash: String(row.content_hash),
      })),
    };
  }

  async getDashboardTotals(): Promise<DashboardTotals> {
    const context = await this.contextPromise;
    const [{ data: sales }, { data: receipts }, { data: ar }, { data: parts }, { data: uploads }] = await Promise.all([
      this.db().from("sales_transactions").select("part_id, sales_amount").eq("company_id", context.companyId),
      this.db().from("receipt_transactions").select("part_id, total_receipt_amount").eq("company_id", context.companyId),
      this.db().from("ar_snapshots").select("part_id, ar_balance").eq("company_id", context.companyId),
      this.db().from("sales_parts").select("id, part_code, part_name").eq("company_id", context.companyId),
      this.db()
        .from("ledger_uploads")
        .select("id, file_name, status, created_at, committed_at, summary_json, part_id")
        .eq("company_id", context.companyId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    const salesAmount = (sales ?? []).reduce((sum, row) => sum + Number(row.sales_amount), 0);
    const receiptAmount = (receipts ?? []).reduce((sum, row) => sum + Number(row.total_receipt_amount), 0);
    const arBalance = (ar ?? []).reduce((sum, row) => sum + Number(row.ar_balance), 0);
    const partRows = (parts ?? []).map((part) => ({
      partCode: part.part_code,
      partName: part.part_name,
      salesAmount: (sales ?? []).filter((row) => row.part_id === part.id).reduce((sum, row) => sum + Number(row.sales_amount), 0),
      receiptAmount: (receipts ?? []).filter((row) => row.part_id === part.id).reduce((sum, row) => sum + Number(row.total_receipt_amount), 0),
      arBalance: (ar ?? []).filter((row) => row.part_id === part.id).reduce((sum, row) => sum + Number(row.ar_balance), 0),
      targetAmount: 0,
    }));
    const partById = new Map((parts ?? []).map((part) => [part.id, part]));
    const recentUploads: DashboardTotals["recentUploads"] = (uploads ?? []).map((upload) => {
      const summary = upload.summary_json as Partial<ImportPreviewRecord["summary"]> | null;
      const part = partById.get(upload.part_id);

      return {
        importBatchId: upload.id,
        fileName: upload.file_name,
        partCode: part?.part_code ?? String(summary?.partCode ?? ""),
        status: upload.status,
        createdAt: upload.committed_at ?? upload.created_at ?? "",
        appliedCount: Number(summary?.insertRows ?? 0) + Number(summary?.updateRows ?? 0),
        rejectedCount: Number(summary?.errorRows ?? 0) + Number(summary?.warningRows ?? 0),
        operator: null,
      };
    });

    return {
      salesAmount,
      receiptAmount,
      receiptRate: salesAmount ? (receiptAmount / salesAmount) * 100 : 0,
      arBalance,
      targetAmount: 0,
      targetRate: 0,
      parts: partRows,
      recentUploads,
      mode: "supabase",
      blockedReasons: [],
    };
  }

  static async loadContext(supabase: SupabaseClient): Promise<SupabaseContext> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error("Supabase session is missing.");

    return SupabaseImportRepository.loadContextForProfile(supabase, auth.user.id);
  }

  static async loadContextForProfile(supabase: SupabaseClient, profileId: string): Promise<SupabaseContext> {
    const db = supabase.schema("cn_sales");
    const { data: profile, error: profileError } = await db
      .from("profiles")
      .select("id, company_id, role")
      .eq("id", profileId)
      .single();
    if (profileError || !profile) throw new Error("Supabase profile is missing.");

    if (!["admin", "team_leader"].includes(profile.role)) {
      throw new Error("Supabase profile is not allowed to run ledger imports.");
    }

    const { data: parts, error: partsError } = await db
      .from("sales_parts")
      .select("id, part_code")
      .eq("company_id", profile.company_id);
    if (partsError) throw new Error(`Fetch sales parts failed: ${partsError.message}`);

    return {
      companyId: profile.company_id,
      profileId: profile.id,
      role: profile.role,
      partIdByCode: new Map((parts ?? []).map((part) => [part.part_code, part.id])),
    };
  }

  private toLedgerRowInsert(
    row: ParsedLedgerRow,
    companyId: string,
    uploadId: string,
    partId: string,
    customerId: string | null,
    productId: string | null,
  ) {
    return {
      company_id: companyId,
      upload_id: uploadId,
      part_id: partId,
      row_index: row.rowIndex,
      ledger_date: row.ledgerDate,
      row_type: row.rowType,
      customer_id: customerId,
      product_id: productId,
      customer_name: row.customerName,
      product_name: row.productName,
      quantity: row.quantity,
      unit_price: row.unitPrice,
      sales_amount: row.salesAmount,
      receipt_amount: row.receiptAmount,
      receipt_discount: row.receiptDiscount,
      ar_balance: row.arBalance,
      identity_hash: row.identityHash,
      content_hash: row.contentHash,
      raw_row_json: row.rawRowJson,
    };
  }

  private toLedgerRowUpdate(row: ParsedLedgerRow, customerId: string | null, productId: string | null) {
    return {
      ledger_date: row.ledgerDate,
      row_type: row.rowType,
      customer_id: customerId,
      product_id: productId,
      customer_name: row.customerName,
      product_name: row.productName,
      quantity: row.quantity,
      unit_price: row.unitPrice,
      sales_amount: row.salesAmount,
      receipt_amount: row.receiptAmount,
      receipt_discount: row.receiptDiscount,
      ar_balance: row.arBalance,
      content_hash: row.contentHash,
      raw_row_json: row.rawRowJson,
      updated_at: new Date().toISOString(),
    };
  }

  private async upsertSalesPart(context: SupabaseContext, partCode: string) {
    const existingPartId = context.partIdByCode.get(partCode);
    if (existingPartId) return existingPartId;

    const now = new Date().toISOString();
    const { data, error } = await this.db()
      .from("sales_parts")
      .upsert({
        company_id: context.companyId,
        part_code: partCode,
        part_name: defaultPartName(partCode),
        source: "ledger",
        is_active: true,
        first_seen_at: now,
        last_seen_at: now,
      }, { onConflict: "company_id,part_code" })
      .select("id")
      .single();
    if (error) throw new Error(`Upsert sales part failed: ${error.message}`);

    context.partIdByCode.set(partCode, data.id as string);
    return data.id as string;
  }

  private async upsertCustomer(companyId: string, partId: string, customerName: string | null) {
    if (!customerName) return null;
    const normalizedCustomerName = normalizeMasterName(customerName);
    const customerCode = normalizedCustomerName || customerName;
    const now = new Date().toISOString();
    const { data, error } = await this.db()
      .from("customers")
      .upsert({
        company_id: companyId,
        part_id: partId,
        customer_code: customerCode,
        customer_name: customerName,
        raw_customer_name: customerName,
        normalized_customer_name: normalizedCustomerName,
        source: "ledger",
        first_seen_at: now,
        last_seen_at: now,
      }, { onConflict: "company_id,customer_code" })
      .select("id")
      .single();
    if (error) throw new Error(`Upsert customer failed: ${error.message}`);

    const { error: aliasError } = await this.db()
      .from("customer_aliases")
      .upsert({
        company_id: companyId,
        customer_id: data.id,
        alias_name: customerName,
        normalized_alias_name: normalizedCustomerName,
        source: "ledger",
      }, { onConflict: "company_id,normalized_alias_name" });
    if (aliasError) throw new Error(`Upsert customer alias failed: ${aliasError.message}`);

    return data.id as string;
  }

  private async upsertProduct(companyId: string, productName: string) {
    const normalizedProductName = normalizeMasterName(productName);
    const now = new Date().toISOString();
    const { data, error } = await this.db()
      .from("products")
      .upsert({
        company_id: companyId,
        product_name: productName,
        raw_product_name: productName,
        normalized_product_name: normalizedProductName,
        source: "ledger",
        first_seen_at: now,
        last_seen_at: now,
      }, { onConflict: "company_id,product_name" })
      .select("id")
      .single();
    if (error) throw new Error(`Upsert product failed: ${error.message}`);

    const { error: aliasError } = await this.db()
      .from("product_aliases")
      .upsert({
        company_id: companyId,
        product_id: data.id,
        alias_name: productName,
        normalized_alias_name: normalizedProductName,
        source: "ledger",
      }, { onConflict: "company_id,normalized_alias_name" });
    if (aliasError) throw new Error(`Upsert product alias failed: ${aliasError.message}`);

    return data.id as string;
  }

  private async upsertCustomerProductUsage(
    companyId: string,
    partId: string,
    customerId: string,
    productId: string,
    row: ParsedLedgerRow,
  ) {
    const { data: existing, error: existingError } = await this.db()
      .from("customer_product_usage")
      .select("first_purchase_date, last_purchase_date, purchase_count, total_quantity, total_sales_amount")
      .eq("company_id", companyId)
      .eq("customer_id", customerId)
      .eq("product_id", productId)
      .eq("part_id", partId)
      .maybeSingle();
    if (existingError) throw new Error(`Fetch customer product usage failed: ${existingError.message}`);

    const firstPurchaseDate = minDate(existing?.first_purchase_date ?? null, row.ledgerDate);
    const lastPurchaseDate = maxDate(existing?.last_purchase_date ?? null, row.ledgerDate);
    const usageStatus = classifyUsageStatus({
      firstPurchaseDate,
      lastPurchaseDate,
      referenceDate: row.ledgerDate,
    });

    const { error } = await this.db()
      .from("customer_product_usage")
      .upsert({
        company_id: companyId,
        customer_id: customerId,
        product_id: productId,
        part_id: partId,
        first_purchase_date: firstPurchaseDate,
        last_purchase_date: lastPurchaseDate,
        last_quantity: row.quantity,
        last_unit_price: row.unitPrice,
        purchase_count: Number(existing?.purchase_count ?? 0) + 1,
        total_quantity: Number(existing?.total_quantity ?? 0) + row.quantity,
        total_sales_amount: Number(existing?.total_sales_amount ?? 0) + row.salesAmount,
        usage_status: usageStatus,
        updated_at: new Date().toISOString(),
      }, { onConflict: "company_id,customer_id,product_id,part_id" });
    if (error) throw new Error(`Upsert customer product usage failed: ${error.message}`);
  }

  private async deleteNormalizedForLedgerRow(ledgerRowId: string) {
    await Promise.all([
      this.db().from("sales_transactions").delete().eq("ledger_row_id", ledgerRowId),
      this.db().from("receipt_transactions").delete().eq("ledger_row_id", ledgerRowId),
      this.db().from("ar_snapshots").delete().eq("ledger_row_id", ledgerRowId),
      this.db().from("product_price_history").delete().eq("ledger_row_id", ledgerRowId),
    ]);
  }

  private async insertNormalized(companyId: string, partId: string, normalized: ReturnType<typeof createNormalizedRows>) {
    const salesRows = normalized.salesTransactions.map((row) => ({
      company_id: companyId,
      ledger_row_id: row.ledgerRowId,
      part_id: partId,
      transaction_date: row.transactionDate,
      sales_amount: row.salesAmount,
      source_row_type: "customer_total",
    }));
    const receiptRows = normalized.receiptTransactions.map((row) => ({
      company_id: companyId,
      ledger_row_id: row.ledgerRowId,
      part_id: partId,
      transaction_date: row.transactionDate,
      receipt_amount: row.receiptAmount,
      receipt_discount: row.receiptDiscount,
    }));
    const arRows = normalized.arSnapshots.map((row) => ({
      company_id: companyId,
      ledger_row_id: row.ledgerRowId,
      part_id: partId,
      snapshot_date: row.snapshotDate,
      ar_balance: row.arBalance,
    }));
    const priceRows = normalized.productPriceHistory.map((row) => ({
      company_id: companyId,
      ledger_row_id: row.ledgerRowId,
      part_id: partId,
      price_date: row.priceDate,
      quantity: row.quantity,
      unit_price: row.unitPrice,
      sales_amount: row.salesAmount,
    }));

    if (salesRows.length) await this.db().from("sales_transactions").insert(salesRows);
    if (receiptRows.length) await this.db().from("receipt_transactions").insert(receiptRows);
    if (arRows.length) await this.db().from("ar_snapshots").insert(arRows);
    if (priceRows.length) await this.db().from("product_price_history").insert(priceRows);
  }
}

function minDate(left: string | null, right: string | null) {
  if (!left) return right;
  if (!right) return left;
  return left <= right ? left : right;
}

function maxDate(left: string | null, right: string | null) {
  if (!left) return right;
  if (!right) return left;
  return left >= right ? left : right;
}
