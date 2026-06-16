# CN_SALES STAGE G-6F Read-back Hotfix Result

## 1. Final Status

- FINAL_STATUS: READBACK_HOTFIX_PR_CREATED_PASS
- Date: 2026-06-16
- Scope: code/test/report only
- Actual DB write in this stage: NO
- dryRun=false confirm in this stage: NO
- Production POST: NO

## 2. PR #40 Merge

- PR: https://github.com/mizzang0305-oss/CN_SALES/pull/40
- Result: merged
- Merge commit: 1d703c7581c34c74d16a4d6e4b95aa56601db8a8
- Side effects during merge: GitHub merge automation only
- Additional DB write during merge: NO
- Additional limited apply during merge: NO

## 3. Root Cause

- Previous endpoint error: LIMITED_APPLY_READBACK_FAILED
- Import batch id: 95413408-9ca6-4cba-8ee6-1d72295a3ba9
- Actual inserted rows from the approved earlier G-6F run: 500
- External selected-column read-back after the earlier failure: matched 500 rows
- Post-apply dry-run after the earlier failure: matched expected scoped state

The failing path inserted rows successfully, then attempted limited apply read-back with a large `id IN (...)` filter containing the inserted row ids. For the 500-row G-6F batch this creates a large URL/filter payload and can fail even though the insert already committed. The safer read-back contract is to query by the single committed `upload_id`, keep selected columns only, order by row index, and set an explicit range equal to the requested row count.

## 4. Hotfix Summary

- Replaced large inserted-id read-back with `upload_id` scoped read-back.
- Added explicit `range(0, requestedRows - 1)` on the selected-column read-back.
- Removed the unused insert-return payload from the ledger row insert call.
- Added a pure read-back verification helper.
- The route now maps successful read-back verification to an explicit `readBack` summary.
- The route still throws LIMITED_APPLY_READBACK_FAILED if count, identity hash, part/date, audit, or content hash checks fail.
- Normalized table write remains false and does not require normalized table read-back.

## 5. Test Coverage

- 3-row read-back verification: PASS
- 30-row read-back verification: PASS
- 100-row read-back verification: PASS
- 500-row read-back verification: PASS
- Row count mismatch failure: PASS
- Identity hash mismatch failure: PASS
- Part/date mismatch failure: PASS
- Limited insert-only static guard: PASS
- Raw row response exclusion: PASS

## 6. Read-only Verification

- Verification mode: localhost preview POST plus localhost confirm dryRun=true only
- Actual DB apply: NO
- dryRun status: PASS
- HTTP status: 200
- dryRun: true
- planReady: true
- scopeSource: explicit-request
- existingScopedRows: 633
- insertCandidates: 1486
- updateCandidates: 0
- deleteCandidates: 0
- noChangeRows: 633
- side_effects.dbWrite: false
- side_effects.normalizedTableWrite: false

## 7. Safety

- Additional DB write: NO
- dryRun=false confirm: NO
- Production POST: NO
- Update/delete/full apply: NO
- Migration/seed/storage: NO
- SQL/view/role/grant changes: NO
- Metabase connection: NO
- Vercel CLI/manual deploy: NO
- Raw row or PII output: NO
- secret/env output: NO
- XLS/approval/raw response files committed: NO

## 8. Side Effects

- PR #40 squash merge: YES
- Vercel/GitHub merge automation from PR #40: allowed by stage scope
- Local preview request: YES, localhost only
- Local dry-run confirm request: YES, dryRun=true only
- Actual XLS apply rerun: NO
- DB row mutation in this hotfix stage: NO

## 9. Next Gate

G-6F read-back hotfix PR is ready for review. After it is merged, proceed to a read-only post-merge smoke first. Do not rerun the G-6F 500-row apply because those rows already exist. The next write stage must use a new explicit approval gate and expected current-state diff.
