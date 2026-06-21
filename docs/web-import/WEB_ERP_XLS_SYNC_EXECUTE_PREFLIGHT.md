# WEB ERP XLS Sync Execute Preflight

## 1. FINAL_STATUS

FINAL_STATUS: W19_SYNC_EXECUTE_PREFLIGHT_DISABLED_AUDIT_READY

## 2. Purpose

This document defines the no-write preflight for a future web ERP XLS sync execution.

The current sync-scope endpoint remains disabled and returns an approval-required response. This stage does not run sync execution, does not update current-view records, and does not write to the database.

## 3. Required Owner Approval

Future sync execution requires a separate owner approval phrase:

```text
WEB_ERP_XLS_SYNC_EXECUTE_APPROVED
```

That phrase is not present as an execution approval in this stage.

Schema apply remains separate and requires its own approval phrase:

```text
WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED
```

Schema approval alone does not authorize sync execution. Sync approval alone does not authorize schema apply.

Current decision:

- sync execute allowed now: NO
- sync execute: FORBIDDEN
- DB write: FORBIDDEN
- migration apply: FORBIDDEN
- production POST: FORBIDDEN
- deploy/manual deploy: FORBIDDEN

## 4. Disabled Sync-Scope Contract

The `/api/sales-import/sync-scope` route remains a disabled readiness contract.

Expected behavior before future approval:

- response status: `approval_required`
- sync execution: disabled
- current-view persistence: disabled
- rawRowsReturned=false
- side effects: all false
- required approvals: schema and execution phrases are both shown

The route may validate role scope, dry-run summary fields, and approval packet shape. It must not persist data while the execution gate is closed.

## 5. Candidate Handling Policy

Future sync execution must continue to follow the ERP XLS source-of-truth policy:

- insert candidates become active current-view records after approved execution.
- update candidates become current-view changes based on the latest XLS values after approved execution.
- removedFromCurrent -> not_in_latest_xls, not physical deletion.
- noChange rows remain unchanged.

This W-19 stage only audits the disabled contract. It does not execute any of the candidate handling steps.

## 6. UI Boundary

The import dashboard may show readiness status, preview summaries, dry-run summaries, and approval-required messaging.

It must not expose an enabled sync/apply button before explicit execution approval.

UI safety requirements:

- enabled sync/apply button: FORBIDDEN
- apply/execute/rollback controls: FORBIDDEN
- raw row table: FORBIDDEN
- full customer or product row dump: FORBIDDEN

## 7. Safety Boundary

- DB write: FORBIDDEN
- sync/apply: FORBIDDEN
- migration apply: FORBIDDEN
- supabase db push: FORBIDDEN
- production POST: FORBIDDEN
- seed/storage: FORBIDDEN
- physical delete: FORBIDDEN
- rawRowsReturned=false
- raw row output: FORBIDDEN
- PII output: FORBIDDEN
- secret/env output: FORBIDDEN
- deploy/manual deploy: FORBIDDEN

## 8. Future Execute Preflight Checklist

Before any future sync execution can be considered, the operator must verify:

- schema apply was explicitly approved and completed, if required.
- target environment identity is confirmed as local/dev-only.
- latest preview and dry-run summaries are fresh.
- file hash, part, and period match the approved packet.
- insert/update/removed/noChange counts match the approved packet.
- rawRowsReturned=false.
- update and removed behavior match the ERP XLS source-of-truth policy.
- rollback plan is reviewed as a plan, not executed.
- explicit owner phrase `WEB_ERP_XLS_SYNC_EXECUTE_APPROVED` is present in the future approval request.

## 9. Current Decision

- sync execute allowed now: NO
- schema apply allowed now: NO
- next required schema approval: WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED
- next required sync approval: WEB_ERP_XLS_SYNC_EXECUTE_APPROVED
