-- Phase 3-A seed draft only. Do not apply without operator approval.
-- Replace :admin_auth_user_id with an existing auth.users.id at runtime.
-- This script intentionally does not insert into auth.users.

begin;

with company_seed as (
  insert into cn_sales.companies (id, name)
  values ('00000000-0000-4000-8000-000000000001', 'CN Food')
  on conflict (id) do update set name = excluded.name
  returning id
),
parts_seed(part_code, part_name) as (
  values
    ('1', '1파트'),
    ('4', '4파트'),
    ('5', '5파트'),
    ('6', '6파트'),
    ('7', '7파트'),
    ('9', '9파트'),
    ('10', '10파트'),
    ('11', '11파트')
),
upserted_parts as (
  insert into cn_sales.sales_parts (company_id, part_code, part_name)
  select company_seed.id, parts_seed.part_code, parts_seed.part_name
  from company_seed
  cross join parts_seed
  on conflict on constraint cn_sales_sales_parts_company_part_code_unique
  do update set part_name = excluded.part_name
  returning id, company_id, part_code
),
admin_profile as (
  insert into cn_sales.profiles (id, company_id, full_name, role)
  select :'admin_auth_user_id'::uuid, company_seed.id, 'CN Sales Admin', 'admin'::cn_sales.user_role
  from company_seed
  on conflict (id)
  do update set
    company_id = excluded.company_id,
    full_name = excluded.full_name,
    role = excluded.role
  returning id, company_id
),
sample_reps(rep_code, rep_name, part_code) as (
  values
    ('REP-1-ADMIN', '관리자 1파트', '1'),
    ('REP-4-SAMPLE', '샘플 4파트', '4'),
    ('REP-5-SAMPLE', '샘플 5파트', '5'),
    ('REP-6-SAMPLE', '샘플 6파트', '6'),
    ('REP-7-SAMPLE', '샘플 7파트', '7'),
    ('REP-9-SAMPLE', '샘플 9파트', '9'),
    ('REP-10-SAMPLE', '샘플 10파트', '10'),
    ('REP-11-SAMPLE', '샘플 11파트', '11')
)
insert into cn_sales.sales_reps (company_id, profile_id, part_id, rep_code, rep_name)
select admin_profile.company_id, admin_profile.id, upserted_parts.id, sample_reps.rep_code, sample_reps.rep_name
from sample_reps
join upserted_parts on upserted_parts.part_code = sample_reps.part_code
cross join admin_profile
on conflict on constraint cn_sales_sales_reps_company_rep_code_unique
do update set
  profile_id = excluded.profile_id,
  part_id = excluded.part_id,
  rep_name = excluded.rep_name;

with company_seed as (
  select id from cn_sales.companies where id = '00000000-0000-4000-8000-000000000001'
),
target_seed(part_code, sales_target, receipt_target) as (
  values
    ('1', 0::numeric, 0::numeric),
    ('4', 0::numeric, 0::numeric),
    ('5', 0::numeric, 0::numeric),
    ('6', 0::numeric, 0::numeric),
    ('7', 0::numeric, 0::numeric),
    ('9', 0::numeric, 0::numeric),
    ('10', 0::numeric, 0::numeric),
    ('11', 0::numeric, 0::numeric)
)
insert into cn_sales.monthly_targets (company_id, part_id, target_month, sales_target, receipt_target)
select company_seed.id, sales_parts.id, date '2026-06-01', target_seed.sales_target, target_seed.receipt_target
from target_seed
join cn_sales.sales_parts on sales_parts.part_code = target_seed.part_code
cross join company_seed
on conflict on constraint cn_sales_monthly_targets_part_month_unique
do update set
  sales_target = excluded.sales_target,
  receipt_target = excluded.receipt_target;

commit;
