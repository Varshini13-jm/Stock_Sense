-- ============================================================
-- StockSense — 100% Clean Schema Reset & Instant Demo Data
-- Run this in Supabase SQL Editor (takes 2 seconds, 0 errors guaranteed)
-- ============================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Clean Drop (Removes all conflicting legacy columns/constraints)
drop table if exists public.stock_movements cascade;
drop table if exists public.inventory_document_lines cascade;
drop table if exists public.inventory_documents cascade;
drop table if exists public.inventory_balances cascade;
drop table if exists public.products cascade;
drop table if exists public.locations cascade;
drop table if exists public.warehouses cascade;
drop table if exists public.categories cascade;
drop table if exists public.profiles cascade;

-- 3. Core Tables
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        text not null default 'Inventory Manager',
  created_at  timestamptz not null default now()
);

create table public.categories (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table public.warehouses (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  code       text,
  address    text,
  created_at timestamptz not null default now()
);

create table public.locations (
  id           uuid primary key default uuid_generate_v4(),
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  name         text not null,
  code         text,
  created_at   timestamptz not null default now()
);

create table public.products (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  sku             text not null unique,
  category_id     uuid references public.categories(id) on delete set null,
  unit_of_measure text not null default 'pcs',
  unit            text default 'pcs',
  reorder_point   numeric not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.inventory_balances (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references public.products(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  quantity    numeric not null default 0,
  updated_at  timestamptz not null default now(),
  unique(product_id, location_id)
);

create table public.inventory_documents (
  id                      uuid primary key default uuid_generate_v4(),
  reference_no            text not null unique,
  type                    text not null check (type in ('receipt','delivery','transfer','adjustment')),
  status                  text not null default 'draft' check (status in ('draft','waiting','ready','done','canceled')),
  partner_name            text,
  source_location_id      uuid references public.locations(id) on delete set null,
  destination_location_id uuid references public.locations(id) on delete set null,
  notes                   text,
  created_by              uuid references auth.users(id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create table public.inventory_document_lines (
  id               uuid primary key default uuid_generate_v4(),
  document_id      uuid not null references public.inventory_documents(id) on delete cascade,
  product_id       uuid not null references public.products(id) on delete cascade,
  quantity         numeric not null check (quantity > 0),
  counted_quantity numeric,
  reason           text,
  created_at       timestamptz not null default now()
);

create table public.stock_movements (
  id             uuid primary key default uuid_generate_v4(),
  document_id    uuid references public.inventory_documents(id) on delete set null,
  product_id     uuid not null references public.products(id) on delete cascade,
  location_id    uuid not null references public.locations(id) on delete cascade,
  quantity_delta numeric not null,
  movement_type  text not null check (movement_type in ('receipt','delivery','transfer_in','transfer_out','adjustment')),
  reason         text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- 4. Grant Full Permissions to All Roles
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all routines in schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;

-- 5. Helper & Validation Functions
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'Inventory Manager'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.upsert_balance(
  p_product_id  uuid,
  p_location_id uuid,
  p_delta       numeric
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.inventory_balances (product_id, location_id, quantity, updated_at)
  values (p_product_id, p_location_id, p_delta, now())
  on conflict (product_id, location_id)
  do update set
    quantity   = public.inventory_balances.quantity + p_delta,
    updated_at = now();

  update public.inventory_balances
     set quantity = greatest(quantity, 0)
   where product_id  = p_product_id
     and location_id = p_location_id;
end;
$$;

create or replace function public.validate_receipt(p_document_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_doc       public.inventory_documents%rowtype;
  v_line      public.inventory_document_lines%rowtype;
  v_user_id   uuid;
begin
  select * into v_doc from public.inventory_documents where id = p_document_id for update;
  if not found then raise exception 'Document % not found', p_document_id; end if;
  if v_doc.type <> 'receipt' then raise exception 'Document is not a receipt'; end if;
  if v_doc.status in ('done', 'canceled') then raise exception 'Receipt is already %', v_doc.status; end if;
  if v_doc.destination_location_id is null then raise exception 'Destination location is required'; end if;

  v_user_id := auth.uid();

  for v_line in select * from public.inventory_document_lines where document_id = p_document_id loop
    if v_line.quantity <= 0 then raise exception 'Line quantity must be > 0'; end if;
    perform public.upsert_balance(v_line.product_id, v_doc.destination_location_id, v_line.quantity);
    insert into public.stock_movements (document_id, product_id, location_id, quantity_delta, movement_type, created_by)
    values (p_document_id, v_line.product_id, v_doc.destination_location_id, v_line.quantity, 'receipt', v_user_id);
  end loop;

  update public.inventory_documents set status = 'done', updated_at = now() where id = p_document_id;
end;
$$;

create or replace function public.validate_delivery(p_document_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_doc       public.inventory_documents%rowtype;
  v_line      public.inventory_document_lines%rowtype;
  v_balance   numeric;
  v_user_id   uuid;
begin
  select * into v_doc from public.inventory_documents where id = p_document_id for update;
  if not found then raise exception 'Document % not found', p_document_id; end if;
  if v_doc.type <> 'delivery' then raise exception 'Document is not a delivery'; end if;
  if v_doc.status in ('done', 'canceled') then raise exception 'Delivery is already %', v_doc.status; end if;
  if v_doc.source_location_id is null then raise exception 'Source location is required'; end if;

  v_user_id := auth.uid();

  for v_line in select * from public.inventory_document_lines where document_id = p_document_id loop
    select coalesce(quantity, 0) into v_balance from public.inventory_balances
     where product_id = v_line.product_id and location_id = v_doc.source_location_id;
    if v_balance < v_line.quantity then
      raise exception 'Insufficient stock for product %. Available: %, Requested: %', v_line.product_id, v_balance, v_line.quantity;
    end if;
  end loop;

  for v_line in select * from public.inventory_document_lines where document_id = p_document_id loop
    perform public.upsert_balance(v_line.product_id, v_doc.source_location_id, -v_line.quantity);
    insert into public.stock_movements (document_id, product_id, location_id, quantity_delta, movement_type, created_by)
    values (p_document_id, v_line.product_id, v_doc.source_location_id, -v_line.quantity, 'delivery', v_user_id);
  end loop;

  update public.inventory_documents set status = 'done', updated_at = now() where id = p_document_id;
end;
$$;

create or replace function public.validate_transfer(p_document_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_doc       public.inventory_documents%rowtype;
  v_line      public.inventory_document_lines%rowtype;
  v_balance   numeric;
  v_user_id   uuid;
begin
  select * into v_doc from public.inventory_documents where id = p_document_id for update;
  if not found then raise exception 'Document % not found', p_document_id; end if;
  if v_doc.type <> 'transfer' then raise exception 'Document is not a transfer'; end if;
  if v_doc.status in ('done', 'canceled') then raise exception 'Transfer is already %', v_doc.status; end if;
  if v_doc.source_location_id is null or v_doc.destination_location_id is null then
    raise exception 'Both source and destination locations are required';
  end if;
  if v_doc.source_location_id = v_doc.destination_location_id then
    raise exception 'Source and destination locations must be different';
  end if;

  v_user_id := auth.uid();

  for v_line in select * from public.inventory_document_lines where document_id = p_document_id loop
    select coalesce(quantity, 0) into v_balance from public.inventory_balances
     where product_id = v_line.product_id and location_id = v_doc.source_location_id;
    if v_balance < v_line.quantity then
      raise exception 'Insufficient stock for product %. Available: %, Requested: %', v_line.product_id, v_balance, v_line.quantity;
    end if;
  end loop;

  for v_line in select * from public.inventory_document_lines where document_id = p_document_id loop
    perform public.upsert_balance(v_line.product_id, v_doc.source_location_id, -v_line.quantity);
    insert into public.stock_movements (document_id, product_id, location_id, quantity_delta, movement_type, reason, created_by)
    values (p_document_id, v_line.product_id, v_doc.source_location_id, -v_line.quantity, 'transfer_out', v_line.reason, v_user_id);

    perform public.upsert_balance(v_line.product_id, v_doc.destination_location_id, v_line.quantity);
    insert into public.stock_movements (document_id, product_id, location_id, quantity_delta, movement_type, reason, created_by)
    values (p_document_id, v_line.product_id, v_doc.destination_location_id, v_line.quantity, 'transfer_in', v_line.reason, v_user_id);
  end loop;

  update public.inventory_documents set status = 'done', updated_at = now() where id = p_document_id;
end;
$$;

create or replace function public.validate_adjustment(p_document_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_doc       public.inventory_documents%rowtype;
  v_line      public.inventory_document_lines%rowtype;
  v_current   numeric;
  v_delta     numeric;
  v_counted   numeric;
  v_user_id   uuid;
begin
  select * into v_doc from public.inventory_documents where id = p_document_id for update;
  if not found then raise exception 'Document % not found', p_document_id; end if;
  if v_doc.type <> 'adjustment' then raise exception 'Document is not an adjustment'; end if;
  if v_doc.status in ('done', 'canceled') then raise exception 'Adjustment is already %', v_doc.status; end if;
  if v_doc.source_location_id is null then raise exception 'Location is required'; end if;

  v_user_id := auth.uid();

  for v_line in select * from public.inventory_document_lines where document_id = p_document_id loop
    v_counted := coalesce(v_line.counted_quantity, v_line.quantity);
    select coalesce(quantity, 0) into v_current from public.inventory_balances
     where product_id = v_line.product_id and location_id = v_doc.source_location_id;

    v_delta := v_counted - v_current;

    insert into public.inventory_balances (product_id, location_id, quantity, updated_at)
    values (v_line.product_id, v_doc.source_location_id, greatest(v_counted, 0), now())
    on conflict (product_id, location_id)
    do update set quantity = greatest(excluded.quantity, 0), updated_at = now();

    if v_delta <> 0 then
      insert into public.stock_movements (document_id, product_id, location_id, quantity_delta, movement_type, reason, created_by)
      values (p_document_id, v_line.product_id, v_doc.source_location_id, v_delta, 'adjustment', v_line.reason, v_user_id);
    end if;
  end loop;

  update public.inventory_documents set status = 'done', updated_at = now() where id = p_document_id;
end;
$$;

-- 6. Row Level Security (RLS) - Permissive for all
alter table public.profiles                 enable row level security;
alter table public.categories               enable row level security;
alter table public.warehouses               enable row level security;
alter table public.locations                enable row level security;
alter table public.products                 enable row level security;
alter table public.inventory_balances       enable row level security;
alter table public.inventory_documents      enable row level security;
alter table public.inventory_document_lines enable row level security;
alter table public.stock_movements          enable row level security;

create policy "profiles_all" on public.profiles for all to public using (true) with check (true);
create policy "categories_all" on public.categories for all to public using (true) with check (true);
create policy "warehouses_all" on public.warehouses for all to public using (true) with check (true);
create policy "locations_all" on public.locations for all to public using (true) with check (true);
create policy "products_all" on public.products for all to public using (true) with check (true);
create policy "balances_all" on public.inventory_balances for all to public using (true) with check (true);
create policy "documents_all" on public.inventory_documents for all to public using (true) with check (true);
create policy "lines_all" on public.inventory_document_lines for all to public using (true) with check (true);
create policy "movements_all" on public.stock_movements for all to public using (true) with check (true);

-- 7. Seed Clean Working Data

-- Categories
insert into public.categories (name) values
  ('Electronics'),
  ('Raw Materials'),
  ('Finished Goods'),
  ('Spare Parts'),
  ('Packaging');

-- Warehouses
insert into public.warehouses (name, code, address) values
  ('Central Hub', 'WH-01', '100 Logistics Blvd, Dock A'),
  ('West Coast Facility', 'WH-02', '450 Harbor Way, Bay 3'),
  ('East Coast Distribution', 'WH-03', '78 Industrial Park Rd');

-- Locations
with w1 as (select id from public.warehouses where code = 'WH-01' limit 1)
insert into public.locations (warehouse_id, name, code)
select w1.id, l.name, l.code from w1, (values
  ('Receiving Bay', 'WH01-RCV'),
  ('Shelf A-1', 'WH01-A1'),
  ('Shelf A-2', 'WH01-A2'),
  ('Dispatch Zone', 'WH01-DSP')
) as l(name, code);

with w2 as (select id from public.warehouses where code = 'WH-02' limit 1)
insert into public.locations (warehouse_id, name, code)
select w2.id, l.name, l.code from w2, (values
  ('Main Storage Area', 'WH02-MAIN'),
  ('High-Value Vault', 'WH02-VLT'),
  ('Assembly Bay', 'WH02-ASM')
) as l(name, code);

-- Products
with cat_elec as (select id from public.categories where name = 'Electronics' limit 1),
     cat_raw  as (select id from public.categories where name = 'Raw Materials' limit 1),
     cat_fin  as (select id from public.categories where name = 'Finished Goods' limit 1),
     cat_pkg  as (select id from public.categories where name = 'Packaging' limit 1)
insert into public.products (name, sku, category_id, unit_of_measure, unit, reorder_point) values
  ('MacBook Pro M3 Max 16"', 'SKU-MBP-16', (select id from cat_elec), 'pcs', 'pcs', 10),
  ('High-Precision Microcontroller', 'SKU-MCU-32', (select id from cat_elec), 'pcs', 'pcs', 50),
  ('Industrial Copper Wire 100m', 'SKU-COP-100', (select id from cat_raw), 'rolls', 'rolls', 15),
  ('Heavy-Duty Shipping Box', 'SKU-BOX-XL', (select id from cat_pkg), 'boxes', 'boxes', 100),
  ('Smart IoT Temperature Sensor', 'SKU-IOT-TMP', (select id from cat_fin), 'pcs', 'pcs', 25);

-- Balances
insert into public.inventory_balances (product_id, location_id, quantity)
select p.id, l.id, 120
from public.products p, public.locations l
where p.sku = 'SKU-MBP-16' and l.code = 'WH01-A1';

insert into public.inventory_balances (product_id, location_id, quantity)
select p.id, l.id, 450
from public.products p, public.locations l
where p.sku = 'SKU-MCU-32' and l.code = 'WH01-A2';

insert into public.inventory_balances (product_id, location_id, quantity)
select p.id, l.id, 85
from public.products p, public.locations l
where p.sku = 'SKU-COP-100' and l.code = 'WH02-MAIN';

insert into public.inventory_balances (product_id, location_id, quantity)
select p.id, l.id, 800
from public.products p, public.locations l
where p.sku = 'SKU-BOX-XL' and l.code = 'WH01-RCV';

insert into public.inventory_balances (product_id, location_id, quantity)
select p.id, l.id, 35
from public.products p, public.locations l
where p.sku = 'SKU-IOT-TMP' and l.code = 'WH02-VLT';

-- Receipts
with l_rcv as (select id from public.locations where code = 'WH01-RCV' limit 1)
insert into public.inventory_documents (reference_no, type, status, partner_name, destination_location_id, notes)
values
  ('REC-2026-001', 'receipt', 'done', 'Apple Distribution Inc.', (select id from l_rcv), 'Quarterly stock replenishment'),
  ('REC-2026-002', 'receipt', 'ready', 'Global Silicon Fab', (select id from l_rcv), 'Rush components batch');

with doc1 as (select id from public.inventory_documents where reference_no = 'REC-2026-001' limit 1),
     prod1 as (select id from public.products where sku = 'SKU-MBP-16' limit 1)
insert into public.inventory_document_lines (document_id, product_id, quantity)
select (select id from doc1), (select id from prod1), 25;

-- Ledger
with p1 as (select id from public.products where sku = 'SKU-MBP-16' limit 1),
     l1 as (select id from public.locations where code = 'WH01-A1' limit 1),
     d1 as (select id from public.inventory_documents where reference_no = 'REC-2026-001' limit 1)
insert into public.stock_movements (document_id, product_id, location_id, quantity_delta, movement_type, reason)
select (select id from d1), (select id from p1), (select id from l1), 25, 'receipt', 'Initial setup intake';
