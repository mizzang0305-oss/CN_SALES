# STAGE_W16_LOCAL_STACK_AUDIT_AND_SPLIT_PLAN

## 1. FINAL_STATUS

FINAL_STATUS: LOCAL_ONLY_W16_STACK_AUDIT_READY

## 2. Base State

- PR #103 status: OPEN / Draft / UNSTABLE
- PR #103 blocker: external Vercel deployment rate limit
- PR #103 branch: `codex/w5a-schema-decision-sync-approval-packet`
- PR #103 head: `09ed96e6557485965a58e9e881932f3766615bcb`
- local branch: `local/w5b-w6-web-import-continued-work`
- base before local stack: `09ed96e`
- current local head before W-16: `d0a5ee8`
- push allowed now: NO
- PR allowed now: NO
- merge allowed now: NO
- deploy: NO

The only unrelated untracked path observed is `docs/adsense/`; it remains outside staging.

## 3. Local Commit Map

Local commits queued after PR #103:

| Stage | Commit | Summary | Split target |
| --- | --- | --- | --- |
| W-5B | `88dd9d3` | docs: add W-5B schema migration draft plan | PR-A |
| W-6 | `c02703f` | feat(web-import): add disabled sync-scope contract | PR-A |
| W-7 | `80912bf` | feat(web-import): improve import dashboard readiness state | PR-B |
| W-6 fix | `70c4701` | fix(web-import): narrow disabled sync-scope dry-run typing | PR-A |
| W-8 | `ee69247` | feat(web-import): improve import dashboard readiness | PR-B |
| W-9 | `a3003e0` | feat(web-import): add admin import audit readiness view | PR-B |
| W-10 | `d59a2d9` | feat(reports): add weekly report data contract | PR-C |
| W-11 | `477bc4e` | feat(reports): add monthly report aggregate contract | PR-C |
| W-12 | `3e08ff3` | feat(receivables): add receivable dashboard contract | PR-C |
| W-13 | `9a9b5dc` | feat(admin): add admin status dashboard contract | PR-C |
| W-13 test | `eb849e2` | test(admin): avoid raw-row safety literal in status contract | PR-C |
| W-14 | `74753d9` | feat(reports): add reporting dashboard readiness routes | PR-D |
| W-15 | `d0a5ee8` | docs(web-import): package local follow-up readiness plan | PR-D |

`70c4701` is grouped into PR-A because it narrows the disabled sync-scope typing introduced by W-6.

## 4. Changed File Inventory

W-5B/W-6 schema draft and disabled sync contract:

- `docs/web-import/WEB_ERP_XLS_SYNC_SCHEMA_APPLY_PLAN.md`
- `reports/STAGE_W5B_SCHEMA_MIGRATION_DRAFT_ONLY.md`
- `reports/STAGE_W6_SYNC_SCOPE_API_DRAFT_DISABLED.md`
- `src/app/api/sales-import/sync-scope/route.ts`
- `src/lib/web-import/sales-sync-scope-disabled.ts`
- `supabase/migrations/0005_web_erp_xls_sync_current_view.sql`
- `tests/sales-import-sync-scope-disabled-static.test.ts`
- `tests/sales-import-sync-scope-disabled.test.ts`
- `tests/sales-sync-scope-plan-static.test.ts`
- `tests/web-import-role-contract-static.test.ts`
- `tests/web-import-schema-decision-docs.test.ts`
- `tests/web-import-schema-migration-draft.test.ts`

W-7/W-8/W-9 import dashboard and admin audit readiness:

- `reports/STAGE_W7_IMPORT_DASHBOARD_READINESS_LOCAL.md`
- `reports/STAGE_W8_IMPORT_DASHBOARD_READINESS_EXPANSION.md`
- `reports/STAGE_W9_ADMIN_IMPORT_AUDIT_READINESS.md`
- `src/app/(pc)/admin/import-audit/page.tsx`
- `src/components/web-import/admin-import-audit-readiness.tsx`
- `src/components/web-import/sales-import-preview-client.tsx`
- `tests/admin-import-audit-readiness-static.test.ts`
- `tests/web-import-dashboard-readiness-static.test.ts`

W-10/W-11/W-12/W-13 aggregate contracts:

