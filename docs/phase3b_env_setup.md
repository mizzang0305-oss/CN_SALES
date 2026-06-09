# Phase 3-B Env Setup

This document prepares the dev/local Supabase migration apply. Do not paste real secrets into chat or committed files.

## Required `.env.local`

Create `.env.local` in the project root. It is ignored by git through `.gitignore`.

```dotenv
SUPABASE_PROJECT_REF=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CN_SALES_IMPORT_BACKEND=supabase
CN_SALES_ALLOW_DB_WRITES=true
CN_SALES_ADMIN_AUTH_USER_ID=
```

Notes:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` can be browser-visible.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. Never prefix it with `NEXT_PUBLIC_`.
- `CN_SALES_IMPORT_BACKEND=supabase` and `CN_SALES_ALLOW_DB_WRITES=true` are both required before DB write mode opens.
- Phase 3-B still requires explicit operator approval before migration apply or seed apply.

## Project Ref

In the Supabase Dashboard, open the target dev/local project. The project ref appears in URLs and API endpoints as:

```text
https://<project-ref>.supabase.co
```

You can also find API URL and keys in Dashboard settings for API/Data API. Confirm the target is dev/local before any apply.

## Admin Auth User ID

Do not insert into `auth.users`. Create or identify an existing admin user through Supabase Auth first, then use that user's id for `CN_SALES_ADMIN_AUTH_USER_ID`.

SQL Editor read-only lookup example:

```sql
select id, email, created_at
from auth.users
where email = '<admin-email>'
limit 1;
```

Use only the `id` value as the seed placeholder input.

## Exposed Schema

Supabase custom schemas must be exposed before Data API access through `supabase.schema("cn_sales").from(...)` works.

Dashboard path:

```text
Project Settings / API or Data API / Exposed schemas
```

Add:

```text
cn_sales
```

The migration grants `usage` on `cn_sales` and selected table reads to `authenticated`, and broad access to `service_role` for server-only import writes. RLS still controls row-level access.

## SQL Editor Apply Alternative

If Supabase CLI is unavailable, use SQL Editor manually after approval:

1. Open the target dev/local Supabase project.
2. Confirm the project ref matches `SUPABASE_PROJECT_REF`.
3. Confirm `cn_sales` is in Exposed schemas.
4. Run the UUID pre-check:

```sql
select gen_random_uuid();
```

If the function is missing, run this manually before the migration:

```sql
create extension if not exists "pgcrypto" with schema extensions;
```

5. Run `supabase/migrations/0001_initial_mvp.sql` in SQL Editor.
6. Verify `cn_sales` schema and tables exist.
7. Replace `:'admin_auth_user_id'::uuid` in `supabase/seed_phase3a_cn_sales.sql` with the approved existing auth user id.
8. Run the seed SQL only after separate approval.

Do not use this SQL Editor flow against production.

## Service Role Server-Only Rules

- Use the service role key only in server code.
- The app keeps the service role client in `src/lib/supabase/service-role.ts`, which imports `server-only`.
- Browser code must call `/api/uploads/preview` and `/api/uploads/confirm`; it must not write directly to `cn_sales.*`.
- Never log env values, uploaded raw rows, or the service role key.
- If `SUPABASE_SERVICE_ROLE_KEY` is missing, the app remains in fixture/blocked mode.

## References

- Supabase custom schema setup: https://supabase.com/docs/guides/api/using-custom-schemas
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
