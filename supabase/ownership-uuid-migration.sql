-- One-time ownership migration for existing EthioMLS environments.
--
-- Before running:
-- 1. Back up public.listings and public.showing_requests.
-- 2. Confirm agent-1 and agent-2 are disposable demo owners.
-- 3. Review the preflight queries below. The migration aborts if any other
--    ownership value is not a valid profile UUID.

begin;

-- Remove requests tied to the disposable demo owners or demo listings.
delete from public.showing_requests
where agent_owner_id in ('agent-1', 'agent-2')
   or listing_id in (
     select id
     from public.listings
     where owner_id in ('agent-1', 'agent-2')
   );

delete from public.listings
where owner_id in ('agent-1', 'agent-2');

-- Abort instead of silently deleting or coercing unexpected ownership data.
do $$
declare
  invalid_listing_owners text;
  missing_listing_profiles text;
  invalid_request_owners text;
  missing_request_profiles text;
  orphaned_request_listings text;
  mismatched_request_owners text;
begin
  select string_agg(distinct owner_id, ', ')
  into invalid_listing_owners
  from public.listings
  where owner_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  if invalid_listing_owners is not null then
    raise exception
      'Ownership migration aborted. Invalid listing owner IDs: %',
      invalid_listing_owners;
  end if;

  select string_agg(distinct owner_id, ', ')
  into missing_listing_profiles
  from public.listings
  where not exists (
    select 1
    from public.profiles
    where profiles.id = listings.owner_id::uuid
  );

  if missing_listing_profiles is not null then
    raise exception
      'Ownership migration aborted. Listing owners without profiles: %',
      missing_listing_profiles;
  end if;

  select string_agg(distinct agent_owner_id, ', ')
  into invalid_request_owners
  from public.showing_requests
  where agent_owner_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  if invalid_request_owners is not null then
    raise exception
      'Ownership migration aborted. Invalid request owner IDs: %',
      invalid_request_owners;
  end if;

  select string_agg(distinct agent_owner_id, ', ')
  into missing_request_profiles
  from public.showing_requests
  where not exists (
    select 1
    from public.profiles
    where profiles.id = showing_requests.agent_owner_id::uuid
  );

  if missing_request_profiles is not null then
    raise exception
      'Ownership migration aborted. Request owners without profiles: %',
      missing_request_profiles;
  end if;

  select string_agg(distinct listing_id, ', ')
  into orphaned_request_listings
  from public.showing_requests
  where not exists (
    select 1
    from public.listings
    where listings.id = showing_requests.listing_id
  );

  if orphaned_request_listings is not null then
    raise exception
      'Ownership migration aborted. Showing requests reference missing listings: %',
      orphaned_request_listings;
  end if;

  select string_agg(distinct showing_requests.id, ', ')
  into mismatched_request_owners
  from public.showing_requests
  join public.listings
    on listings.id = showing_requests.listing_id
  where listings.owner_id <> showing_requests.agent_owner_id;

  if mismatched_request_owners is not null then
    raise exception
      'Ownership migration aborted. Showing requests have mismatched listing owners: %',
      mismatched_request_owners;
  end if;
end;
$$;

drop index if exists public.listings_owner_id_idx;
drop index if exists public.showing_requests_agent_owner_id_idx;

alter table public.listings
alter column owner_id type uuid using owner_id::uuid;

alter table public.showing_requests
alter column agent_owner_id type uuid using agent_owner_id::uuid;

alter table public.listings
add constraint listings_owner_id_fkey
foreign key (owner_id)
references public.profiles(id)
on delete cascade;

alter table public.listings
add constraint listings_id_owner_id_key
unique (id, owner_id);

alter table public.showing_requests
add constraint showing_requests_agent_owner_id_fkey
foreign key (agent_owner_id)
references public.profiles(id)
on delete cascade;

alter table public.showing_requests
add constraint showing_requests_listing_id_fkey
foreign key (listing_id)
references public.listings(id)
on delete cascade;

alter table public.showing_requests
add constraint showing_requests_listing_owner_fkey
foreign key (listing_id, agent_owner_id)
references public.listings(id, owner_id)
on delete cascade;

create index listings_owner_id_idx
on public.listings(owner_id);

create index showing_requests_agent_owner_id_idx
on public.showing_requests(agent_owner_id);

commit;

-- Verification queries:
--
-- select data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'listings'
--   and column_name = 'owner_id';
--
-- select data_type
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'showing_requests'
--   and column_name = 'agent_owner_id';
--
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid in (
--   'public.listings'::regclass,
--   'public.showing_requests'::regclass
-- )
-- and contype = 'f'
-- order by conname;
