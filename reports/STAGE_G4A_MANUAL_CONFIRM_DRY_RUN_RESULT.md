# CN_SALES STAGE G-4A Manual Confirm Dry-Run Result

## 1. Final Status

- Status: DRY_RUN_PATH_PR_CREATED_PASS candidate
- Scope: human-operated upload preview to confirm dry-run path
- Actual DB apply: not executed
- Production request: not executed

## 2. Baseline

- Base branch: main
- Base commit: cbcff41
- Previous gate: G-3 actual XLS preview-only passed
- Target file class: legacy XLS workbook
- Target part: 11

## 3. Contract Change

- Preview remains preview-only.
- Preview now returns `sourceFileHash`, `previewChecksum`, `confirmCandidate`, and `confirmBlockedReason`.
- Preview response no longer returns the full parsed row list.
- Confirm dry-run requires the same file to be uploaded again.
- Confirm dry-run re-parses server-side and compares file hash plus preview checksum.
- `dryRun=false` is blocked with `APPLY_NOT_APPROVED`.
- Actual DB apply remains disabled in the UI.

## 4. Preview Result

| Field | Result |
| --- | --- |
| HTTP status | 200 |
| totalRows | 2394 |
| normalRows | 1844 |
| excludedOrErrorRows | 275 |
| amountTotal | 716970702 |
| customerCount | 159 |
| itemCount | 495 |
| partMismatch | false |
| confirmCandidate | true |
| preview rows returned | 0 |
| preview sample metadata rows | 20 |

## 5. Dry-Run Result

| Field | Result |
| --- | --- |
| HTTP status | 200 |
| dryRun | true |
| applyReady | false |
| applyBlockedReason | HAS_ERROR_ROWS |
| report status | DRY_RUN_BLOCKED_HAS_ERRORS |
| expectedAffectedRows | 0 |

## 6. UI Flow

- Operator selects an Excel file and a part.
- Operator creates a preview and checks the summary.
- Operator enters operator name and confirms the three required acknowledgements.
- Operator runs confirm dry-run.
- The actual DB apply button remains disabled and marked as preparing.

## 7. Safety

| Check | Result |
| --- | --- |
| DB write | NO |
| production POST | NO |
| actual apply | NO |
| migration apply | NO |
| seed apply | NO |
| storage write | NO |
| response diagnostic marker hits | 0 |
| full parsed rows in preview response | NO |
| credential value output | NO |

## 8. Side Effects

- Local server used for smoke only.
- Local response files were stored under the repo-local ignored approval folder.
- No committed XLS/XLSX file.
- No committed response dump.

## 9. Next Gate

- Review and merge the G-4A PR.
- Keep actual DB apply disabled until a separate G-4B approval explicitly covers target file, target part, rollback owner, audit evidence, and stop conditions.
