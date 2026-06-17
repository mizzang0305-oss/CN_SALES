# CN_SALES STAGE H-2A Limited Apply Stage Support

## 1. FINAL_STATUS

`H2A_LIMITED_APPLY_STAGE_SUPPORT_READY`

H-2A is code/test/report-only. It adds explicit `H-2` limited apply stage support and guard tests for the next XLS primary scope, but it does not execute an apply. No DB write, localhost apply, production POST, migration, seed, storage, deploy, raw row output, PII output, secret/env output, previous G-stage rerun, or H-2 actual apply was executed.

## 2. PR #54 Merge Status

- PR URL: `https://github.com/mizzang0305-oss/CN_SALES/pull/54`
- PR state: `MERGED`
- Merge method: `squash`
- Merge commit: `ed0ea3fd33a3faf2cabcc557fde7bf2c5931e9cf`
- Merged at: `2026-06-17T10:35:27Z`
- Main updated locally: `true`

## 3. Root Cause

H-2 actual apply remained blocked because the limited apply stage registry recognized only `G-6B` through `G-6I`. The confirm route enters the limited apply path only when `approvalStage` is recognized by `isLimitedApplyStage`, so `approvalStage=H-2` had no safe supported entrypoint on main.

## 4. Code Change Summary

- Added explicit `H-2` to `LimitedApplyStage`.
- Added `H2_EXPECTED_SOURCE_FILE_HASH`.
- Extended limited apply stage configs with per-stage expected source hash and expected date range.
- Preserved all G-6 stage expected hashes and dates as `2026-06-01` through `2026-06-06`.
- Mapped H-2 to the local-only approval file name `.local-approval/h2_limited_apply_approval.json`; the approval file itself is not committed.
- Updated approval validation to compare the incoming approval against the selected stage config.
- Added unit/static tests for H-2 recognition, guardrails, dry-run diagnostics, approval-file missing behavior, and unchanged insert-only persistence constraints.

## 5. H-2 Stage Support Constraints

| Constraint | H-2 value |
| --- | --- |
| Stage string | `H-2` only |
| Wildcard H support | `false` |
| Approval file | `.local-approval/h2_limited_apply_approval.json` |
| Operation | `insert` only |
| Max rows | `500` |
| Target part | `11` |
| Period | `2026-06-07` through `2026-06-12` |
| Source hash | `sha256:c13f1921051df174e1b457bf10e499711069a5f830c0150eeef576b132cdfe42` |
| Normal rows | `2473` |
| Excluded rows | `271` |
| Amount total | `836068144` |
| Existing scoped rows before apply | `0` |
| Insert candidates before apply | `2473` |
| Update candidates before apply | `0` |
| Delete candidates before apply | `0` |
| Approval required for `dryRun=false` | `true` |
| Raw rows returned | `false` |

## 6. Tests Added/Updated

- H-2 is recognized as a configured limited apply stage.
- Unsupported `H-1` and `H-3` remain blocked.
- H-2 aggregate dry-run diagnostics can be inferred from scoped counts.
- H-2 `dryRun=false` entry remains blocked when the local approval file is missing.
- H-2 operation other than insert is blocked.
- H-2 `max_rows` above `500` is blocked.
- H-2 period outside `2026-06-07` through `2026-06-12` is blocked.
- H-2 source hash mismatch is blocked.
- H-2 update/delete/full-apply paths remain blocked.
- H-2 diagnostics do not expose raw rows or synthetic row content.
- Existing G-6B through G-6I support remains covered by the existing tests.

## 7. Validation Result

| Check | Result |
| --- | --- |
| `npm run lint` | `pass` |
| `npm run test` | `pass` |
| `npm run test:worker` | `pass` |
| `npm run build` | `pass` |
| `git diff --check` | `pass` |
| Secret/env scan | `pass` |
| Raw row/PII output scan | `pass` |
| Production POST scan | `pass` |
| Migration/seed/storage scan | `pass` |
| `dryRun=false` invocation scan | `pass` |

## 8. Safety Result

| Safety item | Result |
| --- | --- |
| DB write | `NO` |
| Localhost apply | `NO` |
| `dryRun=false` actual invocation | `NO` |
| Production POST | `NO` |
| Update/delete/full apply execution | `NO` |
| Migration/seed/storage | `NO` |
| Raw row output | `NO` |
| PII output | `NO` |
| Secret/env output | `NO` |
| Deploy | `NO` |
| Previous G-stage rerun | `NO` |
| H-2 actual apply | `NO` |

## 9. Next Approval Gate

Recommended next stage:

- `H-2B_NEXT_XLS_LIMITED_INSERT_APPLY_APPROVAL`

Required before any actual H-2 apply:

- Review and merge H-2A support.
- Revalidate or recreate the local-only H-2 approval file.
- Rerun the H-2 pre-apply dry-run with `dryRun=true`.
- Confirm exact hash, part, period, row cap, and candidate counts.
- Request a separate explicit approval for actual H-2 limited insert apply.

Next apply allowed now: `false`.
