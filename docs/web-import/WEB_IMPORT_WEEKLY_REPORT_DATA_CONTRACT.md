# WEB_IMPORT_WEEKLY_REPORT_DATA_CONTRACT

Stage: W-10_WEEKLY_REPORT_DATA_CONTRACT

## 1. FINAL_STATUS

FINAL_STATUS: W10_WEEKLY_REPORT_DATA_CONTRACT_READY

## 2. Purpose

Define the aggregate-only data contract for future weekly reports that summarize ERP XLS web-import results.

This stage does not connect a DB query and does not execute sync/apply.

## 3. Required Fields

Weekly report scope:

- `part`
- `periodStart`
- `periodEnd`
- `normalRows`
- `amountTotal`

Change summary:

- `insertCandidates`
- `updateCandidates`
- `removedFromCurrentCandidates`
- `noChangeRows`
- `amountDelta`

Future receivable link fields:

- `customerScopeKey`
- `receivableBalance`
- `collectionMemo`

Future carry-over fields:

- `previousWeekOpenItems`
- `nextWeekFollowUps`

Future monthly memo fields:

- `monthToDateAmount`
- `monthlyAccumulationMemo`

## 4. View Model

Source file:

- `src/lib/reports/weekly-import-report-contract.ts`

The view model derives:

- `periodLabel`
- `changeTotal`
- `planReady`
- no-write safety flags

`planReady` is true only when `rawRowsReturned` is false and the aggregate change count equals `normalRows`.

## 5. Safety Constraints

Forbidden:

- DB write
- sync/apply execution
- raw row output
- PII output
- secret/env output
- production POST
- migration apply
- storage write
- physical delete

## 6. Next Stage

Future stage:

- connect weekly report UI to approved aggregate import summaries after schema apply and sync execution approval are completed
