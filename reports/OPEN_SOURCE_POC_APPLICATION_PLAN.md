# CN Sales Open Source PoC Application Plan

## 1. Current Architecture Summary

This review is plan-only. No code was changed beyond this report file, no database mutation was executed, no migration or seed was applied, and no deployment was triggered.

Current upload/import architecture:

- Upload UI: `src/components/uploads/upload-center.tsx`
- Preview route: `src/app/api/uploads/preview/route.ts`
- Confirm route: `src/app/api/uploads/confirm/route.ts`
- Import orchestration: `src/lib/import/import-service.ts`
- Runtime wiring: `src/lib/import/service-factory.ts`
- Supabase repository: `src/lib/import/supabase-repository.ts`
- Sync and limited apply helpers: `src/lib/import/sync-diff.ts`, `src/lib/import/sync-existing-reader.ts`, `src/lib/import/limited-apply.ts`
- Safety coverage: `tests/upload-preview-static.test.ts`, `tests/upload-preview-safety.test.ts`, `tests/limited-apply.test.ts`, `tests/service-role-static.test.ts`
- Operational evidence: `reports/STAGE_G*.md`, `reports/STAGE_F*.md`

Current boundaries:

| Area | Current behavior | PoC implication |
| --- | --- | --- |
| Preview | Node runtime, preview-only service, safe summary response, no normalized table write | External tools should consume only summary/reporting views or safe aggregates. |
| Confirm dry-run | Re-parses server-side, verifies hashes/checksums, returns sync diff and safe counts | Workflow/background tools can orchestrate dry-run review before any apply. |
| Limited apply | Localhost-only, approval-gated stages with row caps, insert-only limited path | Any automation PoC must keep apply behind explicit operator approval. |
| Dashboard data | `getDashboardTotals()` reads selected aggregate columns from `cn_sales` | Metabase or review UI can start with read-only dashboards. |
| Sensitive data | Client response and reports intentionally avoid source row payloads and sensitive config | PoCs must not expose source workbook rows, detailed customer text, or sensitive config. |

External references reviewed:

- Metabase database connection and dashboard docs: https://www.metabase.com/docs/latest/databases/connecting
- Windmill workflow/internal tool docs: https://www.windmill.dev/docs/intro
- Trigger.dev background job docs: https://trigger.dev/docs/introduction
- NocoDB external data source docs: https://nocodb.com/docs/product-docs/data-sources/connect-to-data-source
- Directus existing database overview: https://directus.io/features/existing-database
- Lago usage metering docs: https://getlago.com/docs/guide/introduction/welcome-to-lago
- Supabase changelog/API exposure context: https://supabase.com/changelog

## 2. Metabase Read-only Dashboard PoC

| Item | Plan |
| --- | --- |
| Purpose | Validate an external read-only BI layer for upload history, apply counts, part-level sales/receipt/AR summaries, and limited-apply progress. |
| Current code touchpoints | `SupabaseImportRepository.getDashboardTotals()`, `reports/STAGE_G6*.md`, `cn_sales.ledger_uploads`, `cn_sales.ledger_rows`, normalized reporting tables. |
| Required tables/data | `ledger_uploads`, `ledger_rows`, `sales_transactions`, `receipt_transactions`, `ar_snapshots`, `sales_parts`; optional future safe views. |
| DB write 여부 | Target PoC should be read-only. Use a dedicated read-only database role or a safe reporting replica/view layer. |
| 개인정보 위험 | Medium if direct ledger/customer/product columns are exposed. Low if only aggregate views are exposed. |
| Expected files | Docs only first: `docs/metabase-readonly-poc.md`; later optional reporting view migration only after approval. |
| Test plan | Verify dashboard cards use selected columns and aggregate counts only; verify no workbook source rows or sensitive text in dashboards; verify read-only credentials cannot mutate data. |
| Rollback plan | Remove Metabase database connection; revoke read-only role; remove optional reporting views if later created. |
| Difficulty | Low for aggregate dashboards; medium if safe views need schema work. |
| Expected KPI | Operator can see upload/apply status, applied row counts, rejected counts, and part-level revenue/receipt trends without entering the app. |
| PR split | PR M1 docs-only plan; PR M2 read-only role/view design; PR M3 dashboard export/config handoff. |

