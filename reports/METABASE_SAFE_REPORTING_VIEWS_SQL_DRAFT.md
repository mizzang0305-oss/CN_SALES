# CN_SALES Metabase Safe Reporting Views SQL Draft

STATUS: SQL_DRAFT_ONLY_NOT_EXECUTED

This document is a SQL draft only. CREATE VIEW, CREATE ROLE, GRANT, REVOKE, and SELECT statements below were not executed. Applying any database object, role, or privilege change is forbidden until a separate approval explicitly authorizes execution.

## 1. Purpose

This document turns the Metabase safe reporting requirements into a reviewable SQL draft. It is intended for human review before any database action. It does not create views, roles, grants, credentials, Metabase connections, migrations, or dashboard cards.

## 2. Safety Boundary

| Item | Status |
| --- | --- |
| SQL execution | NO |
| DB write | NO |
| Migration apply | NO |
| View creation | NO |
| Role creation | NO |
| Privilege change | NO |
| Metabase connection | NO |
| Credential/env change | NO |
| Production POST | NO |
| Vercel CLI/manual deploy | NO |
| Raw customer data output | NO |
| PII output | NO |

The draft uses aggregate or masked fields only. It avoids source payload columns, customer contact fields, business registration fields, address fields, memo bodies, local paths, diagnostic traces, and any broad row dump.

## 3. Source Review Basis

This draft was based on local migration files only:

- `supabase/migrations/0001_initial_mvp.sql`
- `supabase/migrations/0002_phase4a_master_data.sql`
- `supabase/migrations/0003_phase4b_claims_media.sql`
- `supabase/migrations/0004_phase4c_scope_mobile_briefing.sql`

No live database query was executed for this document.

## 4. Draft View List

1. `metabase_reporting.reporting_upload_batches_safe`
2. `metabase_reporting.reporting_ledger_summary_daily_safe`
3. `metabase_reporting.reporting_part_sales_daily_safe`
4. `metabase_reporting.reporting_customer_sales_summary_safe`
5. `metabase_reporting.reporting_product_sales_summary_safe`
6. `metabase_reporting.reporting_sync_diff_summary_safe`
7. `metabase_reporting.reporting_apply_audit_safe`

The `metabase_reporting` schema name is a draft boundary. It is not approved for creation in this stage.

## 5. View: reporting_upload_batches_safe

### Purpose

Provide safe upload batch health without exposing source file paths or row payloads.

### Source Tables

- `cn_sales.ledger_uploads`
- `cn_sales.sales_parts`
- `cn_sales.upload_preview_results`

### Allowed Fields

- upload identifier
- company identifier
- part code
- part name
- status
- upload period
- summary count fields
- created date
- committed date

### Excluded Fields

- storage path
- file name
- row result JSON
- source row JSON
- local path
- diagnostic details

### Filters

- date range
- part code
- status

### PII/Raw Row Policy

No customer, product, contact, address, registration, memo, or source payload fields are exposed.

### SQL Draft - NOT EXECUTED

```sql
-- SQL DRAFT ONLY. DO NOT EXECUTE.
create schema if not exists metabase_reporting;

create or replace view metabase_reporting.reporting_upload_batches_safe
with (security_invoker = true) as
select
  lu.id as upload_id,
  lu.company_id,
  sp.part_code,
  sp.part_name,
  lu.status,
  lu.period_start,
  lu.period_end,
  coalesce((lu.summary_json ->> 'totalRows')::integer, 0) as total_rows,
  coalesce((lu.summary_json ->> 'validRows')::integer, 0) as valid_rows,
  coalesce((lu.summary_json ->> 'excludedRows')::integer, 0) as excluded_rows,
  coalesce((lu.summary_json ->> 'warningCount')::integer, 0) as warning_count,
  lu.created_at::date as created_date,
  lu.committed_at::date as committed_date
from cn_sales.ledger_uploads lu
join cn_sales.sales_parts sp on sp.id = lu.part_id;
```

### Metabase Dashboard Usage

- Upload Health Dashboard
- Sync Audit Dashboard

### Risk Notes

Confirm the actual summary JSON keys before execution. If keys differ, the SQL draft must be adjusted before approval.

## 6. View: reporting_ledger_summary_daily_safe

### Purpose

Summarize ledger rows by day and part without exposing row payloads.

### Source Tables

- `cn_sales.ledger_rows`
- `cn_sales.sales_parts`

### Allowed Fields

- ledger date
- part code
- part name
- row type
- aggregate quantities and amounts
- row counts

