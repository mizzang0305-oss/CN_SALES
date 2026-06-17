# CN_SALES STAGE H-2D Limited Insert Apply 500 Result

## 1. FINAL_STATUS

`H2D_LIMITED_INSERT_APPLY_500_PASS`

H-2D executed exactly one approved localhost limited apply for the next `500` insert candidates from the 11-part `2026-06-07` through `2026-06-12` XLS scope. The runtime apply stage was the exact recognized stage `H-2`; the workflow gate was `H-2D`. The operation was limited to `INSERT` only. No production POST, update, delete, full apply, migration, seed, storage write, raw row output, PII output, secret/env output, deploy, previous G-stage rerun, H-2B/H-2C approval-file reuse, or apply beyond `500` rows was executed.

## 2. PR #57 Merge Status

| Field | Value |
| --- | --- |
| PR URL | `https://github.com/mizzang0305-oss/CN_SALES/pull/57` |
| Ready/merge status | `MERGED` |
| Merge method | `squash` |
| Merge commit | `47c67ae947a75afe87ac53344fbab54c7449a1ea` |
| Merged at | `2026-06-17T17:29:48Z` |
| Report-only | `true` |
| Changed file | `reports/STAGE_H2C_LIMITED_INSERT_APPLY_500_RESULT.md` |

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
| Existing scoped rows | `1000` |
| No-change rows | `1000` |
| Insert candidates | `1473` |
| Update candidates | `0` |
| Delete candidates | `0` |
| Plan ready | `true` |
| Read executed | `true` |
| Read blocked reason | `null` |
| Reader fetched rows | `1000` |
| Reader expected count | `1000` |
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

Pre-apply decision: expected values matched. H-2D limited insert apply was allowed to proceed for exactly `500` rows.

## 4. Approval File Summary

Local-only approval file:

| Field | Value |
| --- | --- |
| Path | `.local-approval/h2_limited_apply_approval.json` |
| Git ignored/excluded | `true` |
| Committed | `false` |
| Workflow gate | `H-2D` |
| Runtime stage | `H-2` |
| Operation | `insert` only |
| Max rows | `500` |
| Period start | `2026-06-07` |
| Period end | `2026-06-12` |
| Source hash | `sha256:c13f1921051df174e1b457bf10e499711069a5f830c0150eeef576b132cdfe42` |
| Expected primary scope rows | `2473` |
| Expected existing scoped rows before apply | `1000` |
| Expected insert candidates before apply | `1473` |
| Expected update candidates before apply | `0` |
| Expected delete candidates before apply | `0` |
| Expected no-change rows before apply | `1000` |
| Approval consistency | `pass` |
| H-2B approval file reused | `false` |
| H-2C approval file reused | `false` |

## 5. Apply Result

Scope: localhost only, `approvalStage=H-2`, `maxRows=500`.

The actual endpoint was called once. A local assertion wrapper mis-labeled the boolean check for `dryRun=false` and exited after the endpoint returned `ok=true`; no second actual apply was attempted. The final result was verified by the post-apply dry-run and a read-only selected-column DB read-back audit.

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

Read-back evidence was aggregate-only and selected-column only. Row ids and identity hashes were not printed.

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
| Existing scoped rows | `1500` |
| No-change rows | `1500` |
| Insert candidates | `973` |
| Update candidates | `0` |
| Delete candidates | `0` |
| Plan ready | `true` |
| Warning rows | `0` |
| Error rows | `0` |
| Amount total | `836068144` |
| Read executed | `true` |
| Read blocked reason | `null` |
| Reader fetched rows | `1500` |
| Reader expected count | `1500` |
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
| Applied in H-2D | `500` |
| Total applied in H-2 flow | `1500` |
| Remaining insert candidates | `973` |
| Next apply allowed now | `false` |

The remaining insert candidates require a separate explicit approval gate.

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
| H-2C approval file reused | `NO` |
| Approval file committed | `NO` |
| Port 3215 stopped after apply | `true` |

## 10. Next Recommendation

Recommended next stage:

- `H-2E_NEXT_500_LIMITED_INSERT_APPLY_APPROVAL`

Required before any next apply:

- Review and merge this H-2D report-only PR.
- Re-run a read-only dry-run for `2026-06-07` through `2026-06-12`.
- Confirm `existingScopedRows = 1500`, `noChangeRows = 1500`, `insertCandidates = 973`, `updateCandidates = 0`, and `deleteCandidates = 0`.
- Create or revalidate a new local-only approval file for the next bounded batch.
- Request a separate explicit approval before any additional `dryRun=false` apply.
