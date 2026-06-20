# STAGE_N_SERIES_BATCH_STAGE_SUPPORT

## 1. FINAL_STATUS

FINAL_STATUS: N_SERIES_BATCH_STAGE_SUPPORT_READY

This is a code/test/report-only stage support change. No apply was executed in this stage.

## 2. Previous Sealed State

- G-stage sealed: yes, no rerun
- H-stage sealed: yes, no rerun
- I-stage sealed: yes, no rerun
- J-stage sealed: yes, no rerun
- K-stage sealed: yes, no rerun
- L-stage sealed: yes, no rerun
- M-stage sealed: yes, no rerun

## 3. Target XLS Aggregate Summary

- file: part-7 1~6 sales-status XLS
- part: 7
- period: 2026-06-01 ~ 2026-06-06
- fileHash: sha256:e18fd014bcffebb4df73839d6b70df4493709a303f6ec17fb2dd17405e1d6f3c
- normalRows: 1920
- excludedRows: 302
- amountTotal: 781351560
- rawRowsReturned: false

## 4. Stage Support Added

The N-series write gate is exact-stage only.

| stage | maxRows | expectedExistingScopedRowsBeforeApply | expectedInsertCandidatesBeforeApply | expectedInsertedRows |
| --- | ---: | ---: | ---: | ---: |
| N-2 | 500 | 0 | 1920 | 500 |
| N-3 | 500 | 500 | 1420 | 500 |
| N-4 | 500 | 1000 | 920 | 500 |
| N-5 | 420 | 1500 | 420 | 420 |

Common exact constraints:

- operation: INSERT only
- target part: 7
- period: 2026-06-01 ~ 2026-06-06
- fileHash: sha256:e18fd014bcffebb4df73839d6b70df4493709a303f6ec17fb2dd17405e1d6f3c
- expectedPrimaryScopeRows: 1920
- expectedUpdateCandidatesBeforeApply: 0
- expectedDeleteCandidatesBeforeApply: 0
- approval file required for dryRun=false: true
- explicit request scope required: true

## 5. Safety Constraints

- wildcard N-stage allowed: false
- arbitrary maxRows allowed: false
- update/delete/full apply allowed: false
- production mode dryRun=false allowed: false
- raw row return allowed: false
- approval file committed: false
- production POST executed: false
- migration/seed/storage executed: false
- deploy executed: false

## 6. Tests Added

- N-series stage recognition and unsupported stage blocking
- N-series approval shape acceptance
- wrong workflow gate, maxRows, operation, hash, period, part, and full-apply blocking
- exact expected count contract blocking
- missing local approval file blocking
- pre-apply dry-run aggregate contract pass case
- explicit request scope requirement
- request/part/hash/count drift blocking
- update/delete/warning/error hard blocker coverage
- static source guard against wildcard stage and arbitrary maxRows patterns
- previous G/H/I/J/K/L/M stage coverage retained

## 7. Validation Result

- targeted tests: PASS (`npx vitest run tests/limited-apply.test.ts tests/upload-preview-static.test.ts`)
- lint: PASS (`npm run lint`)
- test: PASS (`npm run test`, 28 files / 281 tests)
- test:worker: PASS (`npm run test:worker`)
- build: PASS (`npm run build`)
- diff-check: PASS (`git diff --check`)
- safety scans: PASS

## 8. Recommended Next Step

After this support PR is merged into main, proceed to N-series sequential localhost dev mode limited INSERT-only apply:

- N-2 first 500
- N-3 next 500
- N-4 next 500
- N-5 final 420

Each batch must run a fresh pre-apply dry-run, create a fresh local approval file, execute exactly one localhost dev mode dryRun=false request, and verify aggregate-only post-apply dry-run counts before proceeding.