### Excluded Fields

- customer names
- product names
- source payload JSON
- identity/content hashes
- row indexes

### Filters

- ledger date range
- part code
- row type

### PII/Raw Row Policy

Customer and product names are not exposed in this summary view.

### SQL Draft - NOT EXECUTED

```sql
-- SQL DRAFT ONLY. DO NOT EXECUTE.
create or replace view metabase_reporting.reporting_ledger_summary_daily_safe
with (security_invoker = true) as
select
  lr.company_id,
  lr.ledger_date,
  sp.part_code,
  sp.part_name,
  lr.row_type,
  count(lr.id) as row_count,
  sum(lr.quantity) as quantity_total,
  sum(lr.sales_amount) as sales_amount_total,
  sum(lr.receipt_amount) as receipt_amount_total,
  sum(lr.receipt_discount) as receipt_discount_total,
  max(lr.created_at)::date as latest_import_date
from cn_sales.ledger_rows lr
join cn_sales.sales_parts sp on sp.id = lr.part_id
where lr.ledger_date is not null
group by
  lr.company_id,
  lr.ledger_date,
  sp.part_code,
  sp.part_name,
  lr.row_type;
```

### Metabase Dashboard Usage

- Part Sales Daily Dashboard
- Monthly Close Dashboard

### Risk Notes

This view is aggregate-only and should not add row-level dimensions later without a separate review.

## 7. View: reporting_part_sales_daily_safe

### Purpose

Compare daily part sales, receipts, and monthly targets.

### Source Tables

- `cn_sales.sales_transactions`
- `cn_sales.receipt_transactions`
- `cn_sales.sales_parts`
- `cn_sales.monthly_targets`

### Allowed Fields

- transaction date
- part code
- part name
- sales total
- receipt total
- target values
- progress ratios

### Excluded Fields

- customer identifiers
- ledger row identifiers
- individual transaction rows

### Filters

- date range
- month
- part code

### PII/Raw Row Policy

No customer-level columns are exposed.

### SQL Draft - NOT EXECUTED

```sql
-- SQL DRAFT ONLY. DO NOT EXECUTE.
create or replace view metabase_reporting.reporting_part_sales_daily_safe
with (security_invoker = true) as
with sales_daily as (
  select
    company_id,
    part_id,
    transaction_date,
    sum(sales_amount) as sales_amount_total,
    count(id) as sales_row_count
  from cn_sales.sales_transactions
  group by company_id, part_id, transaction_date
),
receipt_daily as (
  select
    company_id,
    part_id,
    transaction_date,
    sum(total_receipt_amount) as receipt_amount_total,
    count(id) as receipt_row_count
  from cn_sales.receipt_transactions
  group by company_id, part_id, transaction_date
),
calendar_union as (
  select company_id, part_id, transaction_date from sales_daily
  union
  select company_id, part_id, transaction_date from receipt_daily
)
select
  cu.company_id,
  cu.transaction_date,
  sp.part_code,
  sp.part_name,
  coalesce(sd.sales_amount_total, 0) as sales_amount_total,
  coalesce(rd.receipt_amount_total, 0) as receipt_amount_total,
  coalesce(sd.sales_row_count, 0) as sales_row_count,
  coalesce(rd.receipt_row_count, 0) as receipt_row_count,
  coalesce(mt.sales_target, 0) as monthly_sales_target,
  coalesce(mt.receipt_target, 0) as monthly_receipt_target
from calendar_union cu
join cn_sales.sales_parts sp on sp.id = cu.part_id
left join sales_daily sd
  on sd.company_id = cu.company_id
  and sd.part_id = cu.part_id
  and sd.transaction_date = cu.transaction_date
left join receipt_daily rd
  on rd.company_id = cu.company_id
  and rd.part_id = cu.part_id
  and rd.transaction_date = cu.transaction_date
left join cn_sales.monthly_targets mt
  on mt.company_id = cu.company_id
  and mt.part_id = cu.part_id
  and mt.target_month = date_trunc('month', cu.transaction_date)::date;
```

### Metabase Dashboard Usage

- Part Sales Daily Dashboard
- Monthly Close Dashboard

### Risk Notes

This is a summary view. It should not be extended with customer detail in the same object.

## 8. View: reporting_customer_sales_summary_safe

### Purpose

Summarize customer activity with masked customer labels.

### Source Tables

- `cn_sales.sales_transactions`
- `cn_sales.receipt_transactions`
- `cn_sales.ar_snapshots`
- `cn_sales.customers`
- `cn_sales.sales_parts`

