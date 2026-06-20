# WEB_IMPORT_RECEIVABLE_DASHBOARD_CONTRACT

Stage: W-12_RECEIVABLE_DASHBOARD_CONTRACT

## 1. FINAL_STATUS

FINAL_STATUS: W12_RECEIVABLE_DASHBOARD_CONTRACT_READY

## 2. Purpose

Define the aggregate-only receivable dashboard contract for future AR management views.

This stage does not connect a DB query and does not execute sync/apply.

## 3. Required Fields

Scope:

- `part`
- `periodStart`
- `periodEnd`
- `rawRowsReturned: false`

Receivable item:

- `maskedCustomerKey`
- `outstandingAmount`
- `lastPaymentDate`
- `promiseDate`
- `riskLevel`
- `actionStatus`
- `rawRowsReturned: false`

Dashboard aggregate:

- `itemCount`
- `totalOutstandingAmount`
- `highRiskCount`
- `followUpRequiredCount`
- `planReady`

## 4. Privacy Contract

The contract intentionally uses `maskedCustomerKey`.

Forbidden:

- customer full name list
- phone number
- business registration number
- raw row table
- raw cell output
- PII output

## 5. View Model

Source file:

- `src/lib/receivables/receivable-dashboard-contract.ts`

`planReady` is true only when all items are aggregate-only and all customer keys are masked.

## 6. Safety Constraints

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
