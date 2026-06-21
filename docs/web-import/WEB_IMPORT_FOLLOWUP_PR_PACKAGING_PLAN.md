# WEB_IMPORT_FOLLOWUP_PR_PACKAGING_PLAN

Stage: W-15_LOCAL_FOLLOWUP_PACKAGING_AND_NAV_READINESS

## 1. FINAL_STATUS

FINAL_STATUS: LOCAL_ONLY_W15_FOLLOWUP_PACKAGING_READY

## 2. Current Gate

PR #103 remains the upstream gate for the local follow-up package.

- PR #103 status: OPEN / Draft / UNSTABLE
- Blocking reason: external Vercel deployment rate limit
- push allowed now: NO
- PR allowed now: NO
- merge allowed now: NO
- deploy: NO

The local branch must stay local until PR #103 checks recover and PR #103 is merged.

## 3. Follow-Up Scope Summary

The future follow-up package contains W-5B through W-14 only.

- W-5B: schema migration draft-only plan
- W-6: disabled `/api/sales-import/sync-scope` contract returning approval-required status only
- W-7/W-8: import dashboard readiness and expanded operator state
- W-9: admin import audit readiness view
- W-10: weekly report aggregate data contract
- W-11: monthly report aggregate contract
- W-12: receivable dashboard aggregate contract
- W-13: admin status dashboard aggregate contract
- W-14: reporting dashboard readiness routes

This package does not apply a schema, does not write to the database, and does not enable sync/apply.

## 4. Local Commit Map

Local commits currently queued behind PR #103:

- `88dd9d3` docs: add W-5B schema migration draft plan
- `c02703f` feat(web-import): add disabled sync-scope contract
- `80912bf` feat(web-import): improve import dashboard readiness state
- `70c4701` fix(web-import): narrow disabled sync-scope dry-run typing
- `ee69247` feat(web-import): improve import dashboard readiness
- `a3003e0` feat(web-import): add admin import audit readiness view
- `d59a2d9` feat(reports): add weekly report data contract
- `477bc4e` feat(reports): add monthly report aggregate contract
- `3e08ff3` feat(receivables): add receivable dashboard contract
- `9a9b5dc` feat(admin): add admin status dashboard contract
- `eb849e2` test(admin): avoid raw-row safety literal in status contract
- `74753d9` feat(reports): add reporting dashboard readiness routes

W-15 adds local packaging, route inventory, and read-only readiness links.

## 5. Route Inventory

Readiness routes expected in the follow-up package:

- `/part/import-sales`
- `/admin/import-audit`
- `/reports/weekly`
- `/reports/monthly`
- `/receivables`
- `/admin/sales-status`

The routes are readiness shells only. They use aggregate-only view models or empty/mock readiness state.

## 6. Future PR Title

Recommended follow-up PR title after PR #103 merges:

```text
feat(web-import): add schema draft and reporting readiness
```

## 7. Future PR Body Draft

```markdown
## 0) Intent
Prepare the ERP XLS web-import follow-up package after W-5A, covering schema draft planning, disabled sync-scope readiness, import dashboard readiness, and aggregate-only reporting/admin/receivable readiness routes.

## 1) Summary (Problem -> Solution -> Outcome)
- Problem: W-5A selects the schema direction, but the schema draft, disabled sync contract, and operator reporting readiness are not yet packaged for review.
- Solution: Add W-5B/W-6/W-7/W-8/W-9/W-10/W-11/W-12/W-13/W-14 follow-up only: schema migration draft-only files, disabled sync-scope response contract, aggregate readiness UI, route shells, reports, and static guards.
- Outcome: Maintainers can review the complete no-write readiness package before any schema apply or sync execution approval.

## 2) Changes
Checklist:
- [ ] Bug fix
- [x] Refactor / cleanup
- [ ] Performance improvement
- [x] Security hardening
- [x] DX / tooling

Key edits:
- Adds schema migration draft-only planning.
- Adds disabled sync-scope contract that requires approval.
- Improves import dashboard readiness state without enabling sync.
- Adds admin import audit readiness view.
- Adds weekly, monthly, receivable, and admin status aggregate contracts.
- Adds reporting dashboard readiness route shells and static route inventory guards.

## 3) Files Changed
- docs/web-import/* (schema draft, approval boundaries, reporting contracts, follow-up packaging)
- reports/STAGE_W5B_* through reports/STAGE_W15_* (local stage evidence)
- src/app/* and src/components/* (readiness route shells and disabled UI surfaces)
- src/lib/* (aggregate-only view model contracts)
- tests/* (static safety and contract guards)

## 4) Testing
Commands to run after rebasing/cherry-picking onto latest main:
- npm run lint
- npm run test
- npm run test:worker
- npm run build
- git diff --check

Manual verification:
- Confirm sync controls remain disabled.
- Confirm no raw row, PII, or secret payloads are returned.
- Confirm route inventory includes /part/import-sales, /admin/import-audit, /reports/weekly, /reports/monthly, /receivables, and /admin/sales-status.

## 5) Risk Assessment
Risk: Low.

- Data impact: none; DB write: NO.
- Migration impact: none; migration apply: NO.
- External dependencies: none; production POST: NO.
- Primary risk is route/UI wording or static guard drift.

## 6) Rollback Plan
- Revert the follow-up PR commit.
- No DB rollback is required because the package is no-write and draft-only.

## 7) Deployment Notes
- Required env vars: none.
- Required secrets: none.
- Migrations: draft-only; schema apply still requires WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED.
- Sync execution still requires WEB_ERP_XLS_SYNC_EXECUTE_APPROVED.
- Deploy steps: none in this PR.

## 8) Follow-ups
- After owner approval, prepare a separate schema apply step.
- After schema apply and explicit owner approval, prepare sync execution.
```

## 8. Required Approval Boundaries

Schema apply remains blocked until the owner explicitly provides:

```text
WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED
```

Sync execution remains blocked until the owner explicitly provides:

```text
WEB_ERP_XLS_SYNC_EXECUTE_APPROVED
```

## 9. PR #103 Recovery Sequence

After PR #103 Vercel checks recover:

1. Confirm PR #103 checks are green.
2. Mark PR #103 ready and squash merge it.
3. Update `main` with `git pull --ff-only`.
4. Rebase or cherry-pick this local branch onto latest `main`.
5. Resolve conflicts while preserving draft-only and disabled-sync boundaries.
6. Re-run validation and safety scans.
7. Only then push a follow-up branch and create a Draft PR.

## 10. Safety Constraints

- DB write: NO
- migration apply: NO
- `supabase db push`: NO
- seed/storage: NO
- sync/apply: NO
- production POST: NO
- raw row/PII/secret: NO
- physical delete: NO
- enabled sync button: NO
- deploy/manual deploy: NO
- docs/adsense staged: NO
- .codex/config.toml staged: NO
