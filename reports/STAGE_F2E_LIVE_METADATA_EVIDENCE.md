# CN_SALES STAGE F-2E Live SELECT-Only Metadata Evidence

## 1. Execution Summary

Status: blocked.

The live target database could not be safely reached through the available Supabase MCP project list.

What was executed:

- Git and GitHub status checks.
- Source inspection in this repository.
- Supabase MCP project list.
- Two metadata-only schema existence probes against MCP-visible projects.

What was not executed:

- No application data query.
- No row-level customer data query.
- No migration, seed, or storage operation.
- No confirm endpoint call.
- No production POST.
- No real XLS preview.
- No DB mutation.

## 2. Locked State

- Repository: `mizzang0305-oss/CN_SALES`
- Base branch: `main`
- Base commit: `61bbf0e`
- PR #7: merged
- F-3 entry: still blocked
- Work branch: `codex/stage-f2e-live-metadata-evidence`

## 3. Read-Only Rules

This stage allowed only:

- metadata reads
- catalog reads
- information schema reads
- policy and grant metadata reads
- row-count estimates or aggregate counts

This stage did not allow:

- DB mutation
- migration apply
- seed apply
- storage write
- production POST
- real XLS preview
- confirm execution
- raw customer row inspection
- PII inspection
- secret or env value output

## 4. Source Code Findings

### Preview route

Source: `src/app/api/uploads/preview/route.ts`

- The preview route is `POST` only.
- Runtime is fixed to Node.
- Invalid file responses are sanitized.
- Preview responses expose safe summary/sample fields only.
- Preview response returns `apply.enabled = false`.
- Preview route uses `createPreviewImportService()`, which forces preview-only mode.

### Confirm route

Source: `src/app/api/uploads/confirm/route.ts`

- Existing route accepts `previewId` or `uploadId`.
- It calls `createImportService()` and then `service.confirm(previewId)`.
- Current route is an implementation candidate, not an approved F-3 execution path.
- F-3 must add stronger revalidation, safe error contract, audit, rollback, and transaction strategy before any limited apply test.

### Service factory

Source: `src/lib/import/service-factory.ts`

- `createPreviewImportService()` returns preview-only repository and storage.
- `createImportService()` can create a Supabase repository only when runtime write gates allow it.
- Production runtime write mode remains blocked by environment checks.
- Service-role client is imported through a server-only module.

### Repository

Source: `src/lib/import/supabase-repository.ts`

Candidate write path is `SupabaseImportRepository.confirmPreview(preview)`.

Candidate table groups inferred from source:

- upload header and preview snapshot
- canonical ledger rows
- ledger row versions
- normalized reporting facts
- master data and aliases
- customer product usage

Current design concern:

- The repository applies row-by-row in application code.
- A single transaction boundary is not yet evident.
- A dedicated audit table is not yet present.
- Rollback is design-required before F-3.

## 5. Live Schema Evidence

Live target evidence status: `not_run_target_unavailable`.

Access findings:

- Local `.env.local` exists and is not tracked.
- Local Supabase URL ref and project ref match each other.
- Local target ref is not present in the MCP-visible project list.
- MCP-visible project count: 2.
- Metadata-only schema probes on both MCP-visible projects found `cn_sales_schema_exists = false`.

Safe query type used for probes:

```sql
select
  exists (
    select 1
    from information_schema.schemata
    where schema_name = 'cn_sales'
  ) as cn_sales_schema_exists,
  (
    select count(*)::bigint
    from information_schema.tables
    where table_schema = 'cn_sales'
  ) as cn_sales_table_count,
  (
    select count(*)::bigint
    from information_schema.tables
    where table_schema = 'public'
  ) as public_table_count;
```

Probe summary:

| Probe scope | cn_sales schema | cn_sales table count | public table count |
|---|---:|---:|---:|
| MCP-visible project A | false | 0 | 68 |
| MCP-visible project B | false | 0 | 14 |

