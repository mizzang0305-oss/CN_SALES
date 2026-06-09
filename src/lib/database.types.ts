export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  cn_sales: {
    Enums: {
      user_role: "sales_rep" | "part_leader" | "team_leader" | "executive" | "admin";
      ledger_row_type: "item_detail" | "customer_total" | "daily_total" | "grand_total" | "receipt" | "unknown";
      upload_status: "preview" | "committed" | "cancelled" | "failed";
      claim_status: "접수" | "진행" | "완료" | "보류";
      promise_status: "예정" | "오늘" | "지연" | "완료" | "연기" | "취소" | "확인필요";
    };
    Tables: {
      ledger_rows: {
        Row: {
          id: string;
          company_id: string;
          upload_id: string;
          row_index: number;
          row_type: Database["cn_sales"]["Enums"]["ledger_row_type"];
          identity_hash: string;
          content_hash: string;
          raw_row_json: Json;
        };
        Insert: {
          company_id: string;
          upload_id: string;
          row_index: number;
          row_type: Database["cn_sales"]["Enums"]["ledger_row_type"];
          identity_hash: string;
          content_hash: string;
          raw_row_json: Json;
        };
        Update: Partial<Database["cn_sales"]["Tables"]["ledger_rows"]["Insert"]>;
      };
    };
  };
}
