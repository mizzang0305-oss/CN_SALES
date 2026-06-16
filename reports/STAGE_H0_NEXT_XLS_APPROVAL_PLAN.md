# CN_SALES STAGE H-0 Next XLS Approval Plan

## 1. FINAL_STATUS

`H0_NEXT_XLS_APPROVAL_PLAN_READY`

This is a report-only approval design stage for the next XLS candidate. It did not execute DB write, apply, production POST, migration, seed, storage, deploy, raw row export, PII output, or secret/env output.

## 2. Previous Sealed State

- Repository: `mizzang0305-oss/CN_SALES`
- Current main HEAD at handoff: `fbc2887c1d1e165dfa4303056ead9a8d7c401ac8`
- Previous final status: `G7_READ_ONLY_SYNC_CLOSURE_AUDIT_MERGED_AND_G6_SEALED`
- G-6 sealed: `true`
- G-7 sealed: `true`
- No further apply for sealed 11-part `2026-06-01` through `2026-06-06`: `true`
- Previous G-stage rerun allowed: `false`

Previous sealed aggregate:

| Field | Value |
| --- | ---: |
| Part | `11` |
| Period start | `2026-06-01` |
| Period end | `2026-06-06` |
| XLS SHA-256 | `37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0` |
| Normal rows | `2119` |
| Excluded rows | `275` |
| Amount total | `716970702` |
| Existing scoped rows | `2119` |
| Insert candidates | `0` |
| Update candidates | `0` |
| Delete candidates | `0` |

## 3. Next XLS Candidate Inventory

Inventory source: local weekly report folder referenced by the sealed approval metadata.

- Candidate folder: `C:\Users\LOVE\MyProjects\00.천년경영 데이터\업무보고\주간보고\6 월`
- Inventory observed: sales XLS files for parts `1`, `4`, `5`, `6`, `7`, `9`, `10`, and `11` across `1~6일` and `6-12일`, plus one all-part receivables XLS.
- Selected next same-part candidate: `11파트 6-12일 매출현황.XLS`
- XLS/XLSX committed in this stage: `false`
- Raw response dumps committed in this stage: `false`

Selected candidate:

| Field | Value |
| --- | --- |
| File | `C:\Users\LOVE\MyProjects\00.천년경영 데이터\업무보고\주간보고\6 월\11파트 6-12일 매출현황.XLS` |
| Part | `11` |
| File name period text | `6-12일` |
| Recommended non-overlap target period | `2026-06-07` through `2026-06-12` |
| Filename-literal period caveat | `2026-06-06` through `2026-06-12` would overlap the sealed `2026-06-01` through `2026-06-06` scope. |
| SHA-256 | `c13f1921051df174e1b457bf10e499711069a5f830c0150eeef576b132cdfe42` |

## 4. Aggregate-Only File Summary

Method: preview-only local route against the candidate XLS with selected part `11`. The route forces `PREVIEW_ONLY`, `canWrite=false`, and does not apply DB changes.

| Field | Value |
| --- | ---: |
| HTTP status | `200` |
| Preview-only mode | `fixture` |
| Apply enabled | `false` |
| Apply reason | `PREVIEW_ONLY` |
| Part mismatch | `false` |
| Total rows | `2744` |
| Normal rows | `2473` |
| Excluded rows | `271` |
| Warning rows | `0` |
| Error rows | `0` |
| Sales total | `564020328` |
| Receipt total | `272047816` |
| Amount total | `836068144` |
| Preview checksum | `sha256:e8a1e1cd873b021981ed50e57d7a09a175e1a1a77adc5655fa57ce96960fbbe5` |
| Raw rows printed | `false` |
| PII printed | `false` |
| Secret/env printed | `false` |

The same aggregate-only preview checksum and counts were observed for the non-overlap target period `2026-06-07` through `2026-06-12` and for the filename-literal range `2026-06-06` through `2026-06-12`.

## 5. H-0 Checklist

