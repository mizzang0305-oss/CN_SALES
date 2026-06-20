# STAGE_W0_WEB_ERP_XLS_SYNC_DESIGN

## 1. FINAL_STATUS

FINAL_STATUS: W0_WEB_ERP_XLS_SYNC_DESIGN_READY

W-0 is a design-only stage. It adds product, permission, data model, API, and staged implementation design for ERP XLS based sales management. It does not implement upload APIs, sync APIs, migrations, storage, or DB writes.

## 2. Scope

- implemented phase: W-0_WEB_ERP_XLS_SYNC_DESIGN
- changed files:
  - `docs/web-import/WEB_ERP_XLS_SYNC_DESIGN.md`
  - `reports/STAGE_W0_WEB_ERP_XLS_SYNC_DESIGN.md`
- DB write: none
- apply: none
- deploy: none
- production POST: none
- migration/seed/storage: none

## 3. Corrected Product Direction

- ERP source of truth: yes
- XLS input contract: yes
- CN_SALES role: web upload validation, aggregate preview, dry-run comparison, current-view sync design, dashboards, receivables support, reports, and audit evidence
- update handling: latest ERP XLS value wins; changed rows update current view and create change summary/audit evidence
- removed row handling: missing rows are marked `not_in_latest_xls`; no physical delete
- discount/return/cancellation handling: ERP XLS final values are followed; CN_SALES does not infer business meaning
- physical delete: forbidden

## 4. Permission Model

- part 담당자: assigned part only for upload, preview, dry-run, sync, sales, and receivables
- part lead: assigned managed parts only
- admin: all parts 1, 4, 5, 6, 7, 9, 10, and 11
- admin all-part upload: allowed by design
- cross-part block: required for reps and part leads
- admin still blocked from: raw row unrestricted output, PII/secret output, physical delete, unbounded full sync, production mode `dryRun=false`, and unauthorized rollback

## 5. Web Flow

- preview: XLS upload to aggregate preview; no DB write
- dry-run: compare latest XLS preview to current view; no DB write
- sync-scope: later approved part + period current-view refresh; history and audit preserved
- audit: batch, row snapshot, change summary, and actor audit log
- closure: read-only aggregate confirmation after a sync scope is completed

## 6. Data Model

- import batches: `sales_import_batches` stores upload unit, actor, scope, hash, aggregate counts, status, and timestamp
- import rows: `sales_import_rows` stores XLS row snapshots by batch with hashes and excluded reason
- current records: `sales_current_records` stores latest queryable view with active, changed, not-in-latest, or excluded status
- change summary: `sales_import_change_summaries` stores inserted, updated, removed, no-change, amount before/after, and delta
- audit logs: `sales_change_audit_logs` stores actor, role, part, action, target, before/after hashes, reason, and timestamp

## 7. Safety

- raw row: forbidden in preview, dry-run, report, and audit responses
- PII: forbidden unless later permission-scoped and masked views explicitly allow it
- secret/env: forbidden
- production POST: forbidden in this stage
- migration/seed/storage: forbidden in this stage
- physical delete: forbidden by design
- approval: any later write or rollback needs a separate explicit approval gate
- sealed stage rerun: G/H/I/J/K/N existing apply and closure stages remain sealed
- unrelated untracked: `docs/adsense/` remains out of scope

## 8. Future Stage Plan

- W-1: preview UI/API, aggregate-only, no DB write
- W-2: dry-run UI/API, aggregate insert/update/removed/no-change/amount delta, no DB write
- W-3: role-scope enforcement and permission tests
- W-4: explicit approval-gated sync-scope implementation with history/audit and no physical delete
- W-5: dashboards, weekly/monthly reports, receivables connection, admin import audit

## 9. Validation

- lint: PASS (`npm run lint`)
- test: PASS (`npm run test`, 28 files / 281 tests)
- test:worker: PASS (`npm run test:worker`)
- build: PASS (`npm run build`)
- diff-check: PASS (`git diff --check`)
- safety scans: PASS

## 10. Final Decision

- W-0 design ready: yes
- sync allowed now: no
- next phase: W-1 preview UI/API
- approval needed: yes, before any implementation phase that can write DB state
