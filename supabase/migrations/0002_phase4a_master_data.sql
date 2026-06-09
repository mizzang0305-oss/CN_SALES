-- Phase 4-A ERP mapping and master-data foundation.
-- Additive migration only. Do not apply without separate operator approval.
-- Scope guard: cn_sales schema only. Existing public ERP tables are read-only references.

alter table cn_sales.sales_parts
  add column if not exists source text not null default 'ledger',
  add column if not exists is_active boolean not null default true,
  add column if not exists first_seen_at timestamptz,
  add column if not exists last_seen_at timestamptz;

alter table cn_sales.sales_reps
  add column if not exists source text not null default 'ledger',
  add column if not exists is_active boolean not null default true,
  add column if not exists raw_rep_name text,
  add column if not exists normalized_rep_name text,
  add column if not exists first_seen_at timestamptz,
  add column if not exists last_seen_at timestamptz;

alter table cn_sales.customers
  add column if not exists raw_customer_name text,
  add column if not exists normalized_customer_name text,
  add column if not exists normalized_business_no text,
  add column if not exists source text not null default 'ledger',
  add column if not exists first_seen_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_ledger_date date;

alter table cn_sales.products
  add column if not exists raw_product_name text,
  add column if not exists normalized_product_name text,
  add column if not exists source text not null default 'ledger',
  add column if not exists first_seen_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_ledger_date date;

create table if not exists cn_sales.customer_aliases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  customer_id uuid not null references cn_sales.customers(id) on delete cascade,
  alias_name text not null,
  normalized_alias_name text not null,
  source text not null default 'ledger',
  created_by uuid references cn_sales.profiles(id),
  created_at timestamptz not null default now(),
  constraint cn_sales_customer_aliases_company_alias_unique unique (company_id, normalized_alias_name)
);

create table if not exists cn_sales.product_aliases (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  product_id uuid not null references cn_sales.products(id) on delete cascade,
  alias_name text not null,
  normalized_alias_name text not null,
  source text not null default 'ledger',
  created_by uuid references cn_sales.profiles(id),
  created_at timestamptz not null default now(),
  constraint cn_sales_product_aliases_company_alias_unique unique (company_id, normalized_alias_name)
);

create table if not exists cn_sales.master_merge_candidates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  entity_type text not null check (entity_type in ('customer', 'product')),
  source_id uuid not null,
  candidate_id uuid not null,
  reason text not null,
  confidence numeric(5, 4) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'merged', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references cn_sales.profiles(id),
  reviewed_at timestamptz,
  review_note text,
  constraint cn_sales_master_merge_candidates_confidence_check check (confidence >= 0 and confidence <= 1),
  constraint cn_sales_master_merge_candidates_unique unique (company_id, entity_type, source_id, candidate_id)
);

create table if not exists cn_sales.customer_product_usage (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  customer_id uuid not null references cn_sales.customers(id) on delete cascade,
  product_id uuid not null references cn_sales.products(id) on delete cascade,
  part_id uuid not null references cn_sales.sales_parts(id),
  sales_rep_id uuid references cn_sales.sales_reps(id),
  first_purchase_date date,
  last_purchase_date date,
  last_quantity numeric(18, 4) not null default 0,
  last_unit_price numeric(18, 2) not null default 0,
  purchase_count integer not null default 0 check (purchase_count >= 0),
  total_quantity numeric(18, 4) not null default 0,
  total_sales_amount numeric(18, 2) not null default 0,
  usage_status text not null default 'active' check (usage_status in ('active', 'new', 'churn_watch', 'churn_risk', 'churned')),
  updated_at timestamptz not null default now(),
  constraint cn_sales_customer_product_usage_unique unique (company_id, customer_id, product_id, part_id)
);

create table if not exists cn_sales.erp_customer_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  cn_sales_customer_id uuid not null references cn_sales.customers(id) on delete cascade,
  erp_vendor_code text not null,
  erp_vendor_name text not null,
  erp_biz_no text,
  match_type text not null check (match_type in ('exact_name', 'normalized_name', 'biz_no', 'manual')),
  confidence numeric(5, 4) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'linked', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references cn_sales.profiles(id),
  reviewed_at timestamptz,
  constraint cn_sales_erp_customer_links_confidence_check check (confidence >= 0 and confidence <= 1),
  constraint cn_sales_erp_customer_links_unique unique (company_id, cn_sales_customer_id, erp_vendor_code)
);

create table if not exists cn_sales.erp_product_links (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  cn_sales_product_id uuid not null references cn_sales.products(id) on delete cascade,
  erp_product_code text not null,
  erp_product_name text not null,
  erp_barcode text,
  match_type text not null check (match_type in ('exact_name', 'normalized_name', 'barcode', 'manual')),
  confidence numeric(5, 4) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'linked', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references cn_sales.profiles(id),
  reviewed_at timestamptz,
  constraint cn_sales_erp_product_links_confidence_check check (confidence >= 0 and confidence <= 1),
  constraint cn_sales_erp_product_links_unique unique (company_id, cn_sales_product_id, erp_product_code)
);

