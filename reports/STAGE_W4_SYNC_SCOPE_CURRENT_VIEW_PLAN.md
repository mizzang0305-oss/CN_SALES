# STAGE_W4_SYNC_SCOPE_CURRENT_VIEW_PLAN

## FINAL_STATUS

FINAL_STATUS: W4_SYNC_SCOPE_CURRENT_VIEW_PLAN_READY

## PR #101 Merge Status

- PR URL: https://github.com/mizzang0305-oss/CN_SALES/pull/101
- Ready/merge status: Ready, squash merged
- Merge commit: cd0dd635ed0d7868d960b0f17b9b803561cbb23a
- W-3 scope: role scope auth integration and validation-only sync approval contract

## Existing Schema / Adapter Inspection

Existing implementation found:

- `cn_sales.ledger_rows`
- `cn_sales.sales_transactions`
- `cn_sales.receipt_transactions`
- `cn_sales.ar_snapshots`
- read-only sync diff planner: `src/lib/import/sync-diff.ts`
- read-only scoped reader: `src/lib/import/sync-existing-reader.ts`
- existing write-capable repository for older upload confirmation flow: `src/lib/import/supabase-repository.ts`

W-0 target current-view tables were not found:

- `sales_import_batches`: not present
- `sales_import_rows`: not present
- `sales_current_records`: not present
- `sales_import_change_summaries`: not present
- `sales_change_audit_logs`: not present

Conclusion:

- Migration is required before a true W-0 current-view/snapshot model can be persisted.
- W-4 did not add or apply migrations.
- W-4 did not open a DB write adapter.
- W-4 implements only a sync-scope plan builder, current-view policy contract, result-preview shape, and tests.

## Sync-Scope Contract

Implemented file:

- `src/lib/import/sales-sync-scope-plan.ts`

Contract fields:

- workflowGate
- actorRole / actorId
- part
- periodStart / periodEnd
- fileHash
- normalRows / excludedRows / amountTotal
- primaryScopeRows / existingScopedRows
- insertCandidates / updateCandidates / removedFromCurrentCandidates / noChangeRows
- amountBefore / amountAfter / amountDelta
- rawRowsReturned: false
- planReady

The plan builder validates the W-3 approval contract against the dry-run aggregate values before returning a result preview.

## Current View Policy

W-4 policy:

- insert: latest XLS row becomes active in current view in a future approved sync.
- update: latest XLS value replaces current-view value in a future approved sync.
- removedFromCurrent: record is marked `not_in_latest_xls` in a future approved sync.
- noChange: existing current-view state is retained.
- physical delete: forbidden.

`updateCandidates` and `removedFromCurrentCandidates` are not blockers in the web-import product model. They are aggregate change categories that require W-5 approval before persistence.

## Permission Model

W-4 reuses the W-3 contract:

- `SALES_REP_PART_N`: assigned part only.
- `PART_LEAD`: managed parts only.
- `ADMIN`: all supported parts `1/4/5/6/7/9/10/11`.
- Unsupported parts are blocked for every role, including `ADMIN`.
- Cross-part plans are blocked before any sync execution path.

## UI Disabled Sync State

The `/part/import-sales` screen remains preview/dry-run only.

W-4 adds a dry-run result panel for current-view sync readiness:

- status: W-5 approval required
- insert/update/removed/noChange aggregates
- amountDelta
- physicalDelete: false
- syncEnabled: false

No executable sync, apply, rollback, or sync-scope route is exposed.

## Implementation Scope

Implemented:

- sync-scope plan builder
- current-view policy constants
- result-preview contract
- no-write side-effect contract
- role-scope validation through W-3 approval contract
- static guards that confirm no `sync-scope` route exists
- W-4 report-only documentation

Not implemented:

- `POST /api/sales-import/sync-scope`
- DB write adapter
- current-view table mutation
- migration apply
- seed
- storage upload
- production POST
- deploy

## W-5 Approval Gate Recommendation

Recommended next phase:

`W-5_SYNC_SCOPE_SCHEMA_AND_EXPLICIT_CURRENT_VIEW_SYNC_APPROVAL`

Required before W-5 actual sync:

- explicit schema decision: reuse existing `ledger_rows` model or add W-0 current-view tables
- migration plan and separate approval if new tables are required
- exact part/period/fileHash approval
- dry-run aggregate match
- rawRowsReturned: false
- physicalDelete: false
- production mode sync blocked
- audit log policy decided before persistence

## Safety Result

- DB write: not implemented
- Storage upload: not implemented
- Raw row output: not implemented
- PII output: not implemented
- Secret/env output: not implemented
- Production POST: not executed
- Migration/seed/storage: not added
- Physical delete: not implemented
- Sync/apply: not implemented
- Enabled sync button: not present

## Validation Result

Validation commands:

- `npm run lint`: PASS
- `npm run test`: PASS, 37 files / 320 tests
- `npm run test:worker`: PASS, 4 tests
- `npm run build`: PASS
- `git diff --check`: PASS

Additional safety scans:

- secret/env scan: PASS
- raw row/PII scan: PASS
- production POST scan: PASS
- migration/seed/storage scan: PASS; only report text documents migration as a future approval requirement.
- DB write scan: PASS
- physical delete scan: PASS
- unapproved sync/apply scan: PASS; no `sync-scope` route added.
- enabled sync button scan: PASS