Because neither MCP-visible project contains the expected `cn_sales` schema and the local target is not MCP-visible, no further live metadata queries were executed.

## 6. Candidate Target Tables

These are source-inferred candidates only. They still require live target confirmation.

| Table | Role | Evidence source | F-3 status |
|---|---|---|---|
| `cn_sales.ledger_uploads` | import batch header | migration and repository | needs live metadata |
| `cn_sales.upload_preview_results` | preview snapshot | migration and repository | needs live metadata |
| `cn_sales.ledger_rows` | canonical ledger rows | migration and repository | needs live metadata |
| `cn_sales.ledger_row_versions` | content-change history | migration and repository | needs live metadata |
| `cn_sales.sales_transactions` | sales reporting fact | migration and normalization | needs live metadata |
| `cn_sales.receipt_transactions` | receipt reporting fact | migration and normalization | needs live metadata |
| `cn_sales.ar_snapshots` | receivable snapshot | migration and normalization | needs live metadata |
| `cn_sales.product_price_history` | item price history | migration and normalization | needs live metadata |
| `cn_sales.sales_parts` | part master data | migration and repository | needs live metadata |
| `cn_sales.customers` | customer master data | migration and repository | needs live metadata |
| `cn_sales.customer_aliases` | customer alias mapping | migration and repository | needs live metadata |
| `cn_sales.products` | product master data | migration and repository | needs live metadata |
| `cn_sales.product_aliases` | product alias mapping | migration and repository | needs live metadata |
| `cn_sales.customer_product_usage` | product usage summary | migration and repository | needs live metadata |

## 7. No-Write Tables

These tables remain outside the confirm/apply write boundary:

- `public.products`
- `public.vendors`
- `public.order_lines`
- `public.pricing_rules`
- `public.v_monthly_sales`
- `public.v_vendor_receivables`
- `public.v_product_sales`
- any `public` table
- any `cn_wms_dev` table

## 8. RLS / Policy Evidence

Live evidence: `not_run_target_unavailable`.

Source evidence:

- Migration files enable RLS for `cn_sales` operational tables.
- Migration files define company-scoped read policies.
- Write policies are admin-scoped in migration files.
- F-3 still requires live policy and grant metadata from the actual target DB.

## 9. Grants / Permissions Evidence

Live evidence: `not_run_target_unavailable`.

Source evidence:

- Migration files grant `cn_sales` schema usage to authenticated and service role.
- Migration files grant selected reads to authenticated.
- Migration files grant broad table/routine/sequence privileges to service role.
- Browser code must not directly import service-role write paths.

F-3 blocker:

- Live grants on the actual target database are not confirmed.

## 10. Index / Constraint Evidence

Live evidence: `not_run_target_unavailable`.

Source evidence:

- `cn_sales.ledger_rows` uses a company plus identity hash uniqueness rule.
- `cn_sales.ar_snapshots` has an identity uniqueness rule.
- `cn_sales.customer_product_usage` has a company/customer/product/part uniqueness rule.
- Alias and ERP mapping tables have uniqueness rules in migrations.

F-3 blocker:

- Live constraints and indexes on the actual target database are not confirmed.

## 11. Audit / Rollback Readiness

Audit readiness: not ready.

- No dedicated import audit table was found in source inspection.
- `ledger_uploads.status` and `ledger_row_versions` provide partial traceability only.
- F-3 should not run until an audit destination and rollback owner are approved.

Rollback readiness: not ready.

- Rollback needs an approved import batch key.
- Rollback needs table-specific affected-row summaries.
- Rollback needs an operator and time window.
- Unknown-state recovery must use read-only reconciliation before retry.

## 12. Idempotency Evidence

Source evidence:

- `identityHash` prevents duplicate canonical rows in design and migration.
- `contentHash` differentiates unchanged and changed rows.
- Existing code records versions for changed rows.

Required before F-3:

- stable `importBatchId`
- `sourceFileHash`
- selected part code
- preview checksum
- dry-run result checksum
- duplicate confirm rejection
- stale preview rejection

