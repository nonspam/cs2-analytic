revoke execute on function public.commit_cs2_state(bigint,jsonb,text,text,text,jsonb,text,uuid) from public, anon, authenticated;
grant execute on function public.commit_cs2_state(bigint,jsonb,text,text,text,jsonb,text,uuid) to service_role;

revoke execute on function public.is_cs2_admin() from public, anon;
grant execute on function public.is_cs2_admin() to authenticated, service_role;

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

create index if not exists idx_cs2_app_state_updated_by on public.cs2_app_state(updated_by);
create index if not exists idx_cs2_audit_log_operation_id on public.cs2_audit_log(operation_id);
