# CN_SALES STAGE F-3 Limited DB Apply Test Plan

## 1. Current Locked State

- PR #5 upload preview hardening: complete.
- PR #6 upload preview safety hotfix: complete.
- PR #7 confirm / DB apply design document: complete.
- PR #8 live metadata evidence report: complete.
- F-2 design document is merged.
- F-2E live metadata evidence is merged.
- Baseline main commit for this plan: `ba66a27`.
- Production deployment for the F-2E document merge was reported successful.
- F-3 limited apply has not started.
- DB write remains `NO`.
- Actual XLS preview remains `NO`.
- Confirm apply remains `NO`.

## 2. Entry Gate From F-2E

F-2E gate decision: `F-3_BLOCKED`.

Reasons carried forward from F-2E:

- Live target DB metadata could not be collected through the available Supabase MCP project list.
- Candidate target tables are source-inferred only.
- Live RLS, policy, grant, constraint, index, and row-estimate evidence is missing.
- Audit readiness is incomplete.
- Rollback readiness is incomplete.
- Approved test file, file hash, target part, row cap, operator, rollback owner, and execution window are not yet supplied.
- Dry-run plan approval is not yet supplied.

This document is allowed because it is plan-only. It does not approve F-3 execution.

## 3. Scope

This document defines the plan for a future limited DB apply test:

- Limited apply test entry criteria.
- Dry-run flow.
- Target table and no-write table boundaries.
- Target part, row cap, and file-hash controls.
- Audit requirements.
- Rollback requirements.
- Idempotency and duplicate-prevention rules.
- Stop conditions.
- Final approval template.

## 4. Non-Goals

This document does not perform or approve:

- DB apply execution.
- Confirm endpoint execution.
- Production URL POST.
- Migration, seed, or storage operation.
- Actual XLS preview.
- Operational data lookup.
- Client response or log output that includes raw rows, sensitive text, or env values.

## 5. F-3 Blockers From Evidence

| Blocker | Evidence | Required before F-3 |
|---|---|---|
| Live target metadata missing | F-2E live metadata status is `not_run_target_unavailable` | Provide sanitized Dashboard SQL Editor metadata or a trusted read-only SQL path to the actual target project. |
| Candidate target tables are source-inferred | F-2E target table list is from code and migration inspection | Confirm live columns, constraints, indexes, RLS, policies, grants, and aggregate row estimates. |
| Audit destination missing | F-2 and F-2E note no dedicated import audit table in source inspection | Approve an audit destination and safe summary fields before any apply. |
| Rollback owner and window missing | F-2 and F-2E require rollback by import batch id | Approve rollback owner, rollback window, and rollback procedure. |
| Transaction boundary unclear | F-2 notes current repository applies rows in application code | Add or approve an atomic apply boundary, or restrict the test to a clearly reversible path. |
| Runtime write scope not approved | F-2 requires explicit runtime gate approval | Confirm runtime write gates and operator role before dry-run or apply. |

## 6. Test Dataset Requirements

The first F-3 dataset must be minimal and explicitly approved.

Required:

- Test XLS is separately approved.
- Masked or copied sample data is preferred.
- Actual operational XLS use requires separate approval.
- Target part is specified.
- Max row cap is specified.
- File hash is recorded before any dry-run.
- File hash matches the approval template.
- The dataset is checked for customer-sensitive fields before any report or log is created.
- Rejected rows are summarized only with safe codes and counts.

Recommended defaults:

- `target_part`: one part only.
- `max_rows`: 3 to 10 rows.
- `apply_mode`: dry-run first.
- `production_post`: `NO` unless separately approved.

## 7. Target Part and Row Cap

The approval must fill every field below before F-3 can start:

- `target_part`
- `max_rows`
- `test_file_name`
- `test_file_hash`
- `operator`
- `execution_window`
- `rollback_owner`

Rules:

- The selected part must match the file-derived part.
- Row count must be less than or equal to `max_rows`.
- Any part mismatch blocks apply.
- Any row-cap mismatch blocks apply.
- Any unapproved file hash blocks apply.

## 8. Target Tables and Write Boundaries

These tables are source-inferred candidates from F-2 and F-2E. They are not yet approved for F-3 writes.

