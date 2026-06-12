-- Emergency rollback for supabase/rls-policies.sql.
--
-- This disables RLS and removes the policies and owner-update protection
-- trigger. Application route authorization remains in place, but the database
-- is no longer an independent authorization boundary after this rollback.

begin;

drop policy if exists showing_requests_select_owned on public.showing_requests;
drop policy if exists showing_requests_insert_eligible on public.showing_requests;

drop policy if exists listings_delete_owned on public.listings;
drop policy if exists listings_update_owned on public.listings;
drop policy if exists listings_insert_owned on public.listings;
drop policy if exists listings_select_authenticated on public.listings;
drop policy if exists listings_select_public on public.listings;

drop policy if exists profiles_select_own on public.profiles;

alter table public.showing_requests disable row level security;
alter table public.listings disable row level security;
alter table public.profiles disable row level security;

drop trigger if exists listings_enforce_owner_update_rules
on public.listings;

drop function if exists ethiomls_private.enforce_listing_owner_update_rules();
drop function if exists ethiomls_private.is_admin();
drop function if exists ethiomls_private.is_agent_or_admin();
drop schema if exists ethiomls_private;

commit;
