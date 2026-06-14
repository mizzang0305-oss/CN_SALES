# CN_SALES STAGE G-1 Actual XLS Preview Smoke Result

## 1. Final Status

- FINAL_STATUS: PREVIEW_SMOKE_FAILED
- Reason: The human-operated preview-only smoke reached the local upload route, but the approved operating XLS file returned a safe 415 `INVALID_UPLOAD_FILE` response before preview summary generation.
- DB apply decision: BLOCKED. Do not proceed to confirm or limited DB apply from this result.

## 2. Baseline

- Repository: mizzang0305-oss/CN_SALES
- Branch at execution: main
- Main HEAD: 0e19021
- PR #14 state: MERGED
- PR #14 merge commit: 0e190210469683398c6464a4df5e889043d44ae7
- Worktree before report: clean

## 3. Environment

- Mode: local
- Local URL: http://127.0.0.1:3215
- Local server: `npm run start -- -p 3215`
- Production URL: not used for XLS preview
- Production auth/gate: not used in this smoke
- Production POST: not executed

## 4. XLS File

- File name: 11파트 1~6일 매출현황.XLS
- File type: legacy `.XLS`
- File hash algorithm: SHA-256
- File hash: 37E0833CF4329D08C7EE4093E4807712BD41C30149A344B8DB440E1CB5472CA0
- Target part: 11
- File part inferred from file name: 11
- XLS committed to git: NO
- Raw file path stored in this report: NO

## 5. Preview Result

- Preview executed: YES, preview-only
- HTTP status: 415
- Safe error code: INVALID_UPLOAD_FILE
- Selected part: 11
- File part: 11
- Part mismatch: not reported by response because preview summary was not generated
- Total rows: unavailable
- Valid rows: unavailable
- Error/rejected rows: unavailable
- Amount total: unavailable
- Customer count: unavailable
- Item count: unavailable
- Warnings count: 0
- canCommit: unavailable
- Apply enabled: unavailable
- Local `.local-data` before preview: absent
- Local `.local-data` after preview: absent

## 6. UI Guard Result

- `/uploads` render: PASS, HTTP 200
- Manual DB apply button clicked: NO
- Confirm endpoint called: NO
- Operator confirmation flow executed: NO
- Expected guard after failed preview: DB apply remains unavailable because no successful committable preview exists.

## 7. Dashboard Result

- `/dashboard` render: PASS, HTTP 200
- Recent upload/apply history section: present in PR #14 UI
- Dashboard DB history expected from preview-only step: NO
- 5xx observed: NO

## 8. Exposure / Safety

- Raw row JSON field exposure in preview response: NO
- Raw row collection field exposure in preview response: NO
- Diagnostic trace exposure in preview response: NO
- local path exposure in preview response: NO
- secret/env exposure in preview response: NO
- Raw customer rows stored in report: NO
- Full XLS content stored in report: NO
- Phone/address/business number stored in report: NO

## 9. Side Effects

- Actual XLS preview: YES, preview-only attempt
- Confirm endpoint call: NO
- DB write: NO
- Production POST: NO
- Migration apply: NO
- Seed apply: NO
- Supabase storage write: NO
- Vercel CLI/manual deploy: NO
- Env/auth/payment/webhook change: NO
- XLS/XLSX committed: NO

## 10. Next Gate

- Do not proceed to confirm/DB apply from this failed preview smoke.
- Recommended next step: use an approved `.XLSX` master-copy smoke file or implement/verify legacy `.XLS` parser support in a separate code PR.
- After a successful preview-only smoke, rerun this gate and create a new result report before any limited confirm/DB apply approval.
