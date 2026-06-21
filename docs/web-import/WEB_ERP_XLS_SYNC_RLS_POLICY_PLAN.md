# WEB ERP XLS Sync RLS Policy Plan

## 1. FINAL_STATUS

FINAL_STATUS: W21A_TARGET_RLS_POLICY_PREFLIGHT_READY

## 2. Purpose

W-21A resolves the policy-readiness blocker found in W-21 by adding a follow-up RLS policy migration draft and documenting the selected Supabase target.

No schema apply is performed in W-21A.

## 3. Current Target Status

- selected target project ref: cwkjdbllgyojpggjjfhv
- project name: mizzang0307
- environment: production
- region: ap-southeast-2
- target project selection status: SELECTED
- usage warning: EXCEEDING USAGE LIMITS shown in Supabase UI

No DB password, service role key, anon key, connection string, or env value was printed or recorded.

## 4. Policy Migration Draft

Policy migration:

```text
supabase/migrations/0006_web_erp_xls_sync_rls_policies.sql
```

This is Option A: keep the existing `0005` current-view schema draft intact and add a follow-up `0006` RLS policy migration draft.

Reason:

- `0005` is already on main as a reviewed draft.
- `0005` has not been applied.
- The target is now selected, but W-21A is still a policy preflight PR only.
- After W-21A merge and final preflight, `0005` and `0006` can be applied together under the existing schema approval.
- The policy change remains reviewable as a separate additive migration.

## 5. Covered Tables

The policy draft adds read policies for:

- `cn_sales.sales_import_batches`
- `cn_sales.sales_import_rows`
- `cn_sales.sales_current_records`
- `cn_sales.sales_import_change_summaries`
- `cn_sales.sales_change_audit_logs`

create policy count: 5

## 6. Auth / Role Pattern

The draft follows existing database-side helpers and scope tables:

- company boundary: `company_id = cn_sales.current_company_id()`
- all-part read roles: `team_leader`, `executive`, `admin`
- managed part read: `cn_sales.user_scope_assignments` with `scope_type = 'part'` and `can_view = true`
- assigned sales rep read: `cn_sales.sales_reps` joined to `cn_sales.sales_parts`
- app-side W roles remain enforced before API calls by `src/lib/auth/part-access.ts`

The SQL does not use mutable `user_metadata` claims for authorization. It uses existing profile/scope tables and existing security-invoker helper functions.

## 7. Grant and Write Boundary

The draft keeps the current-view tables read-only for `authenticated` users:

- revoke all table privileges from `anon`
- revoke insert, update, delete from `authenticated`
- grant select to `authenticated`
- no authenticated write policy
- no sync write policy

Server-side sync execution remains blocked until the separate execution approval phrase is provided:

```text
WEB_ERP_XLS_SYNC_EXECUTE_APPROVED
```

## 8. Safety Boundary

- No schema apply in this PR.
- No sync execute without WEB_ERP_XLS_SYNC_EXECUTE_APPROVED.
- No physical delete.
- No raw row API output.
- rawRowsReturned=false
- no DB data write
- no production POST
- no seed/storage change
- no manual deploy
- no enabled sync/apply button

## 9. Apply Readiness

- policy migration: prepared locally
- create policy count: 5
- required tables covered: YES
- target selected: YES
- apply ready after W-21A merge and final preflight: YES
- schema apply retry allowed now: NO, because W-21A is not merged yet

Remaining blocker before apply retry: W-21A PR must be merged, then final namespace/link/preflight must pass.

## 10. Next Required User Action

After W-21A merge, the next preflight must verify:

- selected project ref
- selected project name
- Supabase link target
- migration history
- `0005` and `0006` pending state
- policy count
- grants
- RLS enabled state
- no sync execution
- no row data query
