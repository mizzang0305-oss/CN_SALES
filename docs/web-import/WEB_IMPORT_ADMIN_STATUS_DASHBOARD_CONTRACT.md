# WEB_IMPORT_ADMIN_STATUS_DASHBOARD_CONTRACT

Stage: W-13_ADMIN_STATUS_DASHBOARD_CONTRACT

## 1. FINAL_STATUS

FINAL_STATUS: W13_ADMIN_STATUS_DASHBOARD_CONTRACT_READY

## 2. Purpose

Define the aggregate-only admin status dashboard contract for all supported sales parts.

This stage does not connect a DB query and does not execute sync/apply.

## 3. Required Fields

Per-part status:

- `part`
- `periodStart`
- `periodEnd`
- `uploadStatus`
- `syncStatus`
- `sealedStatus`
- `amountTotal`
- `candidateSummary`
- `receivableSummary`
- `reportReadiness`
- `rawRowsReturned: false`

Candidate summary:

- `insertCandidates`
- `updateCandidates`
- `removedFromCurrentCandidates`
- `noChangeRows`
- `amountDelta`

Receivable summary:

- `outstandingAmount`
- `highRiskGroups`
- `actionRequiredCount`

Report readiness:

- `weekly`
- `monthly`
- `receivable`

## 4. Admin Access Contract

`ADMIN` may view all supported part aggregate statuses.

Even for `ADMIN`, the dashboard must not return:

- raw row arrays
- customer full name list
- phone number
- business registration number
- secret/env values

## 5. View Model

Source file:

- `src/lib/admin/admin-status-dashboard-contract.ts`

The view model derives:

- `partCount`
- total `amountTotal`
- aggregate candidate totals
- aggregate receivable totals
- `approvalRequiredParts`
- `planReady`
- no-write safety flags

## 6. Safety Constraints

Forbidden:

- DB write
- DB read connection
- sync/apply execution
- enabled sync button
- raw row output
- PII output
- secret/env output
- production POST
- migration apply
- storage write
- physical delete
