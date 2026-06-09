create table if not exists public.listings (
  id text primary key,
  listing_id text not null unique,
  title text not null,
  price text not null,
  location text not null,
  address text,
  property_type text not null,
  status text not null default 'For Sale',
  transaction_type text not null default 'For Sale',
  market_status text not null default 'Active',
  verified boolean not null default false,
  bedrooms integer,
  bathrooms integer,
  agent text not null,
  approval_status text not null default 'Unapproved',
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

create table if not exists public.showing_requests (
  id text primary key,
  listing_id text not null,
  listing_title text not null,
  listing_mls_id text not null,
  agent_owner_id text not null,
  requester_name text not null,
  requester_email text not null,
  requester_phone text,
  preferred_datetime text,
  message text,
  status text not null default 'New',
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

alter table public.listings
add column if not exists transaction_type text;

alter table public.listings
add column if not exists market_status text;

alter table public.listings
alter column status set default 'For Sale';

alter table public.listings
alter column approval_status set default 'Unapproved';

update public.listings
set transaction_type = case
  when upper(status) = 'FOR RENT' then 'For Rent'
  else 'For Sale'
end
where transaction_type is null
  or transaction_type not in ('For Sale', 'For Rent');

update public.listings
set market_status = 'Active'
where market_status is null
  or market_status not in (
    'Coming Soon',
    'Active',
    'Pending',
    'Closed',
    'Off Market'
  );

update public.listings
set approval_status = 'Unapproved'
where approval_status = 'Pending';

update public.listings
set approval_status = 'Unapproved'
where approval_status is null
  or approval_status not in ('Unapproved', 'Approved', 'Rejected');

alter table public.listings
alter column transaction_type set default 'For Sale';

alter table public.listings
alter column transaction_type set not null;

alter table public.listings
alter column market_status set default 'Active';

alter table public.listings
alter column market_status set not null;

alter table public.listings
alter column bedrooms drop not null;

alter table public.listings
alter column bathrooms drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_transaction_type_check'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
    add constraint listings_transaction_type_check
    check (transaction_type in ('For Sale', 'For Rent'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_market_status_check'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
    add constraint listings_market_status_check
    check (
      market_status in (
        'Coming Soon',
        'Active',
        'Pending',
        'Closed',
        'Off Market'
      )
    );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'listings_approval_status_check'
      and conrelid = 'public.listings'::regclass
  ) then
    alter table public.listings
    add constraint listings_approval_status_check
    check (approval_status in ('Unapproved', 'Approved', 'Rejected'));
  end if;
end;
$$;

create index if not exists listings_owner_id_idx on public.listings(owner_id);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_transaction_type_idx on public.listings(transaction_type);
create index if not exists listings_market_status_idx on public.listings(market_status);
create index if not exists listings_property_type_idx on public.listings(property_type);
create index if not exists showing_requests_agent_owner_id_idx on public.showing_requests(agent_owner_id);
create index if not exists showing_requests_listing_id_idx on public.showing_requests(listing_id);
create index if not exists showing_requests_created_at_idx on public.showing_requests(created_at);

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
  transaction_type,
  market_status,
  verified,
  bedrooms,
  bathrooms,
  agent,
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
    'For Sale',
    'For Sale',
    'Active',
    true,
    3,
    2,
    'Dawit Realty',
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
    'For Rent',
    'For Rent',
    'Pending',
    true,
    5,
    4,
    'Habesha Properties',
    'Unapproved',
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
    'For Sale',
    'For Sale',
    'Active',
    false,
    4,
    3,
    'Ethio Land Brokers',
    'Rejected',
    'Please add clearer exterior photos and confirm the property address.',
    'Perfect family home in a quiet neighborhood with easy access to schools and shopping.',
    'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop',
    'agent-1'
  )
on conflict (id) do nothing;

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
