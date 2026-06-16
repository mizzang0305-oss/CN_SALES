# CN_SALES STAGE G-6I Ledger Date Normalization Result

## 1. Final Status

`G6I_LEDGER_DATE_NORMALIZATION_PR_CREATED_PASS`

G-6I ledger date normalization was fixed and verified with preview plus confirm `dryRun=true` only. No actual G-6I apply retry was executed.

## 2. Baseline

- Repository: `mizzang0305-oss/CN_SALES`
- Baseline branch: `main`
- Baseline commit: `90936ce`
- PR #48: merged
- Baseline validation: lint/test/worker/build/diff-check passed before edits

## 3. Previous Blocker

- Attempted stage: G-6I
- Max rows: 486
- Error: `LIMITED_APPLY_LEDGER_DATE_BLOCKED`
- Checked rows: 486
- Previous non-ISO ledger date candidates: 185
- Previous invalid/missing ledger date candidates: 0
- DB write: no

## 4. Root Cause

Category: A, D, E.

The parser stored ledger date cell values without first canonicalizing them to `YYYY-MM-DD`. The limited apply selector, date guard, and insert payload then used that noncanonical parsed field. The G-6I workbook also contains grouped transaction rows whose date cell can be a non-date group label or blank under a preceding in-scope date marker, so row-level canonical date derivation needed safe carry-forward within the approved period.

## 5. Date Normalization Policy

- Canonical ledger date: `YYYY-MM-DD`
- Accepted parseable forms: ISO date, dotted date, slash date, Korean full date, scoped Korean day marker, datetime date prefix, and Excel serial numbers
- Scoped day markers are accepted only when `periodStart` and `periodEnd` are in the same calendar month
- Missing, invalid, and out-of-scope dates remain blocked when no safe in-scope carry-forward date exists
- The approval scope remains `2026-06-01` through `2026-06-06`

## 6. Hotfix

- Added canonical ledger date normalization helper
- Normalized parser ledger dates before identity hashes, sync rows, selectors, guards, and payload construction
- Added safe carry-forward from the last canonical in-scope date for grouped transaction rows
- Added aggregate-only limited apply date diagnostics
- Changed limited insert payload construction to use the paired sync row canonical ledger date

## 7. Test Coverage

- Date normalization forms and blockers
- Parser canonical date normalization
- Missing and out-of-scope date blocking
- Grouped row carry-forward
- G-6I final 486 selected rows aggregate diagnostics
- Limited apply guard and insert payload canonical date source
- Existing G-6F/G-6G/G-6H/G-6I gate behavior retained

## 8. Read-only Verification

- XLS hash: matched expected SHA-256
- Preview HTTP status: 200
- Confirm dry-run HTTP status: 200
- Dry run: true
- Existing scoped rows: 1633
- Insert candidates: 486
- Update candidates: 0
- Delete candidates: 0
- No-change rows: 1633
- Normal rows: 2119
- Excluded rows: 275
- Warning rows: 0
- Error rows: 0
- Plan ready: true
- Selected rows dry-run equivalent: 486
- Candidate digest matches selector: true
- Order digest matches selector: true
- Date diagnostics checked rows: 486
- Canonical ISO ledger date count: 486
- Non-ISO ledger date candidates: 0
- Invalid ledger date candidates: 0
- Missing ledger date candidates: 0
- Date outside scope candidates: 0
- Raw rows returned: false

## 9. Safety

- G-6I actual apply retry: no
- DB write: no
- `dryRun=false`: no
- Production POST: no
- Update/delete/full apply: no
- Migration/seed/storage write: no
- SQL/view/role/grant execution: no
- Vercel deploy/redeploy: no
- Raw row, PII, and secret output: no
- XLS/approval/response files committed: no

## 10. Side Effects

- Source, tests, and this report changed
- Ignored `.local-approval/` dry-run response files were created locally for verification only
- No database rows were inserted, updated, deleted, or upserted during this hotfix verification

## 11. Next Gate

Merge the Draft PR, then rerun G-6I from current-state dry-run and require a separate explicit approval before any actual apply.