### Allowed Fields

- masked customer identifier
- part code
- transaction month
- aggregate sales
- aggregate receipts
- latest transaction date
- latest receivable balance

### Excluded Fields

- customer name
- phone
- address
- business registration number
- free-text memo
- raw source row

### Filters

- month
- part code
- masked customer identifier

### PII/Raw Row Policy

Customer display uses a deterministic masked identifier. Actual customer profile fields are excluded.

### SQL Draft - NOT EXECUTED

```sql
-- SQL DRAFT ONLY. DO NOT EXECUTE.
create or replace view metabase_reporting.reporting_customer_sales_summary_safe
with (security_invoker = true) as
with customer_sales as (
  select
    st.company_id,
    st.customer_id,
    st.part_id,
    date_trunc('month', st.transaction_date)::date as sales_month,
    sum(st.sales_amount) as sales_amount_total,
    count(st.id) as sales_row_count,
    max(st.transaction_date) as latest_sales_date
  from cn_sales.sales_transactions st
  where st.customer_id is not null
  group by st.company_id, st.customer_id, st.part_id, date_trunc('month', st.transaction_date)::date
),
customer_receipts as (
  select
    rt.company_id,
    rt.customer_id,
    rt.part_id,
    date_trunc('month', rt.transaction_date)::date as receipt_month,
    sum(rt.total_receipt_amount) as receipt_amount_total,
    max(rt.transaction_date) as latest_receipt_date
  from cn_sales.receipt_transactions rt
  where rt.customer_id is not null
  group by rt.company_id, rt.customer_id, rt.part_id, date_trunc('month', rt.transaction_date)::date
),
latest_ar as (
  select
    company_id,
    customer_id,
    part_id,
    max(snapshot_date) as latest_snapshot_date,
    max(ar_balance) as latest_ar_balance
  from cn_sales.ar_snapshots
  where customer_id is not null
  group by company_id, customer_id, part_id
)
select
  cs.company_id,
  encode(digest(cs.customer_id::text, 'sha256'), 'hex') as customer_masked_id,
  sp.part_code,
  sp.part_name,
  cs.sales_month,
  cs.sales_amount_total,
  coalesce(cr.receipt_amount_total, 0) as receipt_amount_total,
  cs.sales_row_count,
  cs.latest_sales_date,
  cr.latest_receipt_date,
  la.latest_snapshot_date,
  la.latest_ar_balance
from customer_sales cs
join cn_sales.sales_parts sp on sp.id = cs.part_id
left join customer_receipts cr
  on cr.company_id = cs.company_id
  and cr.customer_id = cs.customer_id
  and cr.part_id = cs.part_id
  and cr.receipt_month = cs.sales_month
left join latest_ar la
  on la.company_id = cs.company_id
  and la.customer_id = cs.customer_id
  and la.part_id = cs.part_id;
```

### Metabase Dashboard Usage

- Customer Sales Summary Dashboard
- Collection and Receivables Dashboard

### Risk Notes

This draft uses `digest`, which depends on database crypto function availability. If unavailable, replace it with an approved masking expression before execution.

## 9. View: reporting_product_sales_summary_safe

### Purpose

Summarize product sales and usage without exposing source rows.

### Source Tables

- `cn_sales.ledger_rows`
- `cn_sales.products`
- `cn_sales.product_groups`
- `cn_sales.sales_parts`
- `cn_sales.customer_product_usage`

### Allowed Fields

- product code
- masked product identifier
- product group
- part code
- ledger month
- quantity and sales totals
- customer count
- usage status counts

### Excluded Fields

- source row payload
- customer detail
- supplier-sensitive notes

### Filters

- month
- part code
- product group
- usage status

### PII/Raw Row Policy

No customer identity is exposed. Product name should be reviewed before display; the draft includes code and masked identifier by default.

### SQL Draft - NOT EXECUTED

