-- Emergency rollback for supabase/rls-policies.sql.
--
-- This disables RLS and removes the policies and owner-update protection
-- trigger. Application route authorization remains in place, but the database
-- is no longer an independent authorization boundary after this rollback.

begin;

drop policy if exists listing_images_update_own_folder on storage.objects;
drop policy if exists listing_images_insert_own_folder on storage.objects;
drop policy if exists listing_images_select_public on storage.objects;

drop policy if exists showing_requests_select_owned on public.showing_requests;
drop policy if exists showing_requests_insert_eligible on public.showing_requests;

drop policy if exists agent_clients_delete_owned on public.agent_clients;
drop policy if exists agent_clients_update_owned on public.agent_clients;
drop policy if exists agent_clients_insert_owned on public.agent_clients;
drop policy if exists agent_clients_select_owned on public.agent_clients;

drop policy if exists client_alert_sends_insert_owned on public.client_alert_sends;
drop policy if exists client_alert_sends_select_owned on public.client_alert_sends;

drop policy if exists listings_delete_owned on public.listings;
drop policy if exists listings_update_owned on public.listings;
drop policy if exists listings_insert_owned on public.listings;
drop policy if exists listings_select_authenticated on public.listings;
drop policy if exists listings_select_public on public.listings;

drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_select_own on public.profiles;

alter table public.showing_requests disable row level security;
alter table public.agent_clients disable row level security;
alter table public.client_alert_sends disable row level security;
alter table public.listings disable row level security;
alter table public.profiles disable row level security;

drop trigger if exists listings_enforce_owner_update_rules
on public.listings;

drop function if exists ethiomls_private.enforce_listing_owner_update_rules();
drop function if exists ethiomls_private.is_admin();
drop function if exists ethiomls_private.is_agent_or_admin();
drop schema if exists ethiomls_private;

commit;
