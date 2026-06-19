# STAGE M-0 next XLS candidate discovery and approval plan

## 1. FINAL_STATUS

FINAL_STATUS: M0_NEXT_XLS_CANDIDATE_DISCOVERY_PLAN_READY

## 2. Current main and prefix decision

- Requested attached stage prefix: K
- Current main HEAD at discovery: 992ed38
- Current sealed reports on main: G, H, I, J, K, L
- Effective next prefix: M
- Reason: K and L are already sealed on current main, so reusing K would violate the sealed-stage rerun boundary.

## 3. Previous sealed state

| Series | Part | Period | Closure state |
| --- | ---: | --- | --- |
| G | 11 | 2026-06-01 ~ 2026-06-06 | sealed |
| H | 11 | 2026-06-07 ~ 2026-06-12 | sealed |
| I | 1 | 2026-06-01 ~ 2026-06-06 | sealed |
| J | 4 | 2026-06-01 ~ 2026-06-06 | sealed |
| K | 4 | 2026-06-07 ~ 2026-06-12 | sealed |
| L | 5 | 2026-06-01 ~ 2026-06-06 | sealed |

## 4. Candidate inventory

Aggregate-only preview was refreshed for the 16 June sales-status XLS candidates. Raw rows were not saved or printed.

| Candidate | Part | Period | same-part sealed overlap | normalRows | excludedRows | amountTotal | warningRows | errorRows | rawRowsReturned |
| --- | ---: | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| part-1 1~6 sales-status XLS | 1 | 2026-06-01 ~ 2026-06-06 | yes | 1528 | 246 | 563169208 | 0 | 0 | false |
| part-1 6-12 sales-status XLS | 1 | 2026-06-07 ~ 2026-06-12 | no | 1617 | 241 | 600278038 | 0 | 5 | false |
| part-4 1~6 sales-status XLS | 4 | 2026-06-01 ~ 2026-06-06 | yes | 1295 | 175 | 338742294 | 0 | 0 | false |
| part-4 6-12 sales-status XLS | 4 | 2026-06-07 ~ 2026-06-12 | yes | 1338 | 165 | 511598722 | 0 | 0 | false |
| part-5 1~6 sales-status XLS | 5 | 2026-06-01 ~ 2026-06-06 | yes | 1546 | 218 | 549324126 | 0 | 0 | false |
| part-5 6-12 sales-status XLS | 5 | 2026-06-07 ~ 2026-06-12 | no | 1667 | 219 | 690577324 | 0 | 4 | false |
| part-6 1~6 sales-status XLS | 6 | 2026-06-01 ~ 2026-06-06 | no | 1359 | 148 | 527288764 | 0 | 0 | false |
| part-6 6-12 sales-status XLS | 6 | 2026-06-07 ~ 2026-06-12 | no | 1356 | 153 | 567118282 | 0 | 2 | false |
| part-7 1~6 sales-status XLS | 7 | 2026-06-01 ~ 2026-06-06 | no | 1920 | 302 | 781351560 | 0 | 0 | false |
| part-7 6-12 sales-status XLS | 7 | 2026-06-07 ~ 2026-06-12 | no | 2167 | 288 | 819247422 | 0 | 21 | false |
| part-9 1~6 sales-status XLS | 9 | 2026-06-01 ~ 2026-06-06 | no | 469 | 61 | 141591470 | 0 | 0 | false |
| part-9 6-12 sales-status XLS | 9 | 2026-06-07 ~ 2026-06-12 | no | 543 | 65 | 133890218 | 0 | 0 | false |
| part-10 1~6 sales-status XLS | 10 | 2026-06-01 ~ 2026-06-06 | no | 790 | 75 | 261242400 | 0 | 0 | false |
| part-10 6-12 sales-status XLS | 10 | 2026-06-07 ~ 2026-06-12 | no | 821 | 73 | 344562420 | 0 | 0 | false |
| part-11 1~6 sales-status XLS | 11 | 2026-06-01 ~ 2026-06-06 | yes | 2119 | 275 | 716970702 | 0 | 0 | false |
| part-11 6-12 sales-status XLS | 11 | 2026-06-07 ~ 2026-06-12 | yes | 2473 | 271 | 836068144 | 0 | 0 | false |

## 5. Selected XLS

- File label: part-6 1~6 sales-status XLS
- Part: 6
- Period: 2026-06-01 ~ 2026-06-06
- File hash: sha256:3a99de5405c01e1e9eba7ca7e3c0ddeaf3f61947ace3bb0c6897bdedffb3700f
- normalRows: 1359
- excludedRows: 148
- amountTotal: 527288764
- warningRows: 0
- errorRows: 0
- same-part sealed overlap: false
- rawRowsReturned: false

## 6. Overlap risk

- Same-part sealed overlap: none for selected candidate
- Cross-part calendar overlap: yes, expected because other parts in the same calendar window are already sealed
- Blocker status: no hard blocker found at M-0

## 7. Next plan

- Next gate: M-1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE
- Operation candidate after M-1: INSERT only
- Batch size candidate: 500
- Approval file required for apply: yes
- Apply allowed from M-0: no

## 8. Forbidden actions

- DB write: not run
- apply: not run
- production POST: not run
- update/delete/full apply: not run
- migration/seed/storage: not run
- raw row/PII/secret output: none
- deploy/manual deploy: not run
- sealed G/H/I/J/K/L stage rerun: none
- approval file committed: none

## 9. Safety and validation result

- aggregate-only inventory: PASS
- rawRowsReturned: false
- tracked worktree: clean except unrelated untracked docs/adsense
- lint: PASS, npm run lint
- test: PASS, npm run test, 28 files / 261 tests
- test:worker: PASS, npm run test:worker, 4 tests
- build: PASS, npm run build
- diff-check: PASS, git diff --check
- safety scans: PASS
