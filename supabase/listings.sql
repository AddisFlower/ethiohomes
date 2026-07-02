create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  agency_name text,
  public_contact_email text,
  role text not null default 'agent' check (role in ('agent', 'admin')),
  created_at timestamptz not null default now()
);

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
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table if not exists public.showing_requests (
  id text primary key,
  listing_id text not null references public.listings(id) on delete cascade,
  listing_title text not null,
  listing_mls_id text not null,
  agent_owner_id uuid not null references public.profiles(id) on delete cascade,
  requester_name text not null,
  requester_email text not null,
  requester_phone text,
  preferred_datetime text,
  message text,
  status text not null default 'New',
  created_at timestamptz not null default now(),
  foreign key (listing_id, agent_owner_id)
    references public.listings(id, owner_id)
    on delete cascade
);

create table if not exists public.agent_clients (
  id text primary key,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  source text not null default 'Manual',
  status text not null default 'New',
  notes text,
  next_follow_up_at timestamptz,
  preferred_location text,
  preferred_property_type text,
  preferred_transaction_type text,
  preferred_market_status text,
  min_price integer,
  max_price integer,
  min_bedrooms integer,
  min_bathrooms integer,
  alert_enabled boolean not null default false,
  alert_frequency text not null default 'Off',
  alert_market_statuses text[] not null default array['Active'],
  alert_last_checked_at timestamptz,
  alert_last_sent_at timestamptz,
  alert_matched_listing_ids text[] not null default '{}',
  alert_consent_at timestamptz,
  alert_unsubscribed_at timestamptz,
  alert_unsubscribe_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table if not exists public.seller_leads (
  id text primary key,
  property_address text not null,
  property_type text,
  intent text,
  seller_name text not null,
  seller_phone text not null,
  seller_email text,
  preferred_contact_method text,
  notes text,
  status text not null default 'New',
  assigned_agent_id uuid references public.profiles(id) on delete set null,
  agent_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agent_clients_id_owner_id_unique'
      and conrelid = 'public.agent_clients'::regclass
  ) then
    alter table public.agent_clients
    add constraint agent_clients_id_owner_id_unique
    unique (id, owner_id);
  end if;
end;
$$;

create table if not exists public.client_alert_sends (
  id text primary key,
  send_batch_id text not null,
  agent_client_id text not null references public.agent_clients(id) on delete cascade,
  agent_owner_id uuid not null references public.profiles(id) on delete cascade,
  listing_id text not null references public.listings(id) on delete cascade,
  listing_title text not null,
  listing_mls_id text not null,
  recipient_email text not null,
  status text not null default 'Sent',
  resend_email_id text,
  error_message text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  foreign key (agent_client_id, agent_owner_id)
    references public.agent_clients(id, owner_id)
    on delete cascade
);

create sequence if not exists public.listing_id_seq
  as integer
  start with 1001
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

alter table public.profiles
add column if not exists public_contact_email text;

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
set market_status = 'Under Contract'
where market_status = 'Pending';

update public.listings
set market_status = 'Active'
where market_status is null
  or market_status not in (
    'Coming Soon',
    'Active',
    'Under Contract',
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
    where conname = 'profiles_public_contact_email_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_public_contact_email_check
    check (
      public_contact_email is null
      or public_contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    );
  end if;

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

  alter table public.listings
  drop constraint if exists listings_market_status_check;

  alter table public.listings
  add constraint listings_market_status_check
  check (
    market_status in (
      'Coming Soon',
      'Active',
      'Under Contract',
      'Closed',
      'Off Market'
    )
  );

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
create index if not exists agent_clients_owner_id_idx on public.agent_clients(owner_id);
create index if not exists agent_clients_status_idx on public.agent_clients(status);
create index if not exists agent_clients_next_follow_up_at_idx on public.agent_clients(next_follow_up_at);
create index if not exists agent_clients_alert_enabled_idx on public.agent_clients(alert_enabled);
create index if not exists seller_leads_status_idx on public.seller_leads(status);
create index if not exists seller_leads_assigned_agent_id_idx on public.seller_leads(assigned_agent_id);
create index if not exists seller_leads_created_at_idx on public.seller_leads(created_at);
create index if not exists client_alert_sends_agent_owner_id_idx on public.client_alert_sends(agent_owner_id);
create index if not exists client_alert_sends_agent_client_id_idx on public.client_alert_sends(agent_client_id);
create index if not exists client_alert_sends_listing_id_idx on public.client_alert_sends(listing_id);
create index if not exists client_alert_sends_sent_at_idx on public.client_alert_sends(sent_at);

alter table public.agent_clients
add column if not exists alert_market_statuses text[] not null default array['Active'];

alter table public.agent_clients
add column if not exists alert_last_checked_at timestamptz;

alter table public.agent_clients
add column if not exists alert_consent_at timestamptz;

alter table public.agent_clients
add column if not exists alert_unsubscribed_at timestamptz;

alter table public.agent_clients
add column if not exists alert_unsubscribe_token text;

alter table public.seller_leads
add column if not exists agent_viewed_at timestamptz;

update public.agent_clients
set alert_unsubscribe_token = md5(random()::text || clock_timestamp()::text)
where alert_unsubscribe_token is null;

update public.agent_clients
set alert_consent_at = coalesce(updated_at, created_at, now())
where alert_enabled = true
  and alert_consent_at is null;

update public.agent_clients
set alert_frequency = 'Off'
where alert_frequency is null
  or alert_frequency not in ('Off', 'Immediate', 'Daily', 'Weekly');

update public.agent_clients
set alert_market_statuses = array['Active']
where alert_market_statuses is null
  or cardinality(alert_market_statuses) = 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'agent_clients_alert_frequency_check'
      and conrelid = 'public.agent_clients'::regclass
  ) then
    alter table public.agent_clients
    add constraint agent_clients_alert_frequency_check
    check (alert_frequency in ('Off', 'Immediate', 'Daily', 'Weekly'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'agent_clients_alert_unsubscribe_token_unique'
      and conrelid = 'public.agent_clients'::regclass
  ) then
    alter table public.agent_clients
    add constraint agent_clients_alert_unsubscribe_token_unique
    unique (alert_unsubscribe_token);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'agent_clients_alert_consent_check'
      and conrelid = 'public.agent_clients'::regclass
  ) then
    alter table public.agent_clients
    add constraint agent_clients_alert_consent_check
    check (
      alert_enabled = false
      or alert_consent_at is not null
    );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'agent_clients_alert_market_statuses_check'
      and conrelid = 'public.agent_clients'::regclass
  ) then
    alter table public.agent_clients
    add constraint agent_clients_alert_market_statuses_check
    check (
      alert_market_statuses <@ array['Coming Soon', 'Active', 'Closed']::text[]
      and cardinality(alert_market_statuses) > 0
    );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'seller_leads_status_check'
      and conrelid = 'public.seller_leads'::regclass
  ) then
    alter table public.seller_leads
    add constraint seller_leads_status_check
    check (status in ('New', 'Contacted', 'Assigned', 'Closed'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'seller_leads_seller_email_check'
      and conrelid = 'public.seller_leads'::regclass
  ) then
    alter table public.seller_leads
    add constraint seller_leads_seller_email_check
    check (
      seller_email is null
      or seller_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'client_alert_sends_status_check'
      and conrelid = 'public.client_alert_sends'::regclass
  ) then
    alter table public.client_alert_sends
    add constraint client_alert_sends_status_check
    check (status in ('Sent', 'Failed'));
  end if;
end;
$$;

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

create or replace function public.set_agent_clients_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists agent_clients_set_updated_at on public.agent_clients;

create trigger agent_clients_set_updated_at
before update on public.agent_clients
for each row
execute function public.set_agent_clients_updated_at();

create or replace function public.set_seller_leads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists seller_leads_set_updated_at on public.seller_leads;

create trigger seller_leads_set_updated_at
before update on public.seller_leads
for each row
execute function public.set_seller_leads_updated_at();

select setval(
  'public.listing_id_seq',
  greatest(
    1000,
    coalesce(
      (
        select max(substring(listing_id from 5)::integer)
        from public.listings
        where listing_id ~ '^MLS-[0-9]{4,6}$'
      ),
      1000
    )
  ),
  true
);

-- New environments should finish setup by running supabase/rls-policies.sql.
-- Keeping policy activation in a separate script makes the security boundary
-- explicit and preserves a tested emergency rollback path.
