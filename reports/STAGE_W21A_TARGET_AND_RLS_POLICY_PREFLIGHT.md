# STAGE_W21A_TARGET_AND_RLS_POLICY_PREFLIGHT

## FINAL_STATUS

FINAL_STATUS: W21A_TARGET_RLS_POLICY_PREFLIGHT_READY

## PR #112

- merged: YES
- reason: checks recovered after empty-commit retrigger
- branch: `codex/w21-schema-apply-blocked-preflight`
- commit: `a0216d8`
- main HEAD after #112: `aeb480c7149e35bfc4c4fdbf47a888ae9e68af12`

## Target Selection

- selected target project ref: cwkjdbllgyojpggjjfhv
- project name: mizzang0307
- environment: production
- region: ap-southeast-2
- target project selection status: SELECTED
- usage warning: EXCEEDING USAGE LIMITS shown in Supabase UI
- repo linked: pending final preflight after W-21A merge

## RLS Policy Plan

- policy migration: `supabase/migrations/0006_web_erp_xls_sync_rls_policies.sql`
- create policy count: 5
- covered tables:
  - `sales_import_batches`
  - `sales_import_rows`
  - `sales_current_records`
  - `sales_import_change_summaries`
  - `sales_change_audit_logs`
- auth/role pattern:
  - `cn_sales.current_company_id()`
  - `cn_sales.current_user_role()`
  - `cn_sales.user_scope_assignments`
  - `cn_sales.sales_reps`
  - `cn_sales.sales_parts`
- apply ready after W-21A merge and final preflight: YES
- blockers: none in W-21A policy draft; final link/preflight still required before apply

## Policy Boundary

- ADMIN-equivalent DB roles: `team_leader`, `executive`, `admin` can read company-scoped current-view tables.
- PART_LEAD managed part read: `user_scope_assignments(scope_type = 'part', can_view = true)`.
- SALES_REP assigned part read: `sales_reps` joined to `sales_parts`.
- authenticated users receive select-only access.
- anon access is revoked.
- authenticated insert/update/delete privileges are revoked.
- sync write policy is not added.

## Safety

- schema apply: NO
- supabase db push: NO
- DB data write: NO
- sync/apply: NO
- production POST: NO
- seed/storage: NO
- raw row/PII/secret: NO
- physical delete: NO
- enabled sync/apply button: NO
- docs/adsense staged: NO
- `.codex/config.toml` staged: NO

## Validation

- lint: PASS
- test: PASS, 59 files / 382 tests
- test:worker: PASS, 4 tests
- build: PASS
- diff-check: PASS
- safety scans: PASS

## Final Decision

- schema apply retry allowed now: NO, because W-21A is not merged yet
- sync execute allowed now: NO
- next required action: push W-21A, merge after checks, then run namespace/link/preflight before schema apply
