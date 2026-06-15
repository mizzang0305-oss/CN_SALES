# CN_SALES Metabase Schema Evidence and SQL Correction

## 1. Final Status

- FINAL_STATUS: SCHEMA_EVIDENCE_REPO_LOCAL_ONLY_SQL_CORRECTION_READY
- Scope: report-only schema evidence and SQL draft correction
- SQL executed: NO
- DB read query executed: NO
- DB write: NO
- Metabase connection: NO
- Credential or env change: NO

This report corrects the Metabase safe reporting SQL draft by using only repo-local evidence from migrations, source files, tests, and existing reports. It does not prove live database metadata.

## 2. PR #33 Merge Evidence

- PR: #33
- Merge status: merged
- Merge commit observed locally: `3e51a9f`
- Production deployment: auto deployment observed after merge
- Manual deploy: NO
- Production smoke method: HEAD only
- Production smoke result: `/`, `/uploads`, and `/dashboard` returned gated responses without 5xx

## 3. Schema Evidence Scope

Evidence source is limited to the repository:

- `supabase/migrations/0001_initial_mvp.sql`
- `src/lib/import/supabase-repository.ts`
- `src/lib/import/types.ts`
- `reports/METABASE_SAFE_REPORTING_VIEWS_SQL_DRAFT.md`
- `reports/METABASE_SAFE_REPORTING_VIEWS_SQL_REVIEW_RESULT.md`

Evidence not collected in this stage:

- live information schema metadata
- live enum metadata
- live JSON key sampling
- live grants and default privileges
- live RLS policy definitions
- Metabase connection verification

## 4. Upload Status Enum Evidence

Repo-local migration evidence defines the upload status enum as:

```sql
-- repo-local evidence only
cn_sales.upload_status = ('preview', 'committed', 'cancelled', 'failed')
```

The `cn_sales.ledger_uploads.status` column is defined as `cn_sales.upload_status not null default 'preview'`.

Validated enum values for SQL draft use:

| status | meaning |
| --- | --- |
| `preview` | upload preview exists, not applied |
| `committed` | upload was applied |
| `cancelled` | upload was cancelled |
| `failed` | upload failed |

`rejected` is not a valid `cn_sales.upload_status` value in repo-local migration evidence.

Application code does use `rejected` as a confirm response state and rejected row count concept. That is separate from the database enum used by `ledger_uploads.status`.

## 5. Table and Column Evidence

### `cn_sales.ledger_uploads`

Repo-local columns relevant to reporting:

- `id`
- `company_id`
- `part_id`
- `file_name`
- `storage_path`
- `period_start`
- `period_end`
- `status`
- `summary_json`
- `created_by`
- `created_at`
- `committed_at`

### `cn_sales.ledger_rows`

Repo-local columns relevant to aggregate reporting:

- `upload_id`
- `row_number`
- `ledger_date`
- `row_type`
- `customer_id`
- `product_id`
- `quantity`
- `unit_price`
- `sales_amount`
- `receipt_amount`
- `receipt_discount`
- `ar_balance`
- `identity_hash`
- `content_hash`

The table also has raw payload storage. Reporting views must not expose raw payloads.

### `cn_sales.upload_preview_results`

Repo-local columns relevant to reporting:

- `upload_id`
- `summary_json`
- `row_results_json`
- `created_at`

The preview result JSON may contain operator-facing counts and warnings. JSON keys still require live evidence before SQL execution approval.

### Normalized result tables

Repo-local reporting candidates:

- `cn_sales.sales_transactions`
- `cn_sales.receipt_transactions`
- `cn_sales.ar_snapshots`

These tables are safer reporting sources than raw ledger payloads because they already separate sales, receipt, and AR snapshot concepts.

## 6. SQL Draft Mismatch Findings

The current Metabase SQL draft contains this status filter:

```sql
-- SQL draft issue. Do not execute as-is.
where lu.status in ('committed', 'failed', 'rejected')
```

Finding:

- `committed`: valid enum value
- `failed`: valid enum value
- `rejected`: not a valid `cn_sales.upload_status` enum value

Correction required:

- Replace `rejected` with a valid enum value or remove it from the upload status filter.
- Keep rejected row counts as summary metrics, not as upload status values.

No enum migration is recommended in this stage.

## 7. Corrected SQL Guidance

Corrected status filter for terminal upload states:

```sql
-- SQL draft only. Do not execute without separate approval.
where lu.status in ('committed', 'failed', 'cancelled')
```

Corrected status grouping guidance:

```sql
-- SQL draft only. Do not execute without separate approval.
case
  when lu.status = 'committed' then 'committed'
  when lu.status = 'failed' then 'failed'
  when lu.status = 'cancelled' then 'cancelled'
  when lu.status = 'preview' then 'preview'
  else 'unknown'
end as upload_status_group
```

Rejected row counts should remain derived from preview or upload summary data, for example as an aggregate count field, not from `ledger_uploads.status`.

## 8. Still-Blocked Items Before SQL Execution

SQL execution remains blocked until a separate approval package resolves:

- live enum evidence for `cn_sales.upload_status`
- live column evidence for each reporting view source
- JSON summary key evidence for rejected and warning counts
- function availability for masking or hashing helpers
- RLS and grant evidence for Metabase access
- exact read-only role design
- non-production dry-run of every view definition
- rollback plan for view and role changes

## 9. Safety Boundary

- SQL execution: NO
- DB read query: NO
- DB write: NO
- migration apply: NO
- seed apply: NO
- storage write: NO
- view or role creation: NO
- grant or revoke execution: NO
- Metabase connection: NO
- credential or env output: NO
- raw row exposure: NO
- customer PII exposure: NO

## 10. Next Gate

Next gate is a separate SQL approval package. It must include live metadata evidence, corrected SQL text, explicit read-only role boundaries, rollback instructions, and a separate execution approval.

F-3 data apply and Metabase SQL execution remain prohibited until separately approved.
