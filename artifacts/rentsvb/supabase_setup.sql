-- RentSVB — TAM baza qurulumu (tətbiqin bütün 5 cədvəli)
-- Supabase Dashboard → SQL Editor → bu kodu tam yapışdır → RUN
-- QEYD: Köhnə/test cədvəlləri təmizlənir. Real data yoxdursa problem yoxdur.

-- Köhnə cədvəlləri sil (FK sırası üçün cascade)
drop table if exists rentals cascade;
drop table if exists owner_requests cascade;
drop table if exists properties cascade;
drop table if exists settings cascade;
drop table if exists profiles cascade;

-- 1. profiles — istifadəçilər / ev sahibləri / admin
create table profiles (
  id uuid default gen_random_uuid() primary key,
  full_name text,
  phone text,
  telegram_username text,
  telegram_id bigint unique,
  role text not null default 'user' check (role in ('user','owner','admin')),
  is_approved boolean not null default false,
  is_blocked boolean not null default false,
  created_at timestamptz default now()
);

-- 2. properties — mənzil elanları
create table properties (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references profiles(id) on delete cascade,
  rooms integer not null default 1,
  address text not null,
  district text,
  price_type text not null default 'fixed' check (price_type in ('fixed','weekday_weekend','negotiable')),
  price_weekday integer,
  price_weekend integer,
  max_people integer not null default 1,
  salary_credit boolean not null default false,
  advance_credit boolean not null default false,
  description text default '',
  status text not null default 'available' check (status in ('available','busy','salary_credit')),
  images text[] default '{}',
  created_at timestamptz default now()
);

-- 3. owner_requests — ev sahibi olmaq müraciətləri
create table owner_requests (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  phone text not null,
  telegram_username text,
  telegram_id bigint,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz default now()
);

-- 4. rentals — icarələr / komissiya
create table rentals (
  id uuid default gen_random_uuid() primary key,
  property_id uuid references properties(id) on delete cascade,
  owner_id uuid references profiles(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  days integer not null default 1,
  price_per_day integer not null default 0,
  commission_rate integer not null default 10,
  commission_amount integer not null default 0,
  is_paid boolean not null default false,
  paid_at timestamptz,
  note text,
  created_at timestamptz default now()
);

-- 5. settings — açar/dəyər (komissiya faizi və s.)
create table settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);
insert into settings (key, value) values ('commission_rate','10')
on conflict (key) do nothing;

-- RLS — Telegram Mini App: auth Telegram tərəfdədir, hamıya icazə
alter table profiles enable row level security;
alter table properties enable row level security;
alter table owner_requests enable row level security;
alter table rentals enable row level security;
alter table settings enable row level security;

create policy "profiles_all" on profiles for all using (true) with check (true);
create policy "properties_all" on properties for all using (true) with check (true);
create policy "owner_requests_all" on owner_requests for all using (true) with check (true);
create policy "rentals_all" on rentals for all using (true) with check (true);
create policy "settings_all" on settings for all using (true) with check (true);

-- Storage bucket — elan şəkilləri
insert into storage.buckets (id, name, public)
values ('property-images','property-images', true)
on conflict (id) do nothing;

drop policy if exists "img_upload" on storage.objects;
drop policy if exists "img_view" on storage.objects;
create policy "img_upload" on storage.objects for insert with check (bucket_id = 'property-images');
create policy "img_view" on storage.objects for select using (bucket_id = 'property-images');

-- Admin profili (Telegram ID 5831496354)
insert into profiles (full_name, telegram_id, role, is_approved)
values ('Admin', 5831496354, 'admin', true)
on conflict (telegram_id) do update set role = 'admin', is_approved = true;

-- Yoxlama
select id, full_name, role, telegram_id from profiles where role = 'admin';
