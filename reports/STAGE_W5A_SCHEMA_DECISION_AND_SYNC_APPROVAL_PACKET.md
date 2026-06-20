# STAGE_W5A_SCHEMA_DECISION_AND_SYNC_APPROVAL_PACKET

## FINAL_STATUS

FINAL_STATUS: W5A_SCHEMA_DECISION_AND_SYNC_APPROVAL_PACKET_READY

## PR #102 Merge Status

- PR URL: https://github.com/mizzang0305-oss/CN_SALES/pull/102
- Ready/merge status: Ready, squash merged
- Merge commit: 62239e30ba13770526c718ef8cf7e1b87973e672
- W-4 scope: sync-scope current-view plan, aggregate-only contract, disabled sync UI state, tests, and report

## Schema Inspection Result

Existing legacy structures:

- `cn_sales.ledger_uploads`
- `cn_sales.upload_preview_results`
- `cn_sales.ledger_rows`
- `cn_sales.ledger_row_versions`
- `cn_sales.sales_transactions`
- `cn_sales.receipt_transactions`
- `cn_sales.ar_snapshots`

Missing W-0 current-view structures:

- `cn_sales.sales_import_batches`
- `cn_sales.sales_import_rows`
- `cn_sales.sales_current_records`
- `cn_sales.sales_import_change_summaries`
- `cn_sales.sales_change_audit_logs`

Conclusion:

- Existing tables are not enough for the intended web import product direction.
- A new current-view schema is recommended before actual current-view sync.
- W-5A does not create or apply a migration.

## Option A: Legacy Table Analysis

Status: not recommended.

Benefits:

- no new migration
- faster initial development
- reuses existing ledger and normalized tables

Risks:

- batch and current-view semantics remain mixed
- latest XLS snapshot evidence is not cleanly separated
- `removedFromCurrent` handling is weak without physical delete or ambiguous status flags
- change summaries and audit evidence are harder to trust
- admin upload/close/re-upload review is weaker

## Option B: Current-View Schema Analysis

Status: recommended.

Tables:

- `sales_import_batches`
- `sales_import_rows`
- `sales_current_records`
- `sales_import_change_summaries`
- `sales_change_audit_logs`

Benefits:

- clear import batch history
- clear latest XLS snapshot boundary
- clear current-view state
- durable aggregate change summary
- actor/action audit evidence
- safer weekly/monthly report and receivables workflows
- physical delete remains forbidden

Costs:

- migration required
- RLS/policy/grant/index design required
- owner approval required before DB apply

## Recommended Schema Decision

Decision: Option B, new current-view schema.

Reason:

- The product goal includes customer sales management, weekly reports, receivables management, admin upload status, close status, and re-upload review.
- These require batch/history/current-view/change-summary/audit separation.
- Legacy tables can remain useful operational/reporting inputs, but they should not be the only source for approved web-import current-view state.

## Migration Plan Status

- migration required: yes
- migration file created: no
- migration applied: no
- seed applied: no
- storage changed: no
- DB write: no

Schema apply approval phrase:

`WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED`

## Sync Approval Packet Status

Document created:

- `docs/web-import/WEB_ERP_XLS_SYNC_EXECUTION_APPROVAL_PACKET.md`

Required execution approval phrase:

`WEB_ERP_XLS_SYNC_EXECUTE_APPROVED`

Execution remains blocked until a later explicit approval stage.

## Safety Result

- DB write: not performed
- Migration apply: not performed
- Seed/storage: not performed
- Sync/apply: not performed
- Physical delete: not implemented
- Raw row/PII/secret output: not added
- Production POST: not executed
- Enabled sync button: not present
- `docs/adsense/`: left untracked and out of PR scope

## Validation Result

Validation commands:

- `npm run lint`: PASS
- `npm run test`: PASS, 38 files / 323 tests
- `npm run test:worker`: PASS, 4 tests
- `npm run build`: PASS
- `git diff --check`: PASS

Additional safety scans:

- secret/env scan: PASS
- raw row/PII scan: PASS
- production POST scan: PASS
- migration apply scan: PASS
- seed/storage scan: PASS
- DB write scan: PASS
- physical delete scan: PASS
- unapproved sync/apply scan: PASS
- enabled sync button scan: PASS

## Next Phase Recommendation

Recommended next phase:

`W-5B_SCHEMA_MIGRATION_PLAN_REVIEW`

Purpose:

- prepare the exact migration file as review-only if owner approves schema planning
- do not apply migration
- verify RLS, grants, indexes, rollback plan, and approval phrase

Actual current-view sync execution remains blocked until both schema approval and execution approval are present.
