-- Phase 4-C scope and mobile customer briefing foundation.
-- Additive migration only. Do not apply without separate operator approval.
-- Scope guard: cn_sales schema only. Existing public ERP tables remain read-only references.

create table if not exists cn_sales.user_scope_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references cn_sales.companies(id),
  user_id uuid not null references cn_sales.profiles(id),
  scope_type text not null check (scope_type in ('company', 'team', 'part', 'sales_rep', 'customer')),
  scope_value text not null,
  can_view boolean not null default true,
  can_write boolean not null default false,
  created_at timestamptz not null default now(),
  constraint cn_sales_user_scope_assignments_unique unique (company_id, user_id, scope_type, scope_value)
);

create index if not exists cn_sales_user_scope_assignments_user_idx
  on cn_sales.user_scope_assignments (company_id, user_id, scope_type, scope_value);

create index if not exists cn_sales_user_scope_assignments_scope_idx
  on cn_sales.user_scope_assignments (company_id, scope_type, scope_value)
  where can_view = true;

alter table cn_sales.user_scope_assignments enable row level security;

create policy "users read own scope assignments" on cn_sales.user_scope_assignments
for select to authenticated using (
  company_id = cn_sales.current_company_id()
  and user_id = auth.uid()
  and can_view = true
);

create policy "leaders read company scope assignments" on cn_sales.user_scope_assignments
for select to authenticated using (
  company_id = cn_sales.current_company_id()
  and cn_sales.current_user_role() in ('team_leader', 'executive', 'admin')
);

create policy "admin write scope assignments" on cn_sales.user_scope_assignments
for all to authenticated using (
  company_id = cn_sales.current_company_id()
  and cn_sales.current_user_role() = 'admin'
)
with check (
  company_id = cn_sales.current_company_id()
  and cn_sales.current_user_role() = 'admin'
);

grant select on cn_sales.user_scope_assignments to authenticated;
grant all on cn_sales.user_scope_assignments to service_role;
