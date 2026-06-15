# CN Sales Metabase Read-only Dashboard PoC Plan

## 1. FINAL_STATUS Draft

- FINAL_STATUS: `DOCS_ONLY_METABASE_POC_PLAN_READY`
- Scope: docs-only planning
- Code change: NO
- DB write: NO
- Migration/view/role creation: NO
- Production POST: NO
- Deploy/redeploy: NO
- Real Metabase connection: NO
- Credential/env addition: NO

## 2. Purpose

This PoC plans a read-only Metabase dashboard layer for CN_SALES operators.

The goal is to let operators and managers inspect safe operational summaries without using raw workbook rows or direct table editing:

- upload/apply status by period and part
- sales trend and monthly target progress
- receivables and collection follow-up summaries
- claims, quality, and logistics issue summaries
- monthly close status and data correction needs

This stage does not connect Metabase, create credentials, create database views, create database roles, or change application code.

## 3. Safety Boundary

| Boundary | Status |
| --- | --- |
| DB write | NO |
| Migration apply | NO |
| View creation | NO |
| Role/user creation | NO |
| Seed apply | NO |
| Storage write | NO |
| Production POST | NO |
| Deploy/redeploy | NO |
| Env/secret addition | NO |
| External API key creation | NO |
| Real Metabase connection | NO |
| Raw row output | NO |
| PII output | NO |
| Original XLS committed | NO |

Metabase must not receive a write-capable database credential.

Initial PoC must use one of these safe inputs:

1. existing aggregate reports already committed under `reports/`
2. future read-only reporting views after separate approval
3. a non-production sanitized database clone after separate approval

## 4. Dashboard Candidates

### 4.1 Sales Flow Dashboard

Purpose:

- Track sales amount by day/week/month.
- Compare current month cumulative sales against monthly target.
- Show part-level trend and remaining sales requirement.

Candidate widgets:

- monthly cumulative sales
- target achievement rate
- daily sales trend
- part-level sales comparison
- applied import batch count
- excluded/error row trend by batch

Allowed data:

- aggregate sales amount
- date bucket
- part code/name
- upload/apply status
- row counts

Excluded data:

- raw source rows
- customer contact details
- original workbook row payload

### 4.2 Collection and Receivables Dashboard

Purpose:

- Track collection progress, receivable status, and follow-up workload.

Candidate widgets:

- receipt amount by day/week/month
- current receivable balance by part
- collection rate
- promised collection amount by due bucket
- follow-up needed count

Allowed data:

- aggregate receipt amount
- aggregate receivable balance
- due bucket
- follow-up count
- part-level summary

Excluded data:

- phone numbers
- addresses
- account notes
- raw customer text

### 4.3 Claims / Quality / Logistics Issue Dashboard

Purpose:

- Monitor operational issue workload and resolution status.

Candidate widgets:

- issue count by type
- open issue count
- resolved issue count
- average resolution age
- attachment-present count
- quality/logistics recheck needed count

Allowed data:

- issue type
- issue status
- date bucket
- aggregate counts
- part-level count

Excluded data:

- raw claim notes
- media files
- customer-sensitive text
- public URL exposure

### 4.4 Part-level Operations Check Dashboard

Purpose:

- Let operators verify whether each part has recent upload, dry-run, limited apply, and post-apply evidence.

Candidate widgets:

- latest upload/apply by part
- dry-run status by part
- applied rows by batch
- rejected/excluded rows by reason code
- duplicate-key warning count
- data correction needed count

Allowed data:

- part code
- batch id
- status
- counts
- reason codes

Excluded data:

- full file name if it contains sensitive text
- raw row payload
- original workbook content

### 4.5 Monthly Close Dashboard

Purpose:

- Support month-end review and close readiness.

Candidate widgets:

- month-to-date sales
- month-to-date receipts
- month-end receivable balance
- applied batch count
- pending correction count
- unresolved issue count
- close readiness status

Allowed data:

- month bucket
- aggregate amount
- status
- count
- part summary

Excluded data:

- customer-specific drill-down by default
- memo/comment raw text
- raw row details

## 5. Read-only Data Contract

Metabase dashboards must use summary fields only.

Allowed:

- aggregate values
- status values
- month/week/day buckets
- part-level summaries
- batch-level counts
- masked identifiers when drill-down is required
- safe reason codes

Disallowed by default:

- raw workbook row payloads
- source row JSON
- original XLS/XLSX file content
- phone numbers
- email addresses
- addresses
- business identifiers
- customer notes or memo text
- secrets/env values
- service-level credentials

Recommended safe schema for future views:

