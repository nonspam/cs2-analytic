-- Admin login alias for the production web UI.
-- Keeps Supabase Auth as the password verifier while allowing a non-email login label.

create table if not exists public.app_login_aliases (
  username text primary key,
  email text not null references public.app_admins(email) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  check (length(trim(username)) between 3 and 64)
);

alter table public.app_login_aliases enable row level security;
revoke all on public.app_login_aliases from anon, authenticated;

insert into public.app_login_aliases(username, email)
values ('черный флаг', 'daynartem0@gmail.com')
on conflict (username) do update set email = excluded.email;

create or replace function public.resolve_cs2_admin_login(p_username text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select a.email
  from public.app_login_aliases a
  where lower(trim(a.username)) = lower(trim(coalesce(p_username, '')))
  limit 1;
$$;

revoke all on function public.resolve_cs2_admin_login(text) from public, anon, authenticated;
grant execute on function public.resolve_cs2_admin_login(text) to anon, authenticated;