Recommendation:

- Start here first.
- Do not connect Metabase to service-level credentials.
- Prefer safe reporting views that exclude source row payloads and direct customer-sensitive columns.
- Keep public ERP tables read-only reference only.

## 3. Windmill Approval Workflow PoC

| Item | Plan |
| --- | --- |
| Purpose | Model a human approval workflow around preview evidence, dry-run evidence, row cap, rollback owner, and final apply approval. |
| Current code touchpoints | `src/app/api/uploads/confirm/route.ts`, `src/lib/import/limited-apply.ts`, `.local-approval` convention, `reports/STAGE_F3*.md`, `reports/STAGE_G6*.md`. |
| Required tables/data | Prefer report files and safe API summaries first; no direct database mutation in PoC. |
| DB write 여부 | No DB write in first PoC. A later phase could trigger only dry-run via localhost or internal API after explicit approval. |
| 개인정보 위험 | Medium if workflow stores workbook names, operator names, or raw request bodies. Keep only hashes, counts, stage, part, dates, and approval status. |
| Expected files | `docs/windmill-approval-poc.md`; optional workflow JSON/YAML stored outside production deploy until approved. |
| Test plan | Feed sanitized G-6D/G-6E report summaries into a mock workflow; verify missing approval fields block progression; verify no source row payload is stored. |
| Rollback plan | Disable Windmill workspace/workflow; remove webhook/trigger config; keep app unaffected. |
| Difficulty | Medium. Workflow modeling is simple, but production trigger/auth boundaries need careful review. |
| Expected KPI | Reduce operator mistakes by making approval gates explicit and auditable before larger applies. |
| PR split | PR W1 workflow design doc; PR W2 local mock workflow; PR W3 optional internal trigger endpoint gated by auth and disabled by default. |

Recommendation:

- Good fit for approval orchestration.
- Do not allow Windmill to call production confirm/apply in the first PoC.
- Keep any webhook disabled until a separate auth and replay-protection review is complete.

## 4. Trigger.dev Background Job PoC

| Item | Plan |
| --- | --- |
| Purpose | Evaluate durable background processing for parse/preview, dry-run diff, post-apply verification, and long-running report generation. |
| Current code touchpoints | `src/lib/import/python-parser.ts`, `src/app/api/uploads/preview/route.ts`, `src/app/api/uploads/confirm/route.ts`, `src/lib/import/sync-diff.ts`, `reports/STAGE_G*.md`. |
| Required tables/data | Initially none beyond file hash and aggregate report inputs. Later possible `ledger_uploads` job status integration only after design approval. |
| DB write 여부 | No DB write in PoC. Background job should be dry-run/report-only. |
| 개인정보 위험 | Medium to high if job payload includes workbook files or source rows. Keep payloads to object references, hashes, stage, and safe counts. |
| Expected files | `docs/trigger-background-job-poc.md`; optional local-only prototype under a separate branch later. |
| Test plan | Simulate job input with G-6E aggregate report; verify retries do not call apply; verify idempotency key prevents duplicate job processing; verify job logs omit source row payload. |
| Rollback plan | Disable Trigger project/task; remove scheduled job config; leave upload flow unchanged. |
| Difficulty | Medium. TypeScript integration is natural, but job/runtime credentials and replay safety need review. |
| Expected KPI | Faster operator feedback for large workbook preview and safer post-apply verification jobs. |
| PR split | PR T1 docs-only job design; PR T2 local dry-run task skeleton disabled by default; PR T3 authenticated queue trigger after security review. |

Recommendation:

- Useful after Metabase and Windmill.
- Best initial use is post-apply read-only verification, not DB apply.
- Avoid putting workbook content or source rows in job payloads.

## 5. NocoDB/Directus Review UI PoC

