-- SHELTER QR Menu — base schema
-- All tables track created_at / updated_at via trigger.

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- profiles ----------
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'manager' check (role in ('admin','manager')),
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------- categories ----------
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  code text,
  name_uk text not null,
  name_en text,
  description_uk text,
  description_en text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger categories_updated before update on categories
  for each row execute function set_updated_at();
create index categories_sort_idx on categories (sort_order);

-- ---------- subcategories ----------
create table subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories on delete cascade,
  slug text not null,
  name_uk text not null,
  name_en text,
  note_uk text,
  note_en text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, slug)
);
create trigger subcategories_updated before update on subcategories
  for each row execute function set_updated_at();
create index subcategories_category_idx on subcategories (category_id, sort_order);

-- ---------- products ----------
create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories on delete restrict,
  subcategory_id uuid references subcategories on delete set null,
  slug text not null,
  name_uk text not null,
  name_en text,
  description_uk text,
  description_en text,
  price numeric(10,2),
  price_display text,
  image_url text,
  badges text[] not null default '{}',
  tags text[] not null default '{}',
  is_available boolean not null default true,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, slug)
);
create trigger products_updated before update on products
  for each row execute function set_updated_at();
create index products_category_idx on products (category_id, subcategory_id, sort_order);
create index products_active_idx on products (is_active, is_available);

-- ---------- category_banners ----------
create table category_banners (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories on delete cascade,
  title_uk text not null,
  title_en text,
  description_uk text,
  description_en text,
  image_url text,
  cta_label_uk text,
  cta_label_en text,
  cta_url text,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger banners_updated before update on category_banners
  for each row execute function set_updated_at();
create index banners_category_idx on category_banners (category_id, sort_order);

-- ---------- call_requests ----------
create table call_requests (
  id uuid primary key default gen_random_uuid(),
  table_number text not null,
  items jsonb not null default '[]',
  comment text,
  status text not null default 'new' check (status in ('new','accepted','done','cancelled')),
  telegram_message_id bigint,
  source text not null default 'qr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger calls_updated before update on call_requests
  for each row execute function set_updated_at();
create index calls_status_idx on call_requests (status, created_at desc);

alter publication supabase_realtime add table call_requests;

-- ---------- settings ----------
create table settings (
  key text primary key,
  value jsonb not null,
  is_public boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger settings_updated before update on settings
  for each row execute function set_updated_at();

insert into settings (key, value, is_public) values
  ('hookah_constructor_url', '"https://hookah-shelter.vercel.app/"'::jsonb, true),
  ('venue_name', '"SHELTER"'::jsonb, true),
  ('venue_coords', '"50.4501° N · 30.5234° E"'::jsonb, true),
  ('venue_address', '"Я. МУДРОГО 17 · БЦ"'::jsonb, true),
  ('phone', '"+380677525089"'::jsonb, true),
  ('instagram', '"https://instagram.com/shelter_bc"'::jsonb, true),
  ('tiktok', '"https://tiktok.com/@shelter_bc"'::jsonb, true),
  ('maps_url', '"https://maps.google.com"'::jsonb, true),
  ('telegram_chat_id_override', 'null'::jsonb, false)
  on conflict (key) do nothing;
