-- Safe, rerunnable migration for existing EthioMLS environments.
-- This preserves the legacy status column and all existing listing rows.

alter table public.listings
add column if not exists transaction_type text;

alter table public.listings
add column if not exists market_status text;

alter table public.listings
add column if not exists rejection_reason text;

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
where approval_status = 'Pending'
  or approval_status is null
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
alter column approval_status set default 'Unapproved';

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

create index if not exists listings_transaction_type_idx
on public.listings(transaction_type);

create index if not exists listings_market_status_idx
on public.listings(market_status);
