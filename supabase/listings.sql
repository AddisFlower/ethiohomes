create table if not exists public.listings (
  id text primary key,
  listing_id text not null unique,
  title text not null,
  price text not null,
  location text not null,
  address text,
  property_type text not null,
  status text not null,
  verified boolean not null default false,
  bedrooms integer not null,
  bathrooms integer not null,
  agent text not null,
  updated_at_label text not null,
  approval_status text not null,
  rejection_reason text,
  description text not null,
  image text not null,
  owner_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  agency_name text,
  role text not null default 'agent' check (role in ('agent', 'admin')),
  created_at timestamptz not null default now()
);

create sequence if not exists public.listing_id_seq
  as integer
  start with 1004
  increment by 1
  minvalue 1;

create or replace function public.next_listing_id()
returns text as $$
begin
  return 'MLS-' || nextval('public.listing_id_seq')::text;
end;
$$ language plpgsql;

alter table public.listings
alter column listing_id set default public.next_listing_id();

alter table public.listings
add column if not exists rejection_reason text;

alter table public.listings
add column if not exists address text;

create index if not exists listings_owner_id_idx on public.listings(owner_id);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_property_type_idx on public.listings(property_type);

create or replace function public.set_listings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists listings_set_updated_at on public.listings;

create trigger listings_set_updated_at
before update on public.listings
for each row
execute function public.set_listings_updated_at();

insert into public.listings (
  id,
  listing_id,
  title,
  price,
  location,
  address,
  property_type,
  status,
  verified,
  bedrooms,
  bathrooms,
  agent,
  updated_at_label,
  approval_status,
  rejection_reason,
  description,
  image,
  owner_id
) values
  (
    '1',
    'MLS-1001',
    'Modern Apartment in Bole',
    '12,500,000 ETB',
    'Addis Ababa, Bole',
    'Bole Rwanda Embassy Area, House No. B-214',
    'Apartment',
    'FOR SALE',
    true,
    3,
    2,
    'Dawit Realty',
    'Updated 2 hours ago',
    'Approved',
    null,
    'Beautiful modern apartment located in the heart of Bole near restaurants, shopping centers, and schools.',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop',
    'agent-1'
  ),
  (
    '2',
    'MLS-1002',
    'Luxury Villa in Summit',
    '28,000,000 ETB',
    'Addis Ababa, Summit',
    'Summit Figa, near Safari Apartments, Villa 18',
    'Villa',
    'FOR RENT',
    true,
    5,
    4,
    'Habesha Properties',
    'Updated yesterday',
    'Pending',
    null,
    'Spacious luxury villa with modern architecture, large outdoor area, and premium finishes.',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop',
    'agent-2'
  ),
  (
    '3',
    'MLS-1003',
    'Family Home in CMC',
    '18,750,000 ETB',
    'Addis Ababa, CMC',
    'CMC Michael Road, behind Tsehay Real Estate, House 42',
    'House',
    'FOR SALE',
    false,
    4,
    3,
    'Ethio Land Brokers',
    'Updated 3 days ago',
    'Rejected',
    'Please add clearer exterior photos and confirm the property address.',
    'Perfect family home in a quiet neighborhood with easy access to schools and shopping.',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
    'agent-1'
  )
on conflict (id) do update set
  listing_id = excluded.listing_id,
  title = excluded.title,
  price = excluded.price,
  location = excluded.location,
  address = excluded.address,
  property_type = excluded.property_type,
  status = excluded.status,
  verified = excluded.verified,
  bedrooms = excluded.bedrooms,
  bathrooms = excluded.bathrooms,
  agent = excluded.agent,
  updated_at_label = excluded.updated_at_label,
  approval_status = excluded.approval_status,
  rejection_reason = excluded.rejection_reason,
  description = excluded.description,
  image = excluded.image,
  owner_id = excluded.owner_id;

select setval(
  'public.listing_id_seq',
  greatest(
    1003,
    coalesce(
      (
        select max(substring(listing_id from 5)::integer)
        from public.listings
        where listing_id ~ '^MLS-[0-9]{4,6}$'
      ),
      1003
    )
  ),
  true
);
