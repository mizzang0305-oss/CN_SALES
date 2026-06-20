# STAGE_W2_DRY_RUN_UI_API

## FINAL_STATUS

FINAL_STATUS: W2_DRY_RUN_UI_API_READY

## PR #99 Merge Status

- PR URL: https://github.com/mizzang0305-oss/CN_SALES/pull/99
- Ready/merge status: Ready, squash merged
- Merge commit: 1e7cb7c7fce6f7909f091d377320460bc97cc69d
- Scope: W-1 preview UI/API only

## Implemented Scope

- API: `POST /api/sales-import/dry-run`
- UI: `/part/import-sales` dry-run section added after preview
- Parser/preview reuse: existing preview-only import service, file hash utility, operational summary, sync diff planner, and read-only existing row reader
- DB write: none
- Storage upload: none
- Sync/apply: none

## API Summary

The W-2 API uses a safe temporary contract because W-1 does not persist previews. The UI sends the same file plus the W-1 aggregate preview fields. The server:

1. Recomputes the source file hash.
2. Re-parses the file through the preview-only service.
3. Validates file hash, part, period, normal row count, excluded row count, amount total, warning count, and error count.
4. Reads existing scoped rows with selected aggregate-safe columns only.
5. Returns aggregate dry-run results.

## UI Summary

The `/part/import-sales` screen now displays:

- preview summary
- dry-run button
- primaryScopeRows
- existingScopedRows
- insertCandidates
- updateCandidates
- removedFromCurrentCandidates
- noChangeRows
- amountBefore / amountAfter / amountDelta
- blockedRows
- planReady
- rawRowsReturned=false

The screen still does not provide sync, apply, rollback, close, raw row table, or row dump controls.

## Permission Model

- `SALES_REP_PART_N`: can dry-run only assigned part N.
- `PART_LEAD`: can dry-run only explicitly managed parts.
- `ADMIN`: can dry-run all supported parts `1/4/5/6/7/9/10/11`.
- Cross-part dry-run is blocked through the same W-1 access helper.

## Dry-run Contract

- primaryScopeRows: latest XLS normal row count
- existingScopedRows: existing read-only scoped row count
- insertCandidates: latest XLS rows not present in current synced scope
- updateCandidates: latest XLS rows with changed content hash
- removedFromCurrentCandidates: existing scoped rows absent from latest XLS
- noChangeRows: matching current scoped rows
- amountBefore: sum of existing scoped selected amount columns
- amountAfter: latest XLS amount total
- amountDelta: amountAfter - amountBefore
- blockedRows: warningRows + errorRows
- planReady: sync diff readiness flag
- rawRowsReturned: false

## Aggregate-Only Guarantee

- No row arrays are returned.
- No customer/product names are returned.
- No raw cell payloads are returned.
- Reader diagnostics expose only aggregate paging/count metadata.

## Safety Result

- DB write: not implemented
- Persistent storage upload: not implemented
- Sync/apply: not implemented
- Physical delete: not implemented
- Production POST: not executed
- Migration/seed/storage: not added
- Raw row/PII/secret output: blocked by contract and tests

## Validation Result

Validation commands for this branch:

- `npm run lint`: PASS
- `npm run test`: PASS, 32 files / 299 tests
- `npm run test:worker`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- safety scans for secret/env, raw row/PII, production POST, migration/seed/storage, DB write, storage upload, physical delete, and unapproved sync/apply: PASS

Notes:

- Existing read-only DB scope lookup still checks env readiness, but does not output env values.
- `process.env.NODE_ENV === "test"` appears only to allow JSON fixture files during automated tests.
- Internal row arrays are used server-side only for parsing/diff planning; API and UI contracts return aggregate fields only.

## Next Phase

Recommended next phase: `W-3_ROLE_SCOPE_AUTH_INTEGRATION_AND_SYNC_APPROVAL_CONTRACT`.

Sync remains blocked until a separate explicit W-4 sync-scope approval path.
