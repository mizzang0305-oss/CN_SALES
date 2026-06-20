# WEB_IMPORT_MONTHLY_REPORT_AGGREGATE_CONTRACT

Stage: W-11_MONTHLY_REPORT_AGGREGATE_CONTRACT

## 1. FINAL_STATUS

FINAL_STATUS: W11_MONTHLY_REPORT_AGGREGATE_CONTRACT_READY

## 2. Purpose

Define the aggregate-only monthly report contract for ERP XLS import summaries.

This stage does not connect a DB query and does not execute sync/apply.

## 3. Required Fields

Monthly scope:

- `part`
- `month`
- `normalRows`
- `excludedRows`
- `amountTotal`
- `rawRowsReturned: false`

Change summary:

- `insertCandidates`
- `updateCandidates`
- `removedFromCurrentCandidates`
- `noChangeRows`
- `amountDelta`

Monthly details:

- `weeklyBreakdown`
- `carryOverItems`

## 4. View Model

Source file:

- `src/lib/reports/monthly-import-report-contract.ts`

The view model derives:

- `weeklyCount`
- `weeklyAmountTotal`
- `changeTotal`
- `carryOverAmountTotal`
- `planReady`
- no-write safety flags

`planReady` is true only when all source rows are aggregate-only, the weekly totals match monthly totals, and the change total matches `normalRows`.

## 5. Safety Constraints

Forbidden:

- DB write
- DB read connection
- sync/apply execution
- raw row output
- PII output
- secret/env output
- production POST
- migration apply
- storage write
- physical delete
