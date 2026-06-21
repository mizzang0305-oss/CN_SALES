# STAGE_W5B_SCHEMA_MIGRATION_DRAFT_ONLY

## FINAL_STATUS

FINAL_STATUS: W5B_SCHEMA_MIGRATION_DRAFT_ONLY_READY

## Base

- base branch: `codex/w5a-schema-decision-sync-approval-packet`
- base commit: `09ed96e`
- PR #103 status at local start: blocked by external Vercel rate limit
- work mode: local-only, no push, no PR, no merge

## Scope

Created a draft-only schema migration and schema apply plan for the W-5A Option B current-view schema.

Changed files:

- `supabase/migrations/0005_web_erp_xls_sync_current_view.sql`
- `docs/web-import/WEB_ERP_XLS_SYNC_SCHEMA_APPLY_PLAN.md`
- `reports/STAGE_W5B_SCHEMA_MIGRATION_DRAFT_ONLY.md`
- `tests/web-import-schema-decision-docs.test.ts`
- `tests/web-import-schema-migration-draft.test.ts`

## Draft Schema

Tables covered:

- `sales_import_batches`
- `sales_import_rows`
- `sales_current_records`
- `sales_import_change_summaries`
- `sales_change_audit_logs`

The draft includes primary keys, scope uniqueness, row count checks, current status checks, indexes, RLS enablement, read grant, and policy plan notes.

## Approval Boundary

Schema apply approval phrase required:

`WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED`

Execution approval phrase remains separate:

`WEB_ERP_XLS_SYNC_EXECUTE_APPROVED`

## Safety Result

- DB write: not performed
- Migration apply: not performed
- `supabase db push`: not run
- Seed/storage: not performed
- Sync/apply: not performed
- Production POST: not executed
- Deploy/manual deploy: not performed
- Raw row/PII/secret output: not added
- Physical delete: not implemented
- Approval file committed: no

## Validation Result

Validation is completed at the combined local branch closeout.

## Next Stage

`W-6_SYNC_SCOPE_API_DRAFT_DISABLED`
