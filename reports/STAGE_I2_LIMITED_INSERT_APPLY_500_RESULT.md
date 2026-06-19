# CN_SALES STAGE I-2 Limited Insert Apply 500 Result

## 1. FINAL_STATUS

`I2_LIMITED_INSERT_APPLY_500_PASS`

I-2 executed exactly one successful localhost limited apply for the first `500` insert candidates from `1파트 1~6일 매출현황.XLS`, scoped to part `1` and `2026-06-01` through `2026-06-06`.

The operation was limited to `INSERT` only. No production POST, update, delete, full apply, migration, seed, storage write, normalized table write, deploy, previous G/H-stage rerun, raw row output, PII output, or secret/env output was performed.

Note: one initial `dryRun=false` request was blocked with HTTP `403` before any DB write because `next start` runs in production mode and the write guard rejected writes. The server was replaced with localhost dev mode, the pre-apply dry-run was rerun and matched expected values, and then the successful I-2 apply was executed once.

## 2. PR #67 Merge Status

| Field | Value |
| --- | --- |
| PR URL | `https://github.com/mizzang0305-oss/CN_SALES/pull/67` |
| Ready/merge status | `MERGED` |
| Merge method | `squash` |
| Merge commit | `7f479f0db42c090a72a412baa3776765d53c7a32` |
| Merged at | `2026-06-19T04:37:21Z` |
| Code/test/report only | `true` |

PR #67 was reviewed and merged before actual I-2 apply. It added exact `I-2` stage support and did not execute apply.

## 3. Target

| Field | Value |
| --- | --- |
| File | `1파트 1~6일 매출현황.XLS` |
| Part | `1` |
| Period start | `2026-06-01` |
| Period end | `2026-06-06` |
| Source hash | `sha256:f43f9eefc35eb30b84e682e22be117d99f30897d69b72d16a91b0adf9a28fcbd` |
| Preview checksum | `sha256:b1adba841143be6eecd40c94f5a73167abd16d6ff34beeb775216871bf6cc9ab` |
| Total rows | `1774` |
| Normal rows | `1528` |
| Excluded rows | `246` |
| Amount total | `563169208` |

## 4. Pre-Apply Dry-Run

The pre-apply dry-run was rerun on the localhost dev server after the production-mode blocked attempt.

| Field | Value |
| --- | ---: |
| Preview HTTP status | `200` |
| Confirm dry-run HTTP status | `200` |
| Dry-run ready | `true` |
| Source hash matched | `true` |
| Primary scope rows | `1528` |
| Existing scoped rows | `0` |
| No-change rows | `0` |
| Insert candidates | `1528` |
| Update candidates | `0` |
| Delete candidates | `0` |
| Plan ready | `true` |
| Raw rows returned | `false` |
| Date outside scope rows | `0` |
| Invalid date rows | `0` |
| Missing date rows | `0` |
| DB write | `false` |
| Actual apply | `false` |

Pre-apply decision: PASS. All expected current-state aggregate values matched before the successful apply call.

## 5. Approval File Summary

Local-only approval file:

| Field | Value |
| --- | --- |
| Path | `.local-approval/i2_limited_apply_approval.json` |
| Git included | `false` |
| Workflow gate | `I-2` |
| Stage | `I-2` |
| Operation | `INSERT only` |
| Max rows | `500` |
| Period start | `2026-06-01` |
| Period end | `2026-06-06` |
| File hash | `sha256:f43f9eefc35eb30b84e682e22be117d99f30897d69b72d16a91b0adf9a28fcbd` |
| Expected primary scope rows | `1528` |
| Expected existing scoped rows before apply | `0` |
| Expected insert candidates before apply | `1528` |
| Expected update candidates before apply | `0` |
| Expected delete candidates before apply | `0` |
| Expected inserted rows | `500` |

The approval file remained local-only and was not staged or committed.

## 6. Apply Result

Scope: localhost only, `approvalStage=I-2`, `workflowGate=I-2`, `maxRows=500`.

