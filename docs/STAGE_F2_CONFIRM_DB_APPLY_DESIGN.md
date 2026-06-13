# CN_SALES STAGE F-2 Confirm / DB Apply Design Review

## 1. Current Locked State

- PR #5 and PR #6 are complete.
- Baseline main commit for this review: `698440a`.
- Production deployment for the upload preview safety line was reported successful.
- Production smoke is still separate because the live app may be behind the Vercel access gate.
- Real operational XLS preview has not been executed in this stage.
- Confirm / DB apply has not been executed in this stage.
- Migration, seed, storage, deploy, production POST, and real XLS preview are not part of this stage.

## 2. Scope

This document fixes the design gate before any limited DB apply stage. It covers:

- Proposed confirm / apply flow after upload preview.
- Target table boundaries inferred from source and migration files.
- Idempotency and duplicate prevention requirements.
- Audit log requirements.
- Rollback and recovery strategy.
- Dry-run and preview snapshot requirements.
- F-3 entry gates.

## 3. Non-Goals

- No confirm implementation in this PR.
- No DB write execution.
- No migration creation or apply.
- No seed apply.
- No storage write.
- No production POST.
- No real operational XLS preview.
- No deploy or redeploy.
- No raw customer data, XLS row dumps, secrets, tokens, cookies, or sessions.

## 4. Current Preview Flow

Source evidence:

- `src/app/api/uploads/preview/route.ts`
- `src/components/uploads/upload-center.tsx`
- `src/lib/import/import-service.ts`
- `src/lib/import/service-factory.ts`
- `src/lib/import/supabase-repository.ts`
- `tests/upload-preview-static.test.ts`
- `tests/upload-preview-safety.test.ts`

Current behavior:

- `/api/uploads/preview` is a Node runtime POST route.
- The route accepts multipart XLS/XLSX/JSON or fixture JSON input.
- Invalid file types return sanitized `INVALID_UPLOAD_FILE` responses.
- Preview response removes source row payload fields from the client response.
- Preview response advertises `apply.enabled = false` and `reason = PREVIEW_ONLY`.
- Part mismatch is allowed for preview, but disables DB apply in the UI.
- `createPreviewImportService()` forces preview-only mode with a preview-only repository and storage adapter.
- Preview-only path does not create repo-local `.local-data` persistence.
- Source-level Supabase preview write methods still exist in `SupabaseImportRepository.createPreview()`, but the production preview route does not call `createImportService()` after PR #5/#6.

Current preview limitations to preserve:

- No confirm call from preview.
- No normalized table write during preview.
- No raw parser traceback, local path, or raw row payload in client responses.

## 5. Proposed Confirm / Apply Flow

The future confirm path must not trust the client preview response as the source of truth.

Recommended flow:

1. User uploads an XLS file.
2. Preview route parses and normalizes rows.
3. Server creates a preview snapshot or returns a stateless checksum bundle.
4. User reviews summary and warnings.
5. Confirm request includes preview id, checksum, selected part code, and preview version.
6. Server reloads the server-side preview snapshot or recomputes the checksum.
7. Server revalidates permissions, selected part, row count, source hash, and row errors.
8. Server executes the apply stage inside one explicit apply boundary.
9. Audit log records only safe summary metadata.
10. Result returns counts, rejected-row counts, and safe error codes.
11. Rollback path is available by import batch id before F-3 is approved.

Mandatory rule: confirm must be a server-side revalidation flow, not a client echo of preview rows.

## 6. Data Contract

### Preview Response

Allowed fields:

- `ok`
- `previewId`
- `uploadId`
- `summary`
- `sampleRows`
- `rowTypeCounts`
- `blockedReasons`
- `mode`
- `apply.enabled`
- `apply.reason`

Forbidden fields:

- Source row full payload.
- Raw parser row object.
- Stack or traceback.
- Local filesystem path.
- Sensitive env values.

### Confirm Request

Required fields for future implementation:

- `previewId`
- `selectedPartCode`
- `previewChecksum`
- `previewVersion`
- `operatorAcknowledgement`

Optional but recommended:

- `dryRun`
- `expectedRowCount`
- `expectedFileHash`

### Apply Result

Required fields:

- `status`
- `importBatchId`
- `previewId`
- `inserted`
- `updated`
- `skipped`
- `rejected`
- `normalizedCounts`
- `auditId`
- `blockedReasons`

### Rejected Row

Client-safe fields only:

- `rowIndex`
- `code`
- `message`
- `field`

Do not include raw row payload or customer-sensitive text in rejected-row details.

### Audit Event

Safe summary only:

- `auditId`
- `importBatchId`
- `actorId` or actor hash
- `action`
- `sourceFileHash`
- `selectedPartCode`
- `rowCount`
- `appliedCount`
- `rejectedCount`
- `startedAt`
- `completedAt`
- `result`
- `errorCode`
- `safeSummaryJson`

