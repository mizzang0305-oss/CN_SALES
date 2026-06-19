# STAGE J-series insert apply result

## 1. FINAL_STATUS

FINAL_STATUS: J_SERIES_INSERT_APPLY_RESULT_READY

## 2. Source state

- Candidate gate: J-0_NEXT_XLS_CANDIDATE_DISCOVERY_AND_APPROVAL_PLAN
- Read-only dry-run gate: J-1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE
- Stage support: J_SERIES_BATCH_STAGE_SUPPORT
- Stage support merge commit: 71c75e0c075e2949151660f88ae6ff23ce6cbe32
- Target file label: part-4 1-6 sales-status XLS
- Part: 4
- Period: 2026-06-01 ~ 2026-06-06
- File hash: sha256:5acf018ec065195bc8c122d43d9ed16eaa4e068f7182798c135fa9fc814ca8e9
- normalRows: 1295
- excludedRows: 175
- amountTotal: 338742294

## 3. Batch apply result

| Stage | Operation | maxRows | insertedRows | updatedRows | deletedRows | Verification |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| J-2 | INSERT only | 500 | 500 | 0 | 0 | post dry-run verified |
| J-3 | INSERT only | 500 | 500 | 0 | 0 | read-back and post dry-run verified |
| J-4 | INSERT only | 295 | 295 | 0 | 0 | read-back and post dry-run verified |

- total inserted: 1295
- updatedRows: 0
- deletedRows: 0
- J-2 rerun after initial apply: none
- J-3/J-4 rerun: none

Note: the first J-2 local script stopped after the actual apply because it incorrectly required `normalizedTableWrite: true`. Current stage support uses limited ledger inserts, where that flag is false. J-2 was not rerun; its result was verified by the immediate post-state read-only dry-run showing existingScopedRows 500 and insertCandidates 795.

## 4. Final post-apply dry-run

| Field | Value |
| --- | ---: |
| normalRows | 1295 |
| excludedRows | 175 |
| amountTotal | 338742294 |
| warningRows | 0 |
| errorRows | 0 |
| primaryScopeRows | 1295 |
| existingScopedRows | 1295 |
| noChangeRows | 1295 |
| insertCandidates | 0 |
| updateCandidates | 0 |
| deleteCandidates | 0 |

- planReady: true
- rawRowsReturned: false
- sideEffects on final dry-run: dbWrite false, storageWrite false, actualApply false

## 5. Approval files

- J-2 approval file: created locally, not committed
- J-3 approval file: created locally, not committed
- J-4 approval file: created locally, not committed
- approval file committed: none

## 6. Safety result

- localhost dev mode: used
- next start / production mode dryRun=false: not used
- production POST: none
- update/delete/full apply: none
- migration/seed/storage: none
- raw row/PII/secret output: none
- deploy/manual deploy: none
- previous sealed G/H/I stage rerun: none
- approval file committed: none
- port 3215 after apply: stopped

## 7. Validation result

- pre-apply dry-run for J-2: PASS
- pre-apply dry-run for J-3: PASS
- pre-apply dry-run for J-4: PASS
- post-apply dry-run after J-2: PASS
- post-apply dry-run after J-3: PASS
- post-apply dry-run after J-4: PASS
- read-back J-3/J-4: PASS
- lint: PASS, npm run lint
- test: PASS, npm run test, 28 files / 239 tests
- test:worker: PASS, npm run test:worker, 4 tests
- build: PASS, npm run build
- diff-check: PASS, git diff --check
- safety scans: PASS, report raw row/PII/secret, approval file committed, production POST, migration/seed/storage, deploy

## 8. Recommended next step

Merge this report-only PR, then run the J read-only closure audit.

No additional apply is allowed from this report.
