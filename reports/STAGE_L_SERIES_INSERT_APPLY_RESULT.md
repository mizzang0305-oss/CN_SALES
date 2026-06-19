# STAGE L-series insert apply result

## 1. FINAL_STATUS

FINAL_STATUS: L_SERIES_INSERT_APPLY_RESULT_READY

## 2. Source state

- Candidate gate: L-0_NEXT_XLS_CANDIDATE_DISCOVERY_AND_APPROVAL_PLAN
- Candidate gate PR: #83
- Read-only dry-run gate: L-1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE
- Read-only dry-run gate PR: #84
- Stage support: L_SERIES_BATCH_STAGE_SUPPORT
- Stage support PR: #85
- Stage support merge commit: d423d02d846b016a1071deaf4733cd62db3a6f54
- Target file label: part-5 1~6 sales-status XLS
- Part: 5
- Period: 2026-06-01 ~ 2026-06-06
- File hash: sha256:0e4f909e5fe2d43e924e99352a6bdfa6f673357b5b2c41974b1981471ef2ad6a
- normalRows: 1546
- excludedRows: 218
- amountTotal: 549324126

## 3. Batch apply result

| Stage | Operation | maxRows | insertedRows | updatedRows | deletedRows | Verification |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| L-2 | INSERT only | 500 | 500 | 0 | 0 | pre dry-run, read-back, and post dry-run verified |
| L-3 | INSERT only | 500 | 500 | 0 | 0 | pre dry-run, read-back, and post dry-run verified |
| L-4 | INSERT only | 500 | 500 | 0 | 0 | pre dry-run, read-back, and post dry-run verified |
| L-5 | INSERT only | 46 | 46 | 0 | 0 | pre dry-run, read-back, and post dry-run verified |

- total inserted: 1546
- updatedRows: 0
- deletedRows: 0
- L-2 rerun: none
- L-3 rerun: none
- L-4 rerun: none
- L-5 rerun: none

## 4. Final post-apply dry-run

| Field | Value |
| --- | ---: |
| normalRows | 1546 |
| excludedRows | 218 |
| amountTotal | 549324126 |
| warningRows | 0 |
| errorRows | 0 |
| primaryScopeRows | 1546 |
| existingScopedRows | 1546 |
| noChangeRows | 1546 |
| insertCandidates | 0 |
| updateCandidates | 0 |
| deleteCandidates | 0 |

- planReady: true
- rawRowsReturned: false
- sideEffects on final dry-run: dbWrite false, storageWrite false, actualApply false

## 5. Approval files

- L-2 approval file: created locally, not committed
- L-3 approval file: created locally, not committed
- L-4 approval file: created locally, not committed
- L-5 approval file: created locally, not committed
- approval file committed: none

## 6. Safety result

- localhost dev mode: used
- next start / production mode dryRun=false: not used
- production POST: none
- update/delete/full apply: none
- migration/seed/storage: none
- raw row/PII/secret output: none
- deploy/manual deploy: none
- previous sealed G/H/I/J/K stage rerun: none
- approval file committed: none
- port 3215 after apply: stopped

## 7. Validation result

- pre-apply dry-run for L-2: PASS
- pre-apply dry-run for L-3: PASS
- pre-apply dry-run for L-4: PASS
- pre-apply dry-run for L-5: PASS
- post-apply dry-run after L-2: PASS
- post-apply dry-run after L-3: PASS
- post-apply dry-run after L-4: PASS
- post-apply dry-run after L-5: PASS
- read-back L-2/L-3/L-4/L-5: PASS
- lint: PASS, npm run lint
- test: PASS, npm run test, 28 files / 261 tests
- test:worker: PASS, npm run test:worker, 4 tests
- build: PASS, npm run build
- diff-check: PASS, git diff --check
- safety scans: PASS, report raw row/PII/secret, approval file committed, production POST, migration/seed/storage, deploy

## 8. Recommended next step

Merge this report-only PR, then run the L read-only closure audit.

No additional apply is allowed from this report.