### Rollback Event

Safe summary only:

- `rollbackId`
- `importBatchId`
- `actorId` or actor hash
- `reasonCode`
- `affectedTableCounts`
- `startedAt`
- `completedAt`
- `result`

## 7. Target Tables and Write Boundaries

Source and migration evidence identify these likely target tables.

| Table | Role in apply | Write boundary | Current evidence | Notes |
|---|---|---|---|---|
| `cn_sales.ledger_uploads` | Import batch header | Create/update status in apply flow | Migration and repository | Needs `import_batch_id`/hash strategy before F-3. |
| `cn_sales.upload_preview_results` | Server preview snapshot | Preview snapshot only | Migration and repository | Must not be trusted as raw client data. |
| `cn_sales.ledger_rows` | Canonical ledger rows | Insert or content-change update by identity hash | Migration and repository | Unique key: `(company_id, identity_hash)`. |
| `cn_sales.ledger_row_versions` | Row change history | Append-only version record | Migration and repository | Currently stores raw JSON; audit exposure must be safe. |
| `cn_sales.sales_transactions` | Sales reporting facts | Derived from `customer_total` rows | Migration and normalization | Do not include item detail in report sales totals. |
| `cn_sales.receipt_transactions` | Receipt reporting facts | Derived from receipt rows | Migration and normalization | Derived rows must be rebuilt deterministically. |
| `cn_sales.ar_snapshots` | Account receivable snapshots | Latest relevant AR rows | Migration and normalization | Needs deterministic replacement rules. |
| `cn_sales.product_price_history` | Product/unit-price history | Derived from item detail rows | Migration and normalization | Not counted as reporting sales total. |
| `cn_sales.sales_parts` | Master data | Ledger-derived part creation only when approved | Migration and repository | Existing seeded parts should be preferred. |
| `cn_sales.customers` | Master data | Ledger-derived customer upsert | Migration and repository | Must keep raw PII out of logs/responses. |
| `cn_sales.customer_aliases` | Matching helper | Ledger-derived alias upsert | Migration and repository | Optional reference, not public ERP mutation. |
| `cn_sales.products` | Master data | Ledger-derived product upsert | Migration and repository | Existing ERP public tables remain read-only. |
| `cn_sales.product_aliases` | Matching helper | Ledger-derived alias upsert | Migration and repository | Optional reference. |
| `cn_sales.customer_product_usage` | Product usage summary | Derived from item detail rows | Migration and repository | Requires duplicate-safe accumulation strategy. |

No-write tables:

- `public.products`
- `public.vendors`
- `public.order_lines`
- `public.pricing_rules`
- `public.v_monthly_sales`
- `public.v_vendor_receivables`
- `public.v_product_sales`
- Any `public` or `cn_wms_dev` table.

Evidence gap:

- Live DB metadata was not queried in this document generation step.
- F-3 must confirm actual table columns, constraints, indexes, RLS, policies, grants, and row counts using SELECT-only metadata queries before any apply test.

## 8. Idempotency and Duplicate Prevention

Required keys:

- `importBatchId`: stable id for the apply operation.
- `sourceFileHash`: hash of the uploaded file content.
- `selectedPartCode`: explicit operator-selected part.
- `previewChecksum`: hash of normalized preview rows plus selected scope.
- `normalizedRowHash`: per-row identity/content hash.
- `identityHash`: used to prevent duplicate canonical ledger rows.
- `contentHash`: used to distinguish unchanged vs changed ledger rows.

Design requirements:

- Repeated confirm for the same preview must be safe.
- Same file and same selected part should not create duplicate facts.
- Same row identity with unchanged content should be skipped.
- Same row identity with changed content must create an append-only version record before derived facts are replaced.
- Partial apply must be avoided in F-3; all-or-nothing is the default.
- A stale preview checksum must block confirm.

Current risk:

- The repository applies row-by-row in application code and does not expose a single database transaction boundary in the current implementation.
- F-3 should not proceed until transaction strategy and rollback are implemented or the test is constrained enough to be reversible.

## 9. Validation Rules Before Apply

Confirm must reject before any write when:

- Selected part and file-derived part do not match.
- Required columns are missing.
- Numeric fields cannot be parsed.
- Date fields are outside the approved period.
- Row count exceeds the approved F-3 maximum.
- Duplicate rows are detected inside the same file.
- Preview id is missing or stale.
- Preview checksum does not match.
- Upload id does not belong to the current actor/company.
- Product/customer mapping is ambiguous where a hard mapping is required.
- Amount or quantity sanity checks fail.
- Any row contains a parser error.
- Runtime write gates are disabled.

