# CN_SALES STAGE G-6F Limited 500-Row Apply Result

## 1. Final Status

- FINAL_STATUS: G6F_READBACK_FAILED
- Reason: the approved G-6F limited apply inserted the expected scoped rows, and separate selected-column read-back verified the batch, but the `/api/uploads/confirm` limited-apply response returned HTTP 500 at its internal read-back step.
- Additional apply after this result: prohibited

## 2. Baseline

- Main HEAD before apply: ac0cb35
- PR #39 scope guard fix: merged
- Target part: 11
- Period scope: 2026-06-01 ~ 2026-06-06
- Source file hash: sha256:37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0
- XLS file committed: NO

## 3. Approval

- Stage: G-6F
- Mode: limited-apply
- Max rows: 500
- Allowed operations: INSERT only
- Blocked operations: UPDATE, DELETE, hard delete, full apply
- Operator: Minz
- Rollback owner: Minz
- Approval file location: `.local-approval/g6f_limited_apply_approval.json`
- Approval file committed: NO

## 4. Scope Guard

- `periodStart`: 2026-06-01
- `periodEnd`: 2026-06-06
- `syncScope.dateFrom`: 2026-06-01
- `syncScope.dateTo`: 2026-06-06
- `scopeSource`: explicit-request
- Previous scope expansion to 2026-06-30: fixed

## 5. Pre-Apply Dry-Run

| Metric | Value |
| --- | ---: |
| HTTP status | 200 |
| existingScopedRows | 133 |
| insertCandidates | 1986 |
| updateCandidates | 0 |
| deleteCandidates | 0 |
| noChangeRows | 133 |
| duplicateIncomingIdentityHashes | 0 |
| duplicateExistingKeys | 0 |
| planReady | true |
| DB write | false |

## 6. Non-ISO Date Guard

- Date guard status: passed before insert path
- Checked rows: 500
- nonIsoLedgerDateCandidates: 0
- invalidLedgerDateCandidates: 0
- Evidence note: the request reached the limited apply read-back step. A date-guard failure would have returned `LIMITED_APPLY_LEDGER_DATE_BLOCKED` before insert.

## 7. Limited Apply Result

| Metric | Value |
| --- | ---: |
| First local production-mode attempt | blocked before write |
| First attempt code | LIMITED_APPLY_WRITE_CLIENT_BLOCKED |
| Dev-mode apply HTTP status | 500 |
| Dev-mode apply error code | LIMITED_APPLY_READBACK_FAILED |
| Requested rows | 500 |
| Verified inserted rows | 500 |
| Verified updated rows | 0 |
| Verified deleted rows | 0 |
| Normalized table write | false |

The HTTP 500 occurred after the insert path. A second limited apply was not executed.

## 8. Read-Back Verification

Selected-column read-back was performed after the endpoint read-back failure.

| Metric | Value |
| --- | ---: |
| Import batch id | 95413408-9ca6-4cba-8ee6-1d72295a3ba9 |
| Upload status | committed |
| Batch row count | 500 |
| Read-back rows | 500 |
| Total scoped rows | 633 |
| Part/date match | true |
| Identity hash count | 500 |
| Content hash present | true |
| Selected columns only | true |
| SELECT * used | false |

## 9. Post-Apply Dry-Run

| Metric | Value |
| --- | ---: |
| HTTP status | 200 |
| existingScopedRows | 633 |
| insertCandidates | 1486 |
| updateCandidates | 0 |
| deleteCandidates | 0 |
| noChangeRows | 633 |
| duplicateIncomingIdentityHashes | 0 |
| duplicateExistingKeys | 0 |
| planReady | true |
| DB write | false |

## 10. Rollback Evidence

- Rollback executed: NO
- Import batch id: 95413408-9ca6-4cba-8ee6-1d72295a3ba9
- Ledger row evidence count: 500
- Identity hash evidence count: 500
- Raw row content recorded in this report: NO

## 11. Safety

- DB write: YES, limited to 500 INSERT rows
- Additional DB write after endpoint failure: NO
- Production POST: NO
- UPDATE: NO
- DELETE: NO
- Full apply: NO
- Migration apply: NO
- Seed apply: NO
- Storage write: NO
- SQL/view/role/grant changes: NO
- Metabase connection: NO
- Raw row/PII output: NO
- Credential/env output: NO
- XLS committed: NO
- Approval JSON committed: NO
- Raw response dump committed: NO

## 12. Side Effects

- Localhost preview POST: executed
- Localhost confirm dry-run POST: executed
- Localhost confirm limited apply POST: executed
- Local production-mode apply attempt: blocked before write
- Local dev-mode apply attempt: inserted 500 rows, then endpoint read-back returned HTTP 500
- Server stopped after smoke: YES

## 13. Next Gate

Do not run another G-6F apply. The target DB state is now at the expected post-G-6F count, but the endpoint read-back failure needs follow-up before the next larger apply stage.

Recommended next gate:

1. Add a focused read-back hotfix so large limited apply batches verify by `upload_id` or bounded chunking instead of a fragile large `in(id, ...)` read.
2. Re-run read-only dry-run only.
3. Proceed to G-6G only after the read-back path is fixed or explicitly waived.