## 13. Row Estimate Summary

Live target row estimates: `not_run_target_unavailable`.

The only live row-related metadata gathered was table-count metadata from MCP-visible projects, and neither project contained `cn_sales`.

No customer rows, ledger rows, or PII-bearing records were queried.

## 14. Evidence Gaps

The following must be supplied before F-3:

- Actual target project must be visible to the SQL execution path, or the operator must paste Dashboard SQL Editor results.
- Live `cn_sales` table columns.
- Live constraints.
- Live indexes.
- Live RLS status.
- Live policies.
- Live grants.
- Live row estimates or aggregate counts.
- Audit destination decision.
- Rollback plan approval.
- Dry-run plan approval.

## 15. F-3 Gate Decision

Decision: `F-3_BLOCKED`.

Reasons:

- Live target DB metadata could not be collected through the available MCP project list.
- Candidate target tables are source-inferred only.
- Live RLS, policy, grants, constraints, indexes, and row estimates are missing.
- Audit and rollback readiness are not complete.

## 16. Required Approvals Before F-3

Required next steps:

1. Make the actual CN_SALES Supabase project available to the read-only SQL execution path, or provide Dashboard SQL Editor metadata results.
2. Confirm `cn_sales` target table metadata.
3. Confirm no-write table boundary.
4. Confirm live RLS and policies.
5. Confirm grants.
6. Approve audit destination.
7. Approve rollback owner and rollback window.
8. Approve dry-run plan.
9. Approve test file, target part, and maximum row count.

## 17. Dashboard SQL Editor Evidence Template

If MCP access remains unavailable, the operator can run these metadata-only queries in Dashboard SQL Editor and paste sanitized results. Do not paste row data containing customer names, phone numbers, email addresses, addresses, notes, file contents, or raw row payloads.

### Target table columns

```sql
select
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'cn_sales'
  and table_name in (
    'ledger_uploads',
    'upload_preview_results',
    'ledger_rows',
    'ledger_row_versions',
    'sales_transactions',
    'receipt_transactions',
    'ar_snapshots',
    'product_price_history',
    'sales_parts',
    'customers',
    'customer_aliases',
    'products',
    'product_aliases',
    'customer_product_usage'
  )
order by table_name, ordinal_position;
```

### Constraints

```sql
select
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  kcu.ordinal_position
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_schema = kcu.constraint_schema
 and tc.constraint_name = kcu.constraint_name
where tc.table_schema = 'cn_sales'
  and tc.table_name in (
    'ledger_uploads',
    'upload_preview_results',
    'ledger_rows',
    'ledger_row_versions',
    'sales_transactions',
    'receipt_transactions',
    'ar_snapshots',
    'product_price_history',
    'sales_parts',
    'customers',
    'customer_aliases',
    'products',
    'product_aliases',
    'customer_product_usage'
  )
order by tc.table_name, tc.constraint_name, kcu.ordinal_position;
```

### Indexes

```sql
select
  schemaname,
  tablename,
  indexname,
  indexdef
from pg_indexes
where schemaname = 'cn_sales'
  and tablename in (
    'ledger_uploads',
    'upload_preview_results',
    'ledger_rows',
    'ledger_row_versions',
    'sales_transactions',
    'receipt_transactions',
    'ar_snapshots',
    'product_price_history',
    'sales_parts',
    'customers',
    'customer_aliases',
    'products',
    'product_aliases',
    'customer_product_usage'
  )
order by tablename, indexname;
```

### RLS status

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'cn_sales'
  and c.relkind in ('r', 'p')
order by c.relname;
```

### Policies

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
from pg_policies
where schemaname = 'cn_sales'
order by tablename, policyname;
```

### Grants

```sql
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'cn_sales'
order by table_name, grantee, privilege_type;
```

### Row estimates

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.reltuples::bigint as estimated_rows
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'cn_sales'
  and c.relkind in ('r', 'p')
order by c.relname;
```
