# CN_SALES Metabase Safe Reporting Views Requirements

## 1. Final Status

FINAL_STATUS = DOCS_ONLY_METABASE_REQUIREMENTS_READY

This document defines requirements for future Metabase-safe reporting views and read-only access. It does not execute SQL, create database objects, create roles, change privileges, connect Metabase, add credentials, or change runtime code.

## 2. Current Data Context

CN_SALES currently has a human-operated XLS upload flow with preview, operator confirmation, limited apply controls, and report evidence. Metabase should consume only curated summaries after a separate approval step defines and applies safe reporting objects.

Current relevant domains:

| Domain | Current source candidates | Reporting posture |
| --- | --- | --- |
| Upload and apply health | upload/import batch evidence, apply result reports | aggregate-only |
| Ledger and sales summary | normalized ledger and sales import tables | summary-only |
| Part operations | sales part, target, and daily performance tables | part/date summary |
| Customer sales | customer-linked import summaries | masked or normalized identifier only |
| Product sales | product-linked import summaries | product summary only |
| Sync and diff evidence | dry-run/apply result evidence | operator/audit summary |

No base table exposure is approved by this document.

## 3. Dashboard Goals

1. Give operators a safe read-only overview of upload and apply health.
2. Show daily and monthly sales progress without exposing source ledger rows.
3. Track part-level operational performance and follow-up needs.
4. Summarize customer and product sales using masked or normalized identifiers.
5. Preserve auditability for dry-run, limited apply, and read-back checks.
6. Keep all Metabase access behind a future read-only database user with least privilege.

## 4. Required Safe Reporting Views

The following are candidate reporting objects for a later SQL draft. They are names and requirements only.

1. `reporting_upload_batches_safe`
2. `reporting_ledger_summary_daily_safe`
3. `reporting_part_sales_daily_safe`
4. `reporting_customer_sales_summary_safe`
5. `reporting_product_sales_summary_safe`
6. `reporting_sync_diff_summary_safe`
7. `reporting_apply_audit_safe`

All objects should live in a dedicated reporting boundary or use a clearly named safe prefix. The exact schema, ownership model, and access policy require separate approval before any SQL is written or applied.

## 5. View-by-View Field Policy

### reporting_upload_batches_safe

| Requirement | Policy |
| --- | --- |
| Purpose | Monitor upload preview and apply batches. |
| Source table candidates | Upload batch evidence, preview result evidence, apply result evidence. |
| Allowed columns | batch identifier, part code, file type, status, row counts, accepted count, rejected count, warning count, created date, applied date. |
| Excluded columns | file path, original filename when sensitive, source payload, local path, parser diagnostics, full operator session payload. |
| Aggregation basis | batch-level summary. |
| Metabase use | Upload Health Dashboard. |
| PII risk | low if identifiers and filenames are sanitized. |
| Raw row risk | blocked. |
| Required filters | date range, part code, status. |

### reporting_ledger_summary_daily_safe

| Requirement | Policy |
| --- | --- |
| Purpose | Show daily ledger totals after approved apply. |
| Source table candidates | Normalized sales, receipts, receivables, and daily summary tables. |
| Allowed columns | business date, part code, sales amount, receipt amount, receivable balance summary, accepted row count, rejected row count. |
| Excluded columns | source row payload, memo text, customer contact fields, local import metadata. |
| Aggregation basis | day and part. |
| Metabase use | Sales flow and monthly close dashboards. |
| PII risk | low if grouped by date and part only. |
| Raw row risk | blocked. |
| Required filters | date range, part code. |

### reporting_part_sales_daily_safe

| Requirement | Policy |
| --- | --- |
| Purpose | Compare part-level daily sales and targets. |
| Source table candidates | Sales transactions, sales parts, monthly targets. |
| Allowed columns | business date, part code, part name, sales total, receipt total, target sales, target receipt, progress ratio, required daily pace. |
| Excluded columns | customer row detail, product row detail, operator notes. |
| Aggregation basis | day and part. |
| Metabase use | Part Sales Daily Dashboard. |
| PII risk | low. |
| Raw row risk | blocked. |
| Required filters | month, date range, part code. |

