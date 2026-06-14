# CN_SALES STAGE G-6A Multi-Table Sync Diff Plan Result

## 1. Final Status

FINAL_STATUS = SYNC_DIFF_PLAN_BLOCKED_KEY_AMBIGUOUS

Decision reason:

- PR #21 G-6 report-only PR was merged into `main`.
- Multi-table sync boundary is now explicit.
- Actual XLS preview and confirm dry-run were executed locally only.
- DB read-only evidence succeeded with an explicit scoped column list.
- No DB write, delete, production POST, migration, seed, storage write, or deploy command was executed.
- The incoming XLS normal rows produced duplicate schema sync keys, so insert/update/delete planning must remain blocked.

Secondary note:

- The current schema-compatible sync key uses `ledger_rows.identity_hash` and `ledger_rows.content_hash`.
- A future apply gate must resolve the 9 duplicate incoming keys before any limited write can be approved.

## 2. Baseline

| Item | Result |
| --- | --- |
| Repo | `mizzang0305-oss/CN_SALES` |
| PR #20 | merged |
| PR #21 | merged |
| PR #21 merge commit | `4ceba6d` |
| G-6 blocked reason | multi-table confirm boundary |
| Starting main after PR #21 | `4ceba6d` |

## 3. Multi-Table Boundary

The current apply boundary is not a single table.

| Group | Tables |
| --- | --- |
| Fact tables | `cn_sales.ledger_rows`, `cn_sales.sales_transactions`, `cn_sales.receipt_transactions`, `cn_sales.ar_snapshots`, `cn_sales.product_price_history` |
| Master tables | `cn_sales.sales_parts`, `cn_sales.customers`, `cn_sales.customer_aliases`, `cn_sales.products`, `cn_sales.product_aliases`, `cn_sales.customer_product_usage` |
| Status tables | `cn_sales.ledger_uploads` |
| Preview tables | `cn_sales.upload_preview_results` is preview-only and not used by the G-6A local confirm dry-run route |
| Read-only tables | existing `public.*` ERP reference tables remain no-write |
| Delete policy | candidate-only in G-6A; delete was not executed |

## 4. Sync Scope

| Item | Result |
| --- | --- |
| Source file | `11파트 1~6일 매출현황.XLS` |
| File hash | `sha256:37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0` |
| target_part | `11` |
| dateFrom | `2026-06-01` |
| dateTo | `2026-06-06` |
| date policy | ISO ledger dates only; label-like values are ignored for scope |

## 5. Sync Key Policy

Current G-6A route policy:

- Use schema-compatible `identity_hash` as `syncKey`.
- Use schema-compatible `content_hash` as `syncContentHash`.
- This matches the current `cn_sales.ledger_rows` unique boundary.
- Field-based sync key helpers were added for future refinement, but they are not used for actual DB comparison because existing rows do not yet store that key.

Blocked condition:

- `duplicateIncomingKeys = 9`
- This means the current schema key cannot uniquely identify all incoming normal rows in the selected XLS scope.
- G-6A therefore cannot safely classify every row as insert/update/delete/no-change for a write gate.

## 6. DB Read-Only Evidence

| Item | Result |
| --- | --- |
| read executed | YES |
| existing scoped rows | 0 |
| selected columns only | YES |
| SELECT star used | NO |
| write SQL executed | NO |
| read blocked reason | none |

Read-only column list:

```text
id
row_index
ledger_date
row_type
identity_hash
content_hash
```

No source row payload, customer name, product name, local path, secret, or env value was recorded in this report.

## 7. Actual XLS Diff Result

| Metric | Value |
| --- | ---: |
| normalRows | 2119 |
| excludedRows | 275 |
| warningRows | 0 |
| errorRows | 0 |
| amountTotal | 716970702 |
| existing scoped rows | 0 |
| insertCandidates | 2119 |
| updateCandidates | 0 |
| deleteCandidates | 0 |
| noChangeRows | 0 |
| duplicateIncomingKeys | 9 |
| duplicateExistingKeys | 0 |
| planReady | false |

Plan blocked reasons:

```text
DUPLICATE_INCOMING_SYNC_KEYS
```

## 8. Insert/Update/Delete Candidate Summary

The candidate counts are planning-only.

- Insert candidates: 2119
- Update candidates: 0
- Delete candidates: 0
- No-change rows: 0
- Delete executed: NO
- DB write executed: NO

Because duplicate incoming keys exist, these counts are not approved as an apply plan.

## 9. Safety

| Check | Result |
| --- | --- |
| DB write | NO |
| delete executed | NO |
| production POST | NO |
| `dryRun=false` confirm | NO |
| migration apply | NO |
| seed apply | NO |
| storage write | NO |
| Vercel CLI/manual deploy | NO |
| raw row response committed | NO |
| XLS committed | NO |
| `.local-approval/**` committed | NO |
| raw customer/PII in report | NO |
| secret/env output | NO |

## 10. Side Effects

Allowed and performed:

- PR #21 report-only squash merge.
- Local actual XLS preview.
- Local confirm dry-run with `dryRun=true`.
- Read-only scoped DB query with explicit columns.

Not performed:

- DB write
- production POST
- actual apply endpoint call
- migration apply
- seed apply
- storage write
- manual deploy

## 11. Next Gate

G-6A remains blocked.

Before a limited `max_rows=3` apply smoke can be approved:

1. Resolve the 9 duplicate incoming sync keys.
2. Decide whether to keep current schema `identity_hash` as the apply key or add a new stored sync key.
3. Re-run actual XLS preview and confirm dry-run.
4. Require `planReady = true`.
5. Require `duplicateIncomingKeys = 0` and `duplicateExistingKeys = 0`.
6. Confirm DB read-only evidence still succeeds.
7. Only then request a separate explicit limited apply approval.
