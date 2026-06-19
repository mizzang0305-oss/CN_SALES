# STAGE I-series remaining batch stage support

## 1. FINAL_STATUS

FINAL_STATUS: I_SERIES_REMAINING_BATCH_STAGE_SUPPORT_READY

## 2. Scope

- Stage: I-SERIES_REMAINING_BATCH_STAGE_SUPPORT_CODE_TEST_REPORT_ONLY
- File: part-1 2026-06-01-to-2026-06-06 sales XLS
- Part: 1
- Period: 2026-06-01 ~ 2026-06-06
- File hash: sha256:f43f9eefc35eb30b84e682e22be117d99f30897d69b72d16a91b0adf9a28fcbd
- Operation support: INSERT only
- Report-only/code-test stage: true
- Actual apply in this support stage: false

## 3. Prior state

- I-0 candidate discovery: merged
- I-1 read-only dry-run gate: merged
- I-2A stage support: merged
- I-2 first 500 INSERT-only apply result: draft/open at handoff
- I-3 next batch support check PR #69: merged
- PR #69 merge commit: fbcf896f1cdf47fcd9af682c7b6bf0dc5d81434f
- Current pre-support database expectation after I-2: existingScopedRows 500, insertCandidates 1028, updateCandidates 0, deleteCandidates 0

## 4. Root cause

I-3/I-4/I-5 were not recognized as explicit limited apply stages. The existing support recognized I-2 only, so the remaining batches needed exact stage registration before any further localhost limited INSERT-only apply could be attempted.

## 5. Code support summary

- Added explicit I-series stage support for I-2, I-3, I-4, and I-5.
- Kept stage recognition closed over exact stage names only.
- Did not add wildcard I-stage support.
- Did not add any general max_rows <= 500 fallback.
- Kept I-series file hash, part, and period fixed to the approved target.
- Kept production mode DB writes blocked by existing runtime environment guard.

## 6. Remaining batch contracts

| Stage | maxRows | expectedInsertedRows | existingScopedRows | insertCandidates | noChangeRows | updateCandidates | deleteCandidates |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| I-3 | 500 | 500 | 500 | 1028 | 500 | 0 | 0 |
| I-4 | 500 | 500 | 1000 | 528 | 1000 | 0 | 0 |
| I-5 | 28 | 28 | 1500 | 28 | 1500 | 0 | 0 |

## 7. Approval gate

- Approval file required for dryRun=false: true
- I-3 approval file: .local-approval/i3_limited_apply_approval.json
- I-4 approval file: .local-approval/i4_limited_apply_approval.json
- I-5 approval file: .local-approval/i5_limited_apply_approval.json
- Required request scope: explicit part 1 and period 2026-06-01 ~ 2026-06-06
- Required source file hash: sha256:f43f9eefc35eb30b84e682e22be117d99f30897d69b72d16a91b0adf9a28fcbd
- Required operation: insert only
- Required dry-run precheck: aggregate counts must exactly match the stage contract before each write

## 8. Regression protection

- I-series stage policies include exact maxRows for I-2/I-3/I-4/I-5.
- Approval validation blocks wrong workflowGate, missing workflowGate, wrong maxRows, wrong operation, wrong period, wrong file hash, wrong part, update/delete/full apply flags, and mismatched source preview counts.
- Precondition validation blocks request scope drift, selected part drift, source hash drift, dry-run count drift, update/delete candidates, warning rows, and error rows.
- Missing approval files block dryRun=false entry for I-2/I-3/I-4/I-5.
- Static tests keep the limited insert repository path free of update/delete/upsert operations.
- Static tests keep production mode DB writes blocked.

## 9. Validation

- Focused test: PASS, npx vitest run tests/limited-apply.test.ts tests/upload-preview-static.test.ts, 90 tests
- lint: PASS, npm run lint
- test: PASS, npm run test, 28 files / 228 tests
- test:worker: PASS, npm run test:worker, 4 tests
- build: PASS, npm run build
- diff-check: PASS, git diff --check
- secret/env value scan: PASS, added-line diff scan
- raw row/PII field scan: PASS, added-line diff scan
- production POST scan: PASS, added-line diff scan
- migration/seed/storage scan: PASS, added-line diff scan
- dryRun=false actual invocation scan: PASS, added-line diff scan
- deploy scan: PASS, added-line diff scan

## 10. Safety constraints

- DB write in this support stage: none
- Actual apply in this support stage: none
- dryRun=false invocation in this support stage: none
- production POST: none
- update/delete/full apply: none
- migration/seed/storage: none
- raw row/PII/secret output: none
- deploy: none
- previous G-stage rerun: none
- previous H-stage rerun: none
- approval file committed: none

## 11. Recommended next step

After this support branch is merged, proceed only with the already approved localhost dev-mode sequence:

1. I-3 limited INSERT-only apply, maxRows 500, only after matching pre-apply dry-run.
2. I-4 limited INSERT-only apply, maxRows 500, only after matching pre-apply dry-run.
3. I-5 final limited INSERT-only apply, maxRows 28, only after matching pre-apply dry-run.
4. Then create a report-only apply result PR and run I-6 read-only closure audit.

Additional XLS, part, rollback, update, delete, full apply, production POST, deploy, or previous-stage rerun still requires a separate explicit approval gate.
