# CN_SALES STAGE G-6 Limited DB Apply Approval Gate Result

## 1. Final Status

FINAL_STATUS = TARGET_TABLE_BLOCKED_NEEDS_SCHEMA_CONFIRMATION

Reason:

- PR #20 is merged into `main` and G-5 row classification is available.
- The selected XLS file exists and a SHA-256 fingerprint was captured without recording file contents.
- The current confirm repository path is not a single-table limited apply path.
- A max-rows 3 approval package with exactly one target table would be misleading because the current confirm implementation can affect multiple `cn_sales` tables.
- No approval JSON file was created.

## 2. Baseline

| Item | Result |
| --- | --- |
| Repository | `mizzang0305-oss/CN_SALES` |
| Branch at start | `main` |
| Main HEAD | `dc71cae` |
| PR #20 | `MERGED` |
| Worktree before report | clean |

## 3. Source File Evidence

| Item | Result |
| --- | --- |
| File name | `11파트 1~6일 매출현황.XLS` |
| File exists | YES |
| SHA-256 | `37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0` |
| Full local path recorded | NO |
| File contents recorded | NO |

## 4. Preview Evidence Used

Previously recorded sanitized preview summary:

| Metric | Value |
| --- | ---: |
| total_rows | 2394 |
| normal_rows | 2119 |
| excluded_rows | 275 |
| warning_rows | 0 |
| error_rows | 0 |
| amount_total | 716970702 |
| target_part | `11` |
| max_rows_requested | 3 |

## 5. Target Table Verification

The current apply candidate is source-inferred from the confirm repository path:

- `src/lib/import/supabase-repository.ts`
- `src/app/api/uploads/confirm/route.ts`
- `docs/STAGE_F3_LIMITED_DB_APPLY_PLAN.md`
- `reports/STAGE_F2E_LIVE_METADATA_EVIDENCE.md`
- `reports/STAGE_G5_ERROR_ROW_CLASSIFICATION_RESULT.md`

The canonical ledger row table is a clear candidate:

- `cn_sales.ledger_rows`

However, the current confirm repository implementation can also affect these tables during a real apply path:

| Table | Evidence | Role |
| --- | --- | --- |
| `cn_sales.sales_parts` | `upsertSalesPart` | master part upsert |
| `cn_sales.customers` | `upsertCustomer` | master customer upsert |
| `cn_sales.customer_aliases` | `upsertCustomer` | customer alias upsert |
| `cn_sales.products` | `upsertProduct` | master product upsert |
| `cn_sales.product_aliases` | `upsertProduct` | product alias upsert |
| `cn_sales.ledger_rows` | `confirmPreview` | canonical ledger row insert or content update |
| `cn_sales.ledger_row_versions` | `confirmPreview` | changed-row version record |
| `cn_sales.customer_product_usage` | `upsertCustomerProductUsage` | product usage summary upsert |
| `cn_sales.sales_transactions` | `insertNormalized` and replacement helper | derived sales fact |
| `cn_sales.receipt_transactions` | `insertNormalized` and replacement helper | derived receipt fact |
| `cn_sales.ar_snapshots` | `insertNormalized` and replacement helper | derived receivable snapshot |
| `cn_sales.product_price_history` | `insertNormalized` and replacement helper | derived price history |
| `cn_sales.ledger_uploads` | `confirmPreview` | import batch status update |

Conclusion:

- A single target table approval is not safe with the current code path.
- `target_tables` cannot truthfully be limited to only `cn_sales.ledger_rows` unless the implementation gains a restricted limited-apply mode or the operator approves the full multi-table boundary.

## 6. No-Write Boundary

These are not approved for G-6:

- Any `public.*` table or view
- Any `cn_wms_dev.*` object
- Existing ERP reference tables
- Storage buckets or objects
- Auth, environment, payment, webhook, or deployment settings
- Migration or seed files
- Any `.local-approval/**` file
- The XLS source file

## 7. Approval Package

| Item | Result |
| --- | --- |
| Local approval input file created | NO |
| Local approval file created | NO |
| Reason | Current apply target is multi-table, but the requested approval package requires one target table. |
| Approval file committed | NO |
| XLS file committed | NO |

Required before a limited DB apply approval package:

- Confirm whether G-6 should approve the complete multi-table boundary, or
- Add a code-level restricted limited-apply path that affects one explicit table only, or
- Provide operator-approved schema evidence and rollback ownership for every affected table.

## 8. Safety Scan Summary

| Check | Result |
| --- | --- |
| DB write | NO |
| `dryRun=false` confirm call | NO |
| production POST | NO |
| migration apply | NO |
| seed apply | NO |
| storage write | NO |
| Vercel deploy or redeploy | NO |
| raw source row content recorded | NO |
| file content recorded | NO |
| `.local-approval/**` committed | NO |
| XLS committed | NO |

## 9. Next Gate

Recommended next status:

TARGET_TABLE_BLOCKED_NEEDS_SCHEMA_CONFIRMATION

Next safe action:

Decide whether the limited apply test should approve the full confirm write boundary listed above or whether the application needs a separate one-table limited-apply path before any approval package is created.
