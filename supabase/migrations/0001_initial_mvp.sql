-- Supabase SQL Editor compatibility:
-- Do not create pgcrypto in this migration by default.
-- Pre-check before applying:
--   select gen_random_uuid();
-- If that function is missing, manually run:
--   create extension if not exists "pgcrypto" with schema extensions;
create schema if not exists cn_sales;

create type cn_sales.user_role as enum ('sales_rep', 'part_leader', 'team_leader', 'executive', 'admin');
create type cn_sales.ledger_row_type as enum ('item_detail', 'customer_total', 'daily_total', 'grand_total', 'receipt', 'unknown');
create type cn_sales.upload_status as enum ('preview', 'committed', 'cancelled', 'failed');
create type cn_sales.claim_status as enum ('접수', '진행', '완료', '보류');
create type cn_sales.promise_status as enum ('예정', '오늘', '지연', '완료', '연기', '취소', '확인필요');

create table cn_sales.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table cn_sales.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references cn_sales.companies(id),
  full_name text not null,
  role cn_sales.user_role not null default 'sales_rep',
  created_at timestamptz not null default now()
);

create table cn_sales.sales_parts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  part_code text not null,
  part_name text not null,
  constraint cn_sales_sales_parts_company_part_code_unique unique (company_id, part_code)
);

create table cn_sales.sales_reps (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  profile_id uuid references cn_sales.profiles(id),
  part_id uuid not null references cn_sales.sales_parts(id),
  rep_code text not null,
  rep_name text not null,
  constraint cn_sales_sales_reps_company_rep_code_unique unique (company_id, rep_code)
);

create table cn_sales.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  part_id uuid not null references cn_sales.sales_parts(id),
  sales_rep_id uuid references cn_sales.sales_reps(id),
  customer_code text not null,
  customer_name text not null,
  business_no text,
  address text,
  phone text,
  active boolean not null default true,
  constraint cn_sales_customers_company_customer_code_unique unique (company_id, customer_code)
);

create table cn_sales.product_groups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  group_name text not null,
  constraint cn_sales_product_groups_company_group_name_unique unique (company_id, group_name)
);

create table cn_sales.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  product_group_id uuid references cn_sales.product_groups(id),
  product_code text,
  product_name text not null,
  active boolean not null default true,
  constraint cn_sales_products_company_product_name_unique unique (company_id, product_name)
);

create table cn_sales.customer_links (
  id uuid primary key default gen_random_uuid(),
  cn_sales_customer_id uuid not null references cn_sales.customers(id) on delete cascade,
  external_schema text not null,
  external_table text not null,
  external_id text not null,
  link_type text not null default 'manual',
  confidence numeric(5, 4) not null default 1,
  created_at timestamptz not null default now(),
  constraint cn_sales_customer_links_external_unique unique (external_schema, external_table, external_id),
  constraint cn_sales_customer_links_confidence_check check (confidence >= 0 and confidence <= 1)
);

create table cn_sales.product_links (
  id uuid primary key default gen_random_uuid(),
  cn_sales_product_id uuid not null references cn_sales.products(id) on delete cascade,
  external_schema text not null,
  external_table text not null,
  external_id text not null,
  link_type text not null default 'manual',
  confidence numeric(5, 4) not null default 1,
  created_at timestamptz not null default now(),
  constraint cn_sales_product_links_external_unique unique (external_schema, external_table, external_id),
  constraint cn_sales_product_links_confidence_check check (confidence >= 0 and confidence <= 1)
);

create table cn_sales.product_price_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  ledger_row_id uuid not null,
  customer_id uuid references cn_sales.customers(id),
  product_id uuid references cn_sales.products(id),
  part_id uuid not null references cn_sales.sales_parts(id),
  price_date date not null,
  quantity numeric(18, 4) not null default 0,
  unit_price numeric(18, 2) not null default 0,
  sales_amount numeric(18, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table cn_sales.ledger_uploads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  part_id uuid not null references cn_sales.sales_parts(id),
  file_name text not null,
  storage_path text,
  period_start date not null,
  period_end date not null,
  status cn_sales.upload_status not null default 'preview',
  summary_json jsonb not null default '{}'::jsonb,
  created_by uuid references cn_sales.profiles(id),
  created_at timestamptz not null default now(),
  committed_at timestamptz
);

