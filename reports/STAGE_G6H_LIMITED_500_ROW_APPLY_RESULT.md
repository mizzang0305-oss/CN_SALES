# CN_SALES STAGE G-6H Limited 500-Row Apply Result

## 1. Final Status

FINAL_STATUS = G6H_LIMITED_APPLY_500_ROWS_PASS

Reason:

- PR #46 report-only verification was merged into `main`.
- Current-state dry-run matched the required precondition: `1133 / 986 / 0 / 0 / 1133`.
- G-6H local approval file was created and validated in `.local-approval/`.
- The single approved localhost `dryRun=false` limited apply inserted 500 rows.
- Read-back verification confirmed 500 inserted rows for the G-6H batch.
- Post-apply dry-run matched the expected next state: `1633 / 486 / 0 / 0 / 1633`.
- G-6F and G-6G were not rerun.
- G-6I was not executed.

## 2. PR #46 Merge

- PR: https://github.com/mizzang0305-oss/CN_SALES/pull/46
- Result: merged
- Merge commit: `697f9c9e8aca966be6e680b0b3982bf59afa4813`
- Merge method: squash
- Side effects: GitHub/Vercel merge-triggered automation only

## 3. Approval

| Field | Value |
| --- | --- |
| stage | G-6H |
| target part | 11 |
| periodStart | 2026-06-01 |
| periodEnd | 2026-06-06 |
| maxRows | 500 |
| apply mode | limited-apply |
| allowed operation | insert |
| blocked operations | update, delete, hard_delete, full_apply |
| production POST approved | false |
| migration/seed/storage approved | false |

Approval file:

- Path: `.local-approval/g6h_limited_apply_approval.json`
- Committed: NO
- Validation: PASS

## 4. Current-State Dry-run

| Metric | Expected | Actual |
| --- | ---: | ---: |
| existingScopedRows | 1133 | 1133 |
| insertCandidates | 986 | 986 |
| updateCandidates | 0 | 0 |
| deleteCandidates | 0 | 0 |
| noChangeRows | 1133 | 1133 |

Additional status:

- HTTP status: 200
- `dryRun`: true
- `scopeSource`: explicit-request
- `planReady`: true
- `actualApplyReady`: false
- `actualApplyBlockedReason`: APPLY_NOT_APPROVED

## 5. Pre-Apply Dry-run

| Metric | Expected | Actual |
| --- | ---: | ---: |
| existingScopedRows | 1133 | 1133 |
| insertCandidates | 986 | 986 |
| updateCandidates | 0 | 0 |
| deleteCandidates | 0 | 0 |
| noChangeRows | 1133 | 1133 |

Additional status:

- HTTP status: 200
- `dryRun`: true
- `planReady`: true
- blockedReasons: none

## 6. Non-ISO Date Guard

| Metric | Value |
| --- | ---: |
| checkedRows | 500 |
| nonIsoLedgerDateCandidates | 0 |
| invalidLedgerDateCandidates | 0 |
| missingLedgerDateCandidates | 0 |

Result: PASS

## 7. Limited Apply Result

| Metric | Value |
| --- | ---: |
| HTTP status | 200 |
| requestedRows | 500 |
| affectedRows | 500 |
| insertedRows | 500 |
| updatedRows | 0 |
| deletedRows | 0 |
| normalizedTableWrite | false |

Import batch:

- importBatchId: `ec1f2257-375d-4ac3-9575-798133b2c7b6`
- applyMode: limited-apply
- stage: G-6H

## 8. Read-Back Verification

| Metric | Value |
| --- | --- |
| executed | true |
| readBackRows | 500 |
| totalScopedRows after apply | 1633 |
| matchesRequestedRows | true |
| identityHashMatch | true |
| identityHash count | 500 |
| contentHashPresent | true |
| selectedColumnsOnly | true |
| selectStarUsed | false |
| part/date match | true |
| audit/status present | true |

## 9. Post-Apply Dry-run

| Metric | Expected | Actual |
| --- | ---: | ---: |
| existingScopedRows | 1633 | 1633 |
| insertCandidates | 486 | 486 |
| updateCandidates | 0 | 0 |
| deleteCandidates | 0 | 0 |
| noChangeRows | 1633 | 1633 |

Reader evidence:

| Field | Value |
| --- | ---: |
| paged | true |
| pageSize | 500 |
| pagesRead | 4 |
| fetchedRows | 1633 |
| expectedCount | 1633 |
| countMatchesFetchedRows | true |
| rawRowsReturned | false |

## 10. Rollback Evidence

- Rollback evidence captured: YES
- Rollback executed: NO
- Rollback evidence file committed: NO
- Raw response dump committed: NO

The local response includes rollback identifiers for the G-6H batch. Those identifiers remain local-only and are not included in this report.

## 11. Safety

| Safety item | Result |
| --- | --- |
| DB write | YES, limited to approved G-6H 500 INSERT rows |
| DB write count | 500 |
| G-6F rerun | NO |
| G-6G rerun | NO |
| G-6I execution | NO |
| production POST | NO |
| update | NO |
| delete | NO |
| full apply | NO |
| migration/seed/storage | NO |
| SQL/view/role/grant | NO |
| Metabase connection | NO |
| Vercel CLI/manual deploy | NO |
| raw row/PII in report | NO |
| secret/env in report | NO |
| XLS/approval/response committed | NO |

Response safety scan:

- raw payload indicators: 0
- local paths: 0
- secret/env terms: 0
- `SELECT *`: 0
- PII fields: 0
- Broad `010-` scan false positives: 2 UUID rollback identifier paths in local-only response

## 12. Side Effects

Allowed side effects performed:

- PR #46 merge into `main`.
- Localhost-only G-6H approval-gated `dryRun=false` limited apply.
- 500 INSERT rows in `cn_sales.ledger_rows`.

Side effects not performed:

- No production POST.
- No G-6F rerun.
- No G-6G rerun.
- No G-6I apply.
- No update/delete/full apply.
- No migration apply.
- No seed apply.
- No storage write.
- No SQL/view/role/grant changes.
- No Vercel CLI/manual deploy.

## 13. Validation

| Check | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run test` | PASS, 27 files / 186 tests |
| `npm run test:worker` | PASS, 4 tests |
| `npm run build` | PASS |
| `git diff --check` | PASS |

## 14. Next Gate

G-6H 500-row limited apply is complete.

Next gate:

- Review and merge this report-only PR.
- If continuing, request separate explicit approval for the final G-6I 486-row apply.
