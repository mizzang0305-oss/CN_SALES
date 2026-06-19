# STAGE K-0 next XLS candidate discovery and approval plan

## 1. FINAL_STATUS

FINAL_STATUS: K0_NEXT_XLS_CANDIDATE_DISCOVERY_PLAN_READY

## 2. Previous sealed state

- G sealed: part 11, 2026-06-01 ~ 2026-06-06, FINAL_STATUS G7_READ_ONLY_SYNC_CLOSURE_AUDIT_MERGED_AND_G6_SEALED
- H sealed: part 11, 2026-06-07 ~ 2026-06-12, FINAL_STATUS H3_READ_ONLY_SYNC_CLOSURE_AUDIT_MERGED_AND_H2_SEALED
- I sealed: part 1, 2026-06-01 ~ 2026-06-06, FINAL_STATUS I6_READ_ONLY_SYNC_CLOSURE_AUDIT_MERGED_AND_I_SERIES_SEALED
- J sealed: part 4, 2026-06-01 ~ 2026-06-06, FINAL_STATUS J_READ_ONLY_SYNC_CLOSURE_AUDIT_MERGED_AND_J_SERIES_SEALED
- Previous sealed stage rerun: none

## 3. Candidate XLS inventory

Inventory source: local June weekly sales-status XLS files matching part-based sales status filenames. Non-sales workbooks, receivables files, settlement files, temporary files, and backup files were excluded.

For filename-literal `6-12`, the recommended apply period is 2026-06-07 ~ 2026-06-12, matching the already sealed H-series period convention.

| File label | Part | Filename period | Recommended period | Same-part sealed overlap | Cross-part calendar overlap | File hash | normalRows | excludedRows | amountTotal | warningRows | errorRows | rawRowsReturned |
| --- | ---: | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| part-1 1-6 sales-status XLS | 1 | 1-6 | 2026-06-01 ~ 2026-06-06 | true | true | sha256:f43f9eefc35eb30b84e682e22be117d99f30897d69b72d16a91b0adf9a28fcbd | 1528 | 246 | 563169208 | 0 | 0 | false |
| part-1 6-12 sales-status XLS | 1 | 6-12 | 2026-06-07 ~ 2026-06-12 | false | true | sha256:eb4e4a46f95cdcaf3761a02e5cfd79695179b76372dce17fd0efcb9724ba8c8a | 1617 | 241 | 600278038 | 0 | 5 | false |
| part-4 1-6 sales-status XLS | 4 | 1-6 | 2026-06-01 ~ 2026-06-06 | true | true | sha256:5acf018ec065195bc8c122d43d9ed16eaa4e068f7182798c135fa9fc814ca8e9 | 1295 | 175 | 338742294 | 0 | 0 | false |
| part-4 6-12 sales-status XLS | 4 | 6-12 | 2026-06-07 ~ 2026-06-12 | false | true | sha256:a5c5ecf67009a83d2bb5639229462e9231ccff1e81291e0cecc365263597217a | 1338 | 165 | 511598722 | 0 | 0 | false |
| part-5 1-6 sales-status XLS | 5 | 1-6 | 2026-06-01 ~ 2026-06-06 | false | true | sha256:0e4f909e5fe2d43e924e99352a6bdfa6f673357b5b2c41974b1981471ef2ad6a | 1546 | 218 | 549324126 | 0 | 0 | false |
| part-5 6-12 sales-status XLS | 5 | 6-12 | 2026-06-07 ~ 2026-06-12 | false | true | sha256:ae776f2e5669e7cd1fa3f450dab8db187c63e606233d51011a6eadf541433230 | 1667 | 219 | 690577324 | 0 | 4 | false |
| part-6 1-6 sales-status XLS | 6 | 1-6 | 2026-06-01 ~ 2026-06-06 | false | true | sha256:3a99de5405c01e1e9eba7ca7e3c0ddeaf3f61947ace3bb0c6897bdedffb3700f | 1359 | 148 | 527288764 | 0 | 0 | false |
| part-6 6-12 sales-status XLS | 6 | 6-12 | 2026-06-07 ~ 2026-06-12 | false | true | sha256:efeedb92fc25067cf028cc6d5519f938af622093f90953a599803188cb2dac39 | 1356 | 153 | 567118282 | 0 | 2 | false |
| part-7 1-6 sales-status XLS | 7 | 1-6 | 2026-06-01 ~ 2026-06-06 | false | true | sha256:e18fd014bcffebb4df73839d6b70df4493709a303f6ec17fb2dd17405e1d6f3c | 1920 | 302 | 781351560 | 0 | 0 | false |
| part-7 6-12 sales-status XLS | 7 | 6-12 | 2026-06-07 ~ 2026-06-12 | false | true | sha256:5bac2e4f8fe71818adf874f3d07be66db073721e236a25f47825a609ff5c6a46 | 2167 | 288 | 819247422 | 0 | 21 | false |
| part-9 1-6 sales-status XLS | 9 | 1-6 | 2026-06-01 ~ 2026-06-06 | false | true | sha256:30d0ad4e99445cafbe6c7aa17d3e775eba669b181bba6f5f77fe80c677e603cc | 469 | 61 | 141591470 | 0 | 0 | false |
| part-9 6-12 sales-status XLS | 9 | 6-12 | 2026-06-07 ~ 2026-06-12 | false | true | sha256:e0850181d1bf1a0ff7341293e765948320b63206d124291370224739eed0c1c0 | 543 | 65 | 133890218 | 0 | 0 | false |
| part-10 1-6 sales-status XLS | 10 | 1-6 | 2026-06-01 ~ 2026-06-06 | false | true | sha256:fef66ba714047e69499f84c98f47926999ad6bbf602a7e21c4c8cc8927cc2cee | 790 | 75 | 261242400 | 0 | 0 | false |
| part-10 6-12 sales-status XLS | 10 | 6-12 | 2026-06-07 ~ 2026-06-12 | false | true | sha256:4ef2a7aa59b199da2053c2242a96032502625f201d4888d539e74349946b7ba2 | 821 | 73 | 344562420 | 0 | 0 | false |
| part-11 1-6 sales-status XLS | 11 | 1-6 | 2026-06-01 ~ 2026-06-06 | true | true | sha256:37e0833cf4329d08c7ee4093e4807712bd41c30149a344b8db440e1cb5472ca0 | 2119 | 275 | 716970702 | 0 | 0 | false |
| part-11 6-12 sales-status XLS | 11 | 6-12 | 2026-06-07 ~ 2026-06-12 | true | false | sha256:c13f1921051df174e1b457bf10e499711069a5f830c0150eeef576b132cdfe42 | 2473 | 271 | 836068144 | 0 | 0 | false |