| Field | Value |
| --- | ---: |
| HTTP status | `200` |
| Dry run | `false` |
| Apply mode | `limited-apply` |
| Stage | `I-2` |
| Actual apply executed | `true` |
| Requested rows | `500` |
| Inserted rows | `500` |
| Updated rows | `0` |
| Deleted rows | `0` |
| Normalized table write | `false` |
| DB write | `true` |
| Storage write | `false` |
| Production POST | `false` |
| Migration apply | `false` |
| Seed apply | `false` |

## 7. Read-Back Result

| Field | Value |
| --- | ---: |
| Read-back executed | `true` |
| Read-back rows | `500` |
| Matches requested rows | `true` |
| Identity hash match | `true` |
| Content hash present | `true` |
| Part/date match | `true` |
| Audit status present | `true` |
| Selected columns only | `true` |
| Select star used | `false` |
| Raw rows printed | `false` |

No row IDs, identity hash lists, raw row JSON, customer names, personal data, or secrets were printed.

## 8. Post-Apply Dry-Run

| Field | Value |
| --- | ---: |
| Preview HTTP status | `200` |
| Confirm dry-run HTTP status | `200` |
| Dry run | `true` |
| Dry-run ready | `true` |
| Actual apply ready | `false` |
| Actual apply blocked reason | `APPLY_NOT_APPROVED` |
| Primary scope rows | `1528` |
| Existing scoped rows | `500` |
| No-change rows | `500` |
| Insert candidates | `1028` |
| Update candidates | `0` |
| Delete candidates | `0` |
| Plan ready | `true` |
| Read executed | `true` |
| Read blocked reason | `null` |
| Selected columns only | `true` |
| Select star used | `false` |
| Raw rows returned | `false` |
| Date outside scope rows | `0` |
| Invalid date rows | `0` |
| Missing date rows | `0` |
| DB write | `false` |
| Actual apply | `false` |

Post-apply decision: PASS. The first `500` rows were inserted and `1028` insert candidates remain.

## 9. Remaining Insert Candidates

| Field | Value |
| --- | ---: |
| Initial I-2 insert candidates | `1528` |
| Applied in I-2 | `500` |
| Remaining insert candidates | `1028` |
| Next apply allowed now | `false` |

The next insert batch requires a separate explicit approval gate.

## 10. Safety Result

| Safety item | Result |
| --- | --- |
| DB write | `YES`, limited to approved localhost `500` row insert |
| Production POST | `NO` |
| Update/delete/full apply | `NO` |
| More than 500 rows applied | `NO` |
| Migration/seed/storage | `NO` |
| Normalized table write | `NO` |
| Raw row output | `NO` |
| PII output | `NO` |
| Secret/env output | `NO` |
| Deploy | `NO` |
| Previous G/H-stage rerun | `NO` |
| Approval file committed | `NO` |

## 11. Validation

| Command or scan | Result |
| --- | --- |
| `npm run lint` | `PASS` |
| `npm run test` | `PASS`, 28 files / 223 tests |
| `npm run test:worker` | `PASS`, 4 tests |
| `npm run build` | `PASS` |
| `git diff --check` | `PASS` |
| Report secret/env scan | `PASS` |
| Report raw row/PII scan | `PASS` |
| Production POST scan | `PASS` |
| Migration/seed/storage scan | `PASS` |
| Update/delete/full apply scan | `PASS` |
| Over-500 actual insert scan | `PASS` |
| Previous H-stage rerun scan | `PASS` |
| Approval file committed scan | `PASS` |
| Port 3215 after apply | `STOPPED` |

## 12. Next Recommendation

Recommended next stage:

`I-2C_NEXT_500_LIMITED_INSERT_APPLY_APPROVAL`

Required before any next apply:

- Review and merge this I-2 result report PR.
- Re-run a read-only dry-run for `1파트 1~6일 매출현황.XLS`.
- Confirm `existingScopedRows = 500`, `noChangeRows = 500`, `insertCandidates = 1028`, `updateCandidates = 0`, and `deleteCandidates = 0`.
- Create or revalidate a local-only approval file for the next bounded batch.
- Request a separate explicit approval before any additional `dryRun=false` apply.
