# CN_SALES STAGE H-2F Final 473 Limited Insert Apply Result

## 1. FINAL_STATUS

`H2F_FINAL_473_LIMITED_INSERT_APPLY_PASS`

The H-2F final explicit limited insert apply completed on localhost only. The final remainder for `11파트 6-12일 매출현황.XLS` was inserted with the approved H-2 limited apply path, `workflowGate=H-2F`, `INSERT only`, and `maxRows=473`.

No production POST, update, delete, full apply, migration, seed, storage write, deploy, raw row output, PII output, secret output, or previous G-stage rerun was performed.

## 2. PR #61 Merge Status

| Field | Value |
| --- | --- |
| PR URL | `https://github.com/mizzang0305-oss/CN_SALES/pull/61` |
| Ready/merge status | `MERGED` |
| Merge method | `squash` |
| Merge commit | `4d865c3586499453689040c7f8a147051d79de1e` |
| Merged at | `2026-06-18T12:27:38Z` |
| Code/test/report only | `true` |

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
| Existing scoped rows | `2000` |
| No-change rows | `2000` |
| Insert candidates | `473` |
| Update candidates | `0` |
| Delete candidates | `0` |
| Plan ready | `true` |
| Read executed | `true` |
| Read blocked reason | `null` |
| Reader fetched rows | `2000` |
| Reader expected count | `2000` |
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

Pre-apply decision: PASS. All expected current-state aggregate values matched before the actual apply call.

## 4. Approval File Summary

The local-only approval file was updated under `.local-approval/` and remained git-ignored.

| Field | Value |
| --- | --- |
| Approval stage | `H-2` |
| Workflow gate | `H-2F` |
| Operation | `INSERT only` |
| Max rows | `473` |
| Period | `2026-06-07` through `2026-06-12` |
| File hash | `sha256:c13f1921051df174e1b457bf10e499711069a5f830c0150eeef576b132cdfe42` |
| Expected primary scope rows | `2473` |
| Expected existing scoped rows before apply | `2000` |
| Expected insert candidates before apply | `473` |
| Expected update candidates before apply | `0` |
| Expected delete candidates before apply | `0` |
| Expected inserted rows | `473` |
| H-2B/H-2C/H-2D/H-2E approval reuse | `false` |
| Included in git | `false` |

## 5. Apply Result

Actual apply was performed once against localhost with `dryRun=false`, `approvalStage=H-2`, and `maxRows=473`.

| Field | Value |
| --- | ---: |
| HTTP status | `200` |
| Dry run | `false` |
| Apply mode | `limited-apply` |
| Stage | `H-2` |
| Actual apply executed | `true` |
| Requested rows | `473` |
| Inserted rows | `473` |
| Updated rows | `0` |
| Deleted rows | `0` |
| Normalized table write | `false` |
| DB write | `true` |
| Storage write | `false` |
| Production POST | `false` |
| Migration apply | `false` |
| Seed apply | `false` |

## 6. Read-Back Result

Read-back was verified through aggregate-only response fields and a selected-column DB audit.

| Field | Value |
| --- | ---: |
| Read-back executed | `true` |
| Read-back rows | `473` |
| Matches requested rows | `true` |
| Identity hash match | `true` |
| Identity hash count | `473` |
| Content hash present | `true` |
| Part/date match | `true` |
| Audit status present | `true` |
| Selected columns only | `true` |
| Select star used | `false` |
| Raw rows returned | `false` |
| Rollback evidence row-id count | `473` |
| Rollback evidence identity-hash count | `473` |
| Rollback executed | `false` |

No row IDs, identity hash lists, raw row JSON, customer names, personal data, or secrets were printed.

## 7. Final Post-Apply Dry-Run

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
| Existing scoped rows | `2473` |
| No-change rows | `2473` |
| Insert candidates | `0` |
| Update candidates | `0` |
| Delete candidates | `0` |
| Plan ready | `true` |
| Read executed | `true` |
| Read blocked reason | `null` |
| Reader fetched rows | `2473` |
| Reader expected count | `2473` |
| Selected columns only | `true` |
| Select star used | `false` |
| Raw rows returned | `false` |
| DB write | `false` |
| Actual apply | `false` |

Final post-apply decision: PASS. The `11파트 6-12일 매출현황.XLS` normal rows are fully synchronized for the approved period.

## 8. Full Sync Completion Judgment

| Field | Value |
| --- | ---: |
| Target file | `11파트 6-12일 매출현황.XLS` |
| Target part | `11` |
| Target period | `2026-06-07` through `2026-06-12` |
| File hash | `sha256:c13f1921051df174e1b457bf10e499711069a5f830c0150eeef576b132cdfe42` |
| Normal rows | `2473` |
| Excluded rows | `271` |
| Amount total | `836068144` |
| Existing scoped rows after H-2F | `2473` |
| Remaining insert candidates | `0` |
| Remaining update candidates | `0` |
| Remaining delete candidates | `0` |

H-2B, H-2C, H-2D, H-2E, and H-2F together completed the 2473-row limited insert synchronization for the approved H-2 XLS period.

## 9. Safety Result

| Constraint | Result |
| --- | --- |
| localhost only | `PASS` |
| production POST | `NOT RUN` |
| update/delete/full apply | `NOT RUN` |
| insert cap | `473/473` |
| over-cap actual insert | `NOT RUN` |
| migration/seed/storage | `NOT RUN` |
| normalized table write | `false` |
| raw row output | `NOT PRINTED` |
| PII output | `NOT PRINTED` |
| secret/env output | `NOT PRINTED` |
| deploy | `NOT RUN` |
| previous G-stage rerun | `NOT RUN` |
| H-2B/H-2C/H-2D/H-2E approval reuse | `NOT USED` |
| localhost port 3215 | `STOPPED` |

## 10. Validation

| Command or scan | Result |
| --- | --- |
| `npm run lint` | `PASS` |
| `npm run test` | `PASS`, 28 files / 215 tests |
| `npm run test:worker` | `PASS`, 4 tests |
| `npm run build` | `PASS` |
| `git diff --check` | `PASS` |
| report safety scan | `PASS` |
| secret/env scan | `PASS` |
| production POST scan | `PASS` |
| migration/seed/storage scan | `PASS` |
| update/delete/full apply scan | `PASS` |
| over-473 actual insert scan | `PASS` |
| previous G-stage rerun scan | `PASS` |
| approval file git inclusion scan | `PASS` |

## 11. Next Recommendation

Proceed to `H-3_READ_ONLY_SYNC_CLOSURE_AUDIT`.

No additional apply is allowed automatically after H-2F. Any rollback, further apply, update, delete, production POST, migration, seed, storage action, or deploy must start from a separate explicit approval gate.

The result PR branch is `codex/h2f-final-473-limited-insert-apply-pass` because `codex/h2f-final-473-limited-insert-apply-result` had already been used for the previous blocked H-2F report PR.
