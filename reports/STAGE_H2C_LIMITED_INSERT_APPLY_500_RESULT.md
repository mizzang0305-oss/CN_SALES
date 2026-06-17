# CN_SALES STAGE H-2C Limited Insert Apply 500 Result

## 1. FINAL_STATUS

`H2C_LIMITED_INSERT_APPLY_500_PASS`

H-2C executed exactly one approved localhost limited apply for the next `500` insert candidates from the 11-part `2026-06-07` through `2026-06-12` XLS scope. The runtime apply stage was the exact recognized stage `H-2`; the workflow gate was `H-2C`. The operation was limited to `INSERT` only. No production POST, update, delete, full apply, migration, seed, storage write, raw row output, PII output, secret/env output, deploy, previous G-stage rerun, H-2B approval-file reuse, or apply beyond `500` rows was executed.

## 2. PR #56 Merge Status

| Field | Value |
| --- | --- |
| PR URL | `https://github.com/mizzang0305-oss/CN_SALES/pull/56` |
| Ready/merge status | `MERGED` |
| Merge method | `squash` |
| Merge commit | `215c282778462ef4a8067e2eac99a178dc7a8d9a` |
| Merged at | `2026-06-17T11:41:07Z` |
| Report-only | `true` |
| Changed file | `reports/STAGE_H2B_LIMITED_INSERT_APPLY_500_RESULT.md` |

## 3. Pre-Apply Dry-Run

Primary scope: `2026-06-07` through `2026-06-12`.

| Field | Value |
| --- | ---: |
| Preview HTTP status | `200` |
| Confirm dry-run HTTP status | `200` |
| Dry run | `true` |
| Dry-run ready | `true` |
| Actual apply ready | `false` |
| Actual apply blocked reason | `APPLY_NOT_APPROVED` |
| Source hash | `sha256:c13f1921051df174e1b457bf10e499711069a5f830c0150eeef576b132cdfe42` |
| Preview checksum | `sha256:e8a1e1cd873b021981ed50e57d7a09a175e1a1a77adc5655fa57ce96960fbbe5` |
| Total rows | `2744` |
| Primary scope rows | `2473` |
| Excluded rows | `271` |
| Warning rows | `0` |
| Error rows | `0` |
| Amount total | `836068144` |
| Existing scoped rows | `500` |
| No-change rows | `500` |
| Insert candidates | `1973` |
| Update candidates | `0` |
| Delete candidates | `0` |
| Plan ready | `true` |
| Read executed | `true` |
| Read blocked reason | `null` |
| Reader fetched rows | `500` |
| Reader expected count | `500` |
| Selected columns only | `true` |
| Select star used | `false` |
| Raw rows returned | `false` |
| DB write | `false` |
| Actual apply | `false` |

Overlap scope: `2026-06-06` only.

| Field | Value |
| --- | ---: |
| Preview HTTP status | `200` |
| Confirm dry-run HTTP status | `200` |
| Overlap rows in XLS | `0` |
| Existing scoped rows | `0` |
| No-change rows | `0` |
| Insert candidates | `0` |
| Update candidates | `0` |
| Delete candidates | `0` |
| Warning rows | `0` |
| Error rows | `2473` |
| Raw rows returned | `false` |

Pre-apply decision: expected values matched. H-2C limited insert apply was allowed to proceed for exactly `500` rows.

## 4. Approval File Summary

Local-only approval file:

| Field | Value |
| --- | --- |
| Path | `.local-approval/h2_limited_apply_approval.json` |
| Git ignored/excluded | `true` |
| Committed | `false` |
| Workflow gate | `H-2C` |
| Runtime stage | `H-2` |
| Operation | `insert` only |
| Max rows | `500` |
| Period start | `2026-06-07` |
| Period end | `2026-06-12` |
| Source hash | `sha256:c13f1921051df174e1b457bf10e499711069a5f830c0150eeef576b132cdfe42` |
| Expected primary scope rows | `2473` |
| Expected existing scoped rows before apply | `500` |
| Expected insert candidates before apply | `1973` |
| Expected update candidates before apply | `0` |
| Expected delete candidates before apply | `0` |
| Expected no-change rows before apply | `500` |
| Approval consistency | `pass` |
| H-2B approval file reused | `false` |