create table cn_sales.ledger_rows (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  upload_id uuid not null references cn_sales.ledger_uploads(id),
  part_id uuid not null references cn_sales.sales_parts(id),
  row_index integer not null,
  ledger_date date,
  row_type cn_sales.ledger_row_type not null,
  customer_id uuid references cn_sales.customers(id),
  product_id uuid references cn_sales.products(id),
  customer_name text,
  product_name text,
  quantity numeric(18, 4) not null default 0,
  unit_price numeric(18, 2) not null default 0,
  sales_amount numeric(18, 2) not null default 0,
  receipt_amount numeric(18, 2) not null default 0,
  receipt_discount numeric(18, 2) not null default 0,
  ar_balance numeric(18, 2),
  identity_hash text not null,
  content_hash text not null,
  raw_row_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cn_sales_ledger_rows_identity_unique unique (company_id, identity_hash)
);

alter table cn_sales.product_price_history
  add constraint cn_sales_product_price_history_ledger_row_id_fkey
  foreign key (ledger_row_id) references cn_sales.ledger_rows(id) on delete cascade;

create table cn_sales.ledger_row_versions (
  id uuid primary key default gen_random_uuid(),
  ledger_row_id uuid not null references cn_sales.ledger_rows(id) on delete cascade,
  previous_content_hash text not null,
  next_content_hash text not null,
  previous_raw_row_json jsonb not null,
  next_raw_row_json jsonb not null,
  changed_by uuid references cn_sales.profiles(id),
  changed_at timestamptz not null default now()
);

create table cn_sales.upload_preview_results (
  id uuid primary key default gen_random_uuid(),
  upload_id uuid not null references cn_sales.ledger_uploads(id) on delete cascade,
  summary_json jsonb not null,
  row_results_json jsonb not null,
  created_at timestamptz not null default now()
);

create table cn_sales.sales_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  ledger_row_id uuid not null references cn_sales.ledger_rows(id) on delete cascade,
  customer_id uuid references cn_sales.customers(id),
  part_id uuid not null references cn_sales.sales_parts(id),
  transaction_date date not null,
  sales_amount numeric(18, 2) not null,
  source_row_type cn_sales.ledger_row_type not null check (source_row_type = 'customer_total')
);

create table cn_sales.receipt_transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  ledger_row_id uuid not null references cn_sales.ledger_rows(id) on delete cascade,
  customer_id uuid references cn_sales.customers(id),
  part_id uuid not null references cn_sales.sales_parts(id),
  transaction_date date not null,
  receipt_amount numeric(18, 2) not null,
  receipt_discount numeric(18, 2) not null default 0,
  total_receipt_amount numeric(18, 2) generated always as (receipt_amount + receipt_discount) stored
);

create table cn_sales.ar_snapshots (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  ledger_row_id uuid references cn_sales.ledger_rows(id) on delete cascade,
  customer_id uuid references cn_sales.customers(id),
  part_id uuid not null references cn_sales.sales_parts(id),
  snapshot_date date not null,
  ar_balance numeric(18, 2) not null,
  constraint cn_sales_ar_snapshots_identity_unique unique (company_id, customer_id, snapshot_date, ledger_row_id)
);

create table cn_sales.monthly_targets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  part_id uuid not null references cn_sales.sales_parts(id),
  target_month date not null,
  sales_target numeric(18, 2) not null default 0,
  receipt_target numeric(18, 2) not null default 0,
  constraint cn_sales_monthly_targets_part_month_unique unique (company_id, part_id, target_month)
);