```sql
-- SQL DRAFT ONLY. DO NOT EXECUTE.
create or replace view metabase_reporting.reporting_product_sales_summary_safe
with (security_invoker = true) as
select
  lr.company_id,
  date_trunc('month', lr.ledger_date)::date as ledger_month,
  sp.part_code,
  sp.part_name,
  pg.group_name as product_group_name,
  p.product_code,
  encode(digest(p.id::text, 'sha256'), 'hex') as product_masked_id,
  count(lr.id) as ledger_row_count,
  sum(lr.quantity) as quantity_total,
  sum(lr.sales_amount) as sales_amount_total,
  count(distinct lr.customer_id) as customer_count,
  count(distinct cpu.id) filter (where cpu.usage_status = 'active') as active_usage_count,
  count(distinct cpu.id) filter (where cpu.usage_status = 'churn_watch') as churn_watch_count,
  count(distinct cpu.id) filter (where cpu.usage_status = 'churn_risk') as churn_risk_count
from cn_sales.ledger_rows lr
join cn_sales.products p on p.id = lr.product_id
left join cn_sales.product_groups pg on pg.id = p.product_group_id
join cn_sales.sales_parts sp on sp.id = lr.part_id
left join cn_sales.customer_product_usage cpu
  on cpu.company_id = lr.company_id
  and cpu.product_id = lr.product_id
  and cpu.part_id = lr.part_id
where lr.product_id is not null
  and lr.ledger_date is not null
group by
  lr.company_id,
  date_trunc('month', lr.ledger_date)::date,
  sp.part_code,
  sp.part_name,
  pg.group_name,
  p.product_code,
  p.id;
```

### Metabase Dashboard Usage

- Product Sales Summary Dashboard

### Risk Notes

Review whether product code alone is acceptable for the intended audience. If not, expose only the masked identifier and group.

## 10. View: reporting_sync_diff_summary_safe

### Purpose

Represent dry-run and diff outcomes from upload/apply evidence without row-level payloads.

### Source Tables

- `cn_sales.ledger_uploads`
- `cn_sales.upload_preview_results`

### Allowed Fields

- upload identifier
- part code
- status
- candidate counts from summary JSON
- blocked reason from summary JSON
- created date

### Excluded Fields

- row results JSON
- source row payload
- file path
- local approval contents

### Filters

- created date
- part code
- status
- blocked reason

### PII/Raw Row Policy

Only summary values from safe JSON keys are allowed. Row result arrays are excluded.

### SQL Draft - NOT EXECUTED

```sql
-- SQL DRAFT ONLY. DO NOT EXECUTE.
create or replace view metabase_reporting.reporting_sync_diff_summary_safe
with (security_invoker = true) as
select
  lu.id as upload_id,
  lu.company_id,
  sp.part_code,
  sp.part_name,
  lu.status,
  coalesce((upr.summary_json ->> 'insertCandidates')::integer, 0) as insert_candidates,
  coalesce((upr.summary_json ->> 'updateCandidates')::integer, 0) as update_candidates,
  coalesce((upr.summary_json ->> 'deleteCandidates')::integer, 0) as delete_candidates,
  coalesce((upr.summary_json ->> 'noChangeRows')::integer, 0) as no_change_rows,
  coalesce((upr.summary_json ->> 'maxRows')::integer, 0) as max_rows,
  upr.summary_json ->> 'blockedReason' as blocked_reason,
  upr.created_at::date as preview_created_date
from cn_sales.upload_preview_results upr
join cn_sales.ledger_uploads lu on lu.id = upr.upload_id
join cn_sales.sales_parts sp on sp.id = lu.part_id;
```

### Metabase Dashboard Usage

- Sync Audit Dashboard
- Upload Health Dashboard

### Risk Notes

Confirm summary JSON keys before execution. If the JSON contains mixed key formats, normalize in an approved migration or use a safer source table.

## 11. View: reporting_apply_audit_safe

### Purpose

Summarize apply audit state using upload status and safe summary values.

### Source Tables

- `cn_sales.ledger_uploads`
- `cn_sales.upload_preview_results`
- `cn_sales.sales_parts`

### Allowed Fields

- upload identifier
- part code
- status
- applied date
- safe count fields
- read-back fields if stored in safe summary keys

### Excluded Fields

- operator session token
- raw response body
- source file contents
- local approval file contents
- row result JSON

### Filters

- applied date
- part code
- status

### PII/Raw Row Policy

No operator secrets, local approval contents, row payloads, or customer detail are exposed.

### SQL Draft - NOT EXECUTED