create table if not exists cn_sales.erp_match_candidates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  entity_type text not null check (entity_type in ('customer', 'product')),
  cn_sales_entity_id uuid not null,
  erp_code text not null,
  erp_name text not null,
  reason text not null,
  confidence numeric(5, 4) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz not null default now(),
  constraint cn_sales_erp_match_candidates_confidence_check check (confidence >= 0 and confidence <= 1),
  constraint cn_sales_erp_match_candidates_unique unique (company_id, entity_type, cn_sales_entity_id, erp_code)
);

create index if not exists cn_sales_customers_normalized_name_idx on cn_sales.customers (company_id, normalized_customer_name);
create index if not exists cn_sales_products_normalized_name_idx on cn_sales.products (company_id, normalized_product_name);
create index if not exists cn_sales_customer_aliases_customer_idx on cn_sales.customer_aliases (customer_id);
create index if not exists cn_sales_product_aliases_product_idx on cn_sales.product_aliases (product_id);
create index if not exists cn_sales_master_merge_candidates_status_idx on cn_sales.master_merge_candidates (company_id, status, entity_type, created_at desc);
create index if not exists cn_sales_customer_product_usage_customer_idx on cn_sales.customer_product_usage (customer_id, usage_status, last_purchase_date desc);
create index if not exists cn_sales_customer_product_usage_product_idx on cn_sales.customer_product_usage (product_id, usage_status, last_purchase_date desc);
create index if not exists cn_sales_erp_customer_links_status_idx on cn_sales.erp_customer_links (company_id, status, erp_vendor_code);
create index if not exists cn_sales_erp_product_links_status_idx on cn_sales.erp_product_links (company_id, status, erp_product_code);
create index if not exists cn_sales_erp_match_candidates_status_idx on cn_sales.erp_match_candidates (company_id, entity_type, status, created_at desc);

alter table cn_sales.customer_aliases enable row level security;
alter table cn_sales.product_aliases enable row level security;
alter table cn_sales.master_merge_candidates enable row level security;
alter table cn_sales.customer_product_usage enable row level security;
alter table cn_sales.erp_customer_links enable row level security;
alter table cn_sales.erp_product_links enable row level security;
alter table cn_sales.erp_match_candidates enable row level security;

create policy "company read customer aliases" on cn_sales.customer_aliases
for select to authenticated using (company_id = cn_sales.current_company_id());

create policy "admin write customer aliases" on cn_sales.customer_aliases
for all to authenticated using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin')
with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');

create policy "company read product aliases" on cn_sales.product_aliases
for select to authenticated using (company_id = cn_sales.current_company_id());

create policy "admin write product aliases" on cn_sales.product_aliases
for all to authenticated using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin')
with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');

create policy "company read merge candidates" on cn_sales.master_merge_candidates
for select to authenticated using (company_id = cn_sales.current_company_id());

create policy "admin write merge candidates" on cn_sales.master_merge_candidates
for all to authenticated using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin')
with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');

create policy "company read customer product usage" on cn_sales.customer_product_usage
for select to authenticated using (company_id = cn_sales.current_company_id());

create policy "admin write customer product usage" on cn_sales.customer_product_usage
for all to authenticated using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin')
with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');

create policy "company read erp customer links" on cn_sales.erp_customer_links
for select to authenticated using (company_id = cn_sales.current_company_id());

create policy "admin write erp customer links" on cn_sales.erp_customer_links
for all to authenticated using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin')
with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');

create policy "company read erp product links" on cn_sales.erp_product_links
for select to authenticated using (company_id = cn_sales.current_company_id());

create policy "admin write erp product links" on cn_sales.erp_product_links
for all to authenticated using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin')
with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');

create policy "company read erp match candidates" on cn_sales.erp_match_candidates
for select to authenticated using (company_id = cn_sales.current_company_id());

create policy "admin write erp match candidates" on cn_sales.erp_match_candidates
for all to authenticated using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin')
with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');

grant select on
  cn_sales.customer_aliases,
  cn_sales.product_aliases,
  cn_sales.master_merge_candidates,
  cn_sales.customer_product_usage,
  cn_sales.erp_customer_links,
  cn_sales.erp_product_links,
  cn_sales.erp_match_candidates
to authenticated;

grant all on
  cn_sales.customer_aliases,
  cn_sales.product_aliases,
  cn_sales.master_merge_candidates,
  cn_sales.customer_product_usage,
  cn_sales.erp_customer_links,
  cn_sales.erp_product_links,
  cn_sales.erp_match_candidates
to service_role;
