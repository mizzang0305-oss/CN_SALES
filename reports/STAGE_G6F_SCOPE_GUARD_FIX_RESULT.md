# CN_SALES STAGE G-6F Scope Guard Fix Result

## 1. Final Status

- FINAL_STATUS: G6F_SCOPE_GUARD_FIX_READY_FOR_REVIEW
- Scope: code/test/report only
- Actual DB apply: NO
- Production POST: NO
- Migration/seed/storage/deploy: NO

## 2. Baseline

- Main baseline before fix: 42416a2
- Previous G-6F apply gate result: LIMITED_APPLY_PRECHECK_BLOCKED
- Previous blocked reason: SYNC_SCOPE_DATE_MISMATCH
- Approval scope: 2026-06-01 ~ 2026-06-06
- Previous computed scope: 2026-06-01 ~ 2026-06-30
- Target file hash verified locally: sha256:37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0

## 3. Root Cause

The sync scope derivation preferred ISO ledger dates parsed from the workbook over the operator request period.
For the G-6F file, incoming ledger dates included 2026-06-30, so the confirm path expanded the sync scope to the full month even though the approved operator scope was 2026-06-01 ~ 2026-06-06.

## 4. Implementation

- `deriveLedgerSyncScope` now accepts explicit request dates.
- Explicit `periodStart` and `periodEnd` take priority over derived ledger row dates.
- Derived and fallback behavior remain available when explicit request dates are absent.
- The scope now includes `scopeSource`: `explicit-request`, `derived`, or `fallback`.
- Limited apply preconditions now require explicit request scope.
- Limited apply preconditions now compare the request scope to the approval scope before any write path.
- Limited apply without explicit period dates is blocked with `REQUEST_PERIOD_SCOPE_REQUIRED` or `LIMITED_APPLY_PERIOD_SCOPE_REQUIRED`.
- Limited apply with request dates outside approval scope is blocked with `REQUEST_SCOPE_DATE_MISMATCH`.

## 5. Tests

- Added unit coverage for explicit request period priority.
- Added limited apply guard coverage for missing explicit scope.
- Added limited apply guard coverage for request/approval date mismatch.
- Added confirm dry-run route coverage for returned `syncScope` and `scopeSource`.
- Added static coverage for the new route/helper guard strings.

## 6. Local Dry-run Smoke

Allowed local actions only:

- Localhost `/uploads` GET: PASS
- Localhost preview POST: PASS
- Localhost confirm POST with `dryRun=true`: PASS
- Confirm with `dryRun=false`: NOT EXECUTED

Preview aggregate result:

| Metric | Value |
| --- | ---: |
| HTTP status | 200 |
| ok | true |
| totalRows | 2394 |
| normalRows | 2119 |
| excludedRows | 275 |
| warningRows | 0 |
| errorRows | 0 |
| partMismatch | false |
| confirmCandidate | true |

Confirm dry-run aggregate result:

| Metric | Value |
| --- | ---: |
| HTTP status | 200 |
| dryRun | true |
| syncScope.partCode | 11 |
| syncScope.dateFrom | 2026-06-01 |
| syncScope.dateTo | 2026-06-06 |
| scopeSource | explicit-request |
| existingScopedRows | 133 |
| insertCandidates | 1986 |
| updateCandidates | 0 |
| deleteCandidates | 0 |
| noChangeRows | 133 |
| planReady | true |
| dryRunReady | true |
| actualApplyReady | false |
| actualApplyBlockedReason | APPLY_NOT_APPROVED |

## 7. Safety

- DB write: NO
- `dryRun=false`: NOT EXECUTED
- Production POST: NO
- UPDATE/DELETE/full apply: NO
- Migration apply: NO
- Seed apply: NO
- Storage write: NO
- SQL/view/role/grant changes: NO
- Vercel deploy/redeploy: NO
- Raw row output: NO
- PII output: NO
- Secret/env output: NO
- XLS committed: NO
- `.local-approval` committed: NO

## 8. Side Effects

- Code/test/report files changed only.
- Local dev server was started for GET/preview/dry-run smoke and then stopped.
- Smoke artifacts were written only under ignored `.local-approval/`.

## 9. Next Gate

After this PR is reviewed and merged, rerun G-6F from the pre-apply dry-run gate.
The next expected dry-run proof is:

- `syncScope.dateFrom = 2026-06-01`
- `syncScope.dateTo = 2026-06-06`
- `scopeSource = explicit-request`
- `existingScopedRows = 133`
- `insertCandidates = 1986`
- `updateCandidates = 0`
- `deleteCandidates = 0`
- `noChangeRows = 133`

G-6F actual limited apply remains blocked until a separate explicit approval is provided.
