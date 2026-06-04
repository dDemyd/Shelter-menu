-- Fix: is_staff() / is_admin() recurse through RLS on `profiles`.
-- Mark them SECURITY DEFINER so they bypass RLS while still being safe
-- (they only read the calling user's row by auth.uid()).

create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','manager')
  )
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

revoke all on function is_staff()  from public;
revoke all on function is_admin()  from public;
grant execute on function is_staff()  to anon, authenticated;
grant execute on function is_admin()  to anon, authenticated;
