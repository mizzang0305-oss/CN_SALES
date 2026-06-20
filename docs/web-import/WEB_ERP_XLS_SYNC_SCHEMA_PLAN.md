# WEB_ERP_XLS_SYNC_SCHEMA_PLAN

Stage: W-5A_SCHEMA_DECISION_AND_SYNC_APPROVAL_PACKET

## 1. Decision

Recommended option: Option B, new current-view schema.

Reason:

- CN_SALES is not the ERP source system. ERP remains the source of truth, and ERP XLS is the input contract.
- The web service needs batch history, latest XLS snapshots, current records, change summaries, and actor audit evidence.
- Weekly reports, monthly rollups, receivables review, admin upload status, close status, and re-upload review all need a durable import history.
- The existing legacy `ledger_rows` and normalized tables are useful operational tables, but they do not cleanly separate uploaded XLS snapshots from the latest current view.

W-5A does not create or apply a migration. This is a schema decision and approval packet only.

## 2. Existing Schema Inspection

Found existing tables:

- `cn_sales.ledger_uploads`
- `cn_sales.upload_preview_results`
- `cn_sales.ledger_rows`
- `cn_sales.ledger_row_versions`
- `cn_sales.sales_transactions`
- `cn_sales.receipt_transactions`
- `cn_sales.ar_snapshots`

Missing W-0 target tables:

- `cn_sales.sales_import_batches`
- `cn_sales.sales_import_rows`
- `cn_sales.sales_current_records`
- `cn_sales.sales_import_change_summaries`
- `cn_sales.sales_change_audit_logs`

## 3. Option A: Reuse Legacy Tables

Strengths:

- No new migration required.
- Faster initial implementation.
- Existing `ledger_rows` and normalized tables already support basic sales and receivables reporting.

Risks:

- Import batch and current-view concepts remain mixed.
- Latest XLS snapshots are not isolated from operational current records.
- `removedFromCurrent` semantics are hard to express without physical deletion or ambiguous status flags.
- Change summary and audit evidence would need to be reconstructed from older structures.
- Admin upload status, close status, re-upload review, and rollback review would be weaker.

Decision: not recommended for the ERP XLS web-import product direction.

## 4. Option B: New Current-View Schema

Strengths:

- Separates immutable import evidence from current-view records.
- Preserves latest XLS snapshots by batch, part, period, and file hash.
- Supports insert/update/removed/noChange summaries without exposing raw rows.
- Supports admin audit, part close status, re-upload review, weekly reports, monthly reports, and receivables workflows.
- Allows physical delete to remain forbidden while current records can be marked `not_in_latest_xls`.

Risks:

- Requires a new migration.
- Requires RLS, grants, and indexes.
- Requires explicit owner approval before DB apply.
- Requires a careful W-5B/W-6 implementation path before any sync execution.

Decision: recommended.

## 5. Planned Tables

### 5.1 `cn_sales.sales_import_batches`

Purpose: one accepted XLS upload scope.

Planned columns:

- `id uuid primary key`
- `company_id uuid not null`
- `uploaded_by uuid null`
- `uploaded_role text not null`
- `part text not null`
- `period_start date not null`
- `period_end date not null`
- `file_name text not null`
- `file_hash text not null`
- `normal_rows integer not null`
- `excluded_rows integer not null`
- `amount_total numeric not null`
- `status text not null`
- `created_at timestamptz not null default now()`

Recommended constraints:

- Unique `(company_id, part, period_start, period_end, file_hash)`.
- Check `normal_rows >= 0`.
- Check `excluded_rows >= 0`.
- Check `period_start <= period_end`.

### 5.2 `cn_sales.sales_import_rows`

Purpose: aggregate-safe row snapshot evidence for an import batch.

Planned columns:

- `id uuid primary key`
- `batch_id uuid not null`
- `company_id uuid not null`
- `row_hash text not null`
- `stable_key text not null`
- `part text not null`
- `ledger_date date null`
- `amount numeric not null`
- `excluded_reason text null`
- `created_at timestamptz not null default now()`

Recommended constraints:

- Foreign key `batch_id` to `sales_import_batches(id)`.
- Unique `(batch_id, stable_key)`.

API rule:

