# CN_SALES STAGE G-5 Error/Excluded Row Classification Result

## 1. Final Status

- Final status: `CLASSIFICATION_PR_CREATED_PASS`
- Decision reason: error/excluded rows are now separated in preview and confirm dry-run summaries. The actual XLS smoke completed with excluded rows only, no warning rows, and no error rows. Actual DB apply remains disabled.

## 2. Baseline

- Base branch: `main`
- Base commit before G-5 branch: `39a0d89`
- PR #19 status: merged
- PR #19 merge commit: `39a0d89`
- G-4B finding: 275 rows were previously grouped under `HAS_ERROR_ROWS`.

## 3. Classification Policy

| bucket | examples | dry-run decision | actual apply decision |
| --- | --- | --- | --- |
| `excludedRows` | blank, repeated header, subtotal/footer, non-transaction helper rows | allowed when no warnings/errors | not written as ledger rows |
| `warningRows` | review-needed rows reserved for ambiguous cases | blocked | blocked |
| `errorRows` | missing required customer/product or invalid required field | blocked | blocked |

Reason counts are aggregate code counts only. No raw row content, customer text, phone number, address, business number, local path, secret, or env value is included.

## 4. Implementation Summary

- Added aggregate row issue classification.
- Added `excludedRows`, `warningRows`, `errorRows`, and reason maps to preview summary.
- Added `dryRunReady`, `actualApplyReady`, and `actualApplyBlockedReason` to confirm dry-run response.
- Kept actual apply disabled with `APPLY_NOT_APPROVED`.
- Ensured future confirm write paths skip excluded rows.
- Added upload UI cards for separated row buckets and reason summaries.

## 5. Test Coverage

- Added row classification unit tests.
- Updated preview checksum tests for category counts.
- Updated preview/confirm route safety tests for separated buckets and actual apply blocking.
- Updated static route tests for category fields and apply-state split.

## 6. Actual XLS Preview Result

| field | value |
| --- | ---: |
| HTTP status | 200 |
| totalRows | 2394 |
| normalRows | 2119 |
| excludedRows | 275 |
| warningRows | 0 |
| errorRows | 0 |
| amountTotal | 716,970,702 |
| customerCount | 159 |
| productCount | 495 |
| partMismatch | false |

Excluded reason counts:

| reason | count |
| --- | ---: |
| `NON_TRANSACTION_ROW` | 275 |

## 7. Actual XLS Confirm Dry-Run Result

| field | value |
| --- | --- |
| HTTP status | 200 |
| dryRunReady | true |
| applyReady compatibility field | true |
| actualApplyReady | false |
| actualApplyBlockedReason | `APPLY_NOT_APPROVED` |
| status | `DRY_RUN_READY` |
| expectedAffectedRows | 2119 |
| dbWrite | false |
| storageWrite | false |
| normalizedTableWrite | false |
| actualApply | false |

## 8. Apply Readiness Decision

- Dry-run readiness: PASS for this file under G-5 policy.
- Actual DB apply: NOT APPROVED.
- Next gate must decide limited apply separately after reviewing `actualApplyReady=false` and the excluded row policy.

## 9. Safety

- DB write: NO
- production POST: NO
- dryRun=false confirm: NO
- migration apply: NO
- seed apply: NO
- storage write: NO
- Vercel CLI/manual deploy: NO
- raw response dump committed: NO
- actual XLS committed: NO
- `.local-approval/**` committed: NO

Response safety scan:

- raw row pattern hits: 0
- diagnostic error detail pattern hits: 0
- secret/env pattern hits: 0
- phone/address/business-number pattern hits: 0

## 10. Side Effects

- PR #19 report-only squash merge: YES
- Vercel production auto deployment from PR #19 main merge: allowed side effect
- G-5 local preview smoke: YES
- G-5 local confirm dry-run smoke: YES
- Actual DB apply: NO

## 11. Next Gate

Merge the G-5 classification PR first. After merge, evaluate limited DB apply only through a separate explicit approval that names the test file, target part, row cap, rollback owner, and operator.
