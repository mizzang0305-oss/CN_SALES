# STAGE_N_SERIES_INSERT_APPLY_RESULT

## 1. FINAL_STATUS

FINAL_STATUS: N_SERIES_LIMITED_INSERT_APPLY_RESULT_READY

N-series limited INSERT-only apply completed through localhost dev mode for the selected part-7 XLS.

## 2. Target

- file: part-7 1~6 sales-status XLS
- part: 7
- period: 2026-06-01 ~ 2026-06-06
- fileHash: sha256:e18fd014bcffebb4df73839d6b70df4493709a303f6ec17fb2dd17405e1d6f3c
- normalRows: 1920
- excludedRows: 302
- amountTotal: 781351560
- rawRowsReturned: false

## 3. Stage Support PR

- PR: #95
- merge commit: 88d5e5b4baef8dc31060e1ce2f565fbf5a1156bf
- support stages: N-2, N-3, N-4, N-5
- wildcard stage allowed: false
- arbitrary maxRows allowed: false
- operation: INSERT only

## 4. Apply Result

| stage | maxRows | insertedRows | updatedRows | deletedRows | postExistingScopedRows | postInsertCandidates |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| N-2 | 500 | 500 | 0 | 0 | 500 | 1420 |
| N-3 | 500 | 500 | 0 | 0 | 1000 | 920 |
| N-4 | 500 | 500 | 0 | 0 | 1500 | 420 |
| N-5 | 420 | 420 | 0 | 0 | 1920 | 0 |

Aggregate result:

- totalInserted: 1920
- updatedRows: 0
- deletedRows: 0
- productionPost: false
- rawRowsReturned: false

## 5. Final Post-Apply Dry-Run

- dryRun: true
- dryRunReady: true
- applyReady: true
- actualApplyExecuted: false
- actualApplyBlockedReason: APPLY_NOT_APPROVED
- primaryScopeRows: 1920
- existingScopedRows: 1920
- noChangeRows: 1920
- insertCandidates: 0
- updateCandidates: 0
- deleteCandidates: 0
- dateOutsideScopeRows: 0
- invalidDateRows: 0
- missingDateRows: 0
- rawRowsReturned: false

## 6. Safety Result

- DB write outside approval: none
- production POST: none
- next start / production mode dryRun=false: not used
- update/delete/full apply: blocked, not executed
- migration/seed/storage: none
- raw row/PII/secret output: none
- deploy/manual deploy: none
- previous sealed stage rerun: none
- approval file committed: false

## 7. Validation Result

- pre-apply dry-run per batch: PASS
- fresh local approval file per batch: PASS
- approval file committed scan: PASS
- localhost dev mode dryRun=false per batch: PASS
- post-apply dry-run per batch: PASS
- final post-apply dry-run: PASS
- lint: PASS (`npm run lint`)
- test: PASS (`npm run test`, 28 files / 281 tests)
- test:worker: PASS (`npm run test:worker`)
- build: PASS (`npm run build`)
- diff-check: PASS (`git diff --check`)
- report safety scan: PASS

## 8. Next Stage

Proceed to N read-only sync closure audit:

- DB write: forbidden
- apply: forbidden
- dryRun=false: forbidden
- approval file creation: forbidden
- expected closure: existingScopedRows 1920, noChangeRows 1920, insertCandidates 0, updateCandidates 0, deleteCandidates 0
