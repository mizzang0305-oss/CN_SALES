# CN_SALES STAGE G-4B Actual XLS Confirm Dry-Run Smoke Result

## 1. Final Status

- Status: CONFIRM_DRY_RUN_BLOCKED_HAS_ERRORS
- Reason: preview and confirm dry-run completed successfully, but the workbook still has error/excluded rows, so actual apply remains blocked.
- Actual DB apply: not executed
- Production POST: not executed

## 2. Baseline

- Branch: main
- Main HEAD before report branch: f87bf21
- PR #18: merged
- Production deployment: already successful before this smoke
- Production access: gated

## 3. XLS File

| Field | Result |
| --- | --- |
| file name | 11파트 1~6일 매출현황.XLS |
| target part | 11 |
| file hash | sha256:37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0 |
| committed | NO |

## 4. Preview Result

| Field | Result |
| --- | --- |
| HTTP status | 200 |
| ok | true |
| sourceFileHash | sha256:37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0 |
| previewChecksum | sha256:ff6a4688dd481b2f0e4ed6055e15a8abdaedf02f3849c4710088f151496a5922 |
| totalRows | 2394 |
| normalRows | 1844 |
| excludedOrErrorRows | 275 |
| amountTotal | 716970702 |
| customerCount | 159 |
| itemCount | 495 |
| partMismatch | false |
| confirmCandidate | true |
| full parsed rows returned | 0 |
| sample metadata rows returned | 20 |

## 5. Confirm Dry-Run Result

| Field | Result |
| --- | --- |
| HTTP status | 200 |
| ok | true |
| dryRun | true |
| operator present | true |
| selected_part | 11 |
| applyReady | false |
| applyBlockedReason | HAS_ERROR_ROWS |
| status | DRY_RUN_BLOCKED_HAS_ERRORS |
| expectedAffectedRows | 0 |

## 6. Safety

| Check | Result |
| --- | --- |
| dryRun=false confirm | NO |
| actual DB apply | NO |
| production POST | NO |
| migration apply | NO |
| seed apply | NO |
| storage write | NO |
| normalized table write | NO |
| raw response committed | NO |
| response safety marker hits | 0 |

## 7. Side Effects

- Local app server was started and stopped for smoke testing.
- Local preview POST was executed against `127.0.0.1`.
- Local confirm dry-run POST was executed against `127.0.0.1`.
- Local response files were stored under the ignored approval folder only.
- No XLS/XLSX file was committed.
- No raw response dump was committed.

## 8. Next Gate

- DB apply remains blocked until error/excluded row handling is reviewed and a separate limited apply approval is issued.
- Next review should decide whether to fix parsing/classification for the 275 excluded/error rows or define an explicit exclusion policy before any limited DB apply.
