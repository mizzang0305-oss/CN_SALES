# STAGE M-series insert apply result

## 1. FINAL_STATUS

FINAL_STATUS: M_SERIES_INSERT_APPLY_RESULT_READY

## 2. Source state

- Candidate gate: M-0_NEXT_XLS_CANDIDATE_DISCOVERY_AND_APPROVAL_PLAN
- Candidate gate PR: #88
- Read-only dry-run gate: M-1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE
- Read-only dry-run gate PR: #89
- Stage support: M_SERIES_BATCH_STAGE_SUPPORT
- Stage support PR: #90
- Stage support merge commit: 978ee8a
- Target file label: part-6 1~6 sales-status XLS
- Part: 6
- Period: 2026-06-01 ~ 2026-06-06
- File hash: sha256:3a99de5405c01e1e9eba7ca7e3c0ddeaf3f61947ace3bb0c6897bdedffb3700f
- normalRows: 1359
- excludedRows: 148
- amountTotal: 527288764

## 3. Batch apply result

| Stage | Operation | maxRows | insertedRows | updatedRows | deletedRows | Verification |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| M-2 | INSERT only | 500 | 500 | 0 | 0 | pre dry-run, approval file guard, read-back, and post dry-run verified |
| M-3 | INSERT only | 500 | 500 | 0 | 0 | pre dry-run, approval file guard, read-back, and post dry-run verified |
| M-4 | INSERT only | 359 | 359 | 0 | 0 | pre dry-run, approval file guard, read-back, and post dry-run verified |

- total inserted: 1359
- updatedRows: 0
- deletedRows: 0
- M-2 rerun: none
- M-3 rerun: none
- M-4 rerun: none

## 4. Final post-apply dry-run

| Field | Value |
| --- | ---: |
| normalRows | 1359 |
| excludedRows | 148 |
| amountTotal | 527288764 |
| warningRows | 0 |
| errorRows | 0 |
| primaryScopeRows | 1359 |
| existingScopedRows | 1359 |
| noChangeRows | 1359 |
| insertCandidates | 0 |
| updateCandidates | 0 |
| deleteCandidates | 0 |
| dateOutsideScopeRows | 0 |
| invalidDateRows | 0 |
| missingDateRows | 0 |

- planReady: true
- rawRowsReturned: false
- sideEffects on final dry-run: dbWrite false, storageWrite false, actualApply false

## 5. Approval files

- M-2 approval file: created locally, not committed
- M-3 approval file: created locally, not committed
- M-4 approval file: created locally, not committed
- approval file committed: none

## 6. Safety result

- localhost dev mode: used
- next start / production mode dryRun=false: not used
- production POST: none
- update/delete/full apply: none
- migration/seed/storage: none
- raw row/PII/secret output: none
- deploy/manual deploy: none
- previous sealed G/H/I/J/K/L stage rerun: none
- approval file committed: none
- port 3215 after apply: stopped

## 7. Validation result

- pre-apply dry-run for M-2: PASS
- pre-apply dry-run for M-3: PASS
- pre-apply dry-run for M-4: PASS
- post-apply dry-run after M-2: PASS
- post-apply dry-run after M-3: PASS
- post-apply dry-run after M-4: PASS
- read-back M-2/M-3/M-4: PASS
- lint: PASS, npm run lint
- test: PASS, npm run test, 28 files / 271 tests
- test:worker: PASS, npm run test:worker, 4 tests
- build: PASS, npm run build
- diff-check: PASS, git diff --check
- safety scans: PASS

## 8. Recommended next step

Merge this report-only PR, then run the M read-only closure audit.

No additional apply is allowed from this report.