Rejected rows must be separated into safe error summaries without raw customer-sensitive text.

## 10. Audit Log Design

Current state:

- No dedicated import audit table is present in the source inspection.
- `ledger_uploads.status`, `committed_at`, and `ledger_row_versions` provide partial history.
- A dedicated append-only audit table is recommended before F-3.

Recommended audit table concept:

- `audit_id`
- `import_batch_id`
- `actor_id` or actor hash
- `action`
- `source_file_hash`
- `selected_part_code`
- `row_count`
- `applied_count`
- `rejected_count`
- `started_at`
- `completed_at`
- `result`
- `error_code`
- `safe_summary_json`

Forbidden audit content:

- Full XLS dump.
- Raw source row object.
- Secret or env values.
- Phone numbers, addresses, business identifiers, or full customer-sensitive notes.

## 11. Transaction / Atomicity Strategy

F-3 default must be all-or-nothing.

Recommended strategy:

- Move apply into a server-only transaction boundary.
- Prefer a database function in `cn_sales` or a server action that can guarantee atomicity.
- Precompute validated rows before entering the transaction.
- Acquire a batch-level lock keyed by `sourceFileHash + selectedPartCode + period`.
- Mark an import batch as applying only inside the transaction.
- Write canonical rows, derived facts, usage summaries, and audit summary together.
- On any validation or write failure, return no partial success.
- Timeouts must return an unknown state that requires read-only reconciliation before retry.

Current risk:

- Existing implementation deletes and reinserts derived rows for changed ledger rows without a visible transaction boundary.
- F-3 must either add an atomic apply path or constrain the test to a reversible non-production target.

## 12. Rollback and Recovery Plan

Required before F-3:

- Every apply must have an `importBatchId`.
- Every affected row should be traceable to the batch or to a changed ledger row.
- Rollback must be limited by `importBatchId`, company, selected part, and time window.
- Rollback must be operator-approved.
- Rollback must create its own audit event.
- Failed apply cleanup must be explicit.
- Retry behavior must be duplicate-safe.

Recovery paths:

- If apply fails before the transaction commits: return blocked or failed and keep no partial data.
- If state is unknown after timeout: run read-only reconciliation first.
- If content changed existing ledger rows: use version records to restore previous content or block rollback until manual review.
- If derived facts were regenerated: rebuild from canonical rows rather than relying on manual edits.

## 13. Error Handling Contract

Client-safe error shape:

```json
{
  "ok": false,
  "error": {
    "code": "APPLY_VALIDATION_FAILED",
    "message": "Apply validation failed.",
    "rejectedCount": 3
  }
}
```

Forbidden client response content:

- Stack.
- Traceback.
- SQL raw detail.
- Local path.
- Secret or env values.
- Raw row payload.

Server logs may include:

- `importBatchId`
- safe count fields
- result code
- duration
- actor hash

Server logs must not include:

- Raw rows.
- File content.
- customer-sensitive text.
- stack trace sent to the client.
- sensitive env values.

## 14. Permission / RLS / Server Boundary

Required:

- Confirm endpoint must stay server-only.
- Client must not import repositories directly.
- Service-role client must stay behind `server-only` boundary.
- Production runtime must not enable broad write mode.
- Actor identity must be loaded from the server session or approved admin fallback only in local/dev.
- `sales_rep` must not be able to run ledger import apply.
- Current repository allows `admin` and `team_leader` context loading; F-3 must explicitly decide whether `team_leader` is allowed for apply or preview only.
- RLS and grant evidence must be confirmed using metadata-only queries before apply.

Current code evidence:

- Service-role client imports `server-only`.
- Runtime env gate disables writes when `NODE_ENV` is production.
- `createPreviewImportService()` forces preview-only mode.
- `createImportService()` can create a write-capable Supabase repository only when runtime gates allow it.

## 15. Dry-Run and Preview Snapshot Strategy

Required stages:

1. Preview-only: parse, normalize, summarize, no persistence side effects beyond approved preview snapshot.
2. Dry-run apply: server reloads preview, validates as if applying, returns exact planned counts, no data writes.
3. Confirm apply: repeats validation and applies inside the approved transaction boundary.

Dry-run must be mandatory before F-3.

Preview snapshot must include:

- preview id
- selected part
- period
- file hash
- normalized row hash summary
- row count
- rejected count
- parser version
- schema version

Preview snapshot must not expose raw rows to the browser.

## 16. Observability and Safe Logging

Allowed:

- `importBatchId`
- preview id
- row counts
- normalized table counts
- result code
- duration
- actor hash
- selected part code

Forbidden:

- Raw rows.
- File contents.
- Customer-sensitive text.
- Stack trace in client response.
- Local filesystem paths in client response.
- Sensitive env values.

