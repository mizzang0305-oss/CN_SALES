# CN_SALES STAGE G-6C Post-Apply Dry-Run Smoke Result

## 1. Final Status

- FINAL_STATUS: `POST_APPLY_DRY_RUN_PASS`
- Decision: The same part 11 XLS now detects the 3 previously inserted rows as no-change rows, with the remaining 2116 rows still reported as insert candidates.

## 2. Baseline

| Item | Value |
| --- | --- |
| Repo | `mizzang0305-oss/CN_SALES` |
| Main HEAD | `5ec5d04` |
| PR #24 | `MERGED` |
| Previous limited apply rows | 3 |
| Previous updates/deletes | 0 / 0 |

## 3. Source File

| Item | Value |
| --- | --- |
| File name | `11파트 1~6일 매출현황.XLS` |
| SHA-256 | `37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0` |
| Target part | `11` |
| Date scope | `2026-06-01` to `2026-06-06` |
| Hash matched approval package | `yes` |

## 4. Preview Result

| Metric | Value |
| --- | ---: |
| HTTP status | 200 |
| Normal rows | 2119 |
| Excluded rows | 275 |
| Warning rows | 0 |
| Error rows | 0 |
| Part mismatch | `false` |

## 5. Post-Apply Dry-Run Diff

| Metric | Value |
| --- | ---: |
| HTTP status | 200 |
| Dry-run | `true` |
| Plan ready | `true` |
| Existing scoped rows | 3 |
| Insert candidates | 2116 |
| Update candidates | 0 |
| Delete candidates | 0 |
| No-change rows | 3 |
| Duplicate incoming identity hashes | 0 |
| Duplicate existing keys | 0 |
| Actual apply ready | `false` |
| Actual apply blocked reason | `APPLY_NOT_APPROVED` |

## 6. Read-Only DB Evidence

| Check | Result |
| --- | --- |
| Read executed | `true` |
| Selected columns only | `true` |
| Wildcard select used | `false` |
| Scoped rows | 3 |
| Inserted 3 rows detected | `yes` |

## 7. Safety

| Check | Result |
| --- | --- |
| DB write | `NO` |
| dryRun=false confirm | `NO` |
| Production POST | `NO` |
| Additional insert | `NO` |
| Update | `NO` |
| Delete | `NO` |
| Migration / seed / storage | `NO` |
| Vercel deploy / redeploy | `NO` |
| Source row payload in report | `NO` |
| Customer or item names in report | `NO` |
| Sensitive config values in report | `NO` |
| XLS / local response dump committed | `NO` |

## 8. Side Effects

- Local preview POST: `YES`
- Local confirm dry-run POST: `YES`
- DB read-only scoped query: `YES`
- DB write: `NO`
- Production request: `NO`
- Deployment: `NO`

## 9. Next Gate

- The G-6B 3-row limited apply is now visible to the dry-run diff planner as already present.
- Next approval can consider a larger bounded row cap, but full 2119-row apply remains blocked until a separate approval states target part, row cap, rollback owner, and write boundaries.
