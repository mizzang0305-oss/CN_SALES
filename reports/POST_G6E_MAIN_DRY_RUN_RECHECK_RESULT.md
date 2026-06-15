# CN_SALES Post-G6E Main Dry-run Recheck Result

## 1. Final Status

- FINAL_STATUS: RESUME_SYNC_POST_G6E_DRY_RUN_PASS
- Scope: main post-G6E localhost preview and dry-run confirm recheck
- Additional DB write: NO
- `dryRun=false`: NO
- Production POST: NO
- SQL execution: NO
- Migration, seed, or storage write: NO
- Raw row or PII output: NO

## 2. PR #36 Merge

- PR: #36
- Final state: MERGED
- Merge commit: `8e60a23`
- Merge type: squash
- Side effect: GitHub merge-triggered Vercel Production auto deployment only
- Production read-only smoke: auth-gated responses without 5xx
- Metabase line state: metadata access remains blocked

## 3. PR #27 Merge

- PR: #27
- Final state: MERGED
- Merge commit: `4d4b4e6`
- Merge type: squash
- Changed files:
  - `reports/STAGE_G6E_LIMITED_100_ROW_APPLY_RESULT.md`
  - `src/app/api/uploads/confirm/route.ts`
  - `src/lib/import/limited-apply.ts`
  - `tests/limited-apply.test.ts`
  - `tests/upload-preview-static.test.ts`
- Side effect: GitHub merge-triggered Vercel Production auto deployment only
- Additional DB write during merge: NO
- Production read-only smoke: auth-gated responses without 5xx

## 4. Source File

- File: `11파트 1~6일 매출현황.XLS`
- Location: local operator filesystem only
- SHA-256 match: YES
- Expected hash: `37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0`
- XLS committed: NO
- Raw response committed: NO

## 5. Dry-run Result

Preview:

- HTTP status: 200
- totalRows: 2394
- insertRows: 2119
- excludedRows: 275
- partMismatch: false

Confirm dry-run:

- HTTP status: 200
- existingScopedRows: 133
- insertCandidates: 1986
- updateCandidates: 0
- deleteCandidates: 0
- noChangeRows: 133
- duplicateIncomingIdentityHashes: 0
- duplicateExistingKeys: 0
- planReady: true
- actualApplyReady: false
- actualApplyBlockedReason: APPLY_NOT_APPROVED

Expected post-G6E values:

- existingScopedRows: 133
- insertCandidates: 1986
- updateCandidates: 0
- deleteCandidates: 0
- noChangeRows: 133

Decision:

- The G-6E 100-row applied subset is now detected as unchanged by main dry-run.
- Additional apply remains blocked.

## 6. Safety

- Additional DB write: NO
- `dryRun=false` confirm: NO
- Production POST: NO
- Update/delete/full apply: NO
- SQL execution: NO
- View/role/grant execution: NO
- Metabase connection: NO
- Migration apply: NO
- Seed apply: NO
- Storage write: NO
- Raw row output: NO
- PII output: NO
- Secret/env output: NO
- Response safety scan: PASS

## 7. Validation

Before PR #36 merge:

- `npm run lint`: PASS
- `npm run test`: PASS, 25 files / 128 tests
- `npm run test:worker`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS

Before PR #27 merge:

- `npm run lint`: PASS
- `npm run test`: PASS, 25 files / 133 tests
- `npm run test:worker`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS

After PR #27 merge on main:

- `npm run lint`: PASS
- `npm run test`: PASS, 25 files / 133 tests
- `npm run test:worker`: PASS
- `npm run build`: PASS
- `git diff --check`: PASS

This report branch validation:

- pending at creation time

## 8. Next Gate

Next gate is max_rows=500 limited apply approval.

Requirements before the next apply:

- explicit operator approval
- bounded row cap
- insert-only operation
- non-ISO ledger-date guard retained
- read-back verification
- post-apply dry-run proof
- no production POST
- no update/delete/full apply
- no raw row/PII/secret output
