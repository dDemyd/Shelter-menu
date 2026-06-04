-- Guest-side "my orders" view.
-- 1) Distinguish "just called bartender" (draft) vs "submitted order" via `kind`.
-- 2) RPC `get_my_requests(ids)` lets anon read only their own rows by UUID.

alter table call_requests
  add column if not exists kind text not null default 'call'
    check (kind in ('call','order'));

create index if not exists calls_kind_idx on call_requests (kind, created_at desc);

-- Anon-callable, returns matching rows. Since UUIDs are unguessable,
-- a guest can only see rows whose IDs they already know (saved client-side).
create or replace function get_my_requests(ids uuid[])
returns setof call_requests
language sql
stable
security definer
set search_path = public
as $$
  select *
    from call_requests
   where id = any(ids)
   order by created_at desc
$$;

revoke all on function get_my_requests(uuid[]) from public;
grant execute on function get_my_requests(uuid[]) to anon, authenticated;