## 17. Test Plan

Minimum tests before F-3:

1. Confirm rejects part mismatch.
2. Confirm rejects stale preview checksum.
3. Confirm rejects duplicate import batch.
4. Confirm dry-run returns planned counts without writes.
5. Confirm apply is all-or-nothing.
6. Confirm writes audit summary.
7. Rollback by import batch id works in a test database.
8. Invalid row is rejected before writes.
9. Client response contains no raw row, stack, path, or sensitive env value.
10. Server-only boundary test for the import repository.
11. Client bundle does not import service-role or repository write paths.
12. Read-only ERP tables are not mutated.
13. `customer_total` drives reporting sales total; `item_detail` drives product and price history only.
14. Changed ledger row records a version before derived facts are replaced.

## 18. F-3 Limited DB Apply Gate

F-3 may start only after all items are approved:

- Target table evidence confirmed from live metadata.
- RLS and grants confirmed from live metadata.
- Rollback table/design confirmed.
- Audit log design confirmed.
- Dry-run apply PASS.
- Test dataset approved.
- Target part approved.
- Maximum row count approved.
- Operator approved.
- Backup or snapshot approved.
- Time window approved.
- Stop condition approved.
- Retry condition approved.

## 19. No-Go Conditions

F-3 is blocked if any condition is true:

- Rollback is unclear.
- Target table boundaries are unclear.
- RLS or policy evidence is missing.
- Duplicate prevention is missing.
- Audit log is missing.
- Real XLS contains unmasked sensitive data that would appear in logs or output.
- Production access context is unclear.
- Confirm endpoint exposes raw errors.
- Runtime write gate is broad or production-enabled.
- Public ERP tables are in any write boundary.
- Any public or `cn_wms_dev` table is in any write boundary.

## 20. Approval Checklist

Operator must approve:

- Test file identity.
- Target part.
- Maximum row count.
- Apply tables.
- Rollback owner.
- Execution window.
- Stop condition.
- Retry condition.
- Dry-run result.
- Audit log destination.
- Post-apply read-only verification queries.

## 21. Evidence Summary

| Evidence | Status | Source | Notes |
|---|---|---|---|
| Source code flow | confirmed | `src/app/api/uploads/preview/route.ts`, `src/app/api/uploads/confirm/route.ts`, `src/lib/import/*` | Preview-only and confirm paths are distinct. |
| Preview no-persistence boundary | confirmed | `src/lib/import/service-factory.ts` | `createPreviewImportService()` forces preview-only repository/storage. |
| Confirm route candidate | confirmed | `src/app/api/uploads/confirm/route.ts` | Existing route calls `createImportService()` and `service.confirm()`. |
| Target tables | confirmed from code/migrations | `supabase/migrations/0001_initial_mvp.sql`, `0002_phase4a_master_data.sql`, `src/lib/import/supabase-repository.ts` | Live metadata still needs confirmation. |
| RLS/policies | confirmed from migrations, live evidence missing | `supabase/migrations/*.sql` | F-3 requires live SELECT-only metadata. |
| Grants | confirmed from migrations, live evidence missing | `supabase/migrations/*.sql` | F-3 requires live SELECT-only metadata. |
| Audit table | needed | source inspection | No dedicated import audit table found. |
| Rollback path | needed | design | Existing version rows help but are not sufficient alone. |
| DB write execution | NO | execution log | This stage created docs only. |
| Production POST | NO | execution log | No live smoke was run. |
| Real XLS preview | NO | execution log | No operational file used. |

## 22. Live Read-Only Evidence Needed Before F-3

The following SELECT-only metadata queries are safe for Dashboard SQL Editor. Do not use `select *`. Do not paste results containing customer names, phone numbers, email, addresses, notes, file contents, or raw row payloads.

### Target table columns

```sql
select
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable
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
  kcu.column_name
from information_schema.table_constraints tc
left join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.table_schema = kcu.table_schema
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

### RLS and policies

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
order by tablename, policyname;
```

### Table row counts

```sql
select 'ledger_uploads' as table_name, count(*) as row_count from cn_sales.ledger_uploads
union all
select 'upload_preview_results', count(*) from cn_sales.upload_preview_results
union all
select 'ledger_rows', count(*) from cn_sales.ledger_rows
union all
select 'ledger_row_versions', count(*) from cn_sales.ledger_row_versions
union all
select 'sales_transactions', count(*) from cn_sales.sales_transactions
union all
select 'receipt_transactions', count(*) from cn_sales.receipt_transactions
union all
select 'ar_snapshots', count(*) from cn_sales.ar_snapshots
union all
select 'product_price_history', count(*) from cn_sales.product_price_history
union all
select 'customer_product_usage', count(*) from cn_sales.customer_product_usage;
```
