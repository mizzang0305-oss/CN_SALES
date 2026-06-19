# STAGE L-0 next XLS candidate discovery and approval plan

## 1. FINAL_STATUS

FINAL_STATUS: L0_NEXT_XLS_CANDIDATE_DISCOVERY_PLAN_READY

## 2. Previous sealed state

Already sealed and not rerun:

- G-series: part-11, 2026-06-01 ~ 2026-06-06
- H-series: part-11, 2026-06-07 ~ 2026-06-12
- I-series: part-1, 2026-06-01 ~ 2026-06-06
- J-series: part-4, 2026-06-01 ~ 2026-06-06
- K-series: part-4, 2026-06-07 ~ 2026-06-12

## 3. Candidate XLS inventory

Aggregate-only current preview inventory:

| File label | Part | Recommended period | Same-part sealed overlap | Cross-part calendar overlap | Hash | normalRows | excludedRows | amountTotal | warningRows | errorRows | rawRowsReturned |
| --- | ---: | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| part-1 1~6 sales-status XLS | 1 | 2026-06-01 ~ 2026-06-06 | true | true | sha256:f43f9eefc35eb30b84e682e22be117d99f30897d69b72d16a91b0adf9a28fcbd | 1528 | 246 | 563169208 | 0 | 0 | false |
| part-1 6-12 sales-status XLS | 1 | 2026-06-07 ~ 2026-06-12 | false | true | sha256:eb4e4a46f95cdcaf3761a02e5cfd79695179b76372dce17fd0efcb9724ba8c8a | 1617 | 241 | 600278038 | 0 | 5 | false |
| part-4 1~6 sales-status XLS | 4 | 2026-06-01 ~ 2026-06-06 | true | true | sha256:5acf018ec065195bc8c122d43d9ed16eaa4e068f7182798c135fa9fc814ca8e9 | 1295 | 175 | 338742294 | 0 | 0 | false |
| part-4 6-12 sales-status XLS | 4 | 2026-06-07 ~ 2026-06-12 | true | true | sha256:a5c5ecf67009a83d2bb5639229462e9231ccff1e81291e0cecc365263597217a | 1338 | 165 | 511598722 | 0 | 0 | false |
| part-5 1~6 sales-status XLS | 5 | 2026-06-01 ~ 2026-06-06 | false | true | sha256:0e4f909e5fe2d43e924e99352a6bdfa6f673357b5b2c41974b1981471ef2ad6a | 1546 | 218 | 549324126 | 0 | 0 | false |
| part-5 6-12 sales-status XLS | 5 | 2026-06-07 ~ 2026-06-12 | false | true | sha256:ae776f2e5669e7cd1fa3f450dab8db187c63e606233d51011a6eadf541433230 | 1667 | 219 | 690577324 | 0 | 4 | false |
| part-6 1~6 sales-status XLS | 6 | 2026-06-01 ~ 2026-06-06 | false | true | sha256:3a99de5405c01e1e9eba7ca7e3c0ddeaf3f61947ace3bb0c6897bdedffb3700f | 1359 | 148 | 527288764 | 0 | 0 | false |
| part-6 6-12 sales-status XLS | 6 | 2026-06-07 ~ 2026-06-12 | false | true | sha256:efeedb92fc25067cf028cc6d5519f938af622093f90953a599803188cb2dac39 | 1356 | 153 | 567118282 | 0 | 2 | false |
| part-7 1~6 sales-status XLS | 7 | 2026-06-01 ~ 2026-06-06 | false | true | sha256:e18fd014bcffebb4df73839d6b70df4493709a303f6ec17fb2dd17405e1d6f3c | 1920 | 302 | 781351560 | 0 | 0 | false |
| part-7 6-12 sales-status XLS | 7 | 2026-06-07 ~ 2026-06-12 | false | true | sha256:5bac2e4f8fe71818adf874f3d07be66db073721e236a25f47825a609ff5c6a46 | 2167 | 288 | 819247422 | 0 | 21 | false |
| part-9 1~6 sales-status XLS | 9 | 2026-06-01 ~ 2026-06-06 | false | true | sha256:30d0ad4e99445cafbe6c7aa17d3e775eba669b181bba6f5f77fe80c677e603cc | 469 | 61 | 141591470 | 0 | 0 | false |
| part-9 6-12 sales-status XLS | 9 | 2026-06-07 ~ 2026-06-12 | false | true | sha256:e0850181d1bf1a0ff7341293e765948320b63206d124291370224739eed0c1c0 | 543 | 65 | 133890218 | 0 | 0 | false |
| part-10 1~6 sales-status XLS | 10 | 2026-06-01 ~ 2026-06-06 | false | true | sha256:fef66ba714047e69499f84c98f47926999ad6bbf602a7e21c4c8cc8927cc2cee | 790 | 75 | 261242400 | 0 | 0 | false |
| part-10 6-12 sales-status XLS | 10 | 2026-06-07 ~ 2026-06-12 | false | true | sha256:4ef2a7aa59b199da2053c2242a96032502625f201d4888d539e74349946b7ba2 | 821 | 73 | 344562420 | 0 | 0 | false |
| part-11 1~6 sales-status XLS | 11 | 2026-06-01 ~ 2026-06-06 | true | true | sha256:37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0 | 2119 | 275 | 716970702 | 0 | 0 | false |
| part-11 6-12 sales-status XLS | 11 | 2026-06-07 ~ 2026-06-12 | true | true | sha256:c13f1921051df174e1b457bf10e499711069a5f830c0150eeef576b132cdfe42 | 2473 | 271 | 836068144 | 0 | 0 | false |

## 4. Recommended candidate

- File label: part-5 1~6 sales-status XLS
- Part: 5
- Period: 2026-06-01 ~ 2026-06-06
- File hash: sha256:0e4f909e5fe2d43e924e99352a6bdfa6f673357b5b2c41974b1981471ef2ad6a
- normalRows: 1546
- excludedRows: 218
- amountTotal: 549324126
- warningRows: 0
- errorRows: 0
- samePartSealedOverlap: false
- crossPartCalendarOverlap: true
- rawRowsReturned: false

Selection reason: this is the first unsealed same-part/non-overlap candidate with normalRows > 0, warningRows 0, errorRows 0, a stable hash, and an aggregate amount total.

## 5. Aggregate-only summary

- Candidate files reviewed: 16
- Sales XLS candidates retained: 16
- Candidate data retained in this report: aggregate fields only
- Raw row output: none
- Customer names / PII / secrets: none

## 6. Overlap risk

- Same-part sealed overlap for selected candidate: false
- Cross-part calendar overlap: true
- Interpretation: cross-part overlap is expected because multiple parts share the same calendar period; same-part overlap is the blocking overlap and is false.

## 7. Proposed next gate

- Next stage: L-1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE
- Operation candidate after L-1: INSERT only
- Batch size candidate: 500
- Approval file required for future dryRun=false: yes
- L-0 actual apply: not allowed

## 8. Safety result

- DB write: none
- apply: none
- dryRun=false call: none
- production POST: none
- update/delete/full apply: none
- migration/seed/storage: none
- raw row/PII/secret output: none
- deploy/manual deploy: none
- previous sealed stage rerun: none
- approval file committed: none
- port 3215 after inventory preview: stopped

## 9. Validation result

- L-0 aggregate preview inventory: PASS
- lint: PASS, npm run lint
- test: PASS, npm run test, 28 files / 250 tests
- test:worker: PASS, npm run test:worker, 4 tests
- build: PASS, npm run build
- diff-check: PASS, git diff --check
- report safety scan: PASS
