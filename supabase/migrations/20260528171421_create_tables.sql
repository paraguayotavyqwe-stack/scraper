-- ============================================
-- AHorraPY - Database Schema
-- ============================================

-- ============================================
-- SUPERMARKETS
-- ============================================
create table public.supermarkets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  address text,
  city text default 'Asunción',
  phone text,
  website text,
  latitude decimal(10,7),
  longitude decimal(10,7),
  opening_hours jsonb default '{}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- CATEGORIES
-- ============================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  icon text,
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================
-- PRODUCTS
-- ============================================
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  brand text,
  unit text default 'unit',
  category_id uuid references public.categories(id) on delete set null,
  barcode text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_products_category on public.products(category_id);

-- ============================================
-- PRODUCT PRICES (current prices per supermarket)
-- ============================================
create table public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  supermarket_id uuid references public.supermarkets(id) on delete cascade not null,
  price decimal(10,2) not null,
  original_price decimal(10,2),
  is_on_sale boolean default false,
  is_available boolean default true,
  last_checked_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(product_id, supermarket_id)
);

create index idx_product_prices_product on public.product_prices(product_id);
create index idx_product_prices_supermarket on public.product_prices(supermarket_id);
create index idx_product_prices_price on public.product_prices(price);

-- ============================================
-- PRICE HISTORY
-- ============================================
create table public.price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade not null,
  supermarket_id uuid references public.supermarkets(id) on delete cascade not null,
  price decimal(10,2) not null,
  recorded_at timestamptz default now()
);

create index idx_price_history_product on public.price_history(product_id);
create index idx_price_history_recorded on public.price_history(recorded_at desc);

-- ============================================
-- USERS (extends Supabase Auth)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  latitude decimal(10,7),
  longitude decimal(10,7),
  notification_enabled boolean default true,
  dark_mode boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- SHOPPING LISTS
-- ============================================
create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null default 'Mi lista',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- SHOPPING LIST ITEMS
-- ============================================
create table public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references public.shopping_lists(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer default 1,
  is_checked boolean default false,
  created_at timestamptz default now()
);

create index idx_shopping_list_items_list on public.shopping_list_items(list_id);

-- ============================================
-- FAVORITES
-- ============================================
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- ============================================
-- PRICE ALERTS
-- ============================================
create table public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  target_price decimal(10,2) not null,
  is_active boolean default true,
  is_triggered boolean default false,
  triggered_at timestamptz,
  created_at timestamptz default now()
);

create index idx_price_alerts_user on public.price_alerts(user_id);
create index idx_price_alerts_product on public.price_alerts(product_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.favorites enable row level security;
alter table public.price_alerts enable row level security;
alter table public.supermarkets enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.product_prices enable row level security;
alter table public.price_history enable row level security;

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Shopping lists policies
create policy "Users can view own lists"
  on public.shopping_lists for select
  using (auth.uid() = user_id);

create policy "Users can create own lists"
  on public.shopping_lists for insert
  with check (auth.uid() = user_id);

create policy "Users can update own lists"
  on public.shopping_lists for update
  using (auth.uid() = user_id);

create policy "Users can delete own lists"
  on public.shopping_lists for delete
  using (auth.uid() = user_id);

-- Shopping list items policies
create policy "Users can view own list items"
  on public.shopping_list_items for select
  using (
    exists (
      select 1 from public.shopping_lists
      where id = list_id and user_id = auth.uid()
    )
  );

create policy "Users can manage own list items"
  on public.shopping_list_items for all
  using (
    exists (
      select 1 from public.shopping_lists
      where id = list_id and user_id = auth.uid()
    )
  );

-- Favorites policies
create policy "Users can view own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can add favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can remove favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- Price alerts policies
create policy "Users can view own alerts"
  on public.price_alerts for select
  using (auth.uid() = user_id);

create policy "Users can create alerts"
  on public.price_alerts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own alerts"
  on public.price_alerts for update
  using (auth.uid() = user_id);

create policy "Users can delete own alerts"
  on public.price_alerts for delete
  using (auth.uid() = user_id);

-- Public read access for products, supermarkets, categories, prices
create policy "Anyone can view supermarkets"
  on public.supermarkets for select
  using (true);

create policy "Anyone can view products"
  on public.products for select
  using (true);

create policy "Anyone can view categories"
  on public.categories for select
  using (true);

create policy "Anyone can view prices"
  on public.product_prices for select
  using (true);

create policy "Anyone can view price history"
  on public.price_history for select
  using (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Function to find nearby supermarkets
create or replace function public.find_nearby_supermarkets(
  user_lat decimal,
  user_lng decimal,
  radius_km integer default 10
)
returns table (
  id uuid,
  name text,
  slug text,
  logo_url text,
  address text,
  distance_km decimal
) as $$
begin
  return query
  select
    s.id,
    s.name,
    s.slug,
    s.logo_url,
    s.address,
    round(
      (6371 * acos(
        cos(radians(user_lat)) * cos(radians(s.latitude)) *
        cos(radians(s.longitude) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(s.latitude))
      ))::numeric, 2
    ) as distance_km
  from public.supermarkets s
  where s.is_active = true
  having (6371 * acos(
    cos(radians(user_lat)) * cos(radians(s.latitude)) *
    cos(radians(s.longitude) - radians(user_lng)) +
    sin(radians(user_lat)) * sin(radians(s.latitude))
  )) <= radius_km
  order by distance_km asc;
end;
$$ language plpgsql;

-- Function to get best price for a product
create or replace function public.get_best_price(product_uuid uuid)
returns table (
  supermarket_name text,
  supermarket_slug text,
  price decimal,
  original_price decimal,
  is_on_sale boolean
) as $$
begin
  return query
  select
    s.name,
    s.slug,
    pp.price,
    pp.original_price,
    pp.is_on_sale
  from public.product_prices pp
  join public.supermarkets s on s.id = pp.supermarket_id
  where pp.product_id = product_uuid
    and pp.is_available = true
  order by pp.price asc
  limit 5;
end;
$$ language plpgsql;
