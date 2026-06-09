# Phase 3-A cn_sales Migration Review

Status: review-only. Migration apply is not approved in this phase.

## Custom Schema API Access

Supabase custom schemas are not exposed through the Data API by default. If the application uses `supabase.schema("cn_sales").from(...)`, the Supabase project must add `cn_sales` to API settings > Exposed schemas and the migration must grant schema/table privileges to the required roles.

Recommended split:

| Area | Access mode | Notes |
| --- | --- | --- |
| Dashboard aggregate reads | Server API route preferred, direct authenticated select acceptable later | Current app calls server route and repository. |
| Mobile customer detail reads | Server API route preferred for Phase 3-B | Keeps future row shaping centralized. |
| Ledger upload/import/confirm | Server API route only | Do not expose direct browser writes to ledger/import tables. |
| Raw ledger rows and upload preview details | Server API route only | Contains original row JSON and file provenance. |
| Claims/visits/tasks | Server API route or controlled authenticated CRUD later | RLS already has company/role expansion points. |

## Grants Review

Current draft direction:

| Role | Grant posture | Review |
| --- | --- | --- |
| `anon` | No `cn_sales` grants | Correct default. Public unauthenticated access remains blocked. |
| `authenticated` | `usage` on schema plus selected table `select` grants only | Safer than broad DML. RLS still controls row access. |
| `service_role` | `usage` plus all tables/routines/sequences | Server-only import writes can use service role if Phase 3-B chooses that path. Never expose to browser. |

Note: if Phase 3-B keeps user-JWT server writes instead of a server-only service role client, extra `authenticated` DML grants would be required for admin write tables. Safer Phase 3-B recommendation is a server-only service role client with strict route-level auth checks.

## RLS Review

| Item | Result |
| --- | --- |
| RLS enabled on all cn_sales tables | Yes, including `customer_links` and `product_links`. |
| Company isolation | Policies use `cn_sales.current_company_id()` and `company_id` checks where tables carry company context. |
| Role expansion | `cn_sales.current_user_role()` supports `sales_rep`, `part_leader`, `team_leader`, `executive`, `admin`. |
| Sensitive direct client writes | Ledger/upload/normalized write policies are admin-scoped, and grants now avoid authenticated broad DML. |
| Profiles auth source | `profiles.id` references existing `auth.users(id)`; seed must not insert auth users. |

## Storage Bucket Plan

Bucket: `cn-sales-ledgers`

Policy direction:

| Operation | Allowed | Notes |
| --- | --- | --- |
| Public access | No | Bucket is private. |
| Upload | Admin now; team_leader can be added after route authorization is finalized | Use server API route for upload. |
| Read/download raw files | Admin only by default | Sales reps should not directly access source ledger files. |
| Upsert/overwrite | No by default | New upload path per file; original files are immutable. |

The migration draft includes bucket creation and storage policies, but Phase 3-A does not apply them.

## Seed SQL Draft

Draft file: `supabase/seed_phase3a_cn_sales.sql`

Seed content:

| Seed area | Strategy |
| --- | --- |
| Company | Fixed id `00000000-0000-4000-8000-000000000001`, upsert by id. |
| Sales parts | Parts `1,4,5,6,7,9,10,11`, upsert by company/part code. |
| Admin profile | Uses `:'admin_auth_user_id'::uuid`; does not insert into `auth.users`. |
| Sales reps | One sample rep per part, idempotent by company/rep code. |
| June targets | `2026-06-01` rows, zero amounts as editable placeholders. |

## Migration Risk Table

| Category | Created/changed | Risk | Notes |
| --- | --- | --- | --- |
| Schema | `cn_sales` | Low | New schema only. |
| Enums | `user_role`, `ledger_row_type`, `upload_status`, `claim_status`, `promise_status` | Low | New `cn_sales` enums only. |
| Tables | 25 cn_sales tables including link tables | Medium | New objects; no existing public table mutation. |
| Functions | `cn_sales.current_company_id()`, `cn_sales.current_user_role()` | Low | Security invoker helper functions. |
| Indexes | `cn_sales_*` prefixed indexes | Low | New indexes only. |
| RLS policies | Company/role-scoped policies | Medium | Needs live policy smoke after apply. |
| Storage | Private `cn-sales-ledgers` bucket and policies | Medium | Requires Supabase Storage policy verification. |
| Existing public/cn_wms_dev | No direct effect | Low | Static grep found no direct refs. |
| Destructive SQL | None found | Low | No drop/truncate/delete/update existing data. |

## Rollback Strategy

Before apply, take a DB backup or branch snapshot.

If applied and rollback is needed before production data exists:

```sql
drop schema if exists cn_sales cascade;
delete from storage.buckets where id = 'cn-sales-ledgers';
```

If any production/dev data has been inserted, do not run cascade rollback blindly. Export `cn_sales.*` tables and storage object metadata first, then decide whether to archive, migrate, or drop after approval.

## Phase 3-B Approval Gate

Before Phase 3-B apply:

1. Confirm target Supabase project/ref.
2. Confirm `cn_sales` should be added to Exposed schemas.
3. Confirm whether import writes should use server-only service role or authenticated admin JWT.
4. Provide existing admin `auth.users.id` for seed placeholder.
5. Approve migration apply and seed apply separately.
