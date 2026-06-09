# CN Sales Obsidian Status Writer

This repo includes a local-only helper for writing sanitized CN Sales progress notes to an Obsidian vault.

## Command

```powershell
$env:OBSIDIAN_VAULT_PATH = "C:\Users\LOVE\MyProjects\Codex\2026-06-06\you-are-helping-me-set-up\Minz-OS"
npm run obsidian:cn-sales -- --phase "PR 1 Obsidian local logging" --summary "Updated local status writer" --verification "npm run test: PASS"
Remove-Item Env:OBSIDIAN_VAULT_PATH
```

If `OBSIDIAN_VAULT_PATH` is not set, the command skips without writing files.

If the path does not exist, the command blocks without creating the path.

## First-Time Project Folder Init

The existing Minz-OS vault structure is used first. To explicitly create `00_projects/cn-sales/` and the CN Sales note set, add this flag:

```powershell
npm run obsidian:cn-sales -- --init-project-folder --phase "CN Sales init"
```

Do not use this flag unless local Obsidian file creation is approved for the target vault.

## Safety Rules

- The helper does not read local env files.
- The helper redacts configured secret-like values from note output.
- The helper records status summaries, decisions, validation, blockers, and next actions only.
- The helper does not run migrations, seed SQL, storage bucket creation, DB writes, deploys, staging, commits, pushes, or PR creation.
- Raw ledger personal data and customer-sensitive raw rows must not be passed to this command.
