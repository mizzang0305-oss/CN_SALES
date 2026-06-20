# WEB_ERP_XLS_SYNC_EXECUTION_APPROVAL_PACKET

Stage: W-5A_SCHEMA_DECISION_AND_SYNC_APPROVAL_PACKET

## 1. Purpose

This packet defines what must be approved before ERP XLS current-view sync execution can be implemented or run.

W-5A does not authorize sync execution.

## 2. Target Scope

Every future sync execution approval must specify:

- workflow gate
- actor role
- actor id when available
- part
- period start
- period end
- file name
- file hash
- normal rows
- excluded rows
- amount total
- primary scope rows
- existing scoped rows before sync
- insert candidates
- update candidates
- removed from current candidates
- no-change rows
- amount before
- amount after
- amount delta
- rawRowsReturned: false

The approved scope must match the latest preview and dry-run aggregate values exactly.

## 3. Permission Contract

Allowed actor roles:

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

Supported parts:

- `1`
- `4`
- `5`
- `6`
- `7`
- `9`
- `10`
- `11`

Rules:

- `SALES_REP_PART_N`: assigned part only.
- `PART_LEAD`: managed parts only.
- `ADMIN`: all supported parts.
- Unsupported parts are blocked for every role, including `ADMIN`.

## 4. Preview Contract

Required preview result:

- `ok: true`
- file hash returned
- part detected or explicitly selected
- period detected or explicitly selected
- normalRows returned
- excludedRows returned
- amountTotal returned
- warningRows returned
- errorRows returned
- rawRowsReturned: false

Preview must not:

- write to DB
- write to storage
- return row arrays
- return raw cells
- return customer or product full payloads
- return PII or secrets

## 5. Dry-Run Contract

Required dry-run result:

- primaryScopeRows
- existingScopedRows
- insertCandidates
- updateCandidates
- removedFromCurrentCandidates
- noChangeRows
- amountBefore
- amountAfter
- amountDelta
- blockedRows
- planReady
- rawRowsReturned: false

Dry-run must not:

- write to DB
- write to storage
- execute sync/apply
- physically delete
- return row arrays
- expose PII or secrets

## 6. Sync-Scope Contract

Required sync-scope plan:

- W-3 approval contract validation passes.
- W-4 sync-scope plan validation passes.
- role and part scope pass.
- file hash matches.
- period matches.
- aggregate counts match.
- amount delta arithmetic matches.
- rawRowsReturned is false.
- physicalDelete is false.

`updateCandidates` and `removedFromCurrentCandidates` are allowed categories when they match the approved dry-run. They are not blockers by themselves.

## 7. Allowed Write Type

Only after later explicit approval, the allowed write type is:

- scoped current-view sync for one approved part + period + file hash
- import batch evidence
- aggregate-safe import row snapshot
- current record upsert or status update
- change summary insert
- audit log insert

The ERP source is not modified.

## 8. Forbidden Write Type

Forbidden:

- production mode sync
- unbounded full sync
- physical delete
- rollback without separate approval
- arbitrary part or period sync
- file hash mismatch sync
- period mismatch sync
- raw row response
- PII response
- secret/env output
- seed data
- storage upload
- deploy

## 9. Production Safety

Future implementation must block:

- production POST for sync execution
- `next start` production mode `dryRun=false`
- sync execution before localhost/dev-mode verification
- sync execution without approval phrase
- sync execution when rawRowsReturned is not false
- sync execution when DB schema approval is missing

## 10. Rollback Plan

Rollback is not authorized by this packet.

Future rollback requires a separate plan-only packet with:

- target batch
- target part
- target period
- target file hash
- current-view rows affected
- audit log references
- read-only backup/export evidence
- explicit rollback approval phrase

No rollback may modify the ERP source file.

## 11. Required Approval Phrase

Execution approval phrase:

`WEB_ERP_XLS_SYNC_EXECUTE_APPROVED`

This phrase is required before any sync-scope execution implementation or run.

Schema approval phrase:

`WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED`

This phrase is required before any schema migration apply.

## 12. W-5A Status

- sync execution approved: no
- sync endpoint implemented: no
- DB write implemented: no
- migration applied: no
- enabled sync button: no
- next phase: W-5B schema migration plan or W-6 sync implementation approval, depending on owner decision