## 4. Recommended candidate

- File label: part-4 6-12 sales-status XLS
- Part: 4
- Filename-literal period: 6-12
- Recommended period: 2026-06-07 ~ 2026-06-12
- File hash: sha256:a5c5ecf67009a83d2bb5639229462e9231ccff1e81291e0cecc365263597217a
- normalRows: 1338
- excludedRows: 165
- amountTotal: 511598722
- warningRows: 0
- errorRows: 0
- same-part sealed overlap: false
- cross-part calendar overlap: true
- rawRowsReturned: false

## 5. Selection notes

- part-1 6-12 is the earliest same-part continuation after I-series, but aggregate preview returned errorRows 5. It is not selected for K-series apply planning.
- part-4 6-12 is the direct clean continuation after the sealed J-series part-4 1-6 sync.
- Cross-part calendar overlap is expected because different parts can share the same calendar period. It is not a same-part duplicate risk.

## 6. Proposed next gate

- NEXT_STAGE: K-1_NEXT_XLS_READ_ONLY_DRY_RUN_GATE
- Target file label: part-4 6-12 sales-status XLS
- Target part: 4
- Target period: 2026-06-07 ~ 2026-06-12
- Expected file hash: sha256:a5c5ecf67009a83d2bb5639229462e9231ccff1e81291e0cecc365263597217a
- Mode: read-only only
- DB write: forbidden
- Apply: forbidden
- Approval file creation: forbidden

## 7. Safety result

- DB write: none
- dryRun=false: none
- production POST: none
- update/delete/full apply: none
- migration/seed/storage: none
- raw row/PII/secret output: none
- deploy: none
- previous sealed stage rerun: none
- approval file committed: none
- out-of-scope docs/adsense untracked file: untouched
- .codex/config.toml: untouched
- port 3215 after aggregate preview: stopped

## 8. Validation result

- main re-anchor: PASS, main at e37cdf82fe21f6293d3fbf9d7a1e6a4b9b04d847
- candidate aggregate preview: PASS, 16 candidate summaries
- hash calculation: PASS
- raw row output: PASS, aggregate-only report
- lint: PASS, npm run lint
- test: PASS, npm run test, 28 files / 239 tests
- test:worker: PASS, npm run test:worker, 4 tests
- build: PASS, npm run build
- diff-check: PASS, git diff --check
- safety scans: PASS, report raw row/PII/secret, approval file committed, production POST, migration/seed/storage, deploy

## 9. Recommended next step

Merge this report-only K-0 PR, then run K-1 read-only dry-run gate for part-4 2026-06-07 ~ 2026-06-12.

No apply is allowed from K-0. Any write must start after K-1 verifies exact aggregate and DB scoped diff values and after exact K-series stage support is present on main.
