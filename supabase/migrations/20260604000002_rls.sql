-- SHELTER QR Menu — Row Level Security
-- Public can SELECT active menu data and public settings.
-- Authenticated admins/managers can CRUD everything.
-- Anonymous can INSERT call_requests (forced via serverless), admins manage.

create or replace function is_staff()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','manager')
  )
$$;

create or replace function is_admin()
returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

-- ---------- profiles ----------
alter table profiles enable row level security;

create policy "profile self read" on profiles
  for select using (auth.uid() = id or is_admin());

create policy "profile self update" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()));

create policy "admin manages profiles" on profiles
  for all using (is_admin()) with check (is_admin());

-- ---------- categories ----------
alter table categories enable row level security;

create policy "public reads active categories" on categories
  for select using (is_active or is_staff());

create policy "staff manages categories" on categories
  for all using (is_staff()) with check (is_staff());

-- ---------- subcategories ----------
alter table subcategories enable row level security;

create policy "public reads active subcategories" on subcategories
  for select using (is_active or is_staff());

create policy "staff manages subcategories" on subcategories
  for all using (is_staff()) with check (is_staff());

-- ---------- products ----------
alter table products enable row level security;

create policy "public reads active products" on products
  for select using (is_active or is_staff());

create policy "staff manages products" on products
  for all using (is_staff()) with check (is_staff());

-- ---------- category_banners ----------
alter table category_banners enable row level security;

create policy "public reads active banners" on category_banners
  for select using (
    is_staff() or (
      is_active
      and (starts_at is null or starts_at <= now())
      and (ends_at   is null or ends_at   >= now())
    )
  );

create policy "staff manages banners" on category_banners
  for all using (is_staff()) with check (is_staff());

-- ---------- call_requests ----------
alter table call_requests enable row level security;

-- Public clients cannot read; only staff.
create policy "staff reads calls" on call_requests
  for select using (is_staff());

create policy "staff updates calls" on call_requests
  for update using (is_staff()) with check (is_staff());

create policy "staff deletes calls" on call_requests
  for delete using (is_staff());

-- INSERTs happen exclusively via serverless function (service role).
-- We intentionally do NOT grant INSERT to anon/authenticated here.

-- ---------- settings ----------
alter table settings enable row level security;

create policy "public reads public settings" on settings
  for select using (is_public or is_staff());

create policy "staff manages settings" on settings
  for all using (is_staff()) with check (is_staff());
