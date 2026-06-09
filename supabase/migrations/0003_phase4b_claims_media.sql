-- Phase 4-B claims media and resolution foundation.
-- Additive migration only. Do not apply without separate operator approval.
-- Scope guard: cn_sales schema only. Claim media bucket must be created separately after approval.

alter type cn_sales.claim_status add value if not exists '처리완료';
alter type cn_sales.claim_status add value if not exists '재확인필요';

create table if not exists cn_sales.product_solution_guides (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  product_id uuid not null references cn_sales.products(id) on delete cascade,
  issue_type text not null,
  issue_keyword text not null,
  recommended_action text not null,
  prevention_note text,
  last_used_at timestamptz,
  use_count integer not null default 0 check (use_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cn_sales_product_solution_guides_unique unique (company_id, product_id, issue_type, issue_keyword)
);

alter table if exists cn_sales.claims
  add column if not exists product_id uuid references cn_sales.products(id),
  add column if not exists sales_rep_id uuid references cn_sales.sales_reps(id),
  add column if not exists issue_type text,
  add column if not exists final_resolution text,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_by uuid references cn_sales.profiles(id),
  add column if not exists solution_guide_id uuid references cn_sales.product_solution_guides(id);

create table if not exists cn_sales.claim_media_attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  claim_id uuid not null references cn_sales.claims(id) on delete cascade,
  storage_bucket text not null default 'cn-sales-claim-media',
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  file_size bigint not null default 0 check (file_size >= 0),
  media_type text not null check (media_type in ('image', 'video', 'file')),
  uploaded_by uuid references cn_sales.profiles(id),
  created_at timestamptz not null default now(),
  constraint cn_sales_claim_media_attachments_path_unique unique (storage_bucket, storage_path)
);

create table if not exists cn_sales.claim_resolution_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  claim_id uuid not null references cn_sales.claims(id) on delete cascade,
  status text not null,
  action_summary text,
  resolution_summary text,
  prevention_note text,
  created_by uuid references cn_sales.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists cn_sales_product_solution_guides_lookup_idx on cn_sales.product_solution_guides (company_id, product_id, issue_type, use_count desc, updated_at desc);
create index if not exists cn_sales_claim_media_attachments_claim_idx on cn_sales.claim_media_attachments (claim_id, created_at desc);
create index if not exists cn_sales_claim_resolution_history_claim_idx on cn_sales.claim_resolution_history (claim_id, created_at desc);

alter table cn_sales.product_solution_guides enable row level security;
alter table cn_sales.claim_media_attachments enable row level security;
alter table cn_sales.claim_resolution_history enable row level security;

create policy "company read product solution guides" on cn_sales.product_solution_guides
for select to authenticated using (company_id = cn_sales.current_company_id());

create policy "admin write product solution guides" on cn_sales.product_solution_guides
for all to authenticated using (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin')
with check (company_id = cn_sales.current_company_id() and cn_sales.current_user_role() = 'admin');

create policy "company read claim media attachments" on cn_sales.claim_media_attachments
for select to authenticated using (company_id = cn_sales.current_company_id());

create policy "company write claim media attachments" on cn_sales.claim_media_attachments
for insert to authenticated with check (company_id = cn_sales.current_company_id());

create policy "company read claim resolution history" on cn_sales.claim_resolution_history
for select to authenticated using (company_id = cn_sales.current_company_id());

create policy "company write claim resolution history" on cn_sales.claim_resolution_history
for insert to authenticated with check (company_id = cn_sales.current_company_id());

grant select on
  cn_sales.product_solution_guides,
  cn_sales.claim_media_attachments,
  cn_sales.claim_resolution_history
to authenticated;

grant all on
  cn_sales.product_solution_guides,
  cn_sales.claim_media_attachments,
  cn_sales.claim_resolution_history
to service_role;
