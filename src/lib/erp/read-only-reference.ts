import type { SupabaseClient } from "@supabase/supabase-js";

export type ErpEntityType = "customer" | "product";
export type ErpMatchCandidateStatus = "pending" | "accepted" | "rejected";

export interface ErpVendorReference {
  vendor_code: string;
  name: string;
  biz_no: string | null;
  manager: string | null;
  current_balance: number | null;
  last_trade_date: string | null;
}

export interface ErpProductReference {
  product_code: string;
  barcode: string | null;
  name: string;
  spec: string | null;
  unit: string | null;
  sale_price: number | null;
  purchase_price: number | null;
  supplier_name: string | null;
}

export interface ErpPricingReference {
  product_code: string;
  sale_price: number | null;
  plan_price: number | null;
  recog_price: number | null;
  purchase_price: number | null;
}

export interface ErpMatchCandidateInsert {
  company_id: string;
  entity_type: ErpEntityType;
  cn_sales_entity_id: string;
  erp_code: string;
  erp_name: string;
  reason: string;
  confidence: number;
  status: ErpMatchCandidateStatus;
}

export class ErpReadOnlyReferenceRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  private db() {
    return this.supabase.schema("public");
  }

  async findVendorCandidates(input: { name?: string | null; bizNo?: string | null; limit?: number }) {
    let query = this.db()
      .from("vendors")
      .select("vendor_code, name, biz_no, manager, current_balance, last_trade_date");

    if (input.bizNo) {
      query = query.eq("biz_no", input.bizNo);
    } else if (input.name) {
      query = query.ilike("name", `%${escapeLikePattern(input.name)}%`);
    }

    const { data, error } = await query.limit(limitOrDefault(input.limit));
    if (error) throw new Error(`Fetch ERP vendor candidates failed: ${error.message}`);
    return (data ?? []) as ErpVendorReference[];
  }

  async findProductCandidates(input: { name?: string | null; barcode?: string | null; limit?: number }) {
    let query = this.db()
      .from("products")
      .select("product_code, barcode, name, spec, unit, sale_price, purchase_price, supplier_name");

    if (input.barcode) {
      query = query.eq("barcode", input.barcode);
    } else if (input.name) {
      query = query.ilike("name", `%${escapeLikePattern(input.name)}%`);
    }

    const { data, error } = await query.limit(limitOrDefault(input.limit));
    if (error) throw new Error(`Fetch ERP product candidates failed: ${error.message}`);
    return (data ?? []) as ErpProductReference[];
  }

  async findPricingRules(productCode: string) {
    const { data, error } = await this.db()
      .from("pricing_rules")
      .select("product_code, sale_price, plan_price, recog_price, purchase_price")
      .eq("product_code", productCode)
      .limit(20);
    if (error) throw new Error(`Fetch ERP pricing rules failed: ${error.message}`);
    return (data ?? []) as ErpPricingReference[];
  }

  async findOrderLineHistory(input: { productCode?: string | null; vendorCode?: string | null; limit?: number }) {
    let query = this.db()
      .from("order_lines")
      .select("product_code, vendor_code, order_date, quantity, sale_price");

    if (input.productCode) query = query.eq("product_code", input.productCode);
    if (input.vendorCode) query = query.eq("vendor_code", input.vendorCode);

    const { data, error } = await query.limit(limitOrDefault(input.limit));
    if (error) throw new Error(`Fetch ERP order lines failed: ${error.message}`);
    return data ?? [];
  }

  async findMonthlySalesReference(input: { productCode?: string | null; vendorCode?: string | null; limit?: number }) {
    let query = this.db()
      .from("v_monthly_sales")
      .select("*");

    if (input.productCode) query = query.eq("product_code", input.productCode);
    if (input.vendorCode) query = query.eq("vendor_code", input.vendorCode);

    const { data, error } = await query.limit(limitOrDefault(input.limit));
    if (error) throw new Error(`Fetch ERP monthly sales failed: ${error.message}`);
    return data ?? [];
  }

  async findVendorReceivables(vendorCode: string) {
    const { data, error } = await this.db()
      .from("v_vendor_receivables")
      .select("*")
      .eq("vendor_code", vendorCode)
      .limit(1);
    if (error) throw new Error(`Fetch ERP vendor receivables failed: ${error.message}`);
    return data ?? [];
  }

  async findProductSales(productCode: string) {
    const { data, error } = await this.db()
      .from("v_product_sales")
      .select("*")
      .eq("product_code", productCode)
      .limit(20);
    if (error) throw new Error(`Fetch ERP product sales failed: ${error.message}`);
    return data ?? [];
  }
}

export function buildCustomerErpMatchCandidate(input: {
  companyId: string;
  customerId: string;
  vendor: Pick<ErpVendorReference, "vendor_code" | "name">;
  reason: string;
  confidence: number;
}): ErpMatchCandidateInsert {
  return {
    company_id: input.companyId,
    entity_type: "customer",
    cn_sales_entity_id: input.customerId,
    erp_code: input.vendor.vendor_code,
    erp_name: input.vendor.name,
    reason: input.reason,
    confidence: clampConfidence(input.confidence),
    status: "pending",
  };
}

export function buildProductErpMatchCandidate(input: {
  companyId: string;
  productId: string;
  product: Pick<ErpProductReference, "product_code" | "name">;
  reason: string;
  confidence: number;
}): ErpMatchCandidateInsert {
  return {
    company_id: input.companyId,
    entity_type: "product",
    cn_sales_entity_id: input.productId,
    erp_code: input.product.product_code,
    erp_name: input.product.name,
    reason: input.reason,
    confidence: clampConfidence(input.confidence),
    status: "pending",
  };
}

function escapeLikePattern(value: string) {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

function limitOrDefault(limit?: number) {
  if (!limit || !Number.isFinite(limit)) return 10;
  return Math.min(Math.max(Math.trunc(limit), 1), 50);
}

function clampConfidence(confidence: number) {
  if (!Number.isFinite(confidence)) return 0;
  return Math.min(Math.max(confidence, 0), 1);
}
