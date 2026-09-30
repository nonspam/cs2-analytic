-- Keep the admin commit RPC callable by authenticated Supabase users.
-- Authorization is still enforced inside commit_cs2_state/is_cs2_admin.
grant execute on function public.commit_cs2_state(bigint,jsonb,text,text,text,jsonb,text,uuid) to authenticated;
