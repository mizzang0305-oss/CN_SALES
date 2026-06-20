# WEB_ERP_XLS_SYNC_SCHEMA_APPLY_PLAN

Stage: W-5B_SCHEMA_MIGRATION_DRAFT_ONLY

## 1. FINAL_STATUS

FINAL_STATUS: W5B_SCHEMA_MIGRATION_DRAFT_ONLY_READY

## 2. Scope

This document describes a draft migration for the ERP XLS web-import current-view schema.

Current status:

- migration file created: yes, draft only
- migration applied: no
- `supabase db push`: not run
- DB write: no
- seed/storage: no
- sync/apply: no
- production POST: no
- deploy: no

Required schema apply approval phrase:

`WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED`

## 3. Draft Migration

Draft file:

- `supabase/migrations/0005_web_erp_xls_sync_current_view.sql`

The draft creates the Option B current-view schema selected in W-5A:

- `cn_sales.sales_import_batches`
- `cn_sales.sales_import_rows`
- `cn_sales.sales_current_records`
- `cn_sales.sales_import_change_summaries`
- `cn_sales.sales_change_audit_logs`

The migration is intentionally limited to DDL review content. It does not backfill data, create seed rows, write storage objects, run sync, or modify the ERP source.

## 4. Table Purpose

`sales_import_batches` records one accepted XLS upload scope by company, part, period, file name, file hash, aggregate row counts, and amount total.

`sales_import_rows` stores aggregate-safe row snapshot evidence tied to a batch. API and UI responses must not return raw row arrays or full customer/product payloads from this table.

`sales_current_records` stores the latest query view for an approved part and period scope. Removed-from-current rows are represented by `current_status = not_in_latest_xls`; physical delete remains forbidden.

`sales_import_change_summaries` stores inserted, updated, removed-from-current, no-change, and amount delta aggregates for report and admin review.

`sales_change_audit_logs` stores actor/action evidence for preview, dry-run approval, planned sync, executed sync, close sealing, and rollback planning.

## 5. Constraints And Indexes

The draft includes:

- supported part checks for `1`, `4`, `5`, `6`, `7`, `9`, `10`, and `11`
- period range checks
- non-negative row count checks
- current status checks
- amount delta arithmetic check
- unique batch scope hash constraint
- unique current-view stable key constraint
- indexes for part/period/status/hash/audit lookup

## 6. RLS / Policy / Grant Plan

The draft enables RLS on all five tables and grants read access to `authenticated`.

Before any schema apply, owner review must confirm:

- company-scoped read policies
- role/part-scoped read policies
- server-side sync write policy design
- no broad client-side mutation policy
- no raw row/PII/secret response path

Application role rules remain required even after RLS:

- `SALES_REP_PART_N`: assigned part only
- `PART_LEAD`: managed parts only
- `ADMIN`: all supported parts

## 7. Rollback Plan

Rollback is not approved in W-5B.

If schema apply is later approved, the rollback plan must be reviewed before applying and must include:

- migration identifier
- affected tables and indexes
- confirmation whether data exists in new tables
- read-only backup/export evidence
- exact rollback approval phrase
- confirmation that ERP XLS source files remain unchanged

No rollback may physically delete ERP source data.

## 8. Safety Constraints

Forbidden until later explicit approval:

- migration apply
- `supabase db push`
- DB write
- sync/apply
- production POST
- seed/storage
- deploy/manual deploy
- raw row output
- PII output
- secret/env output
- physical delete

## 9. Next Stage

Recommended next stage:

`W-6_SYNC_SCOPE_API_DRAFT_DISABLED`

Purpose:

- add a disabled sync-scope API contract
- validate the approval and role-scope wiring
- keep actual current-view sync unavailable until schema apply and execution approval are explicitly provided
