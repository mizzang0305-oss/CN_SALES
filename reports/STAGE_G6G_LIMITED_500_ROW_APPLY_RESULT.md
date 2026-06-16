# CN_SALES STAGE G-6G Limited 500-Row Apply Result

## 1. Final Status

FINAL_STATUS: G6G_POST_DRY_RUN_MISMATCH

G-6G limited apply inserted 500 rows and read-back for the import batch passed.
However, the post-apply dry-run endpoint returned 1000 scoped existing rows
instead of the expected 1133. A separate count-only read verified 1133 scoped
rows and 500 rows for the import batch, so the next gate is to fix/recheck the
read path before any G-6H apply.

## 2. PR #43 Merge

| Item | Result |
| --- | --- |
| PR | https://github.com/mizzang0305-oss/CN_SALES/pull/43 |
| Merged | YES |
| Merge commit | 275ba6e904a4c88e3c132017513dc30e28f983a2 |
| Main validation after merge | PASS |
| Merge side effects | GitHub/Vercel merge-triggered automation only |

## 3. Approval

| Item | Result |
| --- | --- |
| Stage | G-6G |
| maxRows | 500 |
| periodStart | 2026-06-01 |
| periodEnd | 2026-06-06 |
| Allowed operation | insert |
| Blocked operations | update, delete, hard_delete, full_apply |
| Approval file | local-only, not committed |

## 4. Current-State Dry-run

| Metric | Result |
| --- | ---: |
| HTTP status | 200 |
| dryRun | true |
| scopeSource | explicit-request |
| existingScopedRows | 633 |
| insertCandidates | 1486 |
| updateCandidates | 0 |
| deleteCandidates | 0 |
| noChangeRows | 633 |
| duplicateIncomingIdentityHashes | 0 |
| duplicateExistingKeys | 0 |
| planReady | true |
| actualApplyBlockedReason | APPLY_NOT_APPROVED |

## 5. Pre-Apply Dry-run

| Metric | Result |
| --- | ---: |
| HTTP status | 200 |
| existingScopedRows | 633 |
| insertCandidates | 1486 |
| updateCandidates | 0 |
| deleteCandidates | 0 |
| noChangeRows | 633 |
| planReady | true |

## 6. Non-ISO Date Guard

| Metric | Result |
| --- | ---: |
| checkedRows | 500 |
| nonIsoLedgerDateCandidates | 0 |
| invalidLedgerDateCandidates | 0 |

## 7. Limited Apply Result

| Metric | Result |
| --- | --- |
| Executed | YES |
| Host | localhost dev server |
| Production POST | NO |
| requestedRows | 500 |
| affectedRows | 500 |
| insertedRows | 500 |
| updatedRows | 0 |
| deletedRows | 0 |
| normalizedTableWrite | false |
| importBatchId | c3c6a03a-a5bc-458f-9e54-f1f52f35d092 |

## 8. Read-Back Verification

| Metric | Result |
| --- | ---: |
| executed | true |
| readBackRows | 500 |
| identityHash count | 500 |
| part/date match | true |
| selectedColumnsOnly | true |
| selectStarUsed | false |
| audit/status present | true |

Additional count-only evidence:

| Metric | Result |
| --- | ---: |
| scoped_count | 1133 |
| batch_count | 500 |

## 9. Post-Apply Dry-run

| Metric | Expected | Actual |
| --- | ---: | ---: |
| HTTP status | 200 | 200 |
| existingScopedRows | 1133 | 1000 |
| insertCandidates | 986 | 1119 |
| updateCandidates | 0 | 0 |
| deleteCandidates | 0 | 0 |
| noChangeRows | 1133 | 1000 |
| planReady | true | true |

Interpretation:

- The DB write and batch read-back passed.
- Count-only verification shows the expected scoped total and batch total.
- The dry-run endpoint did not return the expected post-apply diff.
- The likely blocker is a read-path row limit in the existing ledger sync reader.
- G-6H must not proceed until the dry-run path reports 1133 / 986 / 0 / 0 / 1133.

## 10. Rollback Evidence

| Item | Result |
| --- | --- |
| importBatchId | c3c6a03a-a5bc-458f-9e54-f1f52f35d092 |
| rollbackExecuted | false |
| rollback row identifiers in report | NO |
| rollback evidence source | local-only response dump, not committed |

Rollback was not executed.

## 11. Safety

| Check | Result |
| --- | --- |
| DB write | YES, limited to 500 insert rows |
| G-6F rerun | NO |
| production POST | NO |
| update | NO |
| delete | NO |
| full apply | NO |
| migration apply | NO |
| seed apply | NO |
| storage write | NO |
| SQL/view/role/grant | NO |
| Metabase connection | NO |
| raw row in report | NO |
| customer PII in report | NO |
| secret/env value in report | NO |
| XLS/approval/response committed | NO |

## 12. Side Effects

Allowed side effect performed:

- localhost approval-gated G-6G limited apply inserted 500 rows into cn_sales
  ledger import storage tables.

Side effects not performed:

- No production POST.
- No update/delete/full apply.
- No migration/seed/storage operation.
- No SQL/view/role/grant change.
- No Vercel CLI/manual deploy.
- No rollback.

## 13. Next Gate

G-6H is blocked until the post-apply dry-run path is corrected or otherwise
proves the expected state with selected-column, non-PII evidence.

Required next steps:

1. Fix or reconcile the existing ledger sync read path so it can read beyond
   the first 1000 scoped rows.
2. Re-run post-G-6G dry-run only.
3. Require expected state 1133 / 986 / 0 / 0 / 1133.
4. Only after that, request separate approval for G-6H.
