# CN_SALES STAGE G-6A2 Duplicate Sync Key Resolver Result

## 1. Final Status

FINAL_STATUS = DUPLICATE_KEY_RESOLVER_PR_CREATED_PASS

Decision reason:

- PR #22 multi-table sync diff planner was merged into `main`.
- The 9 legacy duplicate incoming sync-key groups were diagnosed without raw rows or customer/product names.
- Sync key v2 now separates natural key, occurrence index, identity hash, and content hash.
- The same actual XLS preview and confirm dry-run were re-run locally with `dryRun=true`.
- The new incoming identity duplicates are 0 and `planReady=true`.
- No DB write, delete, production POST, migration, seed, storage write, or manual deploy was executed.

## 2. Baseline

| Item | Result |
| --- | --- |
| Repo | `mizzang0305-oss/CN_SALES` |
| PR #22 | merged |
| PR #22 merge commit | `ab768a8` |
| Source file hash | `sha256:37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0` |
| target_part | `11` |
| dateFrom | `2026-06-01` |
| dateTo | `2026-06-06` |
| existing scoped rows | `0` |

## 3. Duplicate Diagnosis

Aggregate-only diagnosis:

| Metric | Value |
| --- | ---: |
| legacy duplicateIncomingKeys before | 9 |
| legacy duplicate group count | 9 |
| legacy max duplicate group size | 3 |
| legacy groups with mixed contentHash | 9 |
| legacy groups with same contentHash | 0 |
| v2 duplicateIncomingKeys after | 0 |
| v2 duplicateIncomingIdentityHashes | 0 |
| v2 incoming naturalKey duplicate groups | 73 |
| v2 incoming naturalKey max group size | 18 |
| true ambiguous groups after resolver | 0 |

Interpretation:

- Repeated natural keys are expected for same-day, same-part, same-customer-stable-key, same-product-stable-key rows.
- They are no longer ambiguous because `occurrenceIndexWithinNaturalKey` assigns a deterministic source-order identity inside each natural-key group.
- Amount, quantity, and unit price changes affect `contentHash`, not row identity.

## 4. Sync Key V2 Policy

| Field | Policy |
| --- | --- |
| naturalKey | `sha256(partCode, ledgerDate, customerStableKey, productStableKey, documentNoOrBlank, rowType)` |
| occurrenceIndexWithinNaturalKey | 1-based order within the same natural key by source row index |
| identityHash | `sha256(naturalKey, occurrenceIndexWithinNaturalKey)` |
| contentHash | quantity, unit price, sales/receipt/AR amounts, and normalized business fields |
| amount in identity key | NO |
| quantity in identity key | NO |
| unit price in identity key | NO |

## 5. Actual XLS Diff Result

The local smoke used actual XLS preview and confirm dry-run only.

| Metric | Value |
| --- | ---: |
| normalRows | 2119 |
| excludedRows | 275 |
| warningRows | 0 |
| errorRows | 0 |
| existing scoped rows | 0 |
| insertCandidates | 2119 |
| updateCandidates | 0 |
| deleteCandidates | 0 |
| noChangeRows | 0 |
| duplicateIncomingKeys | 0 |
| duplicateIncomingIdentityHashes | 0 |
| duplicateExistingKeys | 0 |
| planReady | true |

Plan blocked reasons:

```text
none
```

## 6. Plan Readiness

| Gate | Result |
| --- | --- |
| part match | PASS |
| valid date scope | PASS |
| warning rows | 0 |
| error rows | 0 |
| duplicate incoming identity hashes | 0 |
| duplicate existing identity hashes | 0 |
| read-only existing evidence | PASS |
| actual apply approved | NO |

`actualApplyReady` remains `false` and `actualApplyBlockedReason` remains `APPLY_NOT_APPROVED`.

## 7. Safety

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

Safety scans:

```text
response raw/PII/secret/path/traceback hits: 0
G-6A2 route/sync write-call hits: 0
```

## 8. Side Effects

Allowed and performed:

- PR #22 squash merge.
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

## 9. Next Gate

G-6A2 resolves the duplicate sync key blocker.

Next safe gate:

1. Review and merge the G-6A2 resolver PR.
2. Re-run local actual XLS preview and confirm dry-run on main.
3. Require `planReady=true`, `duplicateIncomingKeys=0`, and `duplicateExistingKeys=0`.
4. Request a separate explicit limited apply approval before any DB write.
