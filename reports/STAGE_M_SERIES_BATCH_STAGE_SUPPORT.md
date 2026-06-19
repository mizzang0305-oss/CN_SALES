# STAGE M-series batch stage support

## 1. FINAL_STATUS

FINAL_STATUS: M_SERIES_BATCH_STAGE_SUPPORT_READY

## 2. Source gates

- Candidate gate: M-0_NEXT_XLS_CANDIDATE_DISCOVERY_AND_APPROVAL_PLAN
- Candidate gate PR: #88
- Read-only dry-run gate: M-1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE
- Read-only dry-run gate PR: #89
- Selected file label: part-6 1~6 sales-status XLS
- Part: 6
- Period: 2026-06-01 ~ 2026-06-06
- File hash: sha256:3a99de5405c01e1e9eba7ca7e3c0ddeaf3f61947ace3bb0c6897bdedffb3700f
- normalRows: 1359
- excludedRows: 148
- amountTotal: 527288764
- M-1 insertCandidates: 1359
- M-1 updateCandidates: 0
- M-1 deleteCandidates: 0

## 3. Added exact stages

| Stage | Operation | maxRows | expectedExistingScopedRowsBeforeApply | expectedInsertCandidatesBeforeApply | expectedInsertedRows |
| --- | --- | ---: | ---: | ---: | ---: |
| M-2 | INSERT only | 500 | 0 | 1359 | 500 |
| M-3 | INSERT only | 500 | 500 | 859 | 500 |
| M-4 | INSERT only | 359 | 1000 | 359 | 359 |

Shared exact constraints:

- expectedPrimaryScopeRows: 1359
- expectedUpdateCandidatesBeforeApply: 0
- expectedDeleteCandidatesBeforeApply: 0
- periodStart: 2026-06-01
- periodEnd: 2026-06-06
- fileHash: sha256:3a99de5405c01e1e9eba7ca7e3c0ddeaf3f61947ace3bb0c6897bdedffb3700f
- target part: 6

## 4. Guard result

- Any M-stage wildcard allowed: no
- arbitrary maxRows allowed: no
- maxRows <= 500 broad rule added: no
- update/delete/full apply allowed: no
- approval file missing dryRun=false allowed: no
- production mode dryRun=false allowed: no
- raw row return allowed: no
- previous G/H/I/J/K/L stage behavior changed intentionally: no

## 5. Changed files

- src/lib/import/limited-apply.ts
- tests/limited-apply.test.ts
- tests/upload-preview-static.test.ts
- reports/STAGE_M_SERIES_BATCH_STAGE_SUPPORT.md

## 6. Safety result

- actual apply: not run
- DB write: none
- production POST: none
- update/delete/full apply: none
- migration/seed/storage: none
- raw row/PII/secret output: none
- deploy/manual deploy: none
- sealed G/H/I/J/K/L stage rerun: none
- approval file created: none
- approval file committed: none

## 7. Validation result

- targeted tests: PASS, npx vitest run tests/limited-apply.test.ts tests/upload-preview-static.test.ts, 2 files / 133 tests
- lint: PASS, npm run lint
- test: PASS, npm run test, 28 files / 271 tests
- test:worker: PASS, npm run test:worker, 4 tests
- build: PASS, npm run build
- diff-check: PASS, git diff --check
- safety scans: PASS

## 8. Recommended next step

Merge this code/test/report-only stage support PR, then run M-series localhost dev mode limited INSERT apply batches M-2, M-3, and M-4 with fresh local approval files. No actual apply is allowed from this support PR itself.
