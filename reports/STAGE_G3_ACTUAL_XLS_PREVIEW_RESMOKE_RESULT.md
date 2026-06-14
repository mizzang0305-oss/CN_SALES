# CN_SALES STAGE G-3 Actual XLS Preview Re-Smoke Result

## 1. Final Status

- Final status: XLS_PREVIEW_RESMOKE_PASS
- Decision reason: legacy `.XLS` preview returned HTTP 200 locally, generated a summary, matched part 11, and stayed preview-only.

## 2. Baseline

| Item | Result |
| --- | --- |
| Repo | mizzang0305-oss/CN_SALES |
| Main HEAD | b8dc7a6 |
| PR #16 | MERGED |
| Worktree before report | clean |
| Production deployment | success |
| Production access | Vercel auth gate 401 |

## 3. XLS File

| Item | Result |
| --- | --- |
| File name | 11파트 1~6일 매출현황.XLS |
| SHA-256 | 37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0 |
| Target part | 11 |
| File committed | no |

## 4. Local Render

| Route | HEAD | GET |
| --- | --- | --- |
| /uploads | 200 | 200 |
| /dashboard | 200 | 200 |

## 5. Preview Result

| Metric | Result |
| --- | --- |
| Executed | yes, localhost preview-only |
| HTTP status | 200 |
| ok | true |
| selected part | 11 |
| file part | 11 |
| part mismatch | false |
| total rows | 2394 |
| normal rows | 1844 |
| excluded or error rows | 275 |
| amount total | 716970702 |
| sales total | 499286430 |
| receipt total | 217684272 |
| account count | 159 |
| item count | 495 |
| warnings | 2 |
| can commit | false |
| apply enabled | false |
| apply reason | PREVIEW_ONLY |
| blocked reason | PREVIEW_ONLY |

## 6. Preview Safety

| Check | Result |
| --- | --- |
| source row payload fields in response scan | 0 hits |
| diagnostic trace/path fragments in response scan | 0 hits |
| credential marker fragments in response scan | 0 hits |
| confirm endpoint call | no |
| DB write | no |
| production POST | no |
| migration / seed / storage | no |

## 7. Side Effects

- Local preview-only POST was executed against `127.0.0.1`.
- No production POST was executed.
- No confirm endpoint was called.
- No manual DB apply action was executed.
- No migration, seed, or storage change was executed.
- The local response file remains under `.local-approval/` and is not tracked.
- The actual XLS file is not tracked.

## 8. Next Gate

The actual `.XLS` preview-only re-smoke passed. The next gate is a separately approved manual UI confirmation and DB apply smoke, with rollback/audit expectations reviewed before any write path is used.
