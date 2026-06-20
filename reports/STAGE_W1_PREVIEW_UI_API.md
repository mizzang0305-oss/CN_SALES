# STAGE_W1_PREVIEW_UI_API

## FINAL_STATUS

FINAL_STATUS: W1_PREVIEW_UI_API_READY

## PR #98 Merge Status

- PR URL: https://github.com/mizzang0305-oss/CN_SALES/pull/98
- Ready/merge status: Ready, squash merged before W-1 implementation
- Merge commit: b5a9359bb40b969493eae9df77f996f22d5be31d
- Scope: docs/report only

## Implemented Scope

- API: `POST /api/sales-import/preview`
- UI: `/part/import-sales`
- Parser reuse: existing preview-only import service, file hashing, and ledger preview summary utilities
- DB write: none
- Storage upload: none beyond preview-only in-memory/local placeholder adapter
- Sync/apply: none

## API Summary

The preview API accepts multipart form data with an XLS/XLSX file and returns aggregate-only fields:

- fileName
- fileHash
- part
- periodStart / periodEnd
- normalRows
- excludedRows
- amountTotal
- warningRows
- errorRows
- rawRowsReturned: false

The API does not return row arrays, customer lists, product lists, raw cell values, secrets, or environment values.

## UI Summary

The `/part/import-sales` screen provides:

- file selection
- role and managed-part inputs for W-1 permission checks
- optional selected part
- optional explicit period or filename-month period detection
- aggregate preview result display
- side-effect status display

The screen does not provide dry-run, sync, apply, rollback, close, or deploy controls.

## Permission Model

- `SALES_REP_PART_N`: can preview only assigned part N.
- `PART_LEAD`: can preview only explicitly managed parts.
- `ADMIN`: can preview all supported parts `1/4/5/6/7/9/10/11`.
- Cross-part preview is blocked before parsing when the file name exposes a part, and after parsing when only workbook content resolves the part.

## Aggregate-Only Guarantee

- `rawRowsReturned` is always false.
- API response omits `rows`, `sampleRows`, `customerName`, `productName`, and raw source payloads.
- Error responses are sanitized and include no parser stack traces, local paths, cell payloads, or environment details.

## Safety Result

- DB write: not implemented
- Persistent storage upload: not implemented
- Dry-run/sync/apply: not implemented
- Production POST: not used
- Migration/seed/storage: not added
- Physical delete: not implemented
- Raw row/PII/secret output: blocked by response contract and tests

## Validation Result

Validation commands for this branch:

- `npm run lint`: PASS
- `npm run test`: PASS, 30 files / 291 tests
- `npm run test:worker`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS
- safety scans for secret/env, raw row/PII, production POST, migration/seed/storage, DB write, storage upload, physical delete, and unapproved sync/apply: PASS

Notes:

- `process.env.NODE_ENV === "test"` appears only to allow JSON fixture files during automated tests; production request handling remains XLS/XLSX-only.
- The only raw-row-related output field is the required `rawRowsReturned: false` contract flag.

## Next Phase

W-2_DRY_RUN_UI_API should add read-only comparison against the current view. Sync remains blocked until a separate explicit W-4 approval path.