| Table | Role | Write Type | Allowed in F-3 | Evidence | Notes |
|---|---|---|---|---|---|
| `cn_sales.ledger_uploads` | Import batch header | create/status change | NO until approval | F-2/F-2E source evidence | Needs import batch id, hash strategy, audit status. |
| `cn_sales.upload_preview_results` | Server preview snapshot | preview snapshot | NO until approval | F-2/F-2E source evidence | Must not be client-trusted raw data. |
| `cn_sales.ledger_rows` | Canonical ledger rows | insert or content-change update | NO until approval | F-2/F-2E source evidence | Live uniqueness and identity hash evidence required. |
| `cn_sales.ledger_row_versions` | Row change history | append-only version | NO until approval | F-2/F-2E source evidence | Raw payload exposure must be excluded from logs/reports. |
| `cn_sales.sales_transactions` | Sales reporting facts | deterministic derived facts | NO until approval | F-2/F-2E source evidence | `customer_total` drives reporting totals. |
| `cn_sales.receipt_transactions` | Receipt reporting facts | deterministic derived facts | NO until approval | F-2/F-2E source evidence | Requires all-or-nothing apply. |
| `cn_sales.ar_snapshots` | Receivable snapshots | deterministic snapshot facts | NO until approval | F-2/F-2E source evidence | Replacement rules need live constraint confirmation. |
| `cn_sales.product_price_history` | Product price history | deterministic derived facts | NO until approval | F-2/F-2E source evidence | Item detail supports product and price history only. |
| `cn_sales.sales_parts` | Part master data | approved master upsert | NO until approval | F-2/F-2E source evidence | Seeded parts should be preferred. |
| `cn_sales.customers` | Customer master data | approved master upsert | NO until approval | F-2/F-2E source evidence | No sensitive values in logs or reports. |
| `cn_sales.customer_aliases` | Customer matching helper | approved alias upsert | NO until approval | F-2/F-2E source evidence | Optional mapping helper. |
| `cn_sales.products` | Product master data | approved master upsert | NO until approval | F-2/F-2E source evidence | Public ERP tables remain read-only. |
| `cn_sales.product_aliases` | Product matching helper | approved alias upsert | NO until approval | F-2/F-2E source evidence | Optional mapping helper. |
| `cn_sales.customer_product_usage` | Product usage summary | deterministic derived summary | NO until approval | F-2/F-2E source evidence | Duplicate-safe accumulation strategy required. |

Any table not listed in the final approval template is out of scope.

## 9. No-Write Tables

| Table/Schema | Reason | F-3 Rule |
|---|---|---|
| `public.products` | Existing ERP reference | NO WRITE |
| `public.vendors` | Existing ERP reference | NO WRITE |
| `public.order_lines` | Existing ERP reference | NO WRITE |
| `public.pricing_rules` | Existing ERP reference | NO WRITE |
| `public.v_monthly_sales` | Existing ERP view | NO WRITE |
| `public.v_vendor_receivables` | Existing ERP view | NO WRITE |
| `public.v_product_sales` | Existing ERP view | NO WRITE |
| Any `public` table not explicitly approved | Out of scope | NO WRITE |
| Any `cn_wms_dev` table | Out of scope | NO WRITE |
| Supabase storage buckets | Out of scope for F-3 limited DB apply | NO WRITE |

## 10. Dry-Run Flow

Dry-run must complete before any apply is considered.

Required dry-run sequence:

1. Verify approved file hash.
2. Parse and normalize with preview-only behavior.
3. Verify selected part against file-derived part.
4. Verify row count is within max row cap.
5. Verify required columns and safe parser result.
6. Simulate target table mapping.
7. Simulate duplicate and idempotency checks.
8. Produce rejected-row count and safe rejection codes.
9. Produce audit summary simulation.
10. Produce rollback simulation.
11. Produce a dry-run checksum.

Dry-run pass criteria:

- No part mismatch.
- Row count is within the approved cap.
- No unapproved rejected rows.
- Target table mapping is explicit.
- Duplicate check passes.
- Audit summary simulation passes.
- Rollback simulation passes.
- No raw rows, sensitive text, local paths, or env values appear in output.

Apply without dry-run PASS is forbidden.

## 11. Confirm Apply Flow

This flow is for a future F-3 execution only. It is not executed by this PR.

Required sequence:

1. Confirm operator approval.
2. Confirm final preview checksum.
3. Confirm dry-run PASS and dry-run checksum.
4. Create `import_batch_id`.
5. Enter approved atomic apply boundary.
6. Record audit pending summary.
7. Apply only approved limited rows.
8. Validate affected row counts.
9. Record audit success or failure summary.
10. Confirm rollback-ready state.
11. Return only safe count fields and result codes.

The server must revalidate; it must not trust client-provided preview rows.

## 12. Idempotency / Duplicate Prevention

Required keys:

- `source_file_hash`
- `preview_checksum`
- `selected_part_code`
- `normalized_row_hash`
- `import_batch_id`
- `operator_id`

Duplicate-prevention rule:

`source_file_hash + selected_part_code + normalized_row_hash` must not create duplicate canonical or derived rows.

Additional rules:

- Repeated confirm for the same preview must be safe.
- Stale preview checksum blocks apply.
- Duplicate import batch blocks apply.
- Same row identity with unchanged content is skipped.
- Same row identity with changed content requires version recording before derived facts are replaced.

## 13. Audit Log Requirements

Audit must be safe summary only.

Required fields:

- `import_batch_id`
- `actor` or `operator`
- `action`
- `target_part`
- `source_file_hash`
- `row_count`
- `applied_count`
- `rejected_count`
- `result`
- `error_code`
- `safe_summary_json`
- `created_at`

