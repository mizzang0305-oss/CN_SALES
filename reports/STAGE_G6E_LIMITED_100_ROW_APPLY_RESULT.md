# CN Sales STAGE G-6E Limited 100-Row Apply Result

## Final Status

- FINAL_STATUS: `G6E_LIMITED_APPLY_100_ROWS_PASS`
- Stage: `G-6E`
- Scope: localhost-only XLS preview, confirm dry-run, approval-gated 100-row insert-only apply, post-apply dry-run
- Production request: NO
- Migration / seed / storage change: NO

## Approval Gate

| Check | Result |
| --- | --- |
| Approval stage | `G-6E` |
| Target part | `11` |
| Date range | `2026-06-01` to `2026-06-06` |
| Row cap | `100` |
| Allowed operation | `insert` only |
| Blocked operations | update, delete, hard delete, full apply |
| Source file hash match | PASS |
| Operator confirmation | PASS |

## Preview Summary

| Metric | Value |
| --- | ---: |
| Normal rows | 2,119 |
| Excluded rows | 275 |
| Warning rows | 0 |
| Error rows | 0 |
| Amount total | 716,970,702 |
| Account count | 159 |
| Item count | 495 |
| Part mismatch | false |

## Pre-Apply Dry-Run

| Metric | Value |
| --- | ---: |
| Existing scoped rows | 33 |
| Insert candidates | 2,086 |
| Update candidates | 0 |
| Delete candidates | 0 |
| No-change rows | 33 |
| Duplicate incoming identity hashes | 0 |
| Duplicate existing identity hashes | 0 |
| Read-only evidence | PASS |
| DB write during dry-run | false |

## Date Guard

| Metric | Value |
| --- | ---: |
| Selected apply candidates checked | 100 |
| Non-ISO ledger dates | 0 |
| Missing ledger dates | 0 |
| Decision | PASS |

## Limited Apply Result

| Metric | Value |
| --- | --- |
| Import batch id | `97040cf2-3b94-4611-a11e-a00fcc7ca1c6` |
| Requested rows | 100 |
| Inserted rows | 100 |
| Updated rows | 0 |
| Deleted rows | 0 |
| Read-back rows | 100 |
| Identity hash match | true |
| Content hash present | true |
| Normalized table write | false |
| Storage write | false |

Data impact:

- `cn_sales.ledger_rows`: 100 inserted rows
- `cn_sales.ledger_uploads`: 1 audit batch row
- Normalized reporting tables: 0 writes
- Update/delete/full apply: 0 operations

## Post-Apply Dry-Run

| Metric | Value |
| --- | ---: |
| Existing scoped rows | 133 |
| Insert candidates | 1,986 |
| Update candidates | 0 |
| Delete candidates | 0 |
| No-change rows | 133 |
| Duplicate incoming identity hashes | 0 |
| Duplicate existing identity hashes | 0 |
| Read-only evidence | PASS |
| DB write during dry-run | false |

## Rollback Evidence

| Check | Result |
| --- | --- |
| Rollback batch identifier captured | YES |
| Rollback target row count | 100 |
| Rollback executed | NO |

Rollback was not executed in this stage. Any rollback must be separately approved and scoped to the recorded import batch.

## Safety

| Side effect | Result |
| --- | --- |
| Additional production request | NO |
| Migration apply | NO |
| Seed apply | NO |
| Storage write | NO |
| RLS/grant/revoke change | NO |
| Auth/payment/webhook change | NO |
| Row-level source output in report | NO |
| Sensitive config output | NO |
| XLS file committed | NO |
| Approval file committed | NO |
| Response dump committed | NO |

## Validation

- `npm run lint`: PASS
- `npm run test`: PASS, 25 files / 133 tests
- `npm run test:worker`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS

## Next Gate

Recommended next step is post-apply read-only smoke from main after this report/code PR is reviewed and merged:

- Expected existing scoped rows: 133
- Expected insert candidates: 1,986
- Expected no-change rows: 133
- Expected update/delete candidates: 0

Any larger apply must keep explicit approval, bounded row cap, insert-only operation, read-back verification, and post-apply dry-run proof.