### reporting_customer_sales_summary_safe

| Requirement | Policy |
| --- | --- |
| Purpose | Show customer sales trends without exposing customer private details. |
| Source table candidates | Customer summary, customer aliases, sales summaries, receivable summaries. |
| Allowed columns | masked customer identifier, normalized display label when approved for internal admin use, part code, sales amount, receipt amount, order count, last transaction date, status flags. |
| Excluded columns | phone, address, registration number, contact person, full profile, memo text, original row payload, account details. |
| Aggregation basis | customer summary and period. |
| Metabase use | Customer Sales Summary Dashboard. |
| PII risk | medium; require masking by default. |
| Raw row risk | blocked. |
| Required filters | period, part code, masked customer identifier, status flag. |

### reporting_product_sales_summary_safe

| Requirement | Policy |
| --- | --- |
| Purpose | Summarize product sales and quantity movement. |
| Source table candidates | Product summary, product aliases, product usage, sales summaries. |
| Allowed columns | product code or masked product identifier, normalized product label when approved, part code, quantity, sales amount, average unit price, last sale date, customer count. |
| Excluded columns | source row payload, supplier-sensitive terms, purchase-side private terms unless separately approved. |
| Aggregation basis | product summary and period. |
| Metabase use | Product Sales Summary Dashboard. |
| PII risk | low to medium depending on product/customer pairing granularity. |
| Raw row risk | blocked. |
| Required filters | period, part code, product group, status flag. |

### reporting_sync_diff_summary_safe

| Requirement | Policy |
| --- | --- |
| Purpose | Track dry-run and sync diff outcomes before operator apply. |
| Source table candidates | Diff evidence reports, preview result summaries, apply result summaries. |
| Allowed columns | run identifier, target part, row cap, candidate counts, no-change count, blocked reason, created date, operator role label. |
| Excluded columns | raw diff payload, row-level customer data, source workbook row contents, local file path. |
| Aggregation basis | run-level summary. |
| Metabase use | Sync Audit Dashboard. |
| PII risk | low if row-level details are excluded. |
| Raw row risk | blocked. |
| Required filters | run date, part code, status, blocked reason. |

### reporting_apply_audit_safe

| Requirement | Policy |
| --- | --- |
| Purpose | Provide audit evidence for limited apply operations. |
| Source table candidates | Apply batch evidence, read-back result evidence, operator confirmation metadata. |
| Allowed columns | apply identifier, import batch identifier, target part, row cap, allowed operation type, applied counts, read-back count, status, created date, operator role label. |
| Excluded columns | operator session token, raw response body, original file contents, source row payload, local approval file content. |
| Aggregation basis | apply operation summary. |
| Metabase use | Upload Health and Sync Audit dashboards. |
| PII risk | low if operator identity is role-labeled or masked. |
| Raw row risk | blocked. |
| Required filters | date range, part code, status, operation type. |

## 6. PII / Raw Row Exclusion Policy

Default exclusions:

- phone numbers
- addresses
- personal registration numbers
- business registration numbers
- account numbers
- source row payloads
- raw row JSON payload fields
- raw row arrays
- original worksheet row dumps
- local file paths
- diagnostic traces
- parser internals
- sensitive configuration values
- service keys
- full customer profiles
- free-text memo content

Customer and product labels should use the following policy:

| Audience | Identifier policy |
| --- | --- |
| Internal admin dashboard | masked or normalized display label may be allowed after approval. |
| Executive dashboard | masked identifier or alias only. |
| External or customer-facing dashboard | hashed or non-identifying alias only. |

If a dashboard cannot meet this policy, it should not be connected to Metabase.

## 7. Read-only Role Requirements

Future Metabase access requires a dedicated database identity designed only for reporting.

Requirements:

- The identity may read only approved safe reporting objects.
- Direct base table access must be blocked.
- Write privileges must be blocked.
- Schema migration privileges must be blocked.
- Storage privileges must be blocked.
- Service role credentials must not be used.
- Connection credentials must not be created or printed in this stage.
- Credential storage and rotation must be designed before any real Metabase connection.

