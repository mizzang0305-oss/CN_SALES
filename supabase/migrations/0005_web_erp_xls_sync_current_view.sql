-- W-5B DRAFT ONLY.
-- Do not apply without WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED.
-- This file is a review artifact for the ERP XLS web-import current-view schema.
-- It must not be pushed with a schema apply command, seed data, storage changes, or sync execution.

create table if not exists cn_sales.sales_import_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  uploaded_by uuid null,
  uploaded_role text not null,
  part text not null,
  period_start date not null,
  period_end date not null,
  file_name text not null,
  file_hash text not null,
  normal_rows integer not null,
  excluded_rows integer not null,
  amount_total numeric not null,
  status text not null,
  created_at timestamptz not null default now(),
  constraint sales_import_batches_part_check check (part in ('1', '4', '5', '6', '7', '9', '10', '11')),
  constraint sales_import_batches_period_check check (period_start <= period_end),
  constraint sales_import_batches_normal_rows_check check (normal_rows >= 0),
  constraint sales_import_batches_excluded_rows_check check (excluded_rows >= 0),
  constraint sales_import_batches_status_check check (status in ('previewed', 'dry_run_ready', 'sync_planned', 'synced', 'closed')),
  constraint sales_import_batches_scope_hash_unique unique (company_id, part, period_start, period_end, file_hash)
);

create table if not exists cn_sales.sales_import_rows (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references cn_sales.sales_import_batches(id),
  company_id uuid not null,
  row_hash text not null,
  stable_key text not null,
  part text not null,
  ledger_date date null,
  amount numeric not null,
  excluded_reason text null,
  created_at timestamptz not null default now(),
  constraint sales_import_rows_part_check check (part in ('1', '4', '5', '6', '7', '9', '10', '11')),
  constraint sales_import_rows_batch_stable_key_unique unique (batch_id, stable_key)
);

create table if not exists cn_sales.sales_current_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  part text not null,
  period_start date not null,
  period_end date not null,
  stable_key text not null,
  ledger_date date null,
  amount numeric not null,
  source_batch_id uuid not null references cn_sales.sales_import_batches(id),
  current_status text not null,
  first_seen_batch_id uuid not null references cn_sales.sales_import_batches(id),
  last_seen_batch_id uuid not null references cn_sales.sales_import_batches(id),
  updated_at timestamptz not null default now(),
  constraint sales_current_records_part_check check (part in ('1', '4', '5', '6', '7', '9', '10', '11')),
  constraint sales_current_records_period_check check (period_start <= period_end),
  constraint sales_current_records_status_check check (current_status in ('active', 'changed_by_latest_xls', 'not_in_latest_xls', 'excluded')),
  constraint sales_current_records_scope_stable_key_unique unique (company_id, part, period_start, period_end, stable_key)
);

create table if not exists cn_sales.sales_import_change_summaries (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references cn_sales.sales_import_batches(id),
  company_id uuid not null,
  part text not null,
  period_start date not null,
  period_end date not null,
  inserted_count integer not null,
  updated_count integer not null,
  removed_from_current_count integer not null,
  no_change_count integer not null,
  amount_before numeric not null,
  amount_after numeric not null,
  amount_delta numeric not null,
  created_at timestamptz not null default now(),
  constraint sales_import_change_summaries_part_check check (part in ('1', '4', '5', '6', '7', '9', '10', '11')),
  constraint sales_import_change_summaries_period_check check (period_start <= period_end),
  constraint sales_import_change_summaries_inserted_count_check check (inserted_count >= 0),
  constraint sales_import_change_summaries_updated_count_check check (updated_count >= 0),
  constraint sales_import_change_summaries_removed_count_check check (removed_from_current_count >= 0),
  constraint sales_import_change_summaries_no_change_count_check check (no_change_count >= 0),
  constraint sales_import_change_summaries_amount_delta_check check (amount_delta = amount_after - amount_before)
);

create table if not exists cn_sales.sales_change_audit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  actor_id uuid null,
  actor_role text not null,
  part text not null,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  before_hash text null,
  after_hash text null,
  reason text not null,
  created_at timestamptz not null default now(),
  constraint sales_change_audit_logs_part_check check (part in ('1', '4', '5', '6', '7', '9', '10', '11')),
  constraint sales_change_audit_logs_action_check check (action in ('preview_accepted', 'dry_run_approved', 'sync_scope_planned', 'sync_scope_executed', 'close_sealed', 'rollback_planned'))
);

create index if not exists sales_import_batches_scope_created_idx
  on cn_sales.sales_import_batches (company_id, part, period_start, period_end, created_at desc);

create index if not exists sales_import_batches_file_hash_idx
  on cn_sales.sales_import_batches (company_id, file_hash);

create index if not exists sales_import_rows_batch_stable_key_idx
  on cn_sales.sales_import_rows (batch_id, stable_key);

create index if not exists sales_import_rows_part_ledger_date_idx
  on cn_sales.sales_import_rows (company_id, part, ledger_date);

create index if not exists sales_current_records_scope_status_idx
  on cn_sales.sales_current_records (company_id, part, period_start, period_end, current_status);

create index if not exists sales_current_records_scope_stable_key_idx
  on cn_sales.sales_current_records (company_id, part, stable_key);

create index if not exists sales_import_change_summaries_scope_created_idx
  on cn_sales.sales_import_change_summaries (company_id, part, period_start, period_end, created_at desc);

create index if not exists sales_change_audit_logs_part_created_idx
  on cn_sales.sales_change_audit_logs (company_id, part, created_at desc);

alter table cn_sales.sales_import_batches enable row level security;
alter table cn_sales.sales_import_rows enable row level security;
alter table cn_sales.sales_current_records enable row level security;
alter table cn_sales.sales_import_change_summaries enable row level security;
alter table cn_sales.sales_change_audit_logs enable row level security;

grant select on table
  cn_sales.sales_import_batches,
  cn_sales.sales_import_rows,
  cn_sales.sales_current_records,
  cn_sales.sales_import_change_summaries,
  cn_sales.sales_change_audit_logs
to authenticated;

-- Policy plan:
-- 1. Read policies must be company scoped and role scoped before apply.
-- 2. Server-side sync write policies remain deferred until WEB_ERP_XLS_SYNC_EXECUTE_APPROVED.
-- 3. Raw row payload, PII, secret, storage, seed, and production execution remain forbidden.
-- 4. Current-view removal is represented by current_status = 'not_in_latest_xls'; physical delete is forbidden.
