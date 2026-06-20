# Web ERP XLS Sync Design

Stage: W-0_WEB_ERP_XLS_SYNC_DESIGN

## 1. Product Direction

CN_SALES is not an ERP replacement.

- ERP remains the source system.
- ERP-exported XLS files are the input contract for this web service.
- CN_SALES provides upload validation, aggregate preview, dry-run comparison, current-view synchronization, dashboards, receivables workflow support, reports, and audit evidence.
- CN_SALES must not make independent ledger corrections or business judgments.
- Discounts, returns, cancellations, amount corrections, and deleted-looking changes follow the latest ERP XLS result.

The web service should preserve history through batches, snapshots, current records, change summaries, and audit logs. It should not physically delete ledger evidence.

## 2. Sealed Sync Baseline

Already sealed DB sync ranges must not be rerun by this design stage:

- part 11, 2026-06-01 to 2026-06-06
- part 11, 2026-06-07 to 2026-06-12
- part 1, 2026-06-01 to 2026-06-06
- part 4, 2026-06-01 to 2026-06-06
- part 4, 2026-06-07 to 2026-06-12
- part 7, 2026-06-01 to 2026-06-06

Existing G/H/I/J/K/N apply and closure stages remain sealed. W-0 performs no apply, no closure rerun, and no DB write.

## 3. User-Facing Screens

### 3.1 Part Import

Route: `/part/import-sales`

Purpose:

- Upload a sales XLS for the signed-in user's allowed part.
- Show aggregate preview.
- Run dry-run against the current view.
- Show change summary.
- Execute approved scope sync in a later stage.
- Show sync result.

Part users cannot upload or sync another part.

### 3.2 Part Sales Dashboard

Route: `/part/sales-dashboard`

Purpose:

- Customer sales summary.
- Daily sales trend.
- Product sales trend.
- Week-over-week and month-over-month movement.
- Receivables connection for allowed customers and part scope.

### 3.3 Admin Sales Status

Route: `/admin/sales-status`

Purpose:

- All-part sales status.
- Part upload status.
- Part closing status.
- Part-level anomaly review.
- Receivables connection status.
- Weekly and monthly report management.

### 3.4 Admin Import Audit

Route: `/admin/import-audit`

Purpose:

- All-part XLS upload history.
- Preview, dry-run, and sync result history.
- Batch-level file hash, period, status, actor, and aggregate counts.
- Change summary and audit log review.

### 3.5 Reports

Routes:

- `/reports/weekly`
- `/reports/monthly`

Purpose:

- Part-level weekly sales summary.
- Important customer movement summary.
- Receivables and collection check.
- Carry-over items.
- Next-week follow-up items.
- Monthly cumulative notes.

Reports must use aggregate and authorized masked views, not raw row dumps.

## 4. Permission Model

Roles:

- `SALES_REP_PART_1`
- `SALES_REP_PART_4`
- `SALES_REP_PART_5`
- `SALES_REP_PART_6`
- `SALES_REP_PART_7`
- `SALES_REP_PART_9`
- `SALES_REP_PART_10`
- `SALES_REP_PART_11`
- `PART_LEAD`
- `ADMIN`

### 4.1 Part Sales Rep

Allowed:

- Upload XLS for assigned part only.
- Preview assigned part only.
- Dry-run assigned part only.
- Sync assigned part only after explicit approval gates exist.
- View sales and receivables for assigned part only.

Blocked:

- Upload, dry-run, sync, dashboard, receivables, and report access for other parts.
- Raw row unrestricted output.
- PII or secret output.
- Physical delete, full sync, production mode write, or unauthorized rollback.

### 4.2 Part Lead

Allowed:

- Upload XLS for managed parts only.
- Preview, dry-run, and sync managed parts only after approval gates exist.
- View dashboards, reports, and receivables for managed parts.

Blocked:

- Managed-range bypass.
- Access or sync outside the assigned managed part set.
- Raw row unrestricted output.
- Physical delete, full sync, production mode write, or unauthorized rollback.

### 4.3 Admin

Allowed:

- Upload XLS for parts 1, 4, 5, 6, 7, 9, 10, and 11.
- Preview all parts.
- Dry-run all parts.
- Sync all parts after explicit approval gates exist.
- View all-part sales, receivables, report, closing, and audit status.
- Review close sealing, re-upload approval, and rollback plans.

Still blocked:

- Raw row unrestricted output.
- PII or secret output.
- Physical delete.
- Unlimited full sync.
- Production mode `dryRun=false`.
- Rollback without separate approval.

### 4.4 Required Permission Tests

Minimum W-3 tests:

- Part 1 rep uploads part 1 XLS: allow.
- Part 1 rep uploads part 4 XLS: block.
- Part 4 rep syncs part 4: allow when later sync gate exists.
- Part 4 rep syncs part 11: block.
- `PART_LEAD` uploads managed part: allow.
- `PART_LEAD` uploads unmanaged part: block.
- `ADMIN` uploads parts 1, 4, 5, 6, 7, 9, 10, and 11: allow.
- `ADMIN` previews, dry-runs, syncs, and closure-audits all parts: allow when later gates exist.
- `ADMIN` raw row, PII, or secret output: block.
- `ADMIN` physical delete, full sync, or production `dryRun=false`: block.

## 5. Data Reflection Policy

### 5.1 Latest XLS Controls Current View

Each import is scoped by:

- part
- period_start
- period_end
- file_hash

The current view reflects the latest accepted XLS for that scope. History remains available through batches, row snapshots, change summaries, and audit logs.

### 5.2 New Rows

Condition:

- Row exists in latest XLS snapshot.
- Matching current record does not exist.

Action:

- Add to current view as active.
- Count as `inserted_count`.

### 5.3 Changed Rows

Condition:

- Row exists in latest XLS snapshot and current view.
- Amount, quantity, unit price, discount-reflected value, or another tracked comparison field differs.

Action:

- Update current view to latest XLS value.
- Preserve previous and new hashes in audit evidence.
- Count as `updated_count`.
- Include amount movement in `amount_delta`.

The web service does not decide whether the difference is a discount, return, cancellation, or correction. The latest ERP XLS value wins.

### 5.4 Rows Missing From Latest XLS

Condition:

- Current record exists.
- Matching row does not exist in latest XLS snapshot.

Action:

- Do not physically delete.
- Mark current record as `not_in_latest_xls`.
- Count as `removed_from_current_count`.

### 5.5 Excluded Rows

Excluded rows may be stored as import snapshot evidence with `excluded_reason`, but they should not become active current records.

## 6. Data Model

### 6.1 `sales_import_batches`

Upload unit and status tracker.

Columns:

- id
- uploaded_by
- uploaded_role
- part
- period_start
- period_end
- file_name
- file_hash
- normal_rows
- excluded_rows
- amount_total
- status
- created_at

### 6.2 `sales_import_rows`

ERP XLS row snapshot.

Columns:

- id
- batch_id
- row_hash
- stable_key
- part
- ledger_date
- amount
- excluded_reason
- created_at

Rules:

- Store snapshot evidence for comparison and audit.
- Do not return raw rows through preview, dry-run, report, or admin audit APIs.
- Sensitive customer fields must be masked or scoped by permission if later added.

### 6.3 `sales_current_records`

Query-optimized latest view.

Columns:

- id
- part
- period_start
- period_end
- stable_key
- ledger_date
- amount
- source_batch_id
- current_status
- first_seen_batch_id
- last_seen_batch_id
- updated_at

Statuses:

- `active`
- `changed_by_latest_xls`
- `not_in_latest_xls`
- `excluded`

### 6.4 `sales_import_change_summaries`

Aggregate change summary for each batch.

Columns:

- id
- batch_id
- part
- period_start
- period_end
- inserted_count
- updated_count
- removed_from_current_count
- no_change_count
- amount_before
- amount_after
- amount_delta
- created_at

### 6.5 `sales_change_audit_logs`

Actor and change audit log.

Columns:

- id
- actor_id
- actor_role
- part
- action
- target_type
- target_id
- before_hash
- after_hash
- reason
- created_at

## 7. API Design

### 7.1 `POST /api/sales-import/preview`

Purpose:

- Parse uploaded XLS.
- Compute file hash.
- Return aggregate preview only.
- Perform no DB write.

Response shape:

```json
{
  "fileHash": "sha256:...",
  "part": "4",
  "periodStart": "2026-06-01",
  "periodEnd": "2026-06-06",
  "normalRows": 1295,
  "excludedRows": 175,
  "amountTotal": 338742294,
  "rawRowsReturned": false
}
```

### 7.2 `POST /api/sales-import/dry-run`

Purpose:

- Compare latest XLS preview with current records.
- Return aggregate change plan only.
- Perform no DB write.

Response shape:

```json
{
  "primaryScopeRows": 1295,
  "existingScopedRows": 1000,
  "insertCandidates": 295,
  "updateCandidates": 12,
  "removedFromCurrentCandidates": 3,
  "noChangeRows": 985,
  "amountBefore": 330000000,
  "amountAfter": 338742294,
  "amountDelta": 8742294,
  "planReady": true,
  "rawRowsReturned": false
}
```

### 7.3 `POST /api/sales-import/sync-scope`

Purpose:

- Update CN_SALES current view to latest approved XLS scope.
- Preserve import batch, row snapshots, change summary, and audit logs.
- This is not ERP source modification.

Required guards:

- Actor role and part scope check.
- Exact part and period check.
- Exact file hash check.
- Existing preview batch check.
- Latest dry-run result check.
- Raw row response blocked.
- Physical delete blocked.
- Full sync blocked unless a later explicit approval policy defines a bounded scope.
- Production mode `dryRun=false` blocked.

## 8. Future Stage Plan

### W-1 Preview UI/API

- Build `/api/sales-import/preview`.
- Build upload entry UI for `/part/import-sales` and admin flow.
- Return aggregate preview only.
- DB write remains forbidden.

### W-2 Dry-Run UI/API

- Build `/api/sales-import/dry-run`.
- Compare latest XLS aggregate rows to current view.
- Return insert, update, removed, no-change, and amount delta aggregates.
- DB write remains forbidden.

### W-3 Role Scope

- Implement role-to-part authorization.
- Add tests for part rep, part lead, and admin behavior.
- Enforce cross-part upload, preview, dry-run, and sync blocking.

### W-4 Sync Scope

- Implement approved scope sync.
- Create import batch, row snapshots, current record updates, change summaries, and audit logs.
- Do not physically delete missing rows.
- Require explicit approval gates before write paths are enabled.

### W-5 Dashboard And Reports

- Build part dashboard, admin status, import audit, weekly report, monthly report, and receivables connections.
- Use aggregate and permission-scoped data.
- Keep raw row and PII exposure guarded.

## 9. Safety Rules

W-0 and later implementation must preserve:

- No raw row unrestricted output.
- No PII or secret/env output.
- No production POST for local approval workflows.
- No migration/seed/storage during W-0.
- No physical delete.
- No unbounded full sync.
- No rollback without separate approval.
- No rerun of sealed G/H/I/J/K/N stages.
- Unrelated untracked files, including `docs/adsense/`, remain out of staging and PR scope.

## 10. W-0 Non-Goals

W-0 does not implement:

- Upload API.
- Dry-run API.
- Sync API.
- DB schema migration.
- DB write.
- Storage write.
- Deployment.
- Production POST.