| View concept | Grain | PII stance |
| --- | --- | --- |
| `metabase_upload_batch_summary` | one row per import batch | no raw filename if sensitive; no raw rows |
| `metabase_part_daily_sales_summary` | one row per part/date | aggregate only |
| `metabase_part_receivable_summary` | one row per part/date bucket | aggregate only |
| `metabase_issue_status_summary` | one row per type/status/date bucket | aggregate only |
| `metabase_monthly_close_summary` | one row per part/month | aggregate only |

No view, role, or SQL is created in this stage.

## 6. Suggested Metabase Collection Structure

```text
CN_SALES
├── Executive Summary
├── Sales Operations
├── Collection & Receivables
├── Claims Quality Logistics
└── Monthly Close
```

### CN_SALES / Executive Summary

- monthly target achievement
- sales and receipt snapshot
- receivable status
- open issue count
- latest import/apply health

### CN_SALES / Sales Operations

- daily/weekly sales flow
- part-level sales trend
- upload/apply evidence by part
- excluded/error row summary

### CN_SALES / Collection & Receivables

- receipt trend
- receivable balance trend
- promised collection buckets
- follow-up needed count

### CN_SALES / Claims Quality Logistics

- issue type count
- open/resolved issue count
- quality recheck needed
- logistics recheck needed
- attachment metadata coverage

### CN_SALES / Monthly Close

- monthly cumulative sales
- monthly cumulative receipts
- close readiness
- pending correction count
- pending upload/apply evidence

## 7. KPI Candidate List

| KPI | Definition Draft | Grain |
| --- | --- | --- |
| Monthly target sales achievement rate | cumulative sales amount / monthly target sales amount | month, part |
| Required daily sales for remaining business days | remaining target amount / remaining business days | month, part |
| Scheduled collection amount | sum of approved collection promise amount by due bucket | week/month, part |
| Receivable follow-up needed count | count of accounts or tasks requiring follow-up, masked by default | day/week, part |
| Claim count by type | count by issue type and status | day/week/month |
| Quality/logistics recheck needed count | count of unresolved quality or logistics recheck items | day/week/month |
| Correction/source replacement needed count | count of batches or rows requiring correction by safe reason code | batch/month |
| Latest upload/apply freshness | days since latest successful upload/apply evidence | part |
| Excluded/error row rate | excluded or error rows / total parsed rows | batch/month |
| Post-apply verification status | PASS/BLOCKED/MISSING by batch | batch |

KPI names must avoid blaming language. Prefer:

- "follow-up needed"
- "recheck needed"
- "correction needed"
- "close readiness"

## 8. Approval Gate

This document does not approve any database or external-tool setup.

Separate approval is required before any of the following:

- creating a DB read-only role
- creating reporting views
- applying migrations
- running SQL in Supabase
- connecting Metabase to any database
- adding env vars or credentials
- exposing a schema to a Data API
- granting permissions
- importing dashboard definitions into a real Metabase instance
- using production data in a non-production tool

Before the next DB-related gate, the operator must approve:

- target database/project
- read-only credential scope
- allowed views/tables
- PII masking policy
- Metabase collection permissions
- rollback/removal procedure

## 9. Validation Checklist

Required for this docs-only PR:

- changed files are `reports/METABASE_READONLY_DASHBOARD_POC_PLAN.md` only
- `git diff --check`
- `npm run lint`
- `npm run test`
- `npm run test:worker`
- `npm run build`
- secret/env scan
- raw row/PII/XLS scan

Suggested scan approach:

- scan for sensitive config keywords and actual values
- scan for raw row payload markers and diagnostic traces
- scan for source workbook artifacts, env files, and local-only approval artifacts

## 10. PR Report Template

```text
CN_SALES Metabase Read-only Dashboard PoC Plan PR

1. FINAL_STATUS
- FINAL_STATUS:
- Reason:

2. changed files
- files:
- report-only:

3. validation
- lint:
- test:
- test:worker:
- build:
- diff-check:

4. safety
- DB write:
- migration/seed/storage:
- production POST:
- deploy:
- secret/env:
- raw row/PII:
- XLS committed:

5. next gate
- recommended:
- approval required:
```

## 11. Next Gate

Recommended next gate:

- Docs-only design for safe reporting views and read-only role requirements.

Still forbidden until separately approved:

- schema changes
- migration apply
- SQL execution
- role/user creation
- Metabase connection
- credential/env changes
- production requests
- dashboard import to a live Metabase instance

## 12. Final Recommendation

Start Metabase with a strict read-only dashboard PoC based on aggregate-only fields.

Do not connect Metabase directly to operational base tables until safe reporting views, read-only credentials, collection permissions, and PII masking rules are reviewed and approved.