- Do not return raw row payloads from this table.
- Sensitive fields must remain omitted, masked, or permission-scoped if later added.

### 5.3 `cn_sales.sales_current_records`

Purpose: query-optimized latest current view for an approved part and period scope.

Planned columns:

- `id uuid primary key`
- `company_id uuid not null`
- `part text not null`
- `period_start date not null`
- `period_end date not null`
- `stable_key text not null`
- `ledger_date date null`
- `amount numeric not null`
- `source_batch_id uuid not null`
- `current_status text not null`
- `first_seen_batch_id uuid not null`
- `last_seen_batch_id uuid not null`
- `updated_at timestamptz not null default now()`

Recommended statuses:

- `active`
- `changed_by_latest_xls`
- `not_in_latest_xls`
- `excluded`

Recommended constraints:

- Unique `(company_id, part, period_start, period_end, stable_key)`.
- Check `current_status` is one of the planned statuses.

### 5.4 `cn_sales.sales_import_change_summaries`

Purpose: aggregate change summary for reports and admin audit.

Planned columns:

- `id uuid primary key`
- `batch_id uuid not null`
- `company_id uuid not null`
- `part text not null`
- `period_start date not null`
- `period_end date not null`
- `inserted_count integer not null`
- `updated_count integer not null`
- `removed_from_current_count integer not null`
- `no_change_count integer not null`
- `amount_before numeric not null`
- `amount_after numeric not null`
- `amount_delta numeric not null`
- `created_at timestamptz not null default now()`

Recommended constraints:

- Foreign key `batch_id` to `sales_import_batches(id)`.
- Non-negative count checks.
- Check `amount_delta = amount_after - amount_before`.

### 5.5 `cn_sales.sales_change_audit_logs`

Purpose: actor/action audit evidence.

Planned columns:

- `id uuid primary key`
- `company_id uuid not null`
- `actor_id uuid null`
- `actor_role text not null`
- `part text not null`
- `action text not null`
- `target_type text not null`
- `target_id uuid not null`
- `before_hash text null`
- `after_hash text null`
- `reason text not null`
- `created_at timestamptz not null default now()`

Recommended actions:

- `preview_accepted`
- `dry_run_approved`
- `sync_scope_planned`
- `sync_scope_executed`
- `close_sealed`
- `rollback_planned`

## 6. Indexes

Recommended indexes:

- `sales_import_batches(company_id, part, period_start, period_end, created_at desc)`
- `sales_import_batches(company_id, file_hash)`
- `sales_import_rows(batch_id, stable_key)`
- `sales_import_rows(company_id, part, ledger_date)`
- `sales_current_records(company_id, part, period_start, period_end, current_status)`
- `sales_current_records(company_id, part, stable_key)`
- `sales_import_change_summaries(company_id, part, period_start, period_end, created_at desc)`
- `sales_change_audit_logs(company_id, part, created_at desc)`

## 7. RLS / Policy / Grant Requirements

Required before migration apply:

- Enable RLS on all five new tables.
- Company scoped read policies for all five tables.
- Write policies restricted to approved server-side sync flow.
- Role scope must still be enforced in application code before any write.
- `ADMIN` may request all supported parts.
- `PART_LEAD` may request only managed parts.
- `SALES_REP_PART_N` may request only assigned part.
- Raw row, PII, and secret output remain blocked for all roles.

## 8. Draft SQL Scope

The future migration should contain only DDL for the planned tables, constraints, indexes, RLS, and policies.

Forbidden in the future migration:

- Data backfill without separate approval.
- Seed data.
- Storage bucket/object changes.
- Physical delete behavior.
- Production sync execution.

W-5A does not add a migration file and does not run any SQL.

## 9. Rollback Plan

Rollback is not authorized in W-5A.

Future rollback must be separately approved and should include:

- migration identifier
- affected tables
- whether data exists in the new tables
- read-only backup/export evidence
- exact rollback approval phrase
- confirmation that ERP XLS source files remain unchanged

Rollback must never physically delete ERP source data.

## 10. Required Approval Phrase

Schema apply approval phrase:

`WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED`

This phrase is required before any migration file is applied to a database.

W-5A status:

- schema direction selected: Option B
- migration required: yes
- migration file created: no
- migration applied: no
- DB write: no
