# STAGE G-6G Existing Reader Cap Hotfix Result

FINAL_STATUS = EXISTING_READER_CAP_HOTFIX_PR_CREATED_PASS

## 1. Scope

This report documents the post-G-6G reader-cap hotfix.

Allowed work performed:

- PR #44 report-only merge.
- Existing ledger reader pagination fix.
- Localhost XLS preview smoke.
- Localhost confirm `dryRun=true` smoke.
- Tests and static safety checks.

Forbidden work not performed:

- No additional DB write.
- No `dryRun=false` confirm.
- No production POST.
- No G-6G apply rerun.
- No G-6H apply.
- No update/delete/full apply.
- No migration, seed, storage, SQL/view/role/grant, or Metabase setup.
- No Vercel CLI/manual deploy.
- No XLS, approval file, response dump, raw row, PII, or secret committed.

## 2. PR #44 Merge

- PR: https://github.com/mizzang0305-oss/CN_SALES/pull/44
- Result: merged
- Merge commit: `fa32fdef9f58a96283f2276d376a2b74f1a2da33`
- Scope: report-only `reports/STAGE_G6G_LIMITED_500_ROW_APPLY_RESULT.md`

## 3. Root Cause

The existing ledger sync reader used a single selected-column query against `cn_sales.ledger_rows`.

The query was read-only and did not use `select *`, but it did not page with `.range(...)`. The post-G-6G dry-run therefore saw only 1000 existing scoped rows even though count-only evidence showed 1133 scoped rows.

Root cause classification:

- Cause A: existing row fetch lacked pagination/range.
- Cause B: not observed.
- Cause C: not observed.

## 4. Hotfix Summary

Changed behavior:

- Existing ledger rows are fetched in 500-row pages.
- Reads are deterministically ordered by `ledger_date`, `row_index`, and `id`.
- The reader requests exact count metadata.
- The reader blocks with `SYNC_DIFF_DB_READ_INCOMPLETE` if fetched row count does not reconcile with expected count or if the page guard is exhausted.
- Confirm dry-run includes aggregate reader diagnostics only.

Safety properties:

- Selected columns only: `id`, `row_index`, `ledger_date`, `row_type`, `identity_hash`, `content_hash`.
- No raw ledger payload column selected.
- No raw row JSON returned.
- No customer/product names selected by this reader.
- No write method added to the reader.

## 5. Localhost Preview Smoke

- Environment: localhost only.
- Endpoint: `/api/uploads/preview`
- Method: POST
- Status: 200
- Total rows: 2394
- Normal rows: 2119
- Excluded/error rows: 275
- Part mismatch: false
- Amount total: 716970702
- Account count: 159
- Item count: 495
- Response `rows` payload count: 0
- DB write: false
- Storage write: false
- Normalized table write: false

## 6. Localhost Confirm Dry-Run Smoke

- Environment: localhost only.
- Endpoint: `/api/uploads/confirm`
- Method: POST
- Mode: `dryRun=true`
- Status: 200
- `dryRunReady`: true
- `syncDiff.planReady`: true
- Blocked reasons: none

Dry-run diff after hotfix:

| Metric | Value |
| --- | ---: |
| existingScopedRows | 1133 |
| insertCandidates | 986 |
| updateCandidates | 0 |
| deleteCandidates | 0 |
| noChangeRows | 1133 |

Reader diagnostics:

| Metric | Value |
| --- | ---: |
| paged | true |
| pageSize | 500 |
| pagesRead | 3 |
| fetchedRows | 1133 |
| expectedCount | 1133 |
| countMatchesFetchedRows | true |
| rawRowsReturned | false |

Side effects:

| Side effect | Result |
| --- | --- |
| dbWrite | false |
| storageWrite | false |
| normalizedTableWrite | false |
| actualApply | false |

## 7. Validation

Commands run before report creation:

- `npm run lint`: PASS
- `npm run test`: PASS, 27 files / 186 tests
- `npm run test:worker`: PASS, 4 tests
- `npm run build`: PASS

Targeted tests:

- `tests/sync-existing-reader-static.test.ts`: PASS
- `tests/sync-diff.test.ts`: PASS

Additional checks:

- `SELECT *`: not added.
- `raw_row_json`: not selected by the reader.
- `customer_name` / `product_name`: not selected by the reader.
- `.local-approval/**`: not tracked.
- XLS/XLSX: not tracked.
- Approval JSON: not tracked.

## 8. Changed Files

- `src/lib/import/sync-existing-reader.ts`
- `src/lib/import/sync-diff.ts`
- `src/app/api/uploads/confirm/route.ts`
- `tests/sync-existing-reader-static.test.ts`
- `tests/sync-diff.test.ts`
- `reports/STAGE_G6G_EXISTING_READER_CAP_HOTFIX_RESULT.md`

## 9. Next Gate

G-6H remains blocked until this hotfix PR is reviewed and merged.

After merge, the next safe gate is post-hotfix read-only dry-run smoke from `main`/Production state, still with no `dryRun=false` confirm unless separately approved.
