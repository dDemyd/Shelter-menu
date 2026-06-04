-- Global "likes" counter on products. Anonymous guests can toggle their like
-- through a SECURITY DEFINER RPC. Per-user dedup is done client-side via
-- localStorage; the counter is informational/social, not a strict vote.

alter table products
  add column if not exists likes_count int not null default 0;

create or replace function toggle_like(p_product_id uuid, p_liked boolean)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count int;
begin
  update products
     set likes_count = greatest(0, likes_count + case when p_liked then 1 else -1 end)
   where id = p_product_id
     and is_active = true
  returning likes_count into new_count;

  return coalesce(new_count, 0);
end $$;

revoke all on function toggle_like(uuid, boolean) from public;
grant execute on function toggle_like(uuid, boolean) to anon, authenticated;
