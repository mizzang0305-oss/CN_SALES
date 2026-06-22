# Web Import Operator Handover

## 1. FINAL_STATUS

FINAL_STATUS: W20_OPERATOR_HANDOVER_AND_APPROVAL_GATE_SUMMARY_READY

## 2. Current Operator Scope

CN_SALES remains an ERP XLS based sales management web service.

ERP remains the source of truth. The web service currently supports aggregate-only preview, dry-run, readiness routes, and reporting shells. It does not apply schema changes, persist current-view sync, or execute production mutations.

## 3. Currently Available

The following capabilities are available for operator review:

- Excel preview
- dry-run
- readiness routes
- weekly/monthly/receivable/admin aggregate shell
- admin import audit readiness
- disabled sync-scope contract
- role-scope aware preview and dry-run contracts
- aggregate-only dashboard readiness

Supported readiness routes:

- `/part/import-sales`
- `/admin/import-audit`
- `/admin/sales-status`
- `/reports/weekly`
- `/reports/monthly`
- `/receivables`

## 4. Currently Unavailable

The following operations remain unavailable:

- DB migration apply: unavailable
- real current-view persistence: unavailable
- sync execute: unavailable
- physical delete: unavailable
- raw row output: unavailable
- production POST: unavailable
- manual deploy: unavailable
- seed/storage writes: unavailable

Current decisions:

- schema apply allowed now: NO
- sync execute allowed now: NO
- DB write: FORBIDDEN
- migration apply: FORBIDDEN
- sync/apply: FORBIDDEN
- enabled sync/apply button: FORBIDDEN

## 5. Approval Gates

Schema migration apply and sync execution are separate gates.

Future schema apply requires:

```text
WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED
```

Future sync execution requires:

```text
WEB_ERP_XLS_SYNC_EXECUTE_APPROVED
```

Boundary rules:

- schema approval does not authorize sync execution.
- sync approval does not authorize schema apply.
- either phrase appearing in documentation is not itself an approval.
- both future steps require a fresh explicit owner instruction in the active turn.

## 6. Data and Privacy Boundary

All current web import and reporting readiness surfaces remain aggregate-only.

Required guarantees:

- rawRowsReturned=false
- raw row output: FORBIDDEN
- PII output: FORBIDDEN
- secret/env output: FORBIDDEN
- full customer row list: FORBIDDEN
- full product row list: FORBIDDEN
- masked customer key only for receivable readiness contracts

## 7. Operator Flow

Current safe flow:

1. Upload an ERP XLS for preview.
2. Review aggregate preview values.
3. Run aggregate dry-run.
4. Review insert/update/removed/noChange summaries.
5. Confirm readiness reports and disabled sync-scope response.
6. Stop before schema apply or sync execution.

Future schema flow requires a separate approval request.

Future sync execution requires a separate approval request after schema readiness is settled.

## 8. Handover Summary

- Preview and dry-run are ready for aggregate-only review.
- Reporting and receivable screens are readiness shells, not ledger mutation screens.
- The sync-scope endpoint is intentionally disabled and returns approval-required state.
- No current route should expose an enabled sync/apply button.
- Physical deletes are not part of the ERP XLS current-view policy.
- Removed rows are future `not_in_latest_xls` status candidates, not deletion candidates.

## 9. Next Required Action

Before schema apply:

- request and confirm `WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED`
- rerun schema preflight
- confirm target environment
- review rollback, RLS/policy, grant, and index plan

Before sync execute:

- request and confirm `WEB_ERP_XLS_SYNC_EXECUTE_APPROVED`
- rerun preview and dry-run
- confirm file hash, part, period, and aggregate candidates
- confirm local/dev-only execution path
- keep rawRowsReturned=false
