-- Run this in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(10,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  shipping_address text not null,
  contact_number text not null,
  subtotal numeric(10,2) not null check (subtotal >= 0),
  total_amount numeric(10,2) not null check (total_amount >= 0),
  status text not null default 'pending_payment'
    check (status in ('pending_payment','paid','processing','shipped','delivered','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  provider text not null default 'maya',
  provider_checkout_id text unique,
  request_reference_number text unique,
  status text not null default 'pending',
  checkout_url text,
  created_at timestamptz not null default now()
);

-- Automatically create a customer profile after Supabase Auth registration.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Enable RLS. Backend uses the secret key; do not expose that key to clients.
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

-- Public product read policy for clients that use the publishable key directly.
drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products" on public.products
for select using (is_active = true);

-- A user may read/update their own profile, but role assignment must be done by admin SQL.
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles
for select using (auth.uid() = id);

-- Seed sample paddles. Re-running is safe because names are unique in this seed block.
insert into public.products (name, description, price, stock, image_url)
select * from (values
 ('Carbon Pro Paddle', 'Lightweight carbon fiber pickleball paddle.', 3499.00, 15, null::text),
 ('Control Series Paddle', 'Balanced paddle designed for control and placement.', 2499.00, 20, null::text),
 ('PowerStrike Paddle', 'Power-focused paddle with a textured face.', 2999.00, 12, null::text),
 ('Beginner Classic Paddle', 'Comfortable all-around paddle for beginners.', 1499.00, 25, null::text),
 ('Premium Graphite Paddle', 'Graphite face paddle with a cushioned grip.', 3999.00, 8, null::text)
) as seed(name, description, price, stock, image_url)
where not exists (
  select 1 from public.products p where p.name = seed.name
);