| Item | H-0 result |
| --- | --- |
| 1. Next target XLS candidate | `11파트 6-12일 매출현황.XLS` |
| 2. Target part | `11` |
| 3. Target period | Recommended `2026-06-07` through `2026-06-12`; filename-literal `2026-06-06` through `2026-06-12` remains an explicit overlap decision. |
| 4. File hash | `sha256:c13f1921051df174e1b457bf10e499711069a5f830c0150eeef576b132cdfe42` |
| 5. Normal rows | `2473` |
| 6. Excluded rows | `271` |
| 7. Amount total | `836068144` |
| 8. Existing DB scoped rows | Not queried in H-0. Must be checked by the next read-only dry-run or metadata-only SELECT stage. |
| 9. Insert/update/delete candidate check method | Run a separate H-1 read-only confirm dry-run with exact hash, part, period, and `dryRun=true`; output aggregate candidate counts only. |
| 10. Operation candidate | H-1: read-only dry-run. Future H-2 only if approved: insert-only limited apply. |
| 11. Row cap candidate | Future H-2 first cap `500`, bounded by the H-1 insert-candidate count. If H-1 returns fewer than `500`, use the exact H-1 candidate count. |
| 12. Approval file needed | H-1 read-only dry-run: no approval file. Future H-2 actual apply: yes, local-only approval file required and must not be committed. |
| 13. Required dry-run before apply | Required. Must pass with exact file hash, part, period, zero warnings/errors, zero update/delete candidates, and aggregate-only output. |
| 14. Apply ban conditions | Any missing/changed hash, part mismatch, unresolved period overlap, warning/error rows, update/delete candidates, full apply request, production POST, or missing explicit approval blocks apply. |
| 15. Rollback possibility | No rollback needed for H-0. Future H-2 write approval must include import-batch rollback scope and read-back verification. |
| 16. Proposed next stage name | `H-1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE` |

## 6. Proposed Stage Plan

1. `H-1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE`
   - Scope: read-only preview plus confirm dry-run for `11파트 6-12일 매출현황.XLS`.
   - Recommended period: `2026-06-07` through `2026-06-12`.
   - Required output: source hash, preview checksum, normal/excluded/warning/error rows, amount total, existing scoped rows, no-change rows, insert candidates, update candidates, delete candidates.
   - Forbidden output: raw rows, row IDs, identity hash lists, customer names, PII, secrets, env values.

2. `H-2_NEXT_XLS_LIMITED_INSERT_APPLY_500`
   - Scope: only if H-1 passes and the operator gives a separate explicit approval.
   - Operation: insert-only limited apply.
   - Max rows: proposed `500`, or exact candidate count if fewer than `500`.
   - Approval file: required local-only file under `.local-approval/`, not committed.
   - Blocked operations: update, delete, hard delete, full apply.

3. `H-3_NEXT_XLS_POST_APPLY_READ_ONLY_VERIFY`
   - Scope: only if H-2 is separately approved and executed.
   - Operation: read-only verification of aggregate counts and selected-column read-back.
   - Rollback: only through a separately approved rollback gate if H-2 write evidence requires it.

## 7. Proposed Approval Gate

Future apply approval must include all of the following exact fields:

| Field | Required value |
| --- | --- |
| Stage | `H-2_NEXT_XLS_LIMITED_INSERT_APPLY_500` or a later explicitly named limited stage |
| Source file | `11파트 6-12일 매출현황.XLS` |
| Source hash | `sha256:c13f1921051df174e1b457bf10e499711069a5f830c0150eeef576b132cdfe42` |
| Part | `11` |
| Period | Operator must choose non-overlap `2026-06-07` through `2026-06-12` or explicitly approve filename-literal overlap handling. |
| Operation | `insert` only |
| Max rows | `500` candidate for first apply gate, reconciled against H-1 dry-run evidence |
| Dry-run required | `true` |
| Approval file required | `true` for actual apply |
| Production POST approved | `false` unless separately approved |
| Update/delete/full apply approved | `false` |
| Migration/seed/storage approved | `false` |

## 8. Safety Constraints

- DB write: `NO`
- Apply: `NO`
- Localhost apply: `NO`
- Production POST: `NO`
- Migration/seed/storage: `NO`
- Update/delete/full apply: `NO`
- Raw row output: `NO`
- PII output: `NO`
- Secret/env output: `NO`
- Deploy: `NO`
- Previous G-stage rerun: `NO`
- XLS/XLSX commit: `NO`
- `.local-approval/**` commit: `NO`

## 9. Forbidden Actions

The following remain forbidden until a later explicit approval expands scope:

- Re-running `G-6F`, `G-6G`, `G-6H`, `G-6I`, or `G-7`.
- Executing any `dryRun=false` request.
- Sending any production POST.
- Writing to Supabase or storage.
- Applying migrations or seeds.
- Running update/delete/hard-delete/full-apply paths.
- Printing raw rows, customer names, row IDs, identity hash lists, PII, secrets, or env values.
- Deploying manually.

## 10. Validation

Validation completed for this report-only PR:

| Check | Result |
| --- | --- |
| `npm run lint` | `pass` |
| `npm run test` | `pass` |
| `npm run test:worker` | `pass` |
| `npm run build` | `pass` |
| `git diff --check` | `pass` |
| Report safety scan | `pass` |

H-0 safety assertions:

- Report-only document changed: `true`
- Code changed: `false`
- DB write/apply executed: `false`
- Raw row/PII/secret included in report: `false`

## 11. Recommended Next Step

Request explicit approval for `H-1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE` only.

No next apply is allowed now. The next required action is a read-only dry-run gate using the selected file hash, selected part, selected period, and aggregate-only output.
