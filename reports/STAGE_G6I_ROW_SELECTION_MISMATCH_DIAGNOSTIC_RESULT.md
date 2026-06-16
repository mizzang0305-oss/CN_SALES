# CN_SALES STAGE G-6I Row Selection Mismatch Diagnostic Result

## 1. Final Status

FINAL_STATUS = G6I_SELECTION_MISMATCH_DIAGNOSTIC_PR_CREATED_PASS

This report is diagnostic-only. No G-6I apply retry was executed after the previous guarded failure.

## 2. Baseline

| Item | Result |
| --- | --- |
| Main baseline | 3a6bb9e |
| PR #47 | merged |
| Current dry-run HTTP | 200 |
| dryRun | true |
| normalRows | 2119 |
| excludedRows | 275 |
| warningRows | 0 |
| errorRows | 0 |
| existingScopedRows | 1633 |
| insertCandidates | 486 |
| updateCandidates | 0 |
| deleteCandidates | 0 |
| noChangeRows | 1633 |
| planReady | true |
| actualApplyReady | false |
| actualApplyBlockedReason | APPLY_NOT_APPROVED |

## 3. Previous Blocker

| Item | Result |
| --- | --- |
| Attempted stage | G-6I |
| maxRows | 486 |
| Previous error | LIMITED_APPLY_ROW_SELECTION_MISMATCH |
| Previous write completion | false |
| Read-back | not executed |
| Post-apply dry-run | not executed |

## 4. Root Cause

Category: A / G

The dry-run diff and the final limited selector were not using the same candidate source.

- The dry-run planner counted insert candidates from the generated sync rows.
- The selector rebuilt row-to-sync pairing by source row index.
- Source row indexes can repeat in parsed ledger rows, so row-index based mapping can collapse or mis-pair candidates.
- The selector also filtered ledger dates before the explicit date guard, which could make candidate counts diverge from the dry-run planner.

The fix makes selector pairing positional against the already-created sync rows, keeps final date validation in the explicit date guard, and exposes only count/digest diagnostics in dry-run responses.

## 5. Diagnostic / Hotfix

| Item | Result |
| --- | --- |
| Selector source | parsed row and sync row paired by array position |
| Dry-run candidate source | generated sync rows |
| Candidate ordering | ledgerDate, rowIndex, naturalKey, occurrenceIndex, identityHash |
| Date validation | explicit limited apply date guard |
| Diagnostic output | aggregate and digest only |
| Source row payload returned | false |

## 6. Test Coverage

| Test area | Result |
| --- | --- |
| G-6I final 486 selection | covered |
| Duplicate rowIndex candidate preservation | covered |
| Selector/date guard separation | covered |
| G-6I maxRows policy | covered |
| update/delete/full apply boundary | covered by existing tests |
| Approval boundary | covered |
| Source row exclusion | covered by static safety tests |

## 7. Read-only Verification

| Item | Result |
| --- | --- |
| Verification mode | localhost dryRun=true only |
| HTTP status | 200 |
| existingScopedRows | 1633 |
| insertCandidates | 486 |
| updateCandidates | 0 |
| deleteCandidates | 0 |
| noChangeRows | 1633 |
| selectionDiagnostics.stage | G-6I |
| selectionDiagnostics.maxRows | 486 |
| selectionDiagnostics.candidateRows | 486 |
| selectionDiagnostics.selectedRowsDryRunEquivalent | 486 |
| selectionDiagnostics.candidateDigestMatchesSelector | true |
| selectionDiagnostics.orderDigestMatchesSelector | true |
| selectionDiagnostics.rawRowsReturned | false |

## 8. Safety

| Item | Result |
| --- | --- |
| G-6I apply retry | NO |
| DB write | NO |
| dryRun=false confirm | NO |
| production POST | NO |
| update/delete/full apply | NO |
| migration/seed/storage | NO |
| SQL/view/role/grant | NO |
| Metabase connection | NO |
| Vercel CLI/manual deploy | NO |
| source row or PII output | NO |
| secret/env output | NO |
| XLS/approval/response files committed | NO |

## 9. Side Effects

- Localhost preview POST: yes, for diagnostic preview only.
- Localhost confirm dryRun=true POST: yes, read-only diagnostic only.
- Database write: no.
- Production request: no.
- Deployment: no.

## 10. Next Gate

After this diagnostic PR is merged, rerun G-6I from current-state dry-run and request separate explicit approval before any 486-row limited apply retry.
