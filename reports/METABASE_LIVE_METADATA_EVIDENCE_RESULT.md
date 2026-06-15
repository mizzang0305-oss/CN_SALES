# CN_SALES Metabase Live Metadata Evidence Result

## 1. Final Status

- FINAL_STATUS: LIVE_METADATA_BLOCKED_NO_ACCESS
- Decision: live metadata collection is blocked because the available Supabase MCP project list does not include the local CN_SALES target.
- SQL executed: NO
- DB read query executed: NO
- Data row read: NO
- DB write: NO
- View or role creation: NO
- Grant or revoke execution: NO
- Metabase connection: NO

This report records the blocked live metadata gate after PR #34 was merged. It intentionally contains no customer data, raw ledger payloads, credentials, or environment values.

## 2. PR #34 Merge

- PR: #34
- Final state: MERGED
- Merge commit: `abb1b45`
- Merge method: squash
- Side effects: GitHub merge-triggered Vercel Production auto deployment only
- Manual deploy: NO
- Production smoke: HEAD requests only
- Production result: auth-gated responses without 5xx

## 3. Metadata Evidence Scope

Intended live metadata scope:

- table existence
- column names
- column data types
- enum values
- metadata-only alignment for reporting view drafts

Allowed metadata sources for the next attempt:

- `information_schema.tables`
- `information_schema.columns`
- `pg_type`
- `pg_enum`
- `pg_namespace`
- `pg_class`

Blocked in this attempt:

- Supabase MCP did not expose the local CN_SALES target.
- Local environment target was present and internally consistent, but its value is not recorded here.
- No fallback SQL channel was used because credential and connection-string output are prohibited.

## 4. Tables Evidence

Live table evidence was not collected.

Planned tables for the next approved metadata-only attempt:

- `ledger_uploads`
- `ledger_rows`
- `sales_transactions`
- `receipt_transactions`
- `ar_snapshots`
- `product_price_history`
- `sales_parts`
- `customers`
- `customer_aliases`
- `products`
- `product_aliases`
- `customer_product_usage`

Existing repo-local evidence remains available in:

- `supabase/migrations/0001_initial_mvp.sql`
- `reports/METABASE_SCHEMA_EVIDENCE_AND_SQL_CORRECTION.md`

## 5. Columns Evidence

Live column evidence was not collected.

The next metadata-only run must verify:

- every table referenced by the safe reporting draft exists
- every referenced column exists
- column types match aggregate/reporting expressions
- raw payload columns are excluded from reporting view drafts
- PII candidate columns are excluded from reporting view drafts

## 6. Enum Evidence

Live enum evidence was not collected.

Repo-local evidence still indicates:

- `preview`
- `committed`
- `cancelled`
- `failed`

`rejected` remains blocked as a persisted upload status until live enum metadata proves otherwise. It may only be treated as an application-level rejected row or confirm-result concept.

## 7. SQL Draft Alignment

SQL approval is not ready.

Known repo-local correction:

- Use valid persisted upload statuses only.
- Do not use `rejected` as a `ledger_uploads.status` value.
- Keep rejected row counts as summary metrics rather than upload status filters.

Live alignment still needed:

- table metadata
- column metadata
- enum metadata
- JSON summary key evidence
- masking or hashing function availability
- RLS and grant evidence
- rollback procedure for any future view or role SQL

## 8. PII / Raw Row Risk Evidence

Live PII and raw-payload metadata evidence was not collected.

The future SQL approval package must prove:

- customer names are excluded or masked
- contact details are excluded
- business identifiers are excluded
- raw ledger payload columns are excluded
- product and customer identifiers are safe for aggregated dashboards

No actual row values are allowed in that package.

## 9. Blockers Before SQL Approval

- Live metadata access is unavailable from the current Supabase MCP project set.
- Live table and column evidence is missing.
- Live enum evidence is missing.
- Live grant and RLS evidence is missing.
- Metabase read-only role design is not approved.
- No future view or role SQL can be executed yet.

## 10. Safety

- DB write: NO
- DB read of data rows: NO
- SQL object creation: NO
- migration apply: NO
- seed apply: NO
- storage write: NO
- view creation: NO
- role creation: NO
- grant or revoke: NO
- Metabase connection: NO
- credential or env output: NO
- production POST: NO
- customer data output: NO
- raw ledger row output: NO

## 11. Next Gate

Next gate is access reconciliation for metadata-only Supabase evidence.

Required before retry:

- confirm the target Supabase project is available through the approved query channel
- run metadata-only queries without data-row access
- record table names, column names, data types, and enum values only
- keep SQL approval blocked until live evidence is complete

SQL execution for views, roles, grants, or Metabase connection remains prohibited until separately approved.