## 5. Apply Result

Scope: localhost only, `approvalStage=H-2`, `maxRows=500`.

| Field | Value |
| --- | ---: |
| HTTP status | `200` |
| Apply mode | `limited-apply` |
| Runtime stage | `H-2` |
| Actual apply executed | `true` |
| Requested rows | `500` |
| Inserted rows | `500` |
| Updated rows | `0` |
| Deleted rows | `0` |
| Rejected rows | `0` |
| Normalized table write | `false` |
| Production POST | `false` |
| Migration apply | `false` |
| Seed apply | `false` |
| Storage write | `false` |

## 6. Read-Back Result

| Field | Value |
| --- | ---: |
| Read-back executed | `true` |
| Read-back row count | `500` |
| Matches requested rows | `true` |
| Identity hash match | `true` |
| Identity hash count | `500` |
| Part/date match | `true` |
| Content hash present | `true` |
| Audit status present | `true` |
| Selected columns only | `true` |
| Select star used | `false` |
| Raw rows printed | `false` |

## 7. Post-Apply Dry-Run

Scope: `2026-06-07` through `2026-06-12`.

| Field | Value |
| --- | ---: |
| Confirm dry-run HTTP status | `200` |
| Dry run | `true` |
| Dry-run ready | `true` |
| Actual apply ready | `false` |
| Actual apply blocked reason | `APPLY_NOT_APPROVED` |
| Primary scope rows | `2473` |
| Existing scoped rows | `1000` |
| No-change rows | `1000` |
| Insert candidates | `1473` |
| Update candidates | `0` |
| Delete candidates | `0` |
| Plan ready | `true` |
| Warning rows | `0` |
| Error rows | `0` |
| Amount total | `836068144` |
| Read executed | `true` |
| Read blocked reason | `null` |
| Reader fetched rows | `1000` |
| Reader expected count | `1000` |
| Selected columns only | `true` |
| Select star used | `false` |
| Raw rows returned | `false` |
| DB write | `false` |
| Actual apply | `false` |

## 8. Remaining Insert Candidates

| Field | Value |
| --- | ---: |
| Initial H-2 insert candidates | `2473` |
| Applied in H-2B | `500` |
| Applied in H-2C | `500` |
| Total applied in H-2 flow | `1000` |
| Remaining insert candidates | `1473` |
| Next apply allowed now | `false` |

The next insert batch requires a separate explicit approval gate.

## 9. Safety Result

| Safety item | Result |
| --- | --- |
| DB write | `YES`, limited to approved localhost `500` row insert |
| Production POST | `NO` |
| Update/delete/full apply | `NO` |
| More than 500 rows applied | `NO` |
| Migration/seed/storage | `NO` |
| Raw row output | `NO` |
| PII output | `NO` |
| Secret/env output | `NO` |
| Deploy | `NO` |
| Previous G-stage rerun | `NO` |
| H-2B approval file reused | `NO` |
| Approval file committed | `NO` |
| Port 3215 stopped after apply | `true` |

## 10. Next Recommendation

Recommended next stage:

- `H-2D_NEXT_500_LIMITED_INSERT_APPLY_APPROVAL`

Required before any next apply:

- Review and merge this H-2C report-only PR.
- Re-run a read-only dry-run for `2026-06-07` through `2026-06-12`.
- Confirm `existingScopedRows = 1000`, `noChangeRows = 1000`, `insertCandidates = 1473`, `updateCandidates = 0`, and `deleteCandidates = 0`.
- Create or revalidate a new local-only approval file for the next bounded batch.
- Request a separate explicit approval before any additional `dryRun=false` apply.
