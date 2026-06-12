-- EthioMLS Row Level Security policies for an existing UUID ownership schema.
--
-- Before running:
-- 1. Back up public.profiles, public.listings, and public.showing_requests.
-- 2. Confirm supabase/ownership-uuid-migration.sql was already applied.
-- 3. Confirm the application version using authenticated-user REST requests is
--    deployed or ready to deploy immediately after this migration.
-- 4. Keep supabase/rls-rollback.sql available.

begin;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'listings'
      and column_name = 'owner_id'
      and data_type <> 'uuid'
  ) then
    raise exception
      'RLS migration aborted. public.listings.owner_id must be uuid.';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'showing_requests'
      and column_name = 'agent_owner_id'
      and data_type <> 'uuid'
  ) then
    raise exception
      'RLS migration aborted. public.showing_requests.agent_owner_id must be uuid.';
  end if;
end;
$$;

create schema if not exists ethiomls_private;
revoke all on schema ethiomls_private from public;
grant usage on schema ethiomls_private to authenticated;

create or replace function ethiomls_private.is_agent_or_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('agent', 'admin')
  );
$$;

create or replace function ethiomls_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function ethiomls_private.is_agent_or_admin() from public;
revoke all on function ethiomls_private.is_admin() from public;
grant execute on function ethiomls_private.is_agent_or_admin() to authenticated;
grant execute on function ethiomls_private.is_admin() to authenticated;

create or replace function ethiomls_private.enforce_listing_owner_update_rules()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() = 'authenticated'
     and auth.uid() = old.owner_id then
    new.id := old.id;
    new.listing_id := old.listing_id;
    new.owner_id := old.owner_id;
    new.agent := old.agent;
    new.status := old.status;
    new.created_at := old.created_at;

    if old.approval_status = 'Rejected' then
      new.approval_status := 'Unapproved';
      new.verified := false;
      new.rejection_reason := null;
    else
      new.approval_status := old.approval_status;
      new.verified := old.verified;
      new.rejection_reason := old.rejection_reason;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function ethiomls_private.enforce_listing_owner_update_rules()
from public;

drop trigger if exists listings_enforce_owner_update_rules
on public.listings;

create trigger listings_enforce_owner_update_rules
before update on public.listings
for each row
execute function ethiomls_private.enforce_listing_owner_update_rules();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.showing_requests enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists listings_select_public on public.listings;
create policy listings_select_public
on public.listings
for select
to anon
using (
  approval_status = 'Approved'
  and market_status in ('Coming Soon', 'Active', 'Pending', 'Closed')
);

drop policy if exists listings_select_authenticated on public.listings;
create policy listings_select_authenticated
on public.listings
for select
to authenticated
using (
  (
    approval_status = 'Approved'
    and market_status in ('Coming Soon', 'Active', 'Pending', 'Closed')
  )
  or (
    (select ethiomls_private.is_agent_or_admin())
    and (
      owner_id = auth.uid()
      or market_status = 'Off Market'
    )
  )
  or (select ethiomls_private.is_admin())
);

drop policy if exists listings_insert_owned on public.listings;
create policy listings_insert_owned
on public.listings
for insert
to authenticated
with check (
  (select ethiomls_private.is_agent_or_admin())
  and owner_id = auth.uid()
  and approval_status = 'Unapproved'
  and verified = false
  and rejection_reason is null
);

drop policy if exists listings_update_owned on public.listings;
create policy listings_update_owned
on public.listings
for update
to authenticated
using (
  (select ethiomls_private.is_agent_or_admin())
  and owner_id = auth.uid()
)
with check (
  (select ethiomls_private.is_agent_or_admin())
  and owner_id = auth.uid()
);

drop policy if exists listings_delete_owned on public.listings;
create policy listings_delete_owned
on public.listings
for delete
to authenticated
using (
  (select ethiomls_private.is_agent_or_admin())
  and owner_id = auth.uid()
);

drop policy if exists showing_requests_insert_eligible on public.showing_requests;
create policy showing_requests_insert_eligible
on public.showing_requests
for insert
to anon, authenticated
with check (
  status = 'New'
  and (auth.uid() is null or auth.uid() <> agent_owner_id)
  and exists (
    select 1
    from public.listings
    where listings.id = showing_requests.listing_id
      and listings.owner_id = showing_requests.agent_owner_id
      and listings.title = showing_requests.listing_title
      and listings.listing_id = showing_requests.listing_mls_id
      and listings.approval_status = 'Approved'
      and listings.market_status = 'Active'
  )
);

drop policy if exists showing_requests_select_owned on public.showing_requests;
create policy showing_requests_select_owned
on public.showing_requests
for select
to authenticated
using (
  (select ethiomls_private.is_agent_or_admin())
  and agent_owner_id = auth.uid()
);

grant select on public.profiles to authenticated;
grant select on public.listings to anon, authenticated;
grant insert, update, delete on public.listings to authenticated;
grant insert on public.showing_requests to anon, authenticated;
grant select on public.showing_requests to authenticated;
grant usage, select on sequence public.listing_id_seq to authenticated;
grant select, insert, update, delete on public.profiles to service_role;
grant select, insert, update, delete on public.listings to service_role;
grant select, insert, update, delete on public.showing_requests to service_role;
grant usage, select on sequence public.listing_id_seq to service_role;

commit;

-- Verification queries:
--
-- select schemaname, tablename, policyname, roles, cmd
-- from pg_policies
-- where schemaname = 'public'
--   and tablename in ('profiles', 'listings', 'showing_requests')
-- order by tablename, policyname;
--
-- select relname, relrowsecurity
-- from pg_class
-- where oid in (
--   'public.profiles'::regclass,
--   'public.listings'::regclass,
--   'public.showing_requests'::regclass
-- )
-- order by relname;
