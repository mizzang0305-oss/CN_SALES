# CN_SALES STAGE G-6F Stage Support Result

## 1. Final Status

- FINAL_STATUS draft: G6F_STAGE_SUPPORT_PR_CREATED_PASS
- Scope: code/test/report only
- Actual DB write: NO
- dryRun=false confirm execution: NO
- Production POST: NO

## 2. Baseline

- Previous G-6F 500-row apply gate was blocked before execution because the code recognized only G-6B, G-6D, and G-6E limited apply stages.
- The confirm route requires `approvalStage` to pass the limited apply stage guard before any approval-gated write path can be considered.
- This PR adds explicit G-6F stage support before any future 500-row apply attempt.

## 3. Implementation

- Added `G-6F` to the limited apply stage union.
- Added `g6f_limited_apply_approval.json` as the local-only approval filename.
- Added G-6F stage config:
  - maxRows: 500
  - expectedExistingScopedRows: 133
  - expectedInsertCandidates: 1986
  - expectedNoChangeRows: 133
- Extended `isLimitedApplyStage()` so `approvalStage=G-6F` can be recognized by the existing approval-gated confirm route.
- No production POST path was added.
- No migration, seed, storage, RLS, grant, revoke, env, auth, payment, or webhook change was made.

## 4. G-6F Policy

| Field | Policy |
| --- | --- |
| Stage | G-6F |
| Max rows | 500 |
| Allowed operations | insert only |
| Blocked operations | update, delete, hard_delete, full_apply |
| Production POST | not approved |
| Migration/seed/storage | not approved |
| Expected pre-apply scoped rows | 133 |
| Expected insert candidates | 1986 |
| Expected no-change rows | 133 |

G-6F remains approval-gated. A local approval file and matching request fields are required before a future limited apply can execute.

## 5. Tests

- Added validation that G-6F is recognized as a configured limited apply stage.
- Added validation that G-6F accepts only the max-500 insert-only approval shape.
- Added validation that G-6F rejects maxRows below or above 500.
- Added row selection coverage for 500 G-6F insert candidates after 133 existing rows.
- Added precondition coverage for the expected post-G-6E dry-run state.
- Added blocking coverage for update candidates, delete candidates, warning rows, and error rows.
- Added static coverage that G-6F stage config remains present.

## 6. Safety

- DB write executed: NO
- dryRun=false confirm executed: NO
- Actual XLS preview executed: NO
- Production POST executed: NO
- Migration apply: NO
- Seed apply: NO
- Storage write: NO
- Vercel deploy/redeploy: NO
- Raw row output: NO
- PII output: NO
- Secret/env output: NO
- XLS/XLSX committed: NO
- Approval files committed: NO
- Raw response dumps committed: NO

## 7. Side Effects

Only local source, test, and report files were changed. No external system was written.

## 8. Next Gate

After this PR is reviewed and merged:

1. Re-run the G-6F pre-apply dry-run from main.
2. Confirm the expected scoped row counts and duplicate guards.
3. Confirm the 500 selected rows pass the ISO ledger date guard.
4. Only then consider the separately approved `max_rows=500` INSERT-only limited apply.

