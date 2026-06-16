# CN_SALES STAGE G-6I Final 486-Row Apply Result

## 1. Final Status

`G6I_FINAL_486_ROW_APPLY_PASS`

The G-6I final limited apply was executed once through localhost after PR #49 was merged and the current-state dry-run matched the approved max-486 insert-only scope.

## 2. Merge And Runtime Gate

- PR #49: merged
- PR #49 merge commit: `a9571a489680bbe8d2f37bc977b56bb13478b7d4`
- Local server replacement: previous port `3215` listener stopped, merged `main` restarted on port `3215`
- Server source: merged `main`
- Source XLS SHA-256: `sha256:37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0`
- Preview checksum: `sha256:5fe6bdd10bca2f60560b798b2843cf9913e940d429ab95d6cd8c9449c5c224a8`

## 3. Approval Gate

- Approval file: `.local-approval/g6i_limited_apply_approval.json`
- Git status: ignored local file, not committed
- Stage: `G-6I`
- Target part: `11`
- Date scope: `2026-06-01` through `2026-06-06`
- Apply mode: `limited-apply`
- Max rows: `486`
- Allowed operations: `insert`
- Blocked operations: `update`, `delete`, `hard_delete`, `full_apply`
- Production POST approved: `false`
- Migration, seed, and storage approved: `false`
- Update approved: `false`
- Delete approved: `false`
- Full apply approved: `false`

## 4. Current-State Dry Run

- HTTP status: `200`
- Dry run: `true`
- DB write: `false`
- Normal rows: `2119`
- Excluded rows: `275`
- Warning rows: `0`
- Error rows: `0`
- Existing scoped rows: `1633`
- Insert candidates: `486`
- Update candidates: `0`
- Delete candidates: `0`
- No-change rows: `1633`
- Selected rows dry-run equivalent: `486`
- Candidate digest matches selector: `true`
- Order digest matches selector: `true`
- Scope source: `explicit-request`

## 5. Date Diagnostics

- Checked rows: `486`
- Canonical ISO ledger date count: `486`
- Non-ISO ledger date candidates: `0`
- Invalid ledger date candidates: `0`
- Missing ledger date candidates: `0`
- Date outside scope candidates: `0`
- Raw rows returned: `false`

## 6. Immediate Pre-Apply Dry Run

- HTTP status: `200`
- Existing scoped rows: `1633`
- Insert candidates: `486`
- Update candidates: `0`
- Delete candidates: `0`
- No-change rows: `1633`
- Selected rows dry-run equivalent: `486`
- Candidate digest matches selector: `true`
- Order digest matches selector: `true`
- Date diagnostics still clean: `true`

## 7. Limited Apply Result

- HTTP status: `200`
- Dry run: `false`
- Apply mode: `limited-apply`
- Stage: `G-6I`
- Actual apply executed: `true`
- Import batch id: `2dfa067b-20e0-419c-ad59-de34e892b40c`
- Requested rows: `486`
- Inserted rows: `486`
- Updated rows: `0`
- Deleted rows: `0`
- Normalized table write: `false`
- Storage write: `false`
- DB write: `true`

## 8. Read-Back Verification

- Read-back executed: `true`
- Read-back row count: `486`
- Matches requested rows: `true`
- Identity hash match: `true`
- Content hash present: `true`
- Selected columns only: `true`
- Select star used: `false`
- Part/date match: `true`
- Audit status present: `true`
- Rollback executed: `false`
- Rollback evidence retained: import batch id only in this report

## 9. Post-Apply Dry Run And Final Sync

- HTTP status: `200`
- Dry run: `true`
- DB write: `false`
- Normal rows: `2119`
- Excluded rows: `275`
- Warning rows: `0`
- Error rows: `0`
- Existing scoped rows: `2119`
- Insert candidates: `0`
- Update candidates: `0`
- Delete candidates: `0`
- No-change rows: `2119`
- Plan ready: `true`
- Existing reader executed: `true`
- Existing reader fetched rows: `2119`
- Existing reader pages read: `5`
- Existing reader count matches fetched rows: `true`
- Existing reader selected columns only: `true`
- Existing reader select star used: `false`
- Existing reader raw rows returned: `false`

## 10. Validation

- `npm run lint`: pass
- `npm run test`: pass
- `npm run test:worker`: pass
- `npm run build`: pass
- `git diff --check`: pass
- Current-state dry-run assertions: pass
- Immediate pre-apply dry-run assertions: pass
- Limited apply assertions: pass
- Post-apply dry-run assertions: pass

## 11. Safety And Side Effects

- G-6F/G-6G/G-6H rerun: no
- G-6I actual apply count: one localhost request
- DB write over 486 rows: no
- Update/delete/hard delete/full apply: no
- Production URL or production POST: no
- Migration/seed/storage/SQL/view/role/grant execution: no
- Metabase/Vercel deploy: no
- Env/auth/payment/webhook change: no
- XLS/XLSX committed: no
- `.local-approval/**` committed: no
- Approval JSON committed: no
- Raw response dump committed: no
- Raw customer rows, raw row JSON, row ID lists, identity hash lists, actual date lists, PII, and secrets included in this report: no

## 12. Next Gate

G-6I is fully applied for the approved part/date scope. Any rollback or follow-on operational action should be handled as a separate explicitly approved gate using import batch `2dfa067b-20e0-419c-ad59-de34e892b40c`.