Forbidden audit content:

- Raw row full dump.
- `rawRowJson`.
- Env values.
- Customer-sensitive raw text.
- File contents.
- Parser stack details.

Audit destination is not approved yet. F-3 remains blocked until it is approved.

## 14. Rollback Plan

Rollback basis: `import_batch_id`.

Required before F-3:

- Rollback owner is named.
- Rollback window is approved.
- Affected table counts are recorded before and after rollback.
- Rollback creates its own audit event.
- Unknown-state recovery uses read-only reconciliation before retry.
- Existing row content changes can be restored or are blocked pending manual review.

Rollback cannot rely on manual editing of production tables.

## 15. Stop Conditions

Stop immediately if any condition occurs:

- Target table mismatch.
- Row count cap exceeded.
- Part mismatch.
- Duplicate detected.
- Audit write path unavailable.
- Rollback readiness unclear.
- Unexpected affected row count.
- Raw row, sensitive text, local path, or env value exposed.
- DB timeout.
- RLS, policy, or grant evidence unclear.
- Live constraints or indexes do not match expectations.
- Runtime write gate broader than approved.
- Any public ERP or `cn_wms_dev` write path appears.

## 16. Execution Window

Execution window must be filled in the final approval template before F-3 starts.

Minimum requirements:

- Operator is available for the full window.
- Rollback owner is available for the full window.
- No other import is running for the same part and period.
- The window allows dry-run, final gate, limited apply, read-only verification, and rollback if needed.
- If the window expires before final gate, stop and reschedule.

## 17. Operator Approval Checklist

The operator must approve:

- Test file identity.
- Test file hash.
- Target part.
- Max row cap.
- Target tables.
- No-write table boundary.
- Dry-run result.
- Audit destination.
- Rollback owner and rollback window.
- Execution window.
- Stop conditions.
- Post-apply read-only verification.
- Whether production POST is approved. Default is `NO`.

## 18. Validation Checklist

Before F-3 can run:

- F-2 design document is present on `main`.
- F-2E evidence report is present on `main`.
- F-3P plan is present on `main`.
- Approval template is complete.
- Approved file exists.
- Computed file hash matches approved hash.
- Selected part matches approved target part.
- Row count is within max row cap.
- Dry-run PASS is recorded.
- Target tables are approved.
- No-write tables are confirmed.
- Audit destination is approved.
- Rollback owner and rollback window are approved.
- Runtime write gates match approval.

## 19. Post-Apply Verification

Allowed verification for future F-3 is aggregate-only:

- Count by `import_batch_id`.
- Audit event count.
- `applied_count` and `rejected_count`.
- Safe status fields by batch.

Forbidden verification:

- Wildcard table reads.
- Raw customer row inspection.
- Sensitive field inspection.
- Full XLS row dumps.
- Browser response containing raw rows.

## 20. Recovery Procedure

If dry-run fails:

- Do not apply.
- Record safe failure reason.
- Fix the plan or dataset before another dry-run.

If apply fails before commit:

- Return failed status.
- Confirm no partial data using read-only aggregate checks.
- Record audit failure if audit path is available.

If apply state is unknown:

- Stop retries.
- Run read-only reconciliation by `import_batch_id`.
- Escalate to rollback owner.

If rollback succeeds:

- Record rollback audit.
- Report affected table counts only.

If rollback fails or state remains unclear:

- Stop all F-3 work.
- Mark the stage as failed.
- Do not retry until recovery is reviewed.

## 21. No-Go Conditions

F-3 is not allowed if any condition remains true:

- Approval template is incomplete.
- Test file/hash is missing.
- Target part is missing.
- Row cap is missing.
- Target table metadata is unconfirmed.
- Live RLS, policy, grant, constraint, index, or row-estimate evidence is missing.
- Audit destination is not approved.
- Rollback owner or rollback window is not approved.
- Dry-run PASS is missing.
- Runtime write gate is broad or unclear.
- Actual operational XLS use is not separately approved.
- Any no-write table appears in an apply boundary.

## 22. Final Approval Template

```text
F-3 LIMITED DB APPLY APPROVAL

I approve a limited DB apply test under the following constraints:

target_part:
test_file:
test_file_hash:
max_rows:
target_tables:
apply_mode:
rollback_owner:
execution_window:
operator:
stop_conditions:
confirm/DB apply approved: YES/NO
production POST approved: YES/NO
migration/seed/storage approved: NO
```

## 23. F-3 Decision

F-3 actual apply: `NOT APPROVED YET`.

Reason:

- Approval template is not filled.
- Test file and file hash are not provided.
- Target part and row cap are not approved.
- Target tables are not approved.
- Live metadata evidence gaps remain from F-2E.
- Audit destination is not approved.
- Rollback owner and rollback window are not approved.
- Dry-run PASS is not recorded.

F-3P status: plan is ready for review only.