- `docs/web-import/WEB_IMPORT_ADMIN_STATUS_DASHBOARD_CONTRACT.md`
- `docs/web-import/WEB_IMPORT_MONTHLY_REPORT_AGGREGATE_CONTRACT.md`
- `docs/web-import/WEB_IMPORT_RECEIVABLE_DASHBOARD_CONTRACT.md`
- `docs/web-import/WEB_IMPORT_WEEKLY_REPORT_DATA_CONTRACT.md`
- `reports/STAGE_W10_WEEKLY_REPORT_DATA_CONTRACT.md`
- `reports/STAGE_W11_MONTHLY_REPORT_AGGREGATE_CONTRACT.md`
- `reports/STAGE_W12_RECEIVABLE_DASHBOARD_CONTRACT.md`
- `reports/STAGE_W13_ADMIN_STATUS_DASHBOARD_CONTRACT.md`
- `src/lib/admin/admin-status-dashboard-contract.ts`
- `src/lib/receivables/receivable-dashboard-contract.ts`
- `src/lib/reports/monthly-import-report-contract.ts`
- `src/lib/reports/weekly-import-report-contract.ts`
- `tests/admin-status-dashboard-contract-static.test.ts`
- `tests/admin-status-dashboard-contract.test.ts`
- `tests/monthly-import-report-contract-static.test.ts`
- `tests/monthly-import-report-contract.test.ts`
- `tests/receivable-dashboard-contract-static.test.ts`
- `tests/receivable-dashboard-contract.test.ts`
- `tests/weekly-import-report-contract-static.test.ts`
- `tests/weekly-import-report-contract.test.ts`

W-14/W-15 readiness routes, links, and packaging:

- `docs/web-import/WEB_IMPORT_FOLLOWUP_PR_PACKAGING_PLAN.md`
- `reports/STAGE_W14_REPORTING_DASHBOARD_READINESS_ROUTES.md`
- `reports/STAGE_W15_LOCAL_FOLLOWUP_PACKAGING_AND_NAV_READINESS.md`
- `src/app/(pc)/admin/sales-status/page.tsx`
- `src/app/(pc)/receivables/page.tsx`
- `src/app/(pc)/reports/monthly/page.tsx`
- `src/app/(pc)/reports/weekly/page.tsx`
- `src/app/part/import-sales/page.tsx`
- `src/components/reports/reporting-dashboard-readiness.tsx`
- `src/components/web-import/web-import-readiness-links.tsx`
- `tests/reporting-dashboard-readiness-routes-static.test.ts`
- `tests/web-import-followup-packaging-static.test.ts`
- `tests/web-import-route-inventory-static.test.ts`

## 5. Route Inventory

Required readiness routes are present:

- `/part/import-sales`: PASS
- `/admin/import-audit`: PASS
- `/reports/weekly`: PASS
- `/reports/monthly`: PASS
- `/receivables`: PASS
- `/admin/sales-status`: PASS

Build output also lists all six route paths as static routes.

## 6. Test Coverage Summary

W-5B/W-6:

- `tests/web-import-schema-migration-draft.test.ts`
- `tests/sales-import-sync-scope-disabled.test.ts`
- `tests/sales-import-sync-scope-disabled-static.test.ts`
- `tests/sales-sync-scope-plan-static.test.ts`

W-7/W-8/W-9:

- `tests/web-import-dashboard-readiness-static.test.ts`
- `tests/admin-import-audit-readiness-static.test.ts`

W-10/W-11/W-12/W-13:

- `tests/weekly-import-report-contract.test.ts`
- `tests/weekly-import-report-contract-static.test.ts`
- `tests/monthly-import-report-contract.test.ts`
- `tests/monthly-import-report-contract-static.test.ts`
- `tests/receivable-dashboard-contract.test.ts`
- `tests/receivable-dashboard-contract-static.test.ts`
- `tests/admin-status-dashboard-contract.test.ts`
- `tests/admin-status-dashboard-contract-static.test.ts`

W-14/W-15:

- `tests/reporting-dashboard-readiness-routes-static.test.ts`
- `tests/web-import-followup-packaging-static.test.ts`
- `tests/web-import-route-inventory-static.test.ts`

Cross-stage guards:

- `tests/web-import-role-contract-static.test.ts`
- `tests/web-import-schema-decision-docs.test.ts`

## 7. PR Split Plan

Recommended split after PR #103 merges:

### PR-A: W-5B/W-6 Schema Draft and Disabled Sync Contract

Branch suggestion:

- `codex/w5b-w6-schema-draft-sync-disabled`

Cherry-pick order:

1. `88dd9d3`
2. `c02703f`
3. `70c4701`

Scope:

- schema migration draft-only
- disabled sync-scope contract
- approval-required response only
- no migration apply
- no DB write

Validation focus:

- schema draft tests
- disabled sync contract tests
- no schema apply command
- no enabled sync path

### PR-B: W-7/W-8/W-9 Import and Audit Readiness UI

Branch suggestion:

- `codex/w7-w9-import-audit-readiness`

Base:

- latest `main` after PR-A merge

Cherry-pick order:

1. `80912bf`
2. `ee69247`
3. `a3003e0`

Scope:

- import dashboard readiness
- admin import audit readiness
- read-only UI only
- no sync/apply control

### PR-C: W-10/W-11/W-12/W-13 Aggregate Contracts

Branch suggestion:

- `codex/w10-w13-reporting-aggregate-contracts`

Base:

- latest `main` after PR-A merge; PR-B is not a hard dependency

Cherry-pick order:

1. `d59a2d9`
2. `477bc4e`
3. `3e08ff3`
4. `9a9b5dc`
5. `eb849e2`

Scope:

- weekly/monthly/receivable/admin aggregate contracts
- mock/view model only
- aggregate-only output
- masked customer key only

### PR-D: W-14/W-15 Reporting Routes and Follow-Up Packaging

Branch suggestion:

- `codex/w14-w15-reporting-routes-packaging`

Base:

- latest `main` after PR-B and PR-C merge

Cherry-pick order:

1. `74753d9`
2. `d0a5ee8`
3. W-16 report commit

Scope:

- reporting dashboard readiness routes
- readiness links
- follow-up packaging docs
- local stack audit report

Dependency:

- PR-D needs PR-C aggregate contracts because `reporting-dashboard-readiness.tsx` imports those view models.
- PR-D also benefits from PR-B because the route inventory includes `/admin/import-audit`.

### Monolithic fallback

A single follow-up PR is possible but not preferred. Use it only if PR #103 recovery creates conflicts that make split cherry-picks riskier than one rebase. Current dependency graph supports the four-PR split.

## 8. Rebase / Cherry-Pick Procedure After PR #103 Recovery

1. Confirm PR #103 checks are green.
2. Ready and squash merge PR #103.
3. `git checkout main`
4. `git pull --ff-only`
5. Create PR-A branch and cherry-pick PR-A commits.
6. Validate, safety scan, push PR-A only after allowed.
7. Repeat for PR-B, PR-C, and PR-D in the dependency order above.

No push, PR creation, merge, deploy, migration apply, DB write, or sync/apply is allowed before PR #103 is recovered and merged.

## 9. Follow-Up PR Body Final Draft Notes

Each split PR body should include:

- explicit stage range
- `no DB write`
- `no migration apply`
- `no sync/apply`
- `no production POST`
- `no deploy`
- `no raw row/PII/secret`
- `WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED` required before schema apply
- `WEB_ERP_XLS_SYNC_EXECUTE_APPROVED` required before sync execution

PR-D should link back to this W-16 report as the final local stack handoff.

## 10. Safety Boundary

- DB write: NO
- migration apply: NO
- `supabase db push`: NO
- seed/storage: NO
- sync/apply: NO
- production POST: NO
- raw row/PII/secret: NO
- physical delete: NO
- enabled sync button: NO
- docs/adsense staged: NO
- .codex/config.toml staged: NO

Contract safety:

- `rawRowsReturned=false` remains required in readiness contracts.
- receivable contract uses masked customer keys only.
- disabled sync-scope remains approval-required only.
- migration SQL is draft-only and not applied.

## 11. Validation Result

Local validation completed:

- lint: PASS
- test: PASS, 54 files / 367 tests
- test:worker: PASS, 4 tests
- build: PASS
- diff-check: PASS
- safety scans: PASS

## 12. Next Action After PR #103 Recovery

- wait for PR #103: YES
- rebase/cherry-pick needed: YES
- recommended PR split: PR-A / PR-B / PR-C / PR-D
- push allowed now: NO
- PR allowed now: NO
- migration allowed now: NO
- sync allowed now: NO
