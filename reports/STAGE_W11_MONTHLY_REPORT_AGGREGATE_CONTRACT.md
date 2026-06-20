# STAGE_W11_MONTHLY_REPORT_AGGREGATE_CONTRACT

## FINAL_STATUS

FINAL_STATUS: W11_MONTHLY_REPORT_AGGREGATE_CONTRACT_READY

## Scope

Added a local-only monthly report aggregate contract.

Changed files:

- `src/lib/reports/monthly-import-report-contract.ts`
- `docs/web-import/WEB_IMPORT_MONTHLY_REPORT_AGGREGATE_CONTRACT.md`
- `reports/STAGE_W11_MONTHLY_REPORT_AGGREGATE_CONTRACT.md`
- `tests/monthly-import-report-contract.test.ts`
- `tests/monthly-import-report-contract-static.test.ts`

## Contract Fields

Included:

- part
- month
- normalRows
- excludedRows
- amountTotal
- insert/update/removed/noChange
- amountDelta
- weeklyBreakdown
- carryOverItems
- rawRowsReturned: false

## Safety Result

- DB write: not implemented
- DB read: not implemented
- Sync/apply: not implemented
- Raw row/PII/secret output: not added
- Production POST: not executed
- Migration apply: not performed
- Deploy/manual deploy: not performed
