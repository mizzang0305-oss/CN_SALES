# STAGE_W6_SYNC_SCOPE_API_DRAFT_DISABLED

## FINAL_STATUS

FINAL_STATUS: W6_SYNC_SCOPE_API_DRAFT_DISABLED_READY

## Scope

Added a disabled sync-scope API contract for local review.

Implemented files:

- `src/app/api/sales-import/sync-scope/route.ts`
- `src/lib/web-import/sales-sync-scope-disabled.ts`
- `tests/sales-import-sync-scope-disabled.test.ts`
- `tests/sales-import-sync-scope-disabled-static.test.ts`

Updated static guards:

- `tests/sales-sync-scope-plan-static.test.ts`
- `tests/web-import-role-contract-static.test.ts`
- `tests/web-import-schema-decision-docs.test.ts`

## API Contract

Endpoint:

- `POST /api/sales-import/sync-scope`

Response is always disabled:

- `ok: false`
- `status: approval_required`
- `syncEnabled: false`
- `message: Current-view sync requires explicit schema/apply approval.`
- `rawRowsReturned: false`

The route validates safe aggregate fields when provided, but it never runs current-view sync.

Required approvals remain:

- `WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED`
- `WEB_ERP_XLS_SYNC_EXECUTE_APPROVED`

## Safety Result

- DB write: not implemented
- Migration apply: not performed
- `supabase db push`: not run
- Sync/apply: disabled
- Production POST: not executed
- Seed/storage: not performed
- Raw row/PII/secret output: not added
- Physical delete: not implemented
- Enabled sync button: not added
- Deploy/manual deploy: not performed

## Validation Result

Validation is completed at the combined local branch closeout.

## Next Stage

`W-7_IMPORT_DASHBOARD_READINESS_LOCAL`
