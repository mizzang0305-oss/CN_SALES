# STAGE N-1 next XLS read-only dry-run gate

## 1. FINAL_STATUS

FINAL_STATUS: N1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE_PASS

## 2. Selected XLS

- File label: part-7 1~6 sales-status XLS
- Part: 7
- Period: 2026-06-01 ~ 2026-06-06
- File hash: sha256:e18fd014bcffebb4df73839d6b70df4493709a303f6ec17fb2dd17405e1d6f3c
- Preview checksum: sha256:476c82fedbe63b98a3d8298e716a0d124092605772c38bc598a1040ae7666bab

## 3. Read-only dry-run result

The selected XLS was submitted to the localhost confirm route with `dryRun=true`. No approval file was created and no apply was executed.

| Field | Value |
| --- | ---: |
| totalRows | 2222 |
| normalRows | 1920 |
| excludedRows | 302 |
| warningRows | 0 |
| errorRows | 0 |
| amountTotal | 781351560 |
| primaryScopeRows | 1920 |
| existingScopedRows | 0 |
| noChangeRows | 0 |
| insertCandidates | 1920 |
| updateCandidates | 0 |
| deleteCandidates | 0 |
| duplicateIncomingIdentityHashes | 0 |
| duplicateExistingIdentityHashes | 0 |
| dateOutsideScopeRows | 0 |
| invalidDateRows | 0 |
| missingDateRows | 0 |

- planReady: true
- rawRowsReturned: false
- samePartPreviouslySealedOverlap: false
- dryRunReady: true
- actualApplyReady: false
- actualApplyBlockedReason: APPLY_NOT_APPROVED
- readExecuted: true
- readBlockedReason: null
- selectedColumnsOnly: true
- selectStarUsed: false

## 4. N-1 success criteria

- fileHash matches: PASS
- period matches: PASS
- primaryScopeRows = normalRows: PASS
- insertCandidates > 0: PASS
- updateCandidates = 0: PASS
- deleteCandidates = 0: PASS
- planReady = true: PASS
- rawRowsReturned = false: PASS
- dateOutsideScopeRows = 0: PASS
- invalidDateRows = 0: PASS
- missingDateRows = 0: PASS

## 5. Batch plan

insertCandidates = 1920

| Proposed stage | Operation | maxRows | Expected existingScopedRows before apply | Expected insertCandidates before apply | Expected insertedRows |
| --- | --- | ---: | ---: | ---: | ---: |
| N-2 | INSERT only | 500 | 0 | 1920 | 500 |
| N-3 | INSERT only | 500 | 500 | 1420 | 500 |
| N-4 | INSERT only | 500 | 1000 | 920 | 500 |
| N-5 | INSERT only | 420 | 1500 | 420 | 420 |

## 6. Safety result

- DB write: none
- dryRun=false: not run
- approval file created: none
- apply: not run
- production POST: none
- update/delete/full apply: none
- migration/seed/storage: none
- raw row/PII/secret output: none
- deploy/manual deploy: none
- sealed G/H/I/J/K/L/M stage rerun: none
- approval file committed: none
- out-of-scope docs/adsense: untouched

## 7. Next stage

NEXT_STAGE: N-SERIES_BATCH_STAGE_SUPPORT_CODE_TEST_REPORT_ONLY

The next stage should add exact stage support for N-2, N-3, N-4, and N-5. Actual apply is still blocked until that support PR is merged and each localhost-only approval file is created locally.

## 8. Validation result

- lint: PASS, npm run lint
- test: PASS, npm run test, 28 files / 271 tests
- test:worker: PASS, npm run test:worker, 4 tests
- build: PASS, npm run build
- diff-check: PASS, git diff --check
- safety scans: PASS
