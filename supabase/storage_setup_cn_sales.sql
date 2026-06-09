-- CN Sales storage setup draft only. Do not apply without separate operator approval.
-- Run after cn_sales migrations are applied and private bucket creation is approved.
-- Buckets:
--   cn-sales-ledgers: private ledger upload files. Sales reps must not access raw ledger files directly.
--   cn-sales-claim-media: private claim media files. Use server routes or signed URLs for controlled access.

begin;

insert into storage.buckets (id, name, public)
values
  ('cn-sales-ledgers', 'cn-sales-ledgers', false),
  ('cn-sales-claim-media', 'cn-sales-claim-media', false)
on conflict (id) do update set public = false;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'cn sales admin ledger objects read'
  ) then
    create policy "cn sales admin ledger objects read" on storage.objects
    for select using (
      bucket_id = 'cn-sales-ledgers'
      and cn_sales.current_user_role() = 'admin'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'cn sales admin ledger objects write'
  ) then
    create policy "cn sales admin ledger objects write" on storage.objects
    for insert with check (
      bucket_id = 'cn-sales-ledgers'
      and cn_sales.current_user_role() = 'admin'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'cn sales admin claim media objects read'
  ) then
    create policy "cn sales admin claim media objects read" on storage.objects
    for select using (
      bucket_id = 'cn-sales-claim-media'
      and cn_sales.current_user_role() = 'admin'
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'cn sales admin claim media objects write'
  ) then
    create policy "cn sales admin claim media objects write" on storage.objects
    for insert with check (
      bucket_id = 'cn-sales-claim-media'
      and cn_sales.current_user_role() = 'admin'
    );
  end if;
end $$;

commit;
