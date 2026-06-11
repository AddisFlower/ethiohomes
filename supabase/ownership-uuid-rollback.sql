-- Schema rollback for ownership-uuid-migration.sql.
--
-- This restores text column types and removes the new foreign keys.
-- It cannot restore demo rows deleted by the forward migration; restore those
-- from the backup taken before migration if they are unexpectedly needed.

begin;

alter table public.showing_requests
drop constraint if exists showing_requests_listing_id_fkey;

alter table public.showing_requests
drop constraint if exists showing_requests_listing_owner_fkey;

alter table public.showing_requests
drop constraint if exists showing_requests_agent_owner_id_fkey;

alter table public.listings
drop constraint if exists listings_id_owner_id_key;

alter table public.listings
drop constraint if exists listings_owner_id_fkey;

drop index if exists public.listings_owner_id_idx;
drop index if exists public.showing_requests_agent_owner_id_idx;

alter table public.listings
alter column owner_id type text using owner_id::text;

alter table public.showing_requests
alter column agent_owner_id type text using agent_owner_id::text;

create index listings_owner_id_idx
on public.listings(owner_id);

create index showing_requests_agent_owner_id_idx
on public.showing_requests(agent_owner_id);

commit;
