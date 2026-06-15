# CN_SALES Metabase Safe Reporting Views SQL Review Result

## 1. Final Status

SQL_REVIEW_BLOCKED_SCHEMA_EVIDENCE

The SQL draft is safe to keep as documentation, but it is not ready for execution approval. It passes the document-level safety review for no source payload exposure, no wildcard select, no data-changing statement, and explicit not-executed markings. Actual execution remains blocked until live schema metadata, JSON key evidence, function availability, and role privilege evidence are collected and reviewed.

## 2. PR #32 Merge

| Item | Result |
| --- | --- |
| PR | https://github.com/mizzang0305-oss/CN_SALES/pull/32 |
| Merged | YES |
| Merge commit | 9f2c66122a440fc94e7b17a572d1a1c1b63b25c8 |
| Change type | docs-only SQL draft |
| SQL executed | NO |
| DB write | NO |
| Production deployment | observed success |
| Manual deploy | NO |

## 3. SQL Draft Scope

Reviewed file:

- `reports/METABASE_SAFE_REPORTING_VIEWS_SQL_DRAFT.md`

The draft contains:

- 7 safe reporting view candidates
- 5 dashboard mappings
- a read-only role draft
- explicit `SQL_DRAFT_ONLY_NOT_EXECUTED` status
- repeated `DO NOT EXECUTE` markers in fenced SQL blocks
- validation and next-gate requirements

The draft does not itself alter application code, migrations, seed files, storage settings, environment files, or Metabase settings.

## 4. View Review

| View | Review result |
| --- | --- |
| `reporting_upload_batches_safe` | Safety intent PASS; summary JSON key evidence required before execution. |
| `reporting_ledger_summary_daily_safe` | Aggregate-only PASS; row payload columns excluded. |
| `reporting_part_sales_daily_safe` | Aggregate-only PASS; customer-level columns excluded. |
| `reporting_customer_sales_summary_safe` | Masked identifier intent PASS; masking function availability evidence required. |
| `reporting_product_sales_summary_safe` | Product aggregate intent PASS; masking function availability evidence required. |
| `reporting_sync_diff_summary_safe` | Summary-only intent PASS; summary JSON key evidence required. |
| `reporting_apply_audit_safe` | Audit intent PASS; status value and summary JSON key evidence required. |

## 5. PII / Raw Row Review

| Check | Result |
| --- | --- |
| Wildcard select | Absent |
| Source payload exposure | Absent in allowed field lists |
| Customer contact fields | Excluded |
| Address fields | Excluded |
| Registration/account fields | Excluded |
| Memo/free-text payload | Excluded |
| Local file path exposure | Excluded |
| Diagnostic trace exposure | Excluded |

The draft uses aggregate values and masked identifiers for customer/product summaries. It should not be expanded with row-level dimensions without a new review.

## 6. Read-only Role Review

| Check | Result |
| --- | --- |
| Dedicated Metabase role concept | Included |
| Base table direct access | Not granted in draft |
| Write permission | Not granted in draft |
| Migration/schema ownership | Not granted in draft |
| Storage access | Not granted in draft |
| Service role use | Not used |
| Credential generation | Not performed |

Before any future execution, the role draft must be expanded into a full least-privilege approval package. That package must include credential handling, rotation, base-table privilege audit, default privilege audit, and rollback steps.

## 7. Dashboard Mapping Review

| Dashboard | Review result |
| --- | --- |
| Upload Health Dashboard | Mapped to upload, diff, and apply audit summaries. |
| Part Sales Daily Dashboard | Mapped to part sales and ledger daily summaries. |
| Customer Sales Summary Dashboard | Mapped to masked customer summary only. |
| Product Sales Summary Dashboard | Mapped to product aggregate summary only. |
| Sync Audit Dashboard | Mapped to diff and apply audit summaries. |

Dashboard mapping is adequate for a draft. Real Metabase setup is still not approved.

## 8. Execution Risk Review

Execution is blocked until the following evidence exists:

1. Live schema metadata confirms every referenced table and column.
2. Live enum metadata confirms every status value used by the draft.
3. Summary JSON key evidence confirms the fields used in upload, diff, and apply summaries.
4. Masking function availability is confirmed or replaced with an approved alternative.
5. Target Postgres version and view security behavior are confirmed.
6. Metabase reporting schema boundary is approved.
7. Role default privileges and inherited privileges are audited.
8. Rollback SQL and ownership plan are documented.

Known draft issue from local migration evidence:

- `cn_sales.upload_status` currently defines `preview`, `committed`, `cancelled`, and `failed`. The draft audit view references an additional `rejected` status value. This must be removed or reconciled before execution approval.

## 9. Required Fixes Before SQL Execution

- Replace or verify any status value not present in the live enum.
- Confirm every JSON key used in `summary_json` expressions.
- Confirm masking function availability and schema qualification.
- Decide whether the reporting boundary should be `metabase_reporting` or another approved schema.
- Add explicit owner, rollback, and privilege audit steps.
- Confirm whether views should be exposed through Supabase Data API or only through direct database access for Metabase.
- Confirm RLS and grant design for any exposed reporting object.
- Add a non-production validation plan before production execution.

## 10. Safety

| Safety item | Result |
| --- | --- |
| SQL execution | NO |
| DB write | NO |
| Migration apply | NO |
| View creation | NO |
| Role creation | NO |
| Privilege change | NO |
| Metabase connection | NO |
| Credential/env change | NO |
| Production POST | NO |
| Manual deploy | NO |
| Raw customer data output | NO |
| Sensitive configuration output | NO |

## 11. Next Gate

Next gate: schema evidence package or SQL approval package.

Recommended next step:

- Create a read-only metadata evidence report that confirms table columns, enum values, JSON key availability, extension/function availability, current grants, RLS status, and target Postgres version.

Still forbidden until separately approved:

- SQL execution
- DB object creation
- role creation
- privilege changes
- migration apply
- Metabase connection
- credential creation or output
- production POST
