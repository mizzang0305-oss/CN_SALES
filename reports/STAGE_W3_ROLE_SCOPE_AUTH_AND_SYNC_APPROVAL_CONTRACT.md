# STAGE_W3_ROLE_SCOPE_AUTH_AND_SYNC_APPROVAL_CONTRACT

## FINAL_STATUS

FINAL_STATUS: W3_ROLE_SCOPE_AUTH_AND_SYNC_APPROVAL_CONTRACT_READY

## PR #100 Merge Status

- PR URL: https://github.com/mizzang0305-oss/CN_SALES/pull/100
- Ready/merge status: Ready, squash merged
- Merge commit: 37953d9fe5a23396650d5db6f7cc361356e4af8e
- Scope: W-2 dry-run UI/API only

## Implemented Scope

- Role access utility: `src/lib/auth/part-access.ts`
- Preview API integration: uses central `validateSalesPartAccess`
- Dry-run API integration: uses central `validateSalesPartAccess`
- Sync approval contract: validation-only `src/lib/import/sales-sync-approval-contract.ts`
- Approval documentation: `docs/web-import/WEB_ERP_XLS_SYNC_APPROVAL_CONTRACT.md`
- UI sync state: disabled approval-required state only
- DB write: none
- Sync/apply: none

## Role/Part Access Contract

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

- `ADMIN`: all supported parts.
- `SALES_REP_PART_N`: assigned part N only.
- `PART_LEAD`: managed parts only.
- Unsupported parts are blocked for every role, including `ADMIN`.

## Future Sync Approval Contract

W-3 defines validation only. It does not implement `POST /api/sales-import/sync-scope` or any current-view update.

Required aggregate fields include:

- workflowGate
- actorRole
- part
- periodStart / periodEnd
- fileHash
- normalRows / excludedRows / amountTotal
- expectedPrimaryScopeRows
- expectedExistingScopedRowsBeforeSync
- expectedInsertCandidates
- expectedUpdateCandidates
- expectedRemovedFromCurrentCandidates
- expectedNoChangeRows
- expectedAmountBefore / expectedAmountAfter / expectedAmountDelta
- rawRowsReturned: false

## UI Sync Disabled State

The `/part/import-sales` page still supports preview and dry-run only. It shows sync as approval-required and disabled:

- syncEnabled: false
- applyEnabled: false
- no sync/apply handler
- no sync-scope endpoint call

## Safety Result

- DB write: not implemented
- Persistent storage upload: not implemented
- Sync/apply: not implemented
- Physical delete: not implemented
- Production POST: not executed
- Migration/seed/storage: not added
- Raw row/PII/secret output: blocked by contract and tests
- Enabled sync/apply button: not present

## Validation Result

Validation commands for this branch:

- `npm run lint`: PASS
- `npm run test`: PASS, 35 files / 311 tests
- `npm run test:worker`: PASS, 4 tests
- `npm run build`: PASS
- `git diff --check`: PASS

Safety scans:

- Secret/env scan: PASS; only test-mode `NODE_ENV` guards were found in existing preview/dry-run route test fixtures.
- Raw row/PII scan: PASS
- Production POST scan: PASS; no production URL call path added.
- Migration/seed/storage scan: PASS; no executable migration, seed, or persistent storage path added.
- DB write scan: PASS; W-3 adds validation-only code and no current-view mutation path.
- Storage upload scan: PASS
- Physical delete scan: PASS
- Unapproved sync/apply scan: PASS; no `sync-scope` route or apply execution path added.
- Enabled sync button scan: PASS; UI state is disabled and approval-required.

## Next Phase

Recommended next phase: `W-4_SYNC_SCOPE_PLAN_OR_CURRENT_VIEW_SYNC_IMPLEMENTATION_PLAN`.

Sync remains blocked until a separate explicit W-4 approval path.