```sql
-- SQL DRAFT ONLY. DO NOT EXECUTE.
create or replace view metabase_reporting.reporting_apply_audit_safe
with (security_invoker = true) as
select
  lu.id as upload_id,
  lu.company_id,
  sp.part_code,
  sp.part_name,
  lu.status,
  coalesce((lu.summary_json ->> 'appliedCount')::integer, 0) as applied_count,
  coalesce((lu.summary_json ->> 'rejectedCount')::integer, 0) as rejected_count,
  coalesce((lu.summary_json ->> 'insertedRows')::integer, 0) as inserted_rows,
  coalesce((lu.summary_json ->> 'updatedRows')::integer, 0) as updated_rows,
  coalesce((lu.summary_json ->> 'deletedRows')::integer, 0) as deleted_rows,
  coalesce((lu.summary_json ->> 'readBackRows')::integer, 0) as read_back_rows,
  coalesce((upr.summary_json ->> 'maxRows')::integer, 0) as max_rows,
  lu.created_at::date as created_date,
  lu.committed_at::date as committed_date
from cn_sales.ledger_uploads lu
join cn_sales.sales_parts sp on sp.id = lu.part_id
left join cn_sales.upload_preview_results upr on upr.upload_id = lu.id
where lu.status in ('committed', 'failed', 'rejected');
```

### Metabase Dashboard Usage

- Sync Audit Dashboard
- Upload Health Dashboard

### Risk Notes

If apply evidence is not stored in `ledger_uploads.summary_json`, this view must be revised to use an approved audit table before execution.

## 12. Read-only Role Draft

### Included

- Dedicated role concept for Metabase read-only access.
- Access limited to safe reporting schema.
- No direct base table access.
- No write, migration, storage, or service-role usage.

### Executed

NO. This is documentation only.

### SQL Draft - NOT EXECUTED

```sql
-- SQL DRAFT ONLY. DO NOT EXECUTE.
create role metabase_readonly noinherit login;

grant usage on schema metabase_reporting to metabase_readonly;

grant select on
  metabase_reporting.reporting_upload_batches_safe,
  metabase_reporting.reporting_ledger_summary_daily_safe,
  metabase_reporting.reporting_part_sales_daily_safe,
  metabase_reporting.reporting_customer_sales_summary_safe,
  metabase_reporting.reporting_product_sales_summary_safe,
  metabase_reporting.reporting_sync_diff_summary_safe,
  metabase_reporting.reporting_apply_audit_safe
to metabase_readonly;
```

### Base Table Access

The draft does not grant access to `cn_sales` base tables. Before execution, reviewers must verify there are no inherited, default, or pre-existing privileges that bypass this boundary.

### Write Permission

No write permission is intended. Before execution, reviewers must explicitly verify that the Metabase identity cannot insert, modify, remove, or migrate data.

## 13. Dashboard Mapping

| Dashboard | Safe views |
| --- | --- |
| Upload Health Dashboard | `reporting_upload_batches_safe`, `reporting_sync_diff_summary_safe`, `reporting_apply_audit_safe` |
| Part Sales Daily Dashboard | `reporting_part_sales_daily_safe`, `reporting_ledger_summary_daily_safe` |
| Customer Sales Summary Dashboard | `reporting_customer_sales_summary_safe` |
| Product Sales Summary Dashboard | `reporting_product_sales_summary_safe` |
| Sync Audit Dashboard | `reporting_sync_diff_summary_safe`, `reporting_apply_audit_safe` |

## 14. Review Checklist Before Any Future Execution

- Confirm the target Supabase project and database are correct.
- Confirm a dedicated reporting schema name.
- Confirm all source table and JSON key names with read-only metadata evidence.
- Confirm `security_invoker` is supported on the target Postgres version.
- Confirm crypto masking functions are available or replace them with approved alternatives.
- Confirm no view exposes customer contact, address, registration, memo, source payload, local path, or diagnostic details.
- Confirm no base table access is granted to the Metabase identity.
- Confirm the connection credential rotation and storage plan.
- Confirm rollback plan for each database object.
- Obtain separate written approval before any SQL execution.

## 15. Validation Plan

For this document:

- Confirm changed files contain this report only.
- Run lint, tests, worker tests, and build.
- Run whitespace validation.
- Scan for sensitive configuration values.
- Scan for raw row and PII markers.
- Confirm data-changing SQL terms are absent.
- Confirm view/role/privilege SQL is marked draft-only and not executed.
- Confirm no XLS/XLSX files are staged or committed.
- Confirm no local approval files are staged or committed.

For future execution, not approved here:

- Execute only after human review and separate approval.
- Prefer a staged migration with rollback notes.
- Run on a non-production branch or isolated database first if available.
- Validate row counts and sampled aggregate consistency without exposing raw customer rows.
- Confirm Metabase can see only the safe reporting boundary.

## 16. Next Gate

Next gate: human review of this SQL draft.

Still forbidden until separately approved:

- SQL execution
- database object creation
- role creation
- privilege change
- migration apply
- Metabase connection
- credential creation or output
- production POST
- manual deploy or redeploy