create table cn_sales.claims (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  claim_date date not null,
  part_code text,
  customer_id uuid references cn_sales.customers(id),
  customer_name text,
  product_name text,
  claim_type text not null,
  issue_summary text not null,
  raw_message text,
  cause_type text,
  action_type text,
  status cn_sales.claim_status not null default '접수',
  prevention_note text,
  assigned_to uuid references cn_sales.profiles(id),
  source text not null default 'manual',
  created_by uuid references cn_sales.profiles(id),
  created_at timestamptz not null default now()
);

create table cn_sales.claim_attachments (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references cn_sales.claims(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create table cn_sales.visit_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  customer_id uuid references cn_sales.customers(id),
  part_code text,
  sales_rep_id uuid references cn_sales.sales_reps(id),
  visit_datetime timestamptz not null,
  visit_purpose text not null,
  consultation_type text,
  summary text not null,
  ar_related boolean not null default false,
  promised_date date,
  promised_amount numeric(18, 2),
  product_related boolean not null default false,
  suggested_products text[],
  claim_related boolean not null default false,
  next_action text,
  next_action_date date,
  status text not null default '기록',
  location_lat numeric(10, 7),
  location_lng numeric(10, 7),
  created_by uuid references cn_sales.profiles(id),
  created_at timestamptz not null default now()
);

create table cn_sales.visit_log_attachments (
  id uuid primary key default gen_random_uuid(),
  visit_log_id uuid not null references cn_sales.visit_logs(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  created_at timestamptz not null default now()
);

create table cn_sales.visit_log_products (
  id uuid primary key default gen_random_uuid(),
  visit_log_id uuid not null references cn_sales.visit_logs(id) on delete cascade,
  product_id uuid references cn_sales.products(id),
  product_name text not null,
  note text
);

create table cn_sales.task_promises (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  customer_id uuid references cn_sales.customers(id),
  part_code text,
  sales_rep_id uuid references cn_sales.sales_reps(id),
  source_type text not null,
  source_id uuid,
  promise_type text not null,
  title text not null,
  description text,
  promised_date date not null,
  promised_time time,
  promised_amount numeric(18, 2),
  status cn_sales.promise_status not null default '예정',
  priority integer not null default 3,
  completed_at timestamptz,
  completed_by uuid references cn_sales.profiles(id),
  postponed_count integer not null default 0,
  last_postponed_at timestamptz,
  created_by uuid references cn_sales.profiles(id),
  created_at timestamptz not null default now()
);

create table cn_sales.report_exports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  report_type text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'queued',
  storage_path text,
  created_by uuid references cn_sales.profiles(id),
  created_at timestamptz not null default now()
);

create index cn_sales_ledger_rows_company_type_date_idx on cn_sales.ledger_rows (company_id, row_type, ledger_date);
create index cn_sales_ledger_rows_customer_date_idx on cn_sales.ledger_rows (customer_id, ledger_date);
create index cn_sales_sales_transactions_part_date_idx on cn_sales.sales_transactions (part_id, transaction_date);
create index cn_sales_receipt_transactions_part_date_idx on cn_sales.receipt_transactions (part_id, transaction_date);
create index cn_sales_ar_snapshots_customer_date_idx on cn_sales.ar_snapshots (customer_id, snapshot_date desc);
create index cn_sales_task_promises_status_date_idx on cn_sales.task_promises (status, promised_date);
create index cn_sales_product_price_history_customer_product_idx on cn_sales.product_price_history (customer_id, product_id, price_date desc);
create index cn_sales_customer_links_customer_idx on cn_sales.customer_links (cn_sales_customer_id);
create index cn_sales_product_links_product_idx on cn_sales.product_links (cn_sales_product_id);

alter table cn_sales.companies enable row level security;
alter table cn_sales.profiles enable row level security;
alter table cn_sales.sales_parts enable row level security;
alter table cn_sales.sales_reps enable row level security;
alter table cn_sales.customers enable row level security;
alter table cn_sales.product_groups enable row level security;
alter table cn_sales.products enable row level security;
alter table cn_sales.customer_links enable row level security;
alter table cn_sales.product_links enable row level security;
alter table cn_sales.product_price_history enable row level security;
alter table cn_sales.ledger_uploads enable row level security;
alter table cn_sales.ledger_rows enable row level security;
alter table cn_sales.ledger_row_versions enable row level security;
alter table cn_sales.upload_preview_results enable row level security;
alter table cn_sales.sales_transactions enable row level security;
alter table cn_sales.receipt_transactions enable row level security;
alter table cn_sales.ar_snapshots enable row level security;
alter table cn_sales.monthly_targets enable row level security;
alter table cn_sales.claims enable row level security;
alter table cn_sales.claim_attachments enable row level security;
alter table cn_sales.visit_logs enable row level security;
alter table cn_sales.visit_log_attachments enable row level security;
alter table cn_sales.visit_log_products enable row level security;
alter table cn_sales.task_promises enable row level security;
alter table cn_sales.report_exports enable row level security;

create or replace function cn_sales.current_company_id()
returns uuid
language sql
stable
security invoker
as $$
  select company_id from cn_sales.profiles where id = auth.uid()
$$;

create or replace function cn_sales.current_user_role()
returns cn_sales.user_role
language sql
stable
security invoker
as $$
  select role from cn_sales.profiles where id = auth.uid()
$$;

create policy "profiles own company read" on cn_sales.profiles
for select using (company_id = cn_sales.current_company_id());

create policy "company scoped read companies" on cn_sales.companies
for select using (id = cn_sales.current_company_id());

create policy "company scoped read sales parts" on cn_sales.sales_parts
for select using (company_id = cn_sales.current_company_id());

create policy "company scoped read reps" on cn_sales.sales_reps
for select using (company_id = cn_sales.current_company_id());

create policy "role scoped customers read" on cn_sales.customers
for select using (
  company_id = cn_sales.current_company_id()
  and (
    cn_sales.current_user_role() in ('team_leader', 'executive', 'admin')
    or sales_rep_id in (select id from cn_sales.sales_reps where profile_id = auth.uid())
    or part_id in (
      select part_id from cn_sales.sales_reps
      where profile_id = auth.uid()
      and cn_sales.current_user_role() = 'part_leader'
    )
  )
);

create policy "admin customers write" on cn_sales.customers
for all using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin')
with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');

create policy "company read products" on cn_sales.products
for select using (company_id = cn_sales.current_company_id());

create policy "admin products write" on cn_sales.products
for all using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin')
with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');

create policy "company read customer links" on cn_sales.customer_links
for select using (
  exists (
    select 1 from cn_sales.customers c
    where c.id = customer_links.cn_sales_customer_id
    and c.company_id = cn_sales.current_company_id()
  )
);

create policy "admin write customer links" on cn_sales.customer_links
for all using (
  cn_sales.current_user_role() = 'admin'
  and exists (
    select 1 from cn_sales.customers c
    where c.id = customer_links.cn_sales_customer_id
    and c.company_id = cn_sales.current_company_id()
  )
)
with check (
  cn_sales.current_user_role() = 'admin'
  and exists (
    select 1 from cn_sales.customers c
    where c.id = customer_links.cn_sales_customer_id
    and c.company_id = cn_sales.current_company_id()
  )
);

create policy "company read product links" on cn_sales.product_links
for select using (
  exists (
    select 1 from cn_sales.products p
    where p.id = product_links.cn_sales_product_id
    and p.company_id = cn_sales.current_company_id()
  )
);

create policy "admin write product links" on cn_sales.product_links
for all using (
  cn_sales.current_user_role() = 'admin'
  and exists (
    select 1 from cn_sales.products p
    where p.id = product_links.cn_sales_product_id
    and p.company_id = cn_sales.current_company_id()
  )
)
with check (
  cn_sales.current_user_role() = 'admin'
  and exists (
    select 1 from cn_sales.products p
    where p.id = product_links.cn_sales_product_id
    and p.company_id = cn_sales.current_company_id()
  )
);

create policy "admin upload write" on cn_sales.ledger_uploads
for all using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin')
with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');

create policy "company read ledger rows" on cn_sales.ledger_rows
for select using (company_id = cn_sales.current_company_id());

create policy "admin write ledger rows" on cn_sales.ledger_rows
for all using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin')
with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');

create policy "admin read ledger versions" on cn_sales.ledger_row_versions
for select using (
  exists (
    select 1 from cn_sales.ledger_rows lr
    where lr.id = ledger_row_versions.ledger_row_id
    and lr.company_id = cn_sales.current_company_id()
  )
);

create policy "admin write ledger versions" on cn_sales.ledger_row_versions
for insert with check (
  cn_sales.current_user_role() = 'admin'
  and exists (
    select 1 from cn_sales.ledger_rows lr
    where lr.id = ledger_row_versions.ledger_row_id
    and lr.company_id = cn_sales.current_company_id()
  )
);

create policy "admin preview results write" on cn_sales.upload_preview_results
for all using (
  cn_sales.current_user_role() = 'admin'
  and exists (
    select 1 from cn_sales.ledger_uploads lu
    where lu.id = upload_preview_results.upload_id
    and lu.company_id = cn_sales.current_company_id()
  )
)
with check (
  cn_sales.current_user_role() = 'admin'
  and exists (
    select 1 from cn_sales.ledger_uploads lu
    where lu.id = upload_preview_results.upload_id
    and lu.company_id = cn_sales.current_company_id()
  )
);

create policy "company read normalized sales" on cn_sales.sales_transactions for select using (company_id = cn_sales.current_company_id());
create policy "company read normalized receipts" on cn_sales.receipt_transactions for select using (company_id = cn_sales.current_company_id());
create policy "company read ar" on cn_sales.ar_snapshots for select using (company_id = cn_sales.current_company_id());
create policy "admin write normalized sales" on cn_sales.sales_transactions for all using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin') with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');
create policy "admin write normalized receipts" on cn_sales.receipt_transactions for all using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin') with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');
create policy "admin write ar" on cn_sales.ar_snapshots for all using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin') with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');
create policy "company read product price history" on cn_sales.product_price_history for select using (company_id = cn_sales.current_company_id());
create policy "admin write product price history" on cn_sales.product_price_history for all using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin') with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');
create policy "company read claims" on cn_sales.claims for select using (company_id = cn_sales.current_company_id());
create policy "company write manual claims" on cn_sales.claims for insert with check (company_id = cn_sales.current_company_id());
create policy "company read visits" on cn_sales.visit_logs for select using (company_id = cn_sales.current_company_id());
create policy "company write visits" on cn_sales.visit_logs for insert with check (company_id = cn_sales.current_company_id());
create policy "company read promises" on cn_sales.task_promises for select using (company_id = cn_sales.current_company_id());
create policy "company write promises" on cn_sales.task_promises for insert with check (company_id = cn_sales.current_company_id());

