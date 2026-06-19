# CN_SALES STAGE I-2A Limited Apply Stage Support

## 1. FINAL_STATUS

`I2A_LIMITED_APPLY_STAGE_SUPPORT_READY`

This stage added code, tests, and a report for exact `I-2` limited apply stage support only. It did not execute DB write, localhost apply, production POST, `dryRun=false` actual call, approval file creation, update, delete, full apply, migration, seed, storage action, deploy, previous G/H-stage rerun, raw row output, PII output, or secret/env output.

## 2. PR #66 Merge Status

| Field | Value |
| --- | --- |
| PR URL | `https://github.com/mizzang0305-oss/CN_SALES/pull/66` |
| Ready/merge status | `MERGED` |
| Merge method | `squash` |
| Merge commit | `89e383fc9e1d28752afdf7602d56d7acd5e6661f` |
| Merged at | `2026-06-19T04:17:42Z` |
| Report-only | `true` |

PR #66 was reviewed and merged before this I-2A support work. It recorded `BLOCKED_I2_STAGE_SUPPORT_MISSING` and did not authorize any apply.

## 3. Root Cause

| Field | Value |
| --- | --- |
| Blocker | `I-2` was not in the limited apply stage registry or config map |
| Affected workflow | `I-2_LIMITED_INSERT_APPLY` |
| Affected target | `1파트 1~6일 매출현황.XLS` |
| Actual apply attempted | `NO` |
| DB write | `NO` |

The existing limited apply support covered prior `G-6*` stages and `H-2`, including `H-2F` final remainder workflow gating. The next part-1 XLS required its own exact stage contract instead of a wildcard `I-*` or permissive max-row rule.

## 4. Code Change Summary

| File | Summary |
| --- | --- |
| `src/lib/import/limited-apply.ts` | Added `I2_EXPECTED_SOURCE_FILE_HASH`, exact `I-2` config, part-specific target validation, exact workflow gate validation, and exact I-2 approval shape checks |
| `tests/limited-apply.test.ts` | Added I-2 recognition, approval validation, wrong stage/hash/period/maxRows/count blocks, missing approval-file block, and precondition tests |
| `tests/upload-preview-static.test.ts` | Added static regression coverage for exact I-2 config and no wildcard/max-row shortcut |
| `reports/STAGE_I2A_LIMITED_APPLY_STAGE_SUPPORT.md` | Added this report-only support summary |

## 5. I-2 Stage Support Constraints

| Constraint | Value |
| --- | --- |
| Stage | `I-2` |
| Workflow gate | `I-2` |
| Target part | `1` |
| Operation | `INSERT only` |
| Max rows | `500` exactly |
| Period | `2026-06-01` through `2026-06-06` |
| File hash | `sha256:f43f9eefc35eb30b84e682e22be117d99f30897d69b72d16a91b0adf9a28fcbd` |
| Expected primary scope rows | `1528` |
| Expected existing scoped rows before apply | `0` |
| Expected insert candidates before apply | `1528` |
| Expected update candidates before apply | `0` |
| Expected delete candidates before apply | `0` |
| Expected no-change rows before apply | `0` |
| Expected inserted rows | `500` |
| Approval file required before actual call | `YES` |

Blocked by design:

- wildcard stage
- arbitrary `I-*` stage
- arbitrary `maxRows`
- broad `maxRows <= 500` acceptance
- wrong part
- wrong file hash
- wrong period
- wrong expected counts
- update/delete/full apply
- missing approval file before `dryRun=false`

## 6. Tests Added Or Updated

| Requirement | Result |
| --- | --- |
| I-2 recognized | `PASS` |
| Unsupported I-stage blocked | `PASS` |
| Wildcard stage blocked | `PASS` |
| Wrong maxRows blocked | `PASS` |
| Wrong period blocked | `PASS` |
| Wrong fileHash blocked | `PASS` |
| Wrong expectedPrimaryScopeRows blocked | `PASS` |
| Wrong expectedExistingScopedRowsBeforeApply blocked | `PASS` |
| Wrong expectedInsertCandidatesBeforeApply blocked | `PASS` |
| Update/delete/full apply blocked | `PASS` |
| Missing approval file blocked | `PASS` |
| Raw row guard | `PASS` |
| H-2/H-2F regression | `PASS` |

Focused validation:

`npx vitest run tests/limited-apply.test.ts tests/upload-preview-static.test.ts`: `PASS`, 2 files / 85 tests.

## 7. Validation Result

| Check | Result |
| --- | --- |
| `npm run lint` | `PASS` |
| `npm run test` | `PASS`, 28 files / 223 tests |
| `npm run test:worker` | `PASS`, 4 tests |
| `npm run build` | `PASS` |
| `git diff --check` | `PASS` |
| Secret/env scan | `PASS` |
| Raw row/PII scan | `PASS` |
| Production POST invocation scan | `PASS` |
| Migration/seed/storage action scan | `PASS` |
| `dryRun=false` actual invocation scan | `PASS` |
| Approval file committed scan | `PASS` |
| Previous H-stage rerun scan | `PASS` |

Safety scan notes: the changed tests include negative cases that set blocked approval flags to `true` and mention `dryRun=false` in missing-approval tests. These are validator tests only, not actual apply calls.

## 8. Safety Result

| Safety item | Result |
| --- | --- |
| DB write | `NO` |
| Actual apply | `NO` |
| Localhost apply | `NO` |
| `dryRun=false` actual call | `NO` |
| Production POST | `NO` |
| Migration/seed/storage | `NO` |
| Raw row output | `NO` |
| PII output | `NO` |
| Secret/env output | `NO` |
| Deploy | `NO` |
| Previous G/H-stage rerun | `NO` |
| Approval file created | `NO` |
| Approval file committed | `NO` |
| Existing untracked `docs/adsense/` staged | `NO` |

## 9. Next Approval Gate

`I-2_EXPLICIT_LIMITED_INSERT_APPLY_500_APPROVAL`

I-2 actual apply is still not allowed now. The next stage must separately approve a localhost-only first 500 row `INSERT only` apply, recreate the approval file locally, run a fresh pre-apply dry-run, and stop immediately if any aggregate value differs from the I-1 baseline and I-2 stage contract.
