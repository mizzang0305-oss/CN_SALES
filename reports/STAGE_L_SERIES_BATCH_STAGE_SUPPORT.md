# STAGE L-series batch stage support

## 1. FINAL_STATUS

FINAL_STATUS: L_SERIES_BATCH_STAGE_SUPPORT_READY

## 2. Source gate

- Source gate: L-1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE
- Source PR: #84
- Target file label: part-5 1~6 sales-status XLS
- Part: 5
- Period: 2026-06-01 ~ 2026-06-06
- File hash: sha256:0e4f909e5fe2d43e924e99352a6bdfa6f673357b5b2c41974b1981471ef2ad6a
- normalRows: 1546
- excludedRows: 218
- amountTotal: 549324126
- existingScopedRows before L-2: 0
- insertCandidates before L-2: 1546
- updateCandidates: 0
- deleteCandidates: 0
- planReady: true
- rawRowsReturned: false

## 3. Exact stage support added

| Stage | Approval file | maxRows | Expected existingScopedRows | Expected insertCandidates | Expected noChangeRows | Expected insertedRows |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| L-2 | l2_limited_apply_approval.json | 500 | 0 | 1546 | 0 | 500 |
| L-3 | l3_limited_apply_approval.json | 500 | 500 | 1046 | 500 | 500 |
| L-4 | l4_limited_apply_approval.json | 500 | 1000 | 546 | 1000 | 500 |
| L-5 | l5_limited_apply_approval.json | 46 | 1500 | 46 | 1500 | 46 |

Shared constraints:

- target part: 5
- period: 2026-06-01 ~ 2026-06-06
- file hash: sha256:0e4f909e5fe2d43e924e99352a6bdfa6f673357b5b2c41974b1981471ef2ad6a
- primaryScopeRows: 1546
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
| Exact L stages recognized | PASS, L-2/L-3/L-4/L-5 only |
| Unsupported L stages blocked | PASS, L-0/L-1/L-6/L-* blocked |
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
| Previous G/H/I/J/K stage support regression | PASS |

## 5. Files changed

- src/lib/import/limited-apply.ts
- tests/limited-apply.test.ts
- tests/upload-preview-static.test.ts
- reports/STAGE_L_SERIES_BATCH_STAGE_SUPPORT.md

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
- previous sealed G/H/I/J/K stage rerun: none

## 7. Validation result

- targeted limited apply tests: PASS, 2 files / 123 tests
- lint: PASS, npm run lint
- test: PASS, npm run test, 28 files / 261 tests
- test:worker: PASS, npm run test:worker, 4 tests
- build: PASS, npm run build
- diff-check: PASS, git diff --check
- safety scans: PASS, secret/env, report raw row, production POST, dryRun=false invocation, migration/seed/storage, approval file committed

## 8. Recommended next step

Merge this code/test/report PR, then run L-series sequential localhost-only INSERT apply in these stages:

1. L-2 first 500 rows
2. L-3 next 500 rows
3. L-4 next 500 rows
4. L-5 final 46 rows

Each stage still requires a local approval file and a matching pre-apply dry-run. This support PR alone does not allow apply.
