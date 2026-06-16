# CN_SALES Remaining Limited Apply Support Result

## 1. Final Status

FINAL_STATUS: REMAINING_STAGE_SUPPORT_PR_CREATED_PASS

This report documents code/test/report preparation only. No database connection,
limited apply execution, dryRun=false confirm call, production POST, migration,
seed, storage write, SQL/view/role/grant change, Metabase connection, or manual
deploy was performed in this stage.

## 2. PR #42 Merge

| Item | Result |
| --- | --- |
| PR | https://github.com/mizzang0305-oss/CN_SALES/pull/42 |
| Status | merged before this support branch |
| Merge commit | 9f890d7e1b44ff38396214ff8c9ee1eaeb583424 |
| Scope | G-6G limited apply stage support |
| Additional DB write during merge | NO |

## 3. Baseline

The current state assumption comes from the prior G-6F post-apply dry-run
evidence. It must be rechecked with a fresh read-only dry-run before any next
limited apply approval.

| Metric | Expected current value before G-6G |
| --- | ---: |
| existingScopedRows | 633 |
| insertCandidates | 1486 |
| updateCandidates | 0 |
| deleteCandidates | 0 |
| noChangeRows | 633 |
| planReady | true |

G-6F rerun is prohibited.

## 4. Stage Policy

| Stage | maxRows | Expected before existingScopedRows | Expected before insertCandidates | Expected before noChangeRows | Expected after existingScopedRows | Expected after insertCandidates | Expected after noChangeRows |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| G-6G | 500 | 633 | 1486 | 633 | 1133 | 986 | 1133 |
| G-6H | 500 | 1133 | 986 | 1133 | 1633 | 486 | 1633 |
| G-6I | 486 | 1633 | 486 | 1633 | 2119 | 0 | 2119 |

Shared policy:

- INSERT-only approval.
- update, delete, hard delete, and full apply remain blocked.
- G-6F and later require explicit periodStart/periodEnd request scope.
- production POST remains prohibited.
- approval files remain local-only and must not be committed.

## 5. G-6H Support

G-6H is prepared as the next 500-row limited apply stage after G-6G.

Required pre-apply evidence:

- existingScopedRows: 1133
- insertCandidates: 986
- updateCandidates: 0
- deleteCandidates: 0
- noChangeRows: 1133
- explicit request period: 2026-06-01 through 2026-06-06

Expected post-apply evidence:

- existingScopedRows: 1633
- insertCandidates: 486
- noChangeRows: 1633

## 6. G-6I Support

G-6I is prepared as the final 486-row limited apply stage after G-6H.

Required pre-apply evidence:

- existingScopedRows: 1633
- insertCandidates: 486
- updateCandidates: 0
- deleteCandidates: 0
- noChangeRows: 1633
- explicit request period: 2026-06-01 through 2026-06-06

Expected post-apply evidence:

- existingScopedRows: 2119
- insertCandidates: 0
- noChangeRows: 2119

## 7. Final Sync Verification Support

Final verification is a read-only dry-run result check. It expects only aggregate
counts and read-only evidence.

Required final state:

- normalRows: 2119
- excludedRows: 275
- warningRows: 0
- errorRows: 0
- existingScopedRows: 2119
- insertCandidates: 0
- updateCandidates: 0
- deleteCandidates: 0
- noChangeRows: 2119
- planReady: true
- selectedColumnsOnly: true
- selectStarUsed: false

The helper returns aggregate evidence only and does not require a DB write.

## 8. DB Connection Readiness

Required environment key names for the next operator-run stage:

- SUPABASE_PROJECT_REF
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY
- CN_SALES_IMPORT_BACKEND
- CN_SALES_ALLOW_DB_WRITES
- CN_SALES_ADMIN_AUTH_USER_ID

Values must never be printed in logs, reports, PR bodies, or screenshots.

First action after DB connection:

1. Pull latest main.
2. Run local validation.
3. Recheck workbook hash.
4. Run preview with explicit period.
5. Run confirm dryRun=true only.
6. Verify current-state diff is still 633 / 1486 / 0 / 0 / 633 before G-6G.
7. Prepare local-only approval file.
8. Execute G-6G 500-row apply only after separate explicit approval.

## 9. Tests

Added/updated test coverage:

- G-6H and G-6I stage recognition.
- G-6H maxRows=500 strict approval.
- G-6I maxRows=486 strict approval.
- G-6H/G-6I INSERT-only approval shapes.
- G-6H/G-6I update/delete/warning/error blockers.
- G-6H/G-6I explicit period scope blockers.
- Final sync aggregate verification.
- Final verification raw-row non-exposure.

## 10. Safety

| Check | Result |
| --- | --- |
| DB write | NO |
| dryRun=false confirm call | NO |
| production POST | NO |
| update/delete/full apply enabled | NO |
| migration apply | NO |
| seed apply | NO |
| storage write | NO |
| SQL/view/role/grant apply | NO |
| Metabase connection | NO |
| Vercel CLI/manual deploy | NO |
| raw row output | NO |
| secret/env value output | NO |
| XLS/approval/raw response committed | NO |

## 11. Side Effects

This stage only updates code, tests, and this report. No external state was
changed.

## 12. Next Gate

Next gate is not an apply step. It is a DB-connected read-only readiness
recheck:

1. Confirm environment readiness by presence only.
2. Run local app against the intended target.
3. Execute read-only preview/dry-run with explicit period.
4. Confirm the current-state diff still matches the expected G-6G precondition.
5. Request separate approval before any G-6G limited apply.
