# WEB_ERP_XLS_SYNC_APPROVAL_CONTRACT

## Purpose

W-3 defines the future sync approval contract for ERP XLS web import. This document does not authorize or implement sync. W-4/W-5 must use a separate explicit approval gate before any current-view update is allowed.

## Role Scope

- `ADMIN`: can request approval for supported parts `1/4/5/6/7/9/10/11`.
- `SALES_REP_PART_N`: can request approval only for assigned part `N`.
- `PART_LEAD`: can request approval only for parts present in the managed part scope.
- Unsupported parts are blocked for every role, including `ADMIN`.

## Contract Fields

```ts
type SalesSyncApprovalContract = {
  workflowGate: string;
  actorRole: SalesImportRole;
  actorId?: string;
  part: string;
  periodStart: string;
  periodEnd: string;
  fileHash: string;
  normalRows: number;
  excludedRows: number;
  amountTotal: number;
  expectedPrimaryScopeRows: number;
  expectedExistingScopedRowsBeforeSync: number;
  expectedInsertCandidates: number;
  expectedUpdateCandidates: number;
  expectedRemovedFromCurrentCandidates: number;
  expectedNoChangeRows: number;
  expectedAmountBefore: number;
  expectedAmountAfter: number;
  expectedAmountDelta: number;
  rawRowsReturned: false;
};
```

## Validation Rules

- `workflowGate`, `part`, `periodStart`, `periodEnd`, and `fileHash` must match the approved request.
- Counts must be non-negative integers.
- Amount fields must be finite numbers.
- `expectedAmountDelta` must equal `expectedAmountAfter - expectedAmountBefore`.
- `rawRowsReturned` must be exactly `false`.
- Role scope must pass the central `canAccessSalesPart` contract.

## Forbidden In W-3

- DB write
- storage upload
- current-view update
- sync/apply execution
- physical delete
- raw row output
- PII output
- secret/env output
- production POST
