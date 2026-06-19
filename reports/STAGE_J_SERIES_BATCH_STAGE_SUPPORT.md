# STAGE J-series batch stage support

## 1. FINAL_STATUS

FINAL_STATUS: J_SERIES_BATCH_STAGE_SUPPORT_READY

## 2. Source gate

- Source gate: J-1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE
- Source PR: #74
- Target file label: part-4 1-6 sales-status XLS
- Part: 4
- Period: 2026-06-01 ~ 2026-06-06
- File hash: sha256:5acf018ec065195bc8c122d43d9ed16eaa4e068f7182798c135fa9fc814ca8e9
- normalRows: 1295
- excludedRows: 175
- amountTotal: 338742294
- existingScopedRows before J-2: 0
- insertCandidates before J-2: 1295
- updateCandidates: 0
- deleteCandidates: 0
- planReady: true
- rawRowsReturned: false

## 3. Exact stage support added

| Stage | Approval file | maxRows | Expected existingScopedRows | Expected insertCandidates | Expected noChangeRows | Expected insertedRows |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| J-2 | j2_limited_apply_approval.json | 500 | 0 | 1295 | 0 | 500 |
| J-3 | j3_limited_apply_approval.json | 500 | 500 | 795 | 500 | 500 |
| J-4 | j4_limited_apply_approval.json | 295 | 1000 | 295 | 1000 | 295 |

Shared constraints:

- target part: 4
- period: 2026-06-01 ~ 2026-06-06
- file hash: sha256:5acf018ec065195bc8c122d43d9ed16eaa4e068f7182798c135fa9fc814ca8e9
- primaryScopeRows: 1295
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
| Exact J stages recognized | PASS, J-2/J-3/J-4 only |
| Unsupported J stages blocked | PASS, J-0/J-1/J-5/J-* blocked |
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
| Previous G/H/I stage support regression | PASS |

## 5. Files changed

- src/lib/import/limited-apply.ts
- tests/limited-apply.test.ts
- tests/upload-preview-static.test.ts
- reports/STAGE_J_SERIES_BATCH_STAGE_SUPPORT.md

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
- previous sealed G/H/I stage rerun: none

## 7. Validation result

- targeted limited apply tests: PASS, 2 files / 101 tests
- lint: PASS, npm run lint
- test: PASS, npm run test, 28 files / 239 tests
- test:worker: PASS, npm run test:worker, 4 tests
- build: PASS, npm run build
- diff-check: PASS, git diff --check
- safety scans: PASS, secret/env, report raw row, production POST, dryRun=false invocation, migration/seed/storage, approval file committed

## 8. Recommended next step

Merge this code/test/report PR, then run J-series sequential localhost-only INSERT apply in these stages:

1. J-2 first 500 rows
2. J-3 next 500 rows
3. J-4 final 295 rows

Each stage still requires a local approval file and a matching pre-apply dry-run. This support PR alone does not allow apply.