| Item | NocoDB Plan | Directus Plan |
| --- | --- | --- |
| Purpose | Operator review UI for upload batches, row issue summaries, approval status, and safe derived facts. | Same goal with stronger schema introspection/admin UI model. |
| Current code touchpoints | `ledger_uploads` summaries, reports, dashboard totals, potential safe review views. | Same, plus possible richer role/permission mapping. |
| Required tables/data | Prefer safe views over direct base tables. | Prefer safe views or dedicated review schema. |
| DB write 여부 | First PoC read-only only. Editing must be disabled. | First PoC read-only only. Directus should not expose mutation APIs for operational tables. |
| 개인정보 위험 | High if connected to base ledger/customer/product tables. | High if connected directly to base schema/API. |
| Expected files | `docs/nocodb-review-ui-poc.md` | `docs/directus-review-ui-poc.md` |
| Test plan | Connect to a non-production clone or read-only role; verify editing is disabled; verify only safe columns are visible. | Same plus API access disabled or role-restricted. |
| Rollback plan | Remove connection/user; revoke role; remove optional views if created. | Remove instance/project role; revoke role; disable generated APIs if exposed. |
| Difficulty | Medium for read-only UI; high if using generated APIs safely. | Medium/high because Directus can generate APIs over existing schema. |
| Expected KPI | Faster operator review of import batch status and rejected-row categories. | More structured operator UI if role model is needed. |
| PR split | PR R1 compare NocoDB/Directus; PR R2 safe view design; PR R3 one-tool local PoC against read-only role. | Same split; choose one, not both, for implementation. |

Recommendation:

- Use only after a safe review view layer exists.
- NocoDB is likely quicker for spreadsheet-like review.
- Directus is stronger if the long-term need includes custom permissions and generated internal APIs, but it has a larger exposure surface.
- Do not point either tool at raw operational tables with write-capable credentials.

## 6. Lago Usage Metering PoC

| Item | Plan |
| --- | --- |
| Purpose | Evaluate metering of internal usage events: preview run, dry-run run, limited apply run, rows processed, rows applied, and verification runs. |
| Current code touchpoints | `reports/STAGE_G*.md`, confirm route result counts, `ledger_uploads.summary_json`, potential future audit event stream. |
| Required tables/data | New usage event concept only; no current billing table needed for first design. Candidate event fields: event type, stage, safe count, timestamp, actor hash, workspace/company id. |
| DB write 여부 | First PoC should be schema/design only. No Lago API calls and no payment API use. |
| 개인정보 위험 | Low if metering payloads are count-only. High if filenames, customer names, or source row details are sent. |
| Expected files | `docs/lago-usage-metering-poc.md`; optional future `cn_sales.usage_events` migration only after approval. |
| Test plan | Unit-test event builder with synthetic data; verify no source row payload, file path, or sensitive text; verify billing integration is disabled by default. |
| Rollback plan | Disable event emission flag; drop/ignore event table only if separately created in a future migration; remove Lago integration credentials. |
| Difficulty | Medium. Event modeling is straightforward; billing/payment boundary must stay disabled until business approval. |
| Expected KPI | Visibility into operational cost drivers: workbook previews, dry-runs, limited applies, rows processed, and operator workflow volume. |
| PR split | PR L1 docs-only metering schema; PR L2 local event builder with no external call; PR L3 disabled-by-default Lago adapter; PR L4 billing activation only with separate approval. |

Recommendation:

- Keep Lago last.
- It should meter internal platform usage, not charge customers, until business and legal review exists.
- Never send customer-sensitive data or source workbook content as metering properties.

## 7. Security and PII Guardrails

Required for every PoC:

- Use read-only credentials where possible.
- Do not reuse service-level credentials in external tools.
- Do not expose source workbook rows, source payloads, local paths, parser internals, tokens, cookies, or sensitive config.
- Do not expose full customer, phone, email, address, business identifier, or memo text.
- Prefer safe views with aggregated fields.
- Keep `cn_sales` isolated from `public` and `cn_wms_dev`.
- Keep public ERP tables as read-only reference only.
- Keep Production request automation disabled until a separate auth/replay review.
- Treat Supabase Data API exposure settings as an explicit dashboard/security review item before exposing new tables or schemas.

Suggested safe data contract for external tools:

| Field type | Allowed |
| --- | --- |
| Stage/status | yes |
| Part code | yes |
| Date range | yes |
| Row counts | yes |
| Amount totals | yes, aggregate only |
| Import batch id | yes |
| File hash/checksum | yes |
| Operator display label/hash | yes |
| Source row payload | no |
| Customer-sensitive text | no |
| Sensitive config | no |

## 8. DB Write Risk