insert into storage.buckets (id, name, public)
values ('cn-sales-ledgers', 'cn-sales-ledgers', false)
on conflict (id) do nothing;

create policy "admin ledger upload objects read" on storage.objects
for select using (
  bucket_id = 'cn-sales-ledgers'
  and cn_sales.current_user_role() = 'admin'
);

create policy "admin ledger upload objects write" on storage.objects
for insert with check (
  bucket_id = 'cn-sales-ledgers'
  and cn_sales.current_user_role() = 'admin'
);

grant usage on schema cn_sales to authenticated;
grant usage on schema cn_sales to service_role;

grant select on
  cn_sales.companies,
  cn_sales.profiles,
  cn_sales.sales_parts,
  cn_sales.sales_reps,
  cn_sales.customers,
  cn_sales.products,
  cn_sales.product_groups,
  cn_sales.customer_links,
  cn_sales.product_links,
  cn_sales.sales_transactions,
  cn_sales.receipt_transactions,
  cn_sales.ar_snapshots,
  cn_sales.monthly_targets,
  cn_sales.claims,
  cn_sales.visit_logs,
  cn_sales.task_promises,
  cn_sales.report_exports
to authenticated;

grant all on all tables in schema cn_sales to service_role;
grant all on all routines in schema cn_sales to service_role;
grant all on all sequences in schema cn_sales to service_role;



