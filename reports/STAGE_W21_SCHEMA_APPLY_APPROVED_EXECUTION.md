# STAGE_W21_SCHEMA_APPLY_APPROVED_EXECUTION

## FINAL_STATUS

FINAL_STATUS: BLOCKED_SCHEMA_APPLY_PREFLIGHT_FAILED

## Approval

- approval phrase: WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED
- approved scope: schema migration apply only
- sync execute approved: NO
- XLS data apply approved: NO

The provided approval phrase authorizes only the schema migration apply path. It does not authorize XLS sync execution, current-view persistence, production POST, seed/storage changes, or manual deploy.

## Preflight Result

Schema apply was not executed.

Hard blockers:

- target DB clarity: BLOCKED
- linked Supabase project: none
- candidate projects found: 2
- policy readiness: BLOCKED
- create policy statements: 0

Target discovery result:

- Supabase CLI path: `npx supabase`
- CLI version observed: `2.107.0`
- linked project: none
- project candidates: two active projects were visible from the authenticated CLI context
- selected target: none

The repository has no `supabase/config.toml`, and `npx supabase projects list` reported no linked project. Because two active Supabase projects were visible and neither was linked to this repo, the target database is ambiguous.

## Migration Draft Review

Migration file reviewed:

```text
supabase/migrations/0005_web_erp_xls_sync_current_view.sql
```

Expected current-view tables are present in the draft:

- `cn_sales.sales_import_batches`
- `cn_sales.sales_import_rows`
- `cn_sales.sales_current_records`
- `cn_sales.sales_import_change_summaries`
- `cn_sales.sales_change_audit_logs`

The draft also includes:

- primary keys
- uniqueness constraints
- foreign keys
- current status checks
- aggregate count checks
- indexes
- RLS enablement statements
- authenticated read grants

Preflight issue:

- The migration draft contains RLS enablement and grants, but no `create policy` statements.
- Existing W-5A/W-5B/W-18 docs require RLS/policy/grant review before apply.
- `docs/web-import/WEB_ERP_XLS_SYNC_SCHEMA_PLAN.md` says company-scoped read policies and role/part-scoped policy design are required before migration apply.

Because policy readiness could not be verified as complete, schema apply was blocked.

## Apply Command Summary

- apply command: not run
- migration apply executed: NO
- `supabase db push` executed: NO
- rollback executed: NO
- manual DROP/rollback executed: NO
- seed/storage command executed: NO
- sync/apply command executed: NO

## Schema Verification

Remote schema verification was not performed because migration apply did not run and no target DB was selected.

- sales_import_batches: draft present, remote not inspected
- sales_import_rows: draft present, remote not inspected
- sales_current_records: draft present, remote not inspected
- sales_import_change_summaries: draft present, remote not inspected
- sales_change_audit_logs: draft present, remote not inspected
- RLS: draft present, remote not inspected
- policies: BLOCKED, draft has no `create policy` statements
- grants: draft present, remote not inspected
- indexes: draft present, remote not inspected
- constraints: draft present, remote not inspected

## Safety

- DB schema write: NO
- DB data write: NO
- migration apply: NO
- sync/apply: NO
- production POST: NO
- seed/storage: NO
- raw row/PII/secret: NO
- physical delete: NO
- enabled sync/apply button: NO
- manual deploy: NO
- docs/adsense staged: NO
- `.codex/config.toml` staged: NO

## Validation

Pre-apply validation status:

- migration draft table scan: PASS
- RLS/grant/index draft scan: PARTIAL, policies missing
- target DB identity check: BLOCKED
- schema apply: NOT RUN
- sync execute: NOT RUN
- row data query: NOT RUN

- lint: PASS
- test: PASS, 58 files / 379 tests
- test:worker: PASS, 4 tests
- build: PASS
- diff-check: PASS
- safety scans: PASS

## PR / Report

- report file: `reports/STAGE_W21_SCHEMA_APPLY_APPROVED_EXECUTION.md`
- static guard: `tests/web-import-schema-apply-blocked-result-static.test.ts`
- report-only: YES

## Final Decision

- schema applied: NO
- sync execute allowed now: NO
- next required action: choose and link the exact Supabase target project, then add or explicitly approve the missing RLS policy plan before retrying schema apply
- next required sync approval: WEB_ERP_XLS_SYNC_EXECUTE_APPROVED
