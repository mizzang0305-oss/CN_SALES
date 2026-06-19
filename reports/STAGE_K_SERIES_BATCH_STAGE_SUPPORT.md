# STAGE K-series batch stage support

## 1. FINAL_STATUS

FINAL_STATUS: K_SERIES_BATCH_STAGE_SUPPORT_READY

## 2. Source gate

- Source gate: K-1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE
- Source PR: #79
- Target file label: part-4 6-12 sales-status XLS
- Part: 4
- Period: 2026-06-07 ~ 2026-06-12
- File hash: sha256:a5c5ecf67009a83d2bb5639229462e9231ccff1e81291e0cecc365263597217a
- normalRows: 1338
- excludedRows: 165
- amountTotal: 511598722
- existingScopedRows before K-2: 0
- insertCandidates before K-2: 1338
- updateCandidates: 0
- deleteCandidates: 0
- planReady: true
- rawRowsReturned: false

## 3. Exact stage support added

| Stage | Approval file | maxRows | Expected existingScopedRows | Expected insertCandidates | Expected noChangeRows | Expected insertedRows |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| K-2 | k2_limited_apply_approval.json | 500 | 0 | 1338 | 0 | 500 |
| K-3 | k3_limited_apply_approval.json | 500 | 500 | 838 | 500 | 500 |
| K-4 | k4_limited_apply_approval.json | 338 | 1000 | 338 | 1000 | 338 |

Shared constraints:

- target part: 4
- period: 2026-06-07 ~ 2026-06-12
- file hash: sha256:a5c5ecf67009a83d2bb5639229462e9231ccff1e81291e0cecc365263597217a
- primaryScopeRows: 1338
- updateCandidates: 0
- deleteCandidates: 0
- operation: INSERT only
- full apply: blocked
- production POST: blocked
- migration/seed/storage: blocked
- approval workflowGate: exact stage name required

## 4. Guardrails confirmed

| Guardrail | Result |
| --- | --- |
| Exact K stages recognized | PASS, K-2/K-3/K-4 only |
| Unsupported K stages blocked | PASS, K-0/K-1/K-5/K-* blocked |
| Wildcard stage support | PASS, not allowed |
| Arbitrary maxRows | PASS, not allowed |
| Wrong period blocked | PASS |
| Wrong file hash blocked | PASS |
| Wrong target part blocked | PASS |
| Wrong expectedExistingScopedRows blocked | PASS |
| Wrong expectedInsertCandidates blocked | PASS |
| Missing expectedInsertedRows blocked | PASS |
| update/delete/full apply blocked | PASS |
| Missing approval file blocks dryRun=false | PASS |
| Production mode dryRun=false blocked | PASS, existing environment guard retained |
| Raw row diagnostics returned | PASS, false |
| Previous G/H/I/J stage support regression | PASS |

## 5. Files changed

- src/lib/import/limited-apply.ts
- tests/limited-apply.test.ts
- tests/upload-preview-static.test.ts
- reports/STAGE_K_SERIES_BATCH_STAGE_SUPPORT.md

## 6. Safety result

- Actual apply: none
- dryRun=false actual call: none
- DB write: none
- production POST: none
- update/delete/full apply: none
- migration/seed/storage: none
- raw row/PII/secret output: none
- deploy/manual deploy: none
- approval file committed: none
- previous sealed G/H/I/J stage rerun: none

## 7. Validation result

- targeted limited apply tests: PASS, 2 files / 112 tests
- lint: PASS, npm run lint
- test: PASS, npm run test, 28 files / 250 tests
- test:worker: PASS, npm run test:worker, 4 tests
- build: PASS, npm run build
- diff-check: PASS, git diff --check
- safety scans: PASS, secret/env, report raw row, production POST, dryRun=false invocation, migration/seed/storage, approval file committed

## 8. Recommended next step

Merge this code/test/report PR, then run K-series sequential localhost-only INSERT apply in these stages:

1. K-2 first 500 rows
2. K-3 next 500 rows
3. K-4 final 338 rows

Each stage still requires a local approval file and a matching pre-apply dry-run. This support PR alone does not allow apply.
