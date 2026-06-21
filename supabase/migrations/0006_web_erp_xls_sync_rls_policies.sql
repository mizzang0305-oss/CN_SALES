-- W-21A DRAFT ONLY.
-- WEB_ERP_XLS_SYNC_SCHEMA_APPLY_APPROVED was provided for schema apply scope,
-- target selected in W-21 recovery: cwkjdbllgyojpggjjfhv / mizzang0307 / production.
-- No schema apply in this PR.
-- No sync execute without WEB_ERP_XLS_SYNC_EXECUTE_APPROVED.
-- No physical delete.
-- No raw row API output.
-- rawRowsReturned=false must remain the API contract.

revoke all on table
  cn_sales.sales_import_batches,
  cn_sales.sales_import_rows,
  cn_sales.sales_current_records,
  cn_sales.sales_import_change_summaries,
  cn_sales.sales_change_audit_logs
from anon;

revoke insert, update, delete on table
  cn_sales.sales_import_batches,
  cn_sales.sales_import_rows,
  cn_sales.sales_current_records,
  cn_sales.sales_import_change_summaries,
  cn_sales.sales_change_audit_logs
from authenticated;

grant select on table
  cn_sales.sales_import_batches,
  cn_sales.sales_import_rows,
  cn_sales.sales_current_records,
  cn_sales.sales_import_change_summaries,
  cn_sales.sales_change_audit_logs
to authenticated;

create policy "web import batches scoped read" on cn_sales.sales_import_batches
for select to authenticated using (
  company_id = cn_sales.current_company_id()
  and (
    cn_sales.current_user_role() in ('team_leader', 'executive', 'admin')
    or exists (
      select 1
      from cn_sales.user_scope_assignments usa
      where usa.company_id = sales_import_batches.company_id
        and usa.user_id = auth.uid()
        and usa.scope_type = 'part'
        and usa.scope_value = sales_import_batches.part
        and usa.can_view = true
    )
    or exists (
      select 1
      from cn_sales.sales_reps sr
      join cn_sales.sales_parts sp on sp.id = sr.part_id
      where sr.company_id = sales_import_batches.company_id
        and sp.company_id = sales_import_batches.company_id
        and sr.profile_id = auth.uid()
        and sp.part_code = sales_import_batches.part
    )
  )
);

create policy "web import rows scoped read" on cn_sales.sales_import_rows
for select to authenticated using (
  company_id = cn_sales.current_company_id()
  and (
    cn_sales.current_user_role() in ('team_leader', 'executive', 'admin')
    or exists (
      select 1
      from cn_sales.user_scope_assignments usa
      where usa.company_id = sales_import_rows.company_id
        and usa.user_id = auth.uid()
        and usa.scope_type = 'part'
        and usa.scope_value = sales_import_rows.part
        and usa.can_view = true
    )
    or exists (
      select 1
      from cn_sales.sales_reps sr
      join cn_sales.sales_parts sp on sp.id = sr.part_id
      where sr.company_id = sales_import_rows.company_id
        and sp.company_id = sales_import_rows.company_id
        and sr.profile_id = auth.uid()
        and sp.part_code = sales_import_rows.part
    )
  )
);

create policy "web current records scoped read" on cn_sales.sales_current_records
for select to authenticated using (
  company_id = cn_sales.current_company_id()
  and (
    cn_sales.current_user_role() in ('team_leader', 'executive', 'admin')
    or exists (
      select 1
      from cn_sales.user_scope_assignments usa
      where usa.company_id = sales_current_records.company_id
        and usa.user_id = auth.uid()
        and usa.scope_type = 'part'
        and usa.scope_value = sales_current_records.part
        and usa.can_view = true
    )
    or exists (
      select 1
      from cn_sales.sales_reps sr
      join cn_sales.sales_parts sp on sp.id = sr.part_id
      where sr.company_id = sales_current_records.company_id
        and sp.company_id = sales_current_records.company_id
        and sr.profile_id = auth.uid()
        and sp.part_code = sales_current_records.part
    )
  )
);

create policy "web import summaries scoped read" on cn_sales.sales_import_change_summaries
for select to authenticated using (
  company_id = cn_sales.current_company_id()
  and (
    cn_sales.current_user_role() in ('team_leader', 'executive', 'admin')
    or exists (
      select 1
      from cn_sales.user_scope_assignments usa
      where usa.company_id = sales_import_change_summaries.company_id
        and usa.user_id = auth.uid()
        and usa.scope_type = 'part'
        and usa.scope_value = sales_import_change_summaries.part
        and usa.can_view = true
    )
    or exists (
      select 1
      from cn_sales.sales_reps sr
      join cn_sales.sales_parts sp on sp.id = sr.part_id
      where sr.company_id = sales_import_change_summaries.company_id
        and sp.company_id = sales_import_change_summaries.company_id
        and sr.profile_id = auth.uid()
        and sp.part_code = sales_import_change_summaries.part
    )
  )
);

create policy "web change audit logs scoped read" on cn_sales.sales_change_audit_logs
for select to authenticated using (
  company_id = cn_sales.current_company_id()
  and (
    cn_sales.current_user_role() in ('team_leader', 'executive', 'admin')
    or exists (
      select 1
      from cn_sales.user_scope_assignments usa
      where usa.company_id = sales_change_audit_logs.company_id
        and usa.user_id = auth.uid()
        and usa.scope_type = 'part'
        and usa.scope_value = sales_change_audit_logs.part
        and usa.can_view = true
    )
    or exists (
      select 1
      from cn_sales.sales_reps sr
      join cn_sales.sales_parts sp on sp.id = sr.part_id
      where sr.company_id = sales_change_audit_logs.company_id
        and sp.company_id = sales_change_audit_logs.company_id
        and sr.profile_id = auth.uid()
        and sp.part_code = sales_change_audit_logs.part
    )
  )
);
