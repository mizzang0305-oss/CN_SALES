# STAGE I-series remaining insert apply result

## 1. FINAL_STATUS

FINAL_STATUS: I_SERIES_REMAINING_INSERT_APPLY_RESULT_READY

## 2. Scope

- Stage: I-SERIES_REMAINING_INSERT_APPLY_RESULT
- File: part-1 2026-06-01-to-2026-06-06 sales XLS
- Part: 1
- Period: 2026-06-01 ~ 2026-06-06
- File hash: sha256:f43f9eefc35eb30b84e682e22be117d99f30897d69b72d16a91b0adf9a28fcbd
- Operation: INSERT only
- Runtime: localhost dev mode only
- Port: 3215
- Production mode: not used

## 3. Support gate

- PR #69: merged, I-3 support check report-only
- PR #69 merge commit: fbcf896f1cdf47fcd9af682c7b6bf0dc5d81434f
- PR #70: merged, I-series remaining batch stage support
- PR #70 merge commit: 6d232cc4daae48a9f922b78850d085dfbf4c54ae
- I-3/I-4/I-5 exact stages recognized: true
- Wildcard I-stage support: false
- Any H-stage rerun: false

## 4. Apply summary

| Stage | Pre existingScopedRows | Pre insertCandidates | Inserted | Updated | Deleted | ReadBackRows | Post existingScopedRows | Post insertCandidates |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| I-3 | 500 | 1028 | 500 | 0 | 0 | 500 | 1000 | 528 |
| I-4 | 1000 | 528 | 500 | 0 | 0 | 500 | 1500 | 28 |
| I-5 | 1500 | 28 | 28 | 0 | 0 | 28 | 1528 | 0 |

## 5. Total result

- Total insertedRows: 1028
- Total updatedRows: 0
- Total deletedRows: 0
- I-series total inserted after I-2/I-3/I-4/I-5: 1528
- Final existingScopedRows: 1528
- Final noChangeRows: 1528
- Final insertCandidates: 0
- Final updateCandidates: 0
- Final deleteCandidates: 0

## 6. Aggregate final state

- normalRows: 1528
- excludedRows: 246
- amountTotal: 563169208
- existingScopedRows: 1528
- noChangeRows: 1528
- insertCandidates: 0
- updateCandidates: 0
- deleteCandidates: 0
- rawRowsReturned: false

## 7. Safety evidence

- DB write: localhost limited INSERT only for I-3/I-4/I-5
- Actual apply count: 3 approved localhost limited apply calls
- dryRun=false outside approved stages: none
- Production POST: none
- update/delete/full apply: none
- migration/seed/storage: none
- raw row/PII/secret output: none
- deploy: none
- previous G-stage rerun: none
- previous H-stage rerun: none
- approval files committed: none
- Rollback executed: false
- Port 3215 after apply: stopped

## 8. Local evidence files

Only sanitized aggregate summaries were written for this result stage. Full API responses, row IDs, identity hash lists, and raw row payloads were not stored for I-3/I-4/I-5.

- .local-approval/i_series_preview_contract_summary.json
- .local-approval/i3_pre_apply_dry_run_summary.json
- .local-approval/i3_limited_apply_summary.json
- .local-approval/i3_post_apply_dry_run_summary.json
- .local-approval/i4_pre_apply_dry_run_summary.json
- .local-approval/i4_limited_apply_summary.json
- .local-approval/i4_post_apply_dry_run_summary.json
- .local-approval/i5_pre_apply_dry_run_summary.json
- .local-approval/i5_limited_apply_summary.json
- .local-approval/i5_post_apply_dry_run_summary.json
- .local-approval/i_series_remaining_apply_aggregate_summary.json

## 9. Validation

- lint: PASS, npm run lint
- test: PASS, npm run test, 28 files / 228 tests
- test:worker: PASS, npm run test:worker, 4 tests
- build: PASS, npm run build
- diff-check: PASS, git diff --check
- secret/env value scan: PASS, report diff scan
- raw row/PII/id-list scan: PASS, report diff scan
- production/update/delete/full apply scan: PASS, report diff scan
- migration/seed/storage/deploy scan: PASS, report diff scan

## 10. Recommended next step

Proceed to I-6 read-only sync closure audit after this report-only PR is reviewed and merged.

No further apply is allowed from this report. Additional XLS, part, rollback, update, delete, full apply, production POST, deploy, or previous-stage rerun requires a separate explicit approval gate.