The role design requires a separate approval package before SQL drafting or execution.

## 8. Metabase Connection Requirements

Future connection requirements:

- Use a dedicated read-only database identity.
- Connect only to the approved reporting boundary.
- Disable unrestricted native query access unless separately approved.
- Disable access to base schemas that contain operational tables.
- Enforce dashboard-level filters for date range and part code.
- Avoid dashboard cards that expose row-level customer data.
- Document owners for dashboard changes and data access review.

This document does not create a Metabase connection.

## 9. Dashboard Drafts

### 1. Upload Health Dashboard

Purpose:

- Track successful, failed, blocked, and warning-bearing upload batches.
- Show accepted and rejected row counts.
- Show read-back status after apply.

Cards:

- Upload batches by status.
- Accepted vs rejected rows by day.
- Warning count trend.
- Apply read-back pass rate.

### 2. Part Sales Daily Dashboard

Purpose:

- Compare daily part-level sales and receipt performance.
- Show month-to-date progress against targets.
- Highlight parts that need follow-up.

Cards:

- Part/date sales total.
- Part/date receipt total.
- Target progress.
- Required daily pace for remaining business days.

### 3. Customer Sales Summary Dashboard

Purpose:

- Summarize customer-level sales without private details.
- Show order count and last transaction date using masked identifiers.
- Identify follow-up candidates through aggregate status flags.

Cards:

- Sales by masked customer identifier.
- Order count by period.
- Last transaction date bands.
- Follow-up status summary.

### 4. Product Sales Summary Dashboard

Purpose:

- Summarize product movement and amount trends.
- Compare quantity, amount, and average unit price.
- Track product group performance.

Cards:

- Sales amount by product group.
- Quantity movement by period.
- Average unit price trend.
- Customer count by product group.

### 5. Sync Audit Dashboard

Purpose:

- Track dry-run, limited apply, read-back, and blocked operation outcomes.
- Show row cap adherence and allowed operation boundaries.
- Give operators a concise audit trail.

Cards:

- Diff candidate counts by run.
- Row cap usage.
- Apply status by run.
- Blocked reason summary.

## 10. Security Guardrails

- Use aggregate and summary data by default.
- Block source row payloads.
- Block customer contact and registration fields.
- Block free-text memo fields unless sanitized and separately approved.
- Use masked identifiers when customer or product grouping is required.
- Require date and part filters on operational dashboards.
- Keep Metabase access separate from application service credentials.
- Require review before any dashboard is shared outside internal operators.
- Keep data retention and dashboard export controls in the next approval package.

## 11. Blocked Operations

This stage explicitly does not run or approve the following operations:

```text
CREATE VIEW
CREATE ROLE
GRANT
REVOKE
ALTER TABLE
INSERT
UPDATE
DELETE
SELECT *
```

These strings are listed only as blocked operations for reviewer clarity. They are not executable SQL and must not be copied into a database console.

## 12. Validation Plan

Before this requirements document is merged:

- Confirm changed files contain this report only.
- Run lint, tests, worker tests, and build.
- Run whitespace validation.
- Scan for sensitive configuration values.
- Scan for raw row and PII markers.
- Confirm any blocked SQL terms appear only in the Blocked Operations section.
- Confirm no XLS/XLSX files are staged or committed.
- Confirm no local approval files are staged or committed.

Future SQL draft validation, still not approved in this stage:

- Verify every object is safe-prefixed or otherwise isolated.
- Verify only approved summary columns are included.
- Verify base tables are not exposed to Metabase.
- Verify read-only identity has no write or schema-change privilege.
- Verify dashboard cards use aggregate-level data by default.

## 13. Next Gate

Next gate: prepare a docs-only SQL draft proposal for the safe reporting objects and read-only access model.

Still forbidden until separately approved:

- SQL execution
- database object creation
- privilege change
- migration apply
- Metabase connection
- credential creation or output
- production POST
- manual deploy or redeploy
