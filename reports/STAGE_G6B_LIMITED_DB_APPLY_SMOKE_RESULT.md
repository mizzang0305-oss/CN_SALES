# STAGE G-6B Limited DB Apply Smoke Result

## Final Status

- FINAL_STATUS: `LIMITED_APPLY_3_ROWS_PASS`
- Stage: `G-6B`
- Apply mode: `limited-apply`
- Target part: `11`
- Row cap: `3`
- Allowed operation: `INSERT only`
- Operator: `Minz`
- Rollback owner: `Minz`

## Preconditions

| Check | Result |
| --- | --- |
| Main baseline | `22be11d` |
| PR #23 merged | `yes` |
| XLS hash matched approval package | `yes` |
| Project ref alignment | `PASS` |
| Required env readiness | `CONFIGURED` |
| Service-role boundary | `server-only` |
| Approval file present | `yes` |
| Approval JSON BOM-safe loading | `PASS` |
| Production POST | `NO` |
| Migration / seed / storage apply | `NO` |

## Preview Evidence

| Metric | Value |
| --- | ---: |
| Total rows | 2394 |
| Normal rows | 2119 |
| Excluded rows | 275 |
| Warning rows | 0 |
| Error rows | 0 |
| Part mismatch | `false` |

## Dry-Run Diff Gate

| Metric | Value |
| --- | ---: |
| Plan ready | `true` |
| Existing scoped rows before apply | 0 |
| Insert candidates | 2119 |
| Update candidates | 0 |
| Delete candidates | 0 |
| No-change rows | 0 |
| Duplicate incoming identity hashes | 0 |
| Duplicate existing identity hashes | 0 |

## Limited Apply Result

| Metric | Value |
| --- | --- |
| Import batch id | `593998f7-1c55-4021-88c3-86067964838f` |
| Created at | `2026-06-14T18:43:29.737+00:00` |
| Requested rows | 3 |
| Inserted rows | 3 |
| Updated rows | 0 |
| Deleted rows | 0 |
| Normalized table write | `false` |
| Read-back rows | 3 |
| Read-back identity hash match | `true` |
| Read-back content hash present | `true` |

## Side Effects

| Side effect | Result |
| --- | --- |
| DB write | `YES - limited ledger insert only` |
| Ledger upload audit row | `YES` |
| Ledger row inserts | `3` |
| Normalized table write | `NO` |
| Update | `NO` |
| Delete | `NO` |
| Migration apply | `NO` |
| Seed apply | `NO` |
| Storage write | `NO` |
| Production POST | `NO` |
| Vercel deploy / redeploy | `NO` |

## Rollback Evidence

- Rollback was not executed.
- Rollback evidence was captured locally in ignored `.local-approval` files.
- The committed report intentionally excludes source row payloads, customer names, item names, local file paths, and sensitive config values.

## Safety Scan

| Scan | Result |
| --- | --- |
| Sensitive config actual values | `0 hits` |
| Source row payload output | `0 hits` |
| Diagnostic trace / local filesystem path | `0 hits` |
| Unbounded wildcard select text | `0 hits` |
| Production write SQL in report | `0 hits` |

## Next Gate

- Run a read-only post-apply diff smoke to verify the same file now reports the 3 inserted rows as existing/no-change candidates.
- Do not run full 2119-row apply until a separate explicit approval names the target part, row cap, rollback owner, and expected write boundaries.
