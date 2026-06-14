# CN_SALES STAGE G-2 Legacy XLS Preview Support Result

## Status

- Local result: PASS
- Branch: codex/stage-g2-legacy-xls-preview-support
- Scope: legacy `.xls` upload preview support
- Real XLS preview: executed locally, preview-only
- Confirm endpoint: not called
- DB apply: not clicked
- DB write: no
- Migration / seed / storage: no
- Deploy: no

## Changes

- The upload worker now writes incoming workbook bytes to an ASCII-only temporary file name before invoking Python.
- Legacy `.xls` workbooks are read through `xlrd`; `.xlsx` and `.xlsm` workbooks are read through `openpyxl`.
- Python worker JSON output uses ASCII-safe JSON escaping so Korean column keys survive the Node process boundary.
- Worker stdout buffer is explicitly sized for larger workbook preview payloads.
- Ledger row rules now recognize the current ERP workbook header aliases, including date, account, item, quantity, unit price, amount, receipt, discount, and balance columns.
- Preview summary falls back to item-detail amounts when no account-total rows are present.

## Actual XLS Preview Smoke

| Check | Result |
| --- | --- |
| HTTP status | 200 |
| preview ok | true |
| mode | fixture |
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
| apply enabled | false |
| apply reason | PREVIEW_ONLY |
| blocked reason | PREVIEW_ONLY |
| forbidden response fragments | 0 |
| repo-local persistence before | false |
| repo-local persistence after | false |

## Safety

- Invalid upload errors remain sanitized.
- Preview response did not expose diagnostic traces, local filesystem paths, parser file paths, or source row payload fields.
- No confirm request was sent.
- No normalized table write path was used.
- No local persistence directory was created by preview.
- No production POST was executed.

## Validation

- `npm run lint`: PASS
- `npm run test`: PASS, 19 files / 89 tests
- `npm run test:worker`: PASS, 4 tests
- `npm run build`: PASS
- `git diff --check`: PASS

## Next Gate

- Create a Draft PR for maintainer review.
- Keep actual DB apply disabled until an operator explicitly confirms a preview in the UI.
