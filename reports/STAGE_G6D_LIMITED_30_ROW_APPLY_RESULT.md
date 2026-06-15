# CN_SALES STAGE G-6D Limited 30-Row Apply Result

## 1. Final Status

| Item | Result |
| --- | --- |
| Final status | LIMITED_APPLY_30_ROWS_PASS |
| Stage | G-6D |
| Execution target | localhost only |
| Source file hash match | yes |
| Result report scope | aggregate counts only |

## 2. Approval

| Item | Value |
| --- | --- |
| Target part | 11 |
| Date scope | 2026-06-01 to 2026-06-06 |
| Max rows | 30 |
| Allowed operation | insert only |
| Blocked operations | update, delete, hard delete, full apply |
| Operator | Minz |
| Rollback owner | Minz |
| Production post approved | false |
| Migration/seed/storage approved | false |

## 3. Pre-Apply Dry-Run

| Metric | Value |
| --- | ---: |
| HTTP status | 200 |
| Plan ready | true |
| Existing scoped rows | 3 |
| Normal rows | 2,119 |
| Excluded rows | 275 |
| Warning rows | 0 |
| Error rows | 0 |
| Insert candidates | 2,116 |
| Update candidates | 0 |
| Delete candidates | 0 |
| No-change rows | 3 |
| Incoming duplicate identity hashes | 0 |
| Existing duplicate identity hashes | 0 |
| Read used selected columns | true |
| Wildcard read used | false |

## 4. Limited Apply Result

| Metric | Value |
| --- | ---: |
| Executed | true |
| HTTP status | 200 |
| Apply mode | limited-apply |
| Requested ledger rows | 30 |
| Inserted ledger rows | 30 |
| Updated rows | 0 |
| Deleted rows | 0 |
| Upload audit batch row | 1 |
| Normalized table write | false |
| Import batch id | 6f489882-c793-477d-92dd-56d6976990a3 |
| Apply status | LIMITED_APPLY_COMMITTED |

## 5. Read-Back Verification

| Item | Result |
| --- | --- |
| Read-back executed | true |
| Read-back rows | 30 |
| Matches requested rows | true |
| Identity hash match | true |
| Content hash present | true |
| Selected columns only | true |
| Wildcard read used | false |
| Part/date scoped total after apply | 33 |

## 6. Post-Apply Dry-Run

| Metric | Value |
| --- | ---: |
| HTTP status | 200 |
| Plan ready | true |
| Existing scoped rows | 33 |
| Normal rows | 2,119 |
| Excluded rows | 275 |
| Warning rows | 0 |
| Error rows | 0 |
| Insert candidates | 2,086 |
| Update candidates | 0 |
| Delete candidates | 0 |
| No-change rows | 33 |
| Incoming duplicate identity hashes | 0 |
| Existing duplicate identity hashes | 0 |

## 7. Rollback Evidence

| Item | Result |
| --- | --- |
| Import batch id | 6f489882-c793-477d-92dd-56d6976990a3 |
| Ledger row count recorded | 30 |
| Identity hash count recorded | 30 |
| Rollback executed | false |

## 8. Safety

| Guard | Result |
| --- | --- |
| DB write scope | 30 ledger row inserts plus 1 upload audit batch insert |
| Additional apply after success | no |
| Production post | no |
| Update | no |
| Delete | no |
| Full apply | no |
| Migration apply | no |
| Seed apply | no |
| Storage write | no |
| RLS/grant/revoke change | no |
| Sensitive config output | no |
| Customer/row-level source data in report | no |
| XLS committed | no |
| Approval file committed | no |
| Response dump committed | no |

## 9. Validation

| Command | Result |
| --- | --- |
| npm run lint | PASS |
| npm run test | PASS, 25 files / 128 tests |
| npm run test:worker | PASS |
| npm run build | PASS |
| git diff --check | PASS |
| Local response safety scan | PASS |

## 10. Notes

- The first G-6D attempt under production-mode `next start` was blocked by the existing local-write guard before any DB write.
- A second dev-server attempt returned a DB date-format safe code and left scoped rows unchanged at 3.
- The limited apply row selector was tightened to skip non-ISO ledger-date candidates before DB insertion.
- The successful G-6D run inserted 30 valid-date candidates and then verified the expected post-apply dry-run diff.

## 11. Next Gate

The next gate can review whether to repeat the same approval-gated pattern with a larger row cap. Before expanding the cap, keep the same pre-apply dry-run, insert-only approval file, read-back verification, post-apply dry-run, and rollback evidence requirements.