| PoC | Default write risk | Risk notes |
| --- | --- | --- |
| Metabase | Low if read-only role | Native query access and uploads/actions must be disabled or permission-restricted. |
| Windmill | Medium | Can run scripts/workflows; must not get write credentials or production apply endpoint access initially. |
| Trigger.dev | Medium | Retries can duplicate side effects if idempotency is weak; start report-only. |
| NocoDB | High if connected to base tables | Spreadsheet UI can encourage edits; must use read-only role/safe views. |
| Directus | High if mutation APIs are exposed | Generated APIs over operational tables need strict roles or a separate review schema. |
| Lago | Medium | Billing/metering events can become external side effects; no payment activation in PoC. |

Current code risk observations:

- `createPreviewOnlyImportService()` is the safe preview boundary.
- `createImportService()` can become write-capable only when runtime gates permit it.
- `limitedInsertLedgerRows()` is the current bounded insert-only path.
- `confirmPreview()` still contains broader canonical/master/normalized write logic; do not automate it through external tools without a separate design review.
- Existing tests already enforce important preview and limited-apply safety properties; new PoCs should add static tests for external integration boundaries.

## 9. Implementation Order

Recommended order:

1. Metabase read-only dashboard PoC
2. Windmill approval workflow PoC
3. Trigger.dev background verification job PoC
4. NocoDB or Directus review UI PoC, choose one after safe view design
5. Lago usage metering schema PoC

Rationale:

- Start with read-only visibility before orchestration.
- Add human approval workflow before background automation.
- Use background jobs for verification/reporting before any apply orchestration.
- Add operator review UI only after safe views are defined.
- Keep usage metering last because it can become billing-adjacent.

## 10. PR Split Plan

| PR | Scope | Files | Side effects |
| --- | --- | --- | --- |
| OSS-1 | Metabase read-only dashboard plan | `docs/metabase-readonly-poc.md` | none |
| OSS-2 | Safe reporting view design | `docs/reporting-views-design.md`, tests only | no migration apply |
| OSS-3 | Windmill approval workflow plan | `docs/windmill-approval-poc.md` | none |
| OSS-4 | Trigger.dev report-only job design | `docs/trigger-background-job-poc.md` | none |
| OSS-5 | Review UI tool selection | `docs/operator-review-ui-tool-selection.md` | none |
| OSS-6 | NocoDB/Directus read-only view plan | docs/tests only | no external connection |
| OSS-7 | Lago metering event schema plan | `docs/lago-usage-metering-poc.md` | no billing/API call |
| OSS-8 | Disabled-by-default local adapter skeletons | source/tests behind feature flags | no external call, no DB write |

Every implementation PR must state:

- DB mutation: yes/no
- Production request: yes/no
- External API call: yes/no
- Sensitive config required: yes/no
- Rollback plan
- Tests and static safety scans

## 11. Rollback Plan

General rollback:

- Docs-only PR: revert commit.
- Config-only external PoC: remove external connection/workspace/project and revoke credentials.
- Safe view PR if later approved: revert migration or apply approved down migration.
- Disabled adapter PR: turn feature flag off and revert commit.
- Background job PR: disable task schedule/trigger first, then revert code.
- Review UI PoC: revoke read-only role and remove tool connection.
- Lago PoC: disable event emission flag; do not activate billing/payment flows without separate approval.

Rollback evidence to capture for any future non-doc PoC:

- Affected files
- External tool instance/project id, if any
- Credential scope, without printing values
- Whether DB objects were created
- Whether any external event was sent
- How to disable within five minutes

## 12. Final Recommendation

FINAL_STATUS = PLAN_CREATED_PASS

Recommended path:

1. Approve a docs-only Metabase read-only dashboard PoC.
2. Define safe reporting views before connecting any external UI/BI tool to operational tables.
3. Use Windmill for approval-state orchestration only after Metabase visibility is validated.
4. Use Trigger.dev for post-apply verification jobs only after workflow gates are stable.
5. Choose NocoDB or Directus only after a safe review schema/view layer exists.
6. Keep Lago as design-only until usage events and billing boundaries are approved.

Do not proceed to external tool setup, database roles, migrations, storage work, production requests, or billing API use from this plan alone.
