# WEB_ERP_XLS_SYNC_SCHEMA_APPLY_PREFLIGHT

Stage: W-18_SCHEMA_APPLY_PREFLIGHT_NO_WRITE

## 1. FINAL_STATUS

FINAL_STATUS: W18_SCHEMA_APPLY_PREFLIGHT_NO_WRITE_READY

## 2. Purpose

This document defines the no-write preflight for a future schema apply.

The current schema migration remains draft-only. This stage does not run migration apply and does not write to the database.

## 3. Required Owner Approval

Future schema apply requires the exact owner approval phrase:

```text
WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED
```

Without that phrase:

- migration apply: FORBIDDEN
- supabase db push: FORBIDDEN
- DB write: FORBIDDEN
- production POST: FORBIDDEN
- deploy/manual deploy: FORBIDDEN

## 4. Current Draft Inputs

Draft migration file:

- `supabase/migrations/0005_web_erp_xls_sync_current_view.sql`

Current status:

- schema draft-only: YES
- migration apply: FORBIDDEN
- supabase db push: FORBIDDEN
- DB write: FORBIDDEN
- schema apply allowed now: NO

## 5. Required Preflight Checks Before Future Apply

Before any future schema apply, review:

- owner approval
- migration hash and diff
- target database/project identity
- RLS/policy review
- grant review
- index review
- table ownership and schema namespace
- rollback plan
- validation bundle
- production risk check
- secret/env output guard

## 6. Rollback plan

A future schema apply packet must include:

- exact migration file and checksum
- expected tables/indexes/policies
- down-migration or revert mitigation
- validation query list
- owner decision record
- post-apply read-only verification plan

No rollback command is executed in this no-write preflight.

## 7. Sync Separation

Schema apply and sync execution are separate approvals.

- sync execution remains separate
- sync execute: FORBIDDEN
- `WEB_ERP_XLS_SYNC_EXECUTE_APPROVED` does not authorize schema apply
- `WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED` does not authorize sync execute

## 8. Data Safety

- rawRowsReturned=false
- raw row output: FORBIDDEN
- PII output: FORBIDDEN
- secret/env output: FORBIDDEN
- physical delete: FORBIDDEN
- enabled sync/apply button: FORBIDDEN

## 9. Next Gate

Next schema gate remains blocked until explicit owner approval:

```text
WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED
```
