# EthioMLS

## Project Purpose
EthioMLS is an agent-facing MLS workspace for Ethiopian real estate professionals.

## Current Architecture
- Next.js App Router application using React, TypeScript, and Tailwind CSS.
- Core listing UI lives under `app/`.
- Shared listing form lives in `components/PropertyForm.tsx`.
- Listing persistence is now backed by Supabase/Postgres through server-side REST helpers:
  - `lib/supabase.ts` provides explicit anonymous, authenticated-user, and
    service-role REST request paths.
  - Authenticated requests use the Supabase anon key for `apikey` and the
    signed-in user's access token for the bearer credential.
  - Listing image uploads use authenticated Storage requests under
    owner-scoped object paths backed by Storage policies.
  - `lib/listings.ts` maps Supabase rows to the existing app-facing `Property` shape and formats display labels from real timestamp fields.
- API routes handle writes:
  - `POST /api/auth/signup` creates Supabase Auth users and agent profiles.
  - `POST /api/auth/login` signs users in with Supabase email/password auth.
  - `POST /api/auth/logout` clears the app auth cookies.
  - `POST /api/auth/forgot-password` sends Supabase password recovery emails.
  - `POST /api/auth/update-password` updates passwords from recovery links.
  - `POST /api/listings` creates listings.
  - `PUT /api/listings/[id]` updates listings.
  - `DELETE /api/listings/[id]` deletes listings.
  - `PUT /api/listings/[id]/photo` replaces a listing's primary photo.
  - `POST /api/showing-requests` stores public showing requests/inquiries.
  - `POST /api/seller-leads` stores public seller intake requests.
  - `PATCH /api/admin/seller-leads/[id]/assignment` assigns seller leads to
    agent/admin profiles through role-checked admin access.
  - `PATCH /api/admin/listings/[id]/approval` approves or rejects listings through role-checked admin access.
- Reads are routed through `lib/listings.ts`:
  - Home promoted listings.
  - Browse listings.
  - Listing details.
  - Edit listing.
  - Photo management page.
  - My Listings.
  - Admin review dashboard.
- `data/properties.ts` remains as a read fallback if Supabase env vars are absent or reads fail.

## Features Completed
- Browse listings.
- Search/filter listings on `/listings`.
- View listing details.
- Add listing with Supabase persistence.
- Edit listing with Supabase persistence.
- Delete listing with Supabase persistence after confirmation.
- My Listings filtered by owner.
- Ownership-based UI and edit/delete guards using Supabase Auth user IDs.
- Non-owner request showing success state.
- Save Listing UI is hidden until client accounts support persistent favorites.
- Public/non-owner showing requests persist to Supabase and can be reviewed by agents.
- Successful showing requests display the listing agent's public contact email
  as a clickable contact link when the agent has configured one.
- Owner-only primary photo management page.
- Add Listing supports optional Supabase Storage image upload.
- Supabase-backed admin approval workflow with role-checked admin access.
- Admin review supports Unapproved, Approved, Rejected, and All filters.
- Agent/admin Showing Requests page for submitted listing inquiries, scoped to listings the signed-in user owns.
- Rejections store a rejection reason.
- Owners can edit rejected listings to resubmit them for review.
- Edit Listing includes owner delete action.
- Owner-filtered deletes require Supabase to return the deleted row before the
  API reports success.
- Missing and non-owned delete attempts fail with a shared not-found/access
  denial response instead of returning a false success.
- Supabase Auth email/password login and signup.
- Supabase Auth forgot-password and password-update flow.
- Authenticated users without a valid `public.profiles` row enter an incomplete
  session and receive no agent or admin privileges.
- Vitest authorization coverage for session roles, listing visibility, showing
  eligibility, and protected API denial behavior.
- Role-aware navbar for public, agent, and admin users.
- Friendly auth errors and improved auth-page spacing.
- Demo-polished navbar fallback routes for deferred pages.
- Styled not-found and access-denied states.
- Last Updated display now uses the database-owned `updated_at` timestamp instead of storing generated display text.
- Live dashboard counts link to My Listings, Showing Requests, and the admin Unapproved queue.
- Listing visibility is role-aware for public visitors, agents, owners, and admins.
- Listing collections default to newest uploaded first using `created_at`.
- Agent/admin Clients dropdown and outreach workspace are implemented with
  Client Leads, Client List, Add Client, Follow-ups, and manual Automated
  Alerts sending.
- Agent-owned client records support contact details, source, status, notes,
  next follow-up date, saved listing criteria, alert frequency, and matching
  listing previews.
- Showing Requests can prefill a new client record through Add to Clients.
- Manual client listing alert emails are implemented through Resend; scheduled
  automated alert sending is not enabled yet.
- Listing alert preference groundwork is implemented:
  - `agent_clients.alert_consent_at`
  - `agent_clients.alert_unsubscribed_at`
  - `agent_clients.alert_unsubscribe_token`
  - `/alerts/unsubscribe`
  - `POST /api/client-alerts/unsubscribe`
  Manual alert emails include a preference link when a token exists, and sends
  are blocked for unsubscribed clients until the agent re-enables alerts.
- Showing requests are limited to Approved + Active listings in both UI and server logic.
- Residential room fields are required; Land stores null rooms; Commercial/Office use optional bathrooms and null bedrooms.
- Add Listing excludes Under Contract and Closed; Edit Listing supports the full market lifecycle.
- Edit Listing uses Manage Photos file upload instead of raw image URL editing.
- Successful login redirects to the dashboard.
- Navbar and home listing presets apply real Browse filters.
- Mobile navigation uses a compact menu with controlled dismissal behavior.
- Mock listing fallback is restricted to non-production environments or
  explicit demo mode.
- Production listing-read failures log server-side context and render a clear
  listings-unavailable state instead of silently showing demo data.
- RLS policy, rollback, and staged rollout files are prepared:
  - `supabase/rls-policies.sql`
  - `supabase/rls-rollback.sql`
  - `docs/rls-rollout-testing.md`
- Public showing-request inserts use `Prefer: return=minimal` so anonymous
  users do not need read access to private lead rows.
- Agent profiles include an optional `public_contact_email`; showing-request
  confirmations no longer expose the agent's Supabase Auth login email.
- The home Sell tab routes public sellers to `/sell` with the entered address
  prefilled. Seller intake stores private `seller_leads` rows and does not
  create public listings.
- Admins can review seller leads on `/admin/seller-leads` and assign a lead to
  an agent/admin profile. Assigned leads store `assigned_agent_id` and move to
  `Assigned`.
- Assigned agents can review their assigned seller leads on `/seller-leads`.
  Navbar badges show admins the count of new unassigned seller leads and show
  agents the count of assigned seller leads they have not opened yet.

## Supabase Integration Status
- Supabase/Postgres is the active persistence layer for listings.
- The app uses Supabase REST endpoints directly via `fetch`; no Supabase client package is installed.
- Supabase Storage stores listing photos through direct Storage REST requests.
- The MVP stores one primary listing image URL in the existing `listings.image` column.
- Read helpers fall back to mock listing data on failure.
- Write operations do not fall back to mock data. Create/update/delete require Supabase env vars and a working `public.listings` table.
- `listing_id` is human-readable and unique at the database level.
- Internal route identity remains `id`, not `listing_id`.
- New `listing_id` values are generated by Postgres through `public.listing_id_seq` and `public.next_listing_id()`.
- Supabase Auth is the source of identity for new listings.
- New listings store the authenticated user's UUID in `listings.owner_id`.
- Public listing reads and anonymous showing-request submissions use the anon
  credential path.
- Owned listing operations, authenticated listing reads, profile reads, and
  owner-scoped showing-request reads use the signed-in user's access token.
- Admin approval and signup profile creation use the explicit service-role
  path.
- RLS is enabled in the current Supabase test-data environment and the core
  public, agent, ownership, showing-request, and admin smoke tests pass.
- Login does not create missing profiles or infer an agent role.
- Agent signup remains responsible for creating the initial agent profile.
- Admins inherit normal agent capabilities and also access `/admin`.
- Supabase Auth uses email/password login for the MVP.
- Password recovery uses `/forgot-password` and `/reset-password`.
- `updated_at` is the only source of truth for Last Updated UI labels. Any legacy `updated_at_label` column should be ignored by app code.
- Listing status is split into `approval_status`, `market_status`, and `transaction_type`.

## Environment Variables Required
Set these locally in `.env.local` and in Vercel project settings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
# Required for internal scheduled listing-alert runner calls.
CLIENT_ALERT_RUN_SECRET=GENERATE_A_LONG_RANDOM_SECRET
# Required for Vercel Cron invocation auth on /api/client-alerts/run.
CRON_SECRET=GENERATE_A_LONG_RANDOM_SECRET
# Optional: explicitly enable mock read fallback in a demo deployment.
ETHIOMLS_ENABLE_MOCK_LISTINGS=true
```

Important:
- `NEXT_PUBLIC_SUPABASE_URL` must be the project root URL only, not `/rest/v1`.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not expose it in client code.
- Do not set `ETHIOMLS_ENABLE_MOCK_LISTINGS` in production unless the deployment
  is intentionally a demo environment.
- Add the app's `/reset-password` URL to Supabase Auth redirect URLs for password recovery.
- TODO: Configure custom SMTP and branded production email templates before launch.
- For MVP auth, disable email confirmation in Supabase so login/signup flows work immediately.

## Supabase Storage Setup
Create a public Supabase Storage bucket named:

```text
listing-images
```

The current MVP uploads listing photos from server routes using the service role key, then stores the public object URL in `public.listings.image`.

Bucket requirements:
- Bucket name: `listing-images`
- Public bucket: enabled, so listing images render in public browse/detail pages.
- File uploads happen server-side only; no Supabase client package is installed.

## Database Schema Overview
Schema file: `supabase/listings.sql`

Table: `public.listings`

Important columns:
- `id text primary key` - internal app/database identity.
- `listing_id text not null unique` - human-readable MLS-style ID.
- `title text not null`
- `price text not null`
- `location text not null`
- `address text` - street/property address, separate from city/neighborhood location.
- `property_type text not null`
- `status text not null` - legacy transaction-type field kept temporarily for migration safety; app code ignores it.
- `transaction_type text not null` - either `For Sale` or `For Rent`.
- `market_status text not null` - `Coming Soon`, `Active`, `Under Contract`, `Closed`, or `Off Market`.
- `verified boolean not null default false`
- `bedrooms integer` - nullable when bedrooms do not apply.
- `bathrooms integer` - nullable for Land and optional for Commercial/Office.
- `agent text not null`
- `approval_status text not null` - `Unapproved`, `Approved`, or `Rejected`.
- `rejection_reason text`
- `description text not null`
- `image text not null`
- `owner_id uuid not null references public.profiles(id) on delete cascade`
- `created_at timestamptz`
- `updated_at timestamptz` - source of truth for Last Updated displays.

Table: `public.profiles`

Important columns:
- `id uuid primary key references auth.users(id)` - Supabase Auth user ID.
- `full_name text`
- `agency_name text`
- `public_contact_email text` - optional public-facing contact email shown
  after successful showing requests.
- `role text not null default 'agent'` - either `agent` or `admin`.
- `created_at timestamptz`

Table: `public.showing_requests`

Important columns:
- `id text primary key` - app-generated request identity.
- `listing_id text not null references public.listings(id) on delete cascade` - internal listing ID.
- `listing_title text not null` - title snapshot at request time.
- `listing_mls_id text not null` - MLS ID snapshot at request time.
- `agent_owner_id uuid not null references public.profiles(id) on delete cascade` - owner ID for agent-scoped request inboxes.
- `requester_name text not null`
- `requester_email text not null`
- `requester_phone text`
- `preferred_datetime text`
- `message text`
- `status text not null default 'New'`
- `created_at timestamptz`

Table: `public.seller_leads`

Important columns:
- `id text primary key` - app-generated seller lead identity.
- `property_address text not null` - address or neighborhood from the Sell flow.
- `property_type text`
- `intent text` - seller goal such as sell, rent out, or unsure.
- `seller_name text not null`
- `seller_phone text not null`
- `seller_email text`
- `preferred_contact_method text`
- `notes text`
- `status text not null default 'New'`
- `assigned_agent_id uuid references public.profiles(id) on delete set null`
- `agent_viewed_at timestamptz` - set when the assigned agent opens
  `/seller-leads`, clearing the assigned-lead badge.
- `created_at timestamptz`
- `updated_at timestamptz`

Indexes:
- `owner_id`
- `status`
- `property_type`
- `showing_requests.agent_owner_id`
- `showing_requests.listing_id`
- `showing_requests.created_at`
- `seller_leads.status`
- `seller_leads.assigned_agent_id`
- `seller_leads.created_at`

Trigger:
- Updates `updated_at` automatically before row updates.
- App code should format user-facing Last Updated labels from `updated_at`.

Seed data:
- The canonical schema no longer inserts `agent-1`/`agent-2` demo listings.
- Development mock listings remain in `data/properties.ts` and are not database
  records.

## Deployment Status
- MVP UI is working in deployment.
- Supabase project has been created by the user.
- Environment variables have been configured by the user.
- `supabase/listings.sql` should be run in the Supabase SQL Editor for any new Supabase project/environment.
- Vercel deployment must include the same Supabase env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- After Vercel env vars change, redeploy the app.

## Authentication and Ownership
- Authentication uses Supabase email/password auth.
- Current roles are `public`, `agent`, and `admin`.
- Public users can browse public listing pages and sign in.
- Agents can add listings, view My Listings, edit/delete owned listings, and manage owned listing photos.
- Admins inherit agent capabilities and can also access `/admin`.
- Public users can also request password recovery.
- Ownership rules:
  - Owners can edit/delete/manage photos.
  - Non-owners can request showings.
- Showing requests:
  - Public/non-owner visitors can submit name, email, optional phone, optional preferred date/time, and optional message from listing details.
  - Requests store listing title and MLS ID snapshots plus `agent_owner_id`.
  - Agents see requests for listings they own on `/showing-requests`.
  - Admins do not get global showing request access; admins see only requests for listings they personally own.
  - Showing requests are agent-owned lead data, not global admin moderation data.
  - Requests are accepted only for Approved + Active listings.
  - After a successful submission, the server performs a best-effort lookup for
    the listing owner's `profiles.public_contact_email` and returns it for the
    success confirmation when configured.
  - A contact lookup failure does not fail or duplicate the stored showing
    request.
  - Agents can manage the dedicated public contact email on `/profile`.
  - Coming Soon, Under Contract, Closed, Off Market, Unapproved, and Rejected listings cannot receive showing requests.
  - Email notifications are not implemented yet.
  - Deleting a listing cascades deletion to its showing requests.
  - TODO: Before production hard deletion, notify requesters that the listing
    and requested showing are no longer available. Notification must happen
    before the cascade delete and requires deliberate email infrastructure,
    retry handling, and privacy/retention rules.
- Seller leads:
  - Public sellers can enter an address from the home Sell tab and complete
    `/sell` intake.
  - Seller intake creates private `public.seller_leads` rows through the
    service-role server route.
  - Seller leads do not create `public.listings` rows and are not publicly
    browseable.
  - Admins can assign seller leads to an agent/admin profile from
    `/admin/seller-leads`.
  - Assigned agents can view their own seller leads from `/seller-leads`.
  - Notifications are currently navbar count badges, not real-time push or
    email notifications.
  - Agent seller-lead badges count assigned leads with `agent_viewed_at is null`
    and clear when the agent opens `/seller-leads`.
  - Coverage-area matching and public phone/WhatsApp/Telegram profile fields are
    not implemented yet.
- Admins can approve or reject listings through `/admin`.
- Admins can filter and review Unapproved, Approved, Rejected, and All listings.
- Admin rejection requires a reason.
- Editing a rejected listing resubmits it by setting `approval_status = Unapproved` and clearing `rejection_reason`.
- Public browse/detail shows only `approval_status = Approved` listings with `market_status` in `Coming Soon`, `Active`, `Under Contract`, or `Closed`.
- Public browse/detail hides Unapproved listings, Rejected listings, and Off Market listings.
- Public visitors can discover Approved + Coming Soon listings but only see a
  preview. Full Coming Soon details are reserved for signed-in agents/admins.
- Authenticated agents can browse public-visible listings plus Approved + Off
  Market listings from other agents.
- Unapproved and Rejected listings are hidden from unrelated agents regardless
  of market status.
- Owners can always browse and open all of their own listings regardless of approval or market status.
- Admins can browse and open all listings.
- Closed listings remain publicly visible.
- More market statuses may be added later depending on agent, admin, and client feedback.
- `listings.owner_id` and `showing_requests.agent_owner_id` use UUID foreign
  keys to `public.profiles(id)`.
- `showing_requests.listing_id` references `public.listings(id)`.
- A composite listing/owner foreign key prevents a showing request from being
  assigned to a profile that does not own its referenced listing.
- Profile and listing deletion currently use cascading cleanup for owned
  listings and showing requests.
- TODO: Add RLS policies after auth behavior is stable.

## Future Role Model
Planned roles:
- `public` - unauthenticated visitor.
- `client` - authenticated buyer/renter.
- `agent` - listing owner and agent workspace user.
- `admin` - review/moderation user that inherits agent capabilities.

Do not implement client accounts until explicitly requested. When added, the `client` role should be represented in `public.profiles.role` and should not share listing ownership semantics with agents. `listings.owner_id` should continue to mean the agent/admin owner of a listing.

Future client/buyer capabilities should be built on top of the `client` role:
- Persistent favorites or saved listings. Do not add browser-local favorites.
- Listing inquiries.
- Showing requests.
- Search preferences and alerts.
- Client-facing saved search or dashboard views.

## Agent Client Outreach Workspace
The current client-related product direction is agent-side client outreach, not
public buyer/renter client accounts yet.

Implemented agent/admin Clients dropdown:
- Client Leads - showing requests and manually entered prospects.
- Client List - agent-owned client/contact records.
- Add Client - manual contact creation.
- Follow-ups - outreach reminders, statuses, and notes.
- Automated Alerts - saved client criteria that notify clients by email when
  matching listings become available.

Agent-owned client records should be scoped by the signed-in agent/admin owner.
Admins should not receive global access to other agents' client contacts unless
a brokerage/team ownership model is explicitly designed later.

Client outreach schema supports:
- Contact name, email, optional phone, and source.
- Client status such as `New`, `Contacted`, `Interested`, `Tour Scheduled`,
  `Closed`, or `Not Interested`.
- Notes and next follow-up date.
- Saved criteria such as budget, location, property type, transaction type,
  bedrooms, bathrooms, and market status.
- Alert settings such as enabled/disabled, email frequency, last sent time,
  and matched listing history to prevent duplicate alerts.

Automated client alerts should not be implemented as browser-local behavior.
They require server-side persistence, an email provider, unsubscribe/consent
handling, duplicate suppression, and abuse controls. For the first version, it
is acceptable to build saved criteria and preview matching listings before
turning on automatic email sending.

Redfin-inspired TODOs for later product expansion:
- Map-based listing search.
- Saved searches and listing alerts.
- Listing comparison and client shortlists.
- Tour/showing scheduling workflow.
- Agent/client listing recommendations based on saved criteria.
- Valuation/estimate-style features only after price data is normalized and
  enough reliable local market data exists.

## Future Ownership Architecture: Agent vs Brokerage
The current ownership model is:

```text
Listing -> Agent
```

Real agencies may require:

```text
Brokerage -> Agent -> Listing
```

Before scaling beyond individual agents, decide whether:
- Listings are owned by an individual agent, a brokerage, or both.
- Brokerage administrators can manage all listings and leads for their team.
- Agents can transfer listings between team members.
- Showing requests and reporting belong to the listing agent or the brokerage.
- Agent profiles can belong to one or multiple brokerages.

Brokerage/team ownership does not need to block the current internal demo, but it should be considered before the ownership schema and RLS policies become difficult to change.

## Strategic Roadmap

### Before Client Accounts
These are the most urgent architecture and security requirements:

1. Finish the remaining UX bugs found through manual testing.
   - Why: The current MVP is feature-complete enough for internal demos, so obvious workflow defects should be resolved before expanding the role model.
   - Dependencies: Existing manual QA checklist and role-specific test accounts.

2. Add automated authorization and visibility tests.
   - Cover public, agent, owner, admin, and future-client boundaries.
   - Test listing reads, direct detail access, writes, photo access, showing requests, and admin approval.
   - Why: The visibility model is already complex enough that manual testing alone is fragile.
   - Dependencies: Stable test fixtures and a dedicated Supabase test environment or database test strategy.

3. Maintain fail-closed missing-profile behavior.
   - An authenticated user without a valid `public.profiles` row receives the
     `incomplete` app session role and no agent or admin privileges.
   - Login must not create or infer an agent profile.
   - Current agent signup still creates an agent profile explicitly.
   - Future onboarding should move reliable profile creation into a deliberate
     database-backed workflow without weakening the fail-closed session model.

4. Maintain UUID ownership relationships.
   - `listings.owner_id` and `showing_requests.agent_owner_id` reference
     `public.profiles(id)`.
   - `showing_requests.listing_id` references `public.listings(id)`.
   - Existing environments migrate through
     `supabase/ownership-uuid-migration.sql`.
   - Keep ownership and cascade behavior covered before implementing RLS.

5. Implement Row Level Security and user-scoped Supabase access.
   - Public users should read only public-visible listings.
   - Agents should manage only owned listings and owned lead data.
   - Admins should retain review access without gaining ownership of other agents' leads.
   - Server helpers should use the authenticated user's access token where user-scoped policies apply instead of always using the service-role key.
   - Why: Current application-route checks are not a sufficient database security boundary.
   - Dependencies: UUID ownership migration, finalized role semantics, and automated authorization tests.

6. Maintain production-safe mock fallback behavior.
   - Mock fallback is available only in development or an explicit demo mode.
   - Production read failures surface a clear operational state and server logging.
   - Do not reintroduce silent production fallback because outages could look like valid data and mix demo listings with real user expectations.

7. Build the agent-side Clients outreach workspace before public client
   accounts if agent CRM/outreach remains the immediate product priority.
   - This is agent-owned contact and follow-up management, not a public
     buyer/renter login role.
   - Automated client alerts must use persisted saved criteria and deliberate
     email infrastructure rather than local-only state.

8. Introduce public client accounts only after the items above are complete and
   the agent outreach model is stable.
   - Client accounts must not share listing ownership semantics with agents.
   - Client capabilities should be added incrementally after role and database enforcement are stable.

### Before Production/Public Launch
These items can follow the pre-client security foundation but should be completed before public reliance on the platform:

1. Restore Save Listing with persistent favorites after client accounts are introduced.
   - The Save Listing action is currently hidden so the UI does not imply persistence that does not exist.
   - Do not implement browser-local or localStorage favorites.
   - Implement favorites with client-owned persistent storage when client accounts are available.

2. Add privacy and abuse controls for public lead forms.
   - Add rate limiting, bot protection, payload limits, and duplicate-request protection.
   - Document who can access requester contact data and how long it is retained.

3. Replace hard delete with archival or soft delete.
   - Preserve listing history, showing requests, auditability, and recovery options.

4. Add audit history for approval and market-status changes.
   - Record who changed a status, when it changed, and any rejection reason.

5. Normalize production data fields.
   - Store price as a numeric amount with a separate currency.
   - Store preferred showing time as `timestamptz` rather than free text.
   - Normalize location fields when geographic search requirements are clear.
   - Remove the legacy `listings.status` column after migration confidence is established.
   - Reassess whether `verified` should remain once approval state is authoritative.

6. Harden authentication operations.
   - Configure custom SMTP and branded recovery templates.
   - Define agent onboarding/approval so public signup cannot grant an agent role unintentionally.
   - Add operational logging and monitoring for auth and data failures.

7. Improve listing media for real property marketing.
   - Move from one `listings.image` value to a `listing_media` table with multiple images, ordering, and a primary image.
   - Multi-photo galleries should follow client accounts in the current sequence unless real-agent demos make them urgent.

8. Improve accessibility, image optimization, and automated workflow coverage.
   - Address existing raw `<img>` warnings where appropriate.
   - Add regression coverage for auth, CRUD, visibility, filters, and lead submission.

### Post-Client Product Expansion
After client accounts are introduced:
- Add persistent favorites/saved listings and saved-list management.
- Add client inquiry and showing-request history.
- Add showing-request workflow statuses such as Contacted, Scheduled, Completed, and Closed.
- Add multi-photo galleries and media ordering.
- Add saved searches, search alerts, and client dashboard views.
- Consider agent/brokerage analytics, listing views, saves, and inquiry conversion.
- Expand Redfin-inspired client/search features such as map search, listing
  comparisons, shortlists, and stronger recommendation/alert workflows.

Showing-request statuses beyond `New` are useful for real agent operations, but `New`-only is acceptable for the current MVP and internal demos.

## Latest MVP/Demo Audit
Current status:
- MVP listing CRUD is Supabase-backed and Vercel build is passing.
- Listing status model redesign is complete:
  - `approval_status`: `Unapproved`, `Approved`, `Rejected`.
  - `market_status`: `Coming Soon`, `Active`, `Under Contract`, `Closed`, `Off Market`.
  - `transaction_type`: `For Sale`, `For Rent`.
- Public browse/detail visibility is approval/lifecycle filtered.
- Supabase Auth email/password flows are implemented for agent/admin access.
- Showing requests/inquiries are persistent in `public.showing_requests`.
- Showing requests are owner-only lead data:
  - Agents see requests only for listings they own.
  - Admins do not get global showing request visibility.
  - Admins see showing requests only for listings they personally own.
- Admin approval permissions remain separate from showing request privacy.

Top remaining recommendations by priority:
1. Finish remaining UX bugs found in manual testing.
2. Complete the remaining direct REST RLS abuse tests before real production
   data or users are introduced.
3. Build the agent-side Clients dropdown/workspace for outreach, follow-ups,
   saved criteria, and alert preparation.
4. Introduce public client accounts.
5. Add favorites, inquiry history, showing-request statuses, and multi-photo
   galleries.

Recommended next implementation slice:
- Complete the direct REST abuse tests in `docs/rls-rollout-testing.md`.
- Retain `supabase/rls-rollback.sql` as emergency recovery while the current
  environment contains only disposable test data.
- Apply and verify authenticated Storage upload policies before testing new
  image uploads in each Supabase environment.
- Before real production use, repeat the full RLS checklist in a staging
  environment and confirm backups and rollback procedures.

## Known Limitations and Technical Debt
- Create/update/delete send the authenticated user's access token and are
  enforced by both application authorization and database RLS.
- Application route checks remain required even though RLS is enabled.
- Mock reads remain available in development and explicit demo mode. Production
  fails closed unless `ETHIOMLS_ENABLE_MOCK_LISTINGS=true` is deliberately set.
- Delete is currently a hard delete.
- Owner-filtered delete verification is implemented, but deletion remains
  permanent and does not preserve listing history.
- Add Listing uses a fallback image when no primary image is uploaded.
- Edit Listing displays the current image and routes replacements through `/listings/[id]/photos`.
- Photo management supports one primary image only; galleries and ordering are future work.
- Save Listing is hidden. Restore it only with client accounts and persistent favorites; do not add a browser-local success state.
- Showing request status is currently always `New`; this is acceptable for MVP/internal demos, but a follow-up workflow will be valuable after client accounts.
- Seller lead status starts as `New`; admin assignment changes it to `Assigned`.
  More agent-facing status management is future work.
- Admin access uses `public.profiles.role` in both application authorization
  and RLS role helpers.
- `verified` remains a supporting database flag and should not be treated as the primary UI state.
- Initial Vitest authorization and visibility tests exist. Broader database and
  browser-level workflow coverage is still required.
- Missing or invalid profiles produce an authenticated `incomplete` session.
  Incomplete users can browse public listings and sign out but cannot access
  agent or admin tools.
- If an existing database still has a legacy `updated_at_label` column, app code ignores it. Do not read from it or write to it.
- The old `listings.status` column remains only as a temporary migration-safety field. New application behavior uses `transaction_type` and `market_status`.

## TODO/Future Enhancement: Address Normalization
Current MVP approach:
- `location` stores the broad city/neighborhood display value, such as `Addis Ababa, Bole`.
- `address` stores the full property address or landmark-level property address.

Future production schema to consider:
- `city`
- `neighborhood`
- `address_line1`
- `address_line2`
- `region`
- `country`

Reason for postponing:
- The current MVP implementation is sufficient for listing creation, review, display, and demo workflows.
- Additional normalization should be driven by future search/filter requirements and real listing data patterns.

## Recommended Next Sequence
1. Finish remaining UX bugs found in manual testing.
2. Complete the remaining direct REST RLS abuse tests.
3. Repeat the full RLS rollout in staging before introducing real production
   data or users.
4. Add the agent-side Clients dropdown/workspace.
5. Add saved client criteria and manual matching previews.
6. Add automated client email alerts only after email infrastructure, consent,
   duplicate suppression, and abuse controls are designed.
7. Introduce public client accounts.
8. Add favorites, inquiry history, showing-request statuses, and multi-photo galleries.

## Manual Testing Checklist
The current detailed QA scheme is in `docs/qa-manual-testing.md`.

Run these after Supabase env vars are configured and `supabase/listings.sql` has been applied.

### Auth
- Enable Supabase email/password auth.
- Disable email confirmation for MVP testing.
- Add `/reset-password` to Supabase Auth redirect URLs.
- Run the latest SQL so `public.profiles` exists.
- Open `/login`.
- Create an agent account.
- Expected: redirect to `/my-listings`.
- Log out from the navbar.
- Sign back in with the same account.
- Expected: authenticated navbar appears.
- Open `/forgot-password`.
- Request a reset link for the account email.
- Expected: success message appears and Supabase sends a recovery email.
- Open the recovery email link.
- Expected: `/reset-password` lets you set a new password.
- Sign in with the new password.
- Expected: login succeeds.
- If an auth error is shown, it should be a friendly message, not raw Supabase JSON.

### Missing Profile Authorization
- Create a Supabase Auth user, then remove that user's `public.profiles` row.
- Sign in with the same credentials.
- Expected: sign-in succeeds, but agent/admin navigation is absent.
- Open `/add-listing`, `/my-listings`, `/showing-requests`, `/admin`, and owned
  listing edit/photo URLs.
- Expected: an Agent profile required state appears without a redirect loop.
- Send create/update/delete/photo API requests while signed in.
- Expected: each protected listing API returns `403` with `Agent profile required.`
- Expected: public listing browse/detail and logout remain available.
- Restore a valid `agent` profile.
- Expected: agent navigation and listing management return.

### Read
- Open `/listings`.
- Expected: approved Supabase listings appear without legacy demo records.
- Open a real listing detail page from Browse Listings.
- Expected: the selected listing loads.
- Open `/my-listings`.
- Expected: only listings owned by the signed-in profile UUID appear.
- Open `/listings/999`.
- Expected: styled not-found state.

### Create
- Open `/add-listing`.
- Submit a valid listing with an address and a primary image selected.
- Expected: success message appears.
- Open `/my-listings`.
- Expected: new listing appears.
- Refresh `/my-listings`.
- Expected: new listing remains.
- Check Supabase Table Editor.
- Expected: new row has `owner_id` equal to the authenticated Supabase user ID, `approval_status = Unapproved`, `transaction_type = For Sale`, `market_status = Active`, `verified = false`, and short `listing_id` like `MLS-1004`.
- Expected: new row has `location` as city/neighborhood and `address` as the specific property address.
- Expected: new row has an `image` URL from the `listing-images` Supabase Storage bucket.
- Open the listing detail page.
- Expected: uploaded image appears.

### Update
- From `/my-listings`, open an owned listing edit page.
- Change title, price, bedrooms, bathrooms, and description.
- Change the address.
- Save.
- Expected: success message appears.
- Open the listing detail page and refresh.
- Expected: edited values persist.
- If the listing was rejected, expected: `approval_status = Unapproved` and `rejection_reason = null`.

### Delete
- Open an owned listing detail page.
- Click `Delete Listing`, then cancel.
- Expected: listing remains.
- Click `Delete Listing`, then confirm.
- Expected: redirect to `/my-listings`.
- Expected: deleted listing is gone from UI and Supabase.

### Ownership
- Sign out and open `/add-listing`.
- Expected: redirected to `/login`.
- Sign in as an agent and open `/listings/2`.
- Expected: non-owner actions are shown.
- Open `/listings/2/edit`.
- Expected: access denied.
- Open `/listings/2/photos`.
- Expected: access denied.

### Listing IDs
- Add two listings back to back.
- Expected: IDs increment, such as `MLS-1004`, then `MLS-1005`.
- Confirm database `id` remains the internal primary key and `listing_id` is the display MLS code.

### Photos
- Open an owned listing detail page.
- Click `Manage Photos`.
- Expected: current primary photo appears.
- Upload a replacement image.
- Expected: success message appears and the preview updates.
- Open `/my-listings`, `/listings`, and the listing detail page.
- Expected: the replacement image appears everywhere.
- Open `/listings/2/photos`.
- Expected: access denied for a non-owned listing.

### Showing Requests
- Sign out and open an approved public listing detail page.
- Click `Request Showing`.
- Submit name and email with optional phone, preferred date/time, and message.
- Expected: success message appears.
- Check Supabase Table Editor.
- Expected: `public.showing_requests` has a new row with listing ID, listing title, MLS ID, `agent_owner_id`, requester fields, `status = New`, and `created_at`.
- Sign in as the listing owner.
- Open `/showing-requests`.
- Expected: the new request appears.
- Sign in as a different agent.
- Open `/showing-requests`.
- Expected: requests for listings owned by other agents do not appear.
- Sign in as an admin who does not own that listing.
- Open `/showing-requests`.
- Expected: the request does not appear.
- Sign in as an admin who owns the listing.
- Open `/showing-requests`.
- Expected: the request appears.

### Admin Approval
- Create or update a profile with `role = admin`.
- Sign in as that admin user.
- Open `/admin`.
- Expected: pending listings from Supabase appear with photo, MLS ID, title, price, location, agent, and approval status.
- Use the filter buttons for Unapproved, Approved, Rejected, and All.
- Expected: each filter shows matching listings.
- Create a new listing from `/add-listing`.
- Open `/admin`.
- Expected: the new listing appears as `Unapproved`.
- Click `Approve`.
- Expected: listing disappears from the pending queue.
- Check Supabase Table Editor.
- Expected: `approval_status = Approved` and `verified = true`.
- Open `/admin?status=Approved`.
- Reject an approved listing with a reason.
- Expected: `approval_status = Rejected`, `verified = false`, and `rejection_reason` stores the reason.
- Open `/my-listings` as the owner of a rejected listing.
- Expected: rejection reason is visible.
- Edit the rejected listing and save.
- Expected: listing is resubmitted with `approval_status = Unapproved` and `rejection_reason = null`.
- Create or reset another listing to `Unapproved`.
- Click `Reject`.
- Expected: listing disappears from the pending queue.
- Check Supabase Table Editor.
- Expected: `approval_status = Rejected`, `verified = false`, and `rejection_reason` stores the reason.

## Coding Rules
- Preserve EthioMLS styling.
- Prefer reusable components.
- Do not modify unrelated files.
- Add TODO comments for future work.
- Do not introduce auth, billing, payments, emails, or image uploads unless explicitly requested.
- Keep MVP changes narrow and verify with `npm run lint`.

## Next Session Context
- Planned next slice: complete agent-side automated client listing alert emails.
  This is still agent-side client outreach, not public client accounts.
  Implement phase by phase and confirm before each phase if product choices have
  changed.
  - Phase 1 - Email scope:
    - Listing alert emails may include listings with `approval_status = Approved`
      and market statuses selected on the client alert filter.
    - Supported alert market statuses: `Coming Soon`, `Active`, and `Closed`.
    - Default alert market status filter: `Active`.
    - Exclude `Under Contract`, `Off Market`, `Unapproved`, and `Rejected` from alert
      emails.
    - Match against saved client criteria such as location, property type,
      transaction type, budget, bedrooms, bathrooms, and selected market
      statuses. Blank criteria should not filter out listings.
    - First implementation is manual `Send now`; store frequency values for
      future `Immediate`, `Daily`, `Weekly`, and `Off` scheduled behavior.
    - Emails include up to 5 newest matching listings.
    - Email display name should be the assigned agent's name. The sender email
      should remain platform-controlled and configurable.
    - Each listing in the email must include a `View Details` link to that
      listing detail page.
  - Phase 2 - Schema:
    - Add durable alert send history, tentatively `public.client_alert_sends`.
    - Store one history row per listing included in an email and group rows from
      the same email with `send_batch_id`.
    - Do not add a permanent unique constraint on `(agent_client_id,
      listing_id)` because agents should be able to resend a listing later.
    - Add or confirm `agent_clients` alert fields:
      `alert_enabled`, `alert_frequency`, `alert_market_statuses`,
      `alert_last_checked_at`, and `alert_last_sent_at`.
    - Use `alert_market_statuses text[] not null default array['Active']`.
    - Add database constraints for allowed alert frequencies (`Off`,
      `Immediate`, `Daily`, `Weekly`) and allowed alert market statuses
      (`Coming Soon`, `Active`, `Closed`).
    - Keep alert send history owner-scoped by `agent_owner_id`; admins should
      not get global visibility into other agents' client alert history.
    - Make alert history visible to the owning agent in the UI.
  - Phase 3 - Email provider:
    - Use Resend.
    - Use generic/rebrand-friendly env vars where possible:
      `RESEND_API_KEY`, `LISTING_ALERT_FROM_EMAIL`,
      `LISTING_ALERT_REPLY_TO_EMAIL`, `LISTING_ALERT_PRODUCT_NAME`, and
      `NEXT_PUBLIC_SITE_URL`.
    - Initial sender email can be `alerts@ethiomls.com`, but it must be
      configurable because the product name may change.
    - From format: `Agent Name <configured sender email>`.
    - Reply-To should use the agent's Supabase account email when available,
      falling back to the configured reply-to email.
    - Failed email attempts should be saved as `Failed` alert history rows with
      concise error details.
  - Phase 4 - Server alert engine:
    - Add a signed-in agent/admin manual send route, tentatively
      `POST /api/client-alerts/send`.
    - Send for one owned client record at a time.
    - Manual `Send now` is allowed even when `alert_enabled = false`; scheduled
      sends later must require alerts to be enabled.
    - Default manual sends should exclude previously successful sends.
    - Load the owned client, find up to 5 eligible matching listings, send the
      email through Resend, record send history, and update
      `alert_last_checked_at` plus `alert_last_sent_at` only on success.
    - No matching listings should return a clean non-send result and should not
      call Resend.
  - Phase 5 - Email content:
    - Use count/location subject when available, such as
      `3 listings that match your Addis Ababa search`, with fallback
      `New listings that match your search`.
    - Include primary listing images when available, but keep the email useful
      without images.
    - Copy should read like the assigned agent is talking to the client.
    - Include listing title, price, location, transaction type, market status,
      bedrooms/bathrooms when applicable, and direct `View Details` links.
    - Signature should include agent name, agency name if available, and
      `via ${LISTING_ALERT_PRODUCT_NAME}`.
    - Include a preference link for clients to stop listing updates when an
      unsubscribe token exists.
  - Phase 6 - Agent UI:
    - `/clients/alerts` is the main alert workspace.
    - `/clients/[id]` should also show a smaller alert panel.
    - `Send now` should be available from both places, backed by shared server
      logic.
    - Start with `/clients/alerts`, then reuse the component on client detail.
    - Show alert enabled toggle, frequency selector, market-status multi-select,
      preview matches, `Send now`, last sent/result state, and visible alert
      history.
  - Phase 7 - Safety controls:
    - Respect Resend limits. Resend docs currently describe a default API rate
      limit of 5 requests per second per team, with `429` responses for rate or
      quota overages.
    - Send one Resend request at a time from the app and add a configurable app
      cap below provider limits, such as `LISTING_ALERT_MAX_SENDS_PER_MINUTE=60`.
    - Keep a per-client repeat guard for manual sends, such as one manual send
      per client every 5 minutes.
    - If Resend returns `429`, record the attempt as `Failed` with a rate/quota
      message and show it clearly in the UI.
    - Scheduled sends later should use queue/batched-worker behavior and must
      not fire all clients at once.
    - Do not include private lead/contact data from other agents. Do not include
      Off Market, Under Contract, Unapproved, or Rejected listings.
  - Phase 8 - Test plan:
    - Add schema/RLS tests for alert send history, default market statuses,
      allowed-value constraints, and owner-only visibility.
    - Add matching tests for approval/status eligibility, criteria matching,
      blank criteria behavior, newest-first ordering, cap at 5, and default
      exclusion of previously successful sends.
    - Add API tests for signed-out denial, role denial, owner scoping, manual
      send while disabled, missing client email, no matches, provider failure,
      success history and timestamp updates, repeat-send guard, and Resend
      `429` handling.
    - Add UI/manual QA for `/clients/alerts`, client detail alert panel, send
      results, alert history, and `View Details` links.
- Latest implemented slice: public lead hardening, public contact email, and
  client alert detail cleanup.
  - Public showing-request submissions now have route-level request-size
    rejection, malformed JSON handling, and a basic in-process IP rate limit.
  - `createShowingRequest()` validates field types and lengths, normalizes
    requester email, and blocks duplicate showing requests for the same
    listing/email within 24 hours using a service-role duplicate lookup.
  - Agent profiles now include optional `public_contact_email`.
  - New routes/pages:
    - `/profile`
    - `PATCH /api/profile`
  - Agents/admins can manage full name, agency name, and public contact email
    from `/profile`.
  - Showing-request success confirmations use
    `profiles.public_contact_email` only. If the field is blank, the app does
    not expose the agent's Supabase Auth login email.
  - `supabase/listings.sql` adds `profiles.public_contact_email` and an email
    format constraint.
  - `supabase/rls-policies.sql` adds owner-scoped authenticated profile
    updates; authenticated profile updates are column-limited to
    `full_name`, `agency_name`, and `public_contact_email` so users cannot
    elevate their `role` through direct Supabase REST calls.
    `supabase/rls-rollback.sql` drops the new policy.
  - `/clients/[id]` Listing Alert panel was simplified to keep the send/resend
    actions and remove diagnostic/debug text. Detailed match diagnostics remain
    on `/clients/alerts`.
  - Manual QA passed for public contact email behavior after applying the SQL:
    configured public email appears after successful showing requests, and
    clearing it avoids login-email exposure.
  - Local verification after this slice:
    - `npm.cmd run lint`
    - `npm.cmd run test -- --configLoader runner` with 106 tests
    - `npm.cmd run build`
  - Quick security pass found and fixed an RLS grant issue where owner profile
    updates were initially table-wide; `tests/rls-policies.test.ts` now asserts
    the column-limited grant.
- Latest automation-prep slice:
  - Added durable alert consent/unsubscribe fields to `agent_clients`.
  - New clients receive an `alert_unsubscribe_token`; existing rows are
    backfilled by `supabase/listings.sql`.
  - Enabling alerts records `alert_consent_at`; disabling alerts clears
    consent for the current saved state.
  - Manual alert emails now include `/alerts/unsubscribe?token=...` when a
    token is available.
  - Public unsubscribe route:
    - `POST /api/client-alerts/unsubscribe`
    - Uses the opaque token and service-role REST to set
      `alert_enabled = false`, `alert_frequency = Off`, and
      `alert_unsubscribed_at = now`.
  - Public unsubscribe page:
    - `/alerts/unsubscribe`
    - Requires the email token and asks the recipient to confirm before
      turning alerts off.
  - Manual sends now block clients with `alert_unsubscribed_at` until the agent
    re-enables alerts on the client record.
  - Agent-facing UI now clearly marks unsubscribed clients on `/clients`,
    `/clients/[id]`, and `/clients/alerts`, including the unsubscribe date on
    detail and alert-workspace warning states.
  - Scheduled/cron automation is still not implemented.
  - Local verification after this slice:
    - `npm.cmd run lint`
    - `npm.cmd run test -- --configLoader runner` with 113 tests
  - Recommended next implementation slice:
    - Add a cron-safe dry-run/batched alert runner route that respects
      `alert_enabled`, `alert_frequency`, `alert_consent_at`,
      `alert_unsubscribed_at`, rate caps, and existing send history.
- Latest scheduled-alert runner slice:
  - Added internal runner route:
    - `POST /api/client-alerts/run`
    - Protected by `CLIENT_ALERT_RUN_SECRET` via `Authorization: Bearer ...`
      or `x-client-alert-run-secret`.
    - Defaults to `dryRun: true`; explicit `{ "dryRun": false }` is required
      to send.
    - Batch limit defaults to 5 and is capped at 10.
  - Added service-role scheduled alert helpers:
    - `getScheduledAlertClients()`
    - `getAlertListingsForAutomation()`
    - `getAlertSenderProfile()`
    - `sendScheduledListingAlert()`
    - `runScheduledClientAlerts()`
  - Runner respects `alert_enabled`, `alert_frequency`, `alert_consent_at`,
    `alert_unsubscribed_at`, already-sent listing history, and no-match
    handling.
  - Frequency behavior:
    - `Off`: skipped.
    - `Immediate`: due whenever unsent matches exist.
    - `Daily`: due when last checked/sent is at least 24 hours old.
    - `Weekly`: due when last checked/sent is at least 7 days old.
  - Scheduled sends use the agent profile as sender identity and include the
    existing alert unsubscribe link.
  - Vercel Cron is configured in `vercel.json` to invoke
    `/api/client-alerts/run` daily at `0 13 * * *` UTC.
  - Current Vercel Hobby-plan cadence means `Immediate` alerts are still only
    checked once per day. If the project moves off Vercel Hobby or uses an
    external scheduler, change the cron cadence so `Immediate` clients can be
    checked hourly while `Daily` and `Weekly` remain rate-limited by the runner.
  - Vercel Cron uses `GET /api/client-alerts/run`, protected by `CRON_SECRET`
    through the Vercel-provided `Authorization: Bearer ...` header.
  - Manual runner testing still uses `POST /api/client-alerts/run`, protected
    by `CLIENT_ALERT_RUN_SECRET`, and defaults to `dryRun: true`.
  - First production cron observation should inspect Vercel Cron logs and alert
    history after the scheduled run before increasing cadence or batch size.
  - Deployed runner smoke test passed:
    - `CLIENT_ALERT_RUN_SECRET` was configured in Vercel.
    - Dry run returned one eligible Immediate-frequency client and sent no
      emails.
    - A live run with `dryRun: false` and `limit: 1` sent 3 matching listings
      to a tester-controlled email address.
    - A follow-up dry run returned no new matching listings, confirming
      already-sent listing suppression.
    - Local git working tree was clean after the scheduled-runner checkpoint.
  - Recommended checkpoint commit message:
    `Harden showing requests and add public agent contact email`
- Previous implemented slice: manual agent-side client listing alert emails and
  client workspace polish.
  - Resend-backed manual listing alert emails are implemented.
  - Resend was configured and locally tested successfully with the temporary
    sending domain:
    - Domain: `ethiomls.online`
    - Sending subdomain: `alerts.ethiomls.online`
    - From email pattern: `alerts@alerts.ethiomls.online`
  - Required environment variables:
    - `RESEND_API_KEY`
    - `LISTING_ALERT_FROM_EMAIL`
    - `LISTING_ALERT_REPLY_TO_EMAIL`
    - `LISTING_ALERT_PRODUCT_NAME`
    - `NEXT_PUBLIC_SITE_URL`
    - Optional: `LISTING_ALERT_MAX_SENDS_PER_MINUTE`
  - Resend API key should use sending-only access when possible.
  - Local Resend test passed from the app.
  - Resend env vars were added in Vercel by the user.
  - New alert send route:
    - `POST /api/client-alerts/send`
    - Signed-in agent/admin only.
    - Sends for one owned client record at a time.
    - Manual sends are allowed even when `alert_enabled = false`.
    - A 5-minute per-client repeat guard is enforced.
    - App-level send cap uses `LISTING_ALERT_MAX_SENDS_PER_MINUTE`, default
      `60`.
    - Resend `429` failures are recorded as failed alert history rows.
  - New alert history table and fields are in `supabase/listings.sql`:
    - `public.client_alert_sends`
    - `agent_clients.alert_market_statuses`
    - `agent_clients.alert_last_checked_at`
    - `agent_clients.alert_last_sent_at`
    - `agent_clients.alert_matched_listing_ids`
  - RLS policies in `supabase/rls-policies.sql` keep
    `client_alert_sends` owner-only.
  - `supabase/rls-rollback.sql` was updated for alert history policies.
  - Alert email matching:
    - Only `approval_status = Approved` listings can be emailed.
    - Alert market statuses are limited to `Coming Soon`, `Active`, and
      `Closed`.
    - `Under Contract`, `Off Market`, `Unapproved`, and `Rejected` are excluded from
      alert emails.
    - Emails include up to 5 matching listings.
    - Each listing includes a direct `View Details` link.
    - Email includes agent-style copy and, after the automation-prep slice, a
      preference link for stopping listing updates when a token exists.
  - Important UX decision:
    - The old single client `preferred_market_status` filter was removed from
      the client form and ignored by matching.
    - Client saves now clear `preferred_market_status` to `null`.
    - Market status for alert emails is now controlled only by
      `alert_market_statuses`.
    - This avoids confusing overlap between a generic market filter and alert
      market-status multi-select.
  - `/clients/alerts` was redesigned as a professional alert workspace:
    - Shows metric strip per client: Approved Listings, In Alert Markets,
      Criteria Matches, New Matches, Sent Before.
    - Separates Ready to Send from Already Sent.
    - Shows excluded listings and reasons in an expandable section.
    - Uses `Send new matches` and `Resend eligible matches` actions.
  - `/clients` was redesigned as a CRM-style table:
    - Summary metrics for Total Clients, Active Pipeline, Due Follow-ups, and
      Alerts Enabled.
    - Table rows show client, status/source, saved criteria, next follow-up,
      and alert state.
  - `/clients/[id]` now shows alert-eligible matches rather than broad general
    criteria matches that could include Under Contract or Off Market listings.
  - Client deletion is implemented:
    - `DELETE /api/clients/[id]`
    - `deleteAgentClient()` in `lib/clients.ts`
    - `DeleteClientButton` on `/clients/[id]`
    - Delete is owner-scoped and requires Supabase to return the deleted row
      before the API reports success.
    - Missing/non-owned deletes return `404` with
      `Client not found or access denied.`
    - Deleting an `agent_clients` row cascades related `client_alert_sends`
      through the database foreign key.
  - Local verification after this slice:
    - `npm.cmd run lint`
    - `npm.cmd run test -- --configLoader runner` with 90 tests
    - `npm.cmd run build`
  - Recommended checkpoint commit message:
    `Add manual client listing alert emails`
  - Next session checklist:
    - Commit the current work if it has not been committed.
    - Add Resend env vars to Vercel and redeploy.
    - Run updated `supabase/listings.sql` and `supabase/rls-policies.sql` in
      any Supabase environment that has not received the alert schema/RLS
      changes.
    - Smoke test `/clients`, `/clients/[id]`, `/clients/[id]/edit`,
      `/clients/alerts`, `Send new matches`, `Resend eligible matches`, and
      `Delete Client`.
    - Test with an agent-owned client using the tester's email before sending
      to real client addresses.
    - Keep sends manual for demos; do not implement scheduled/automatic sends
      until unsubscribe/preference and abuse controls are designed.
- Previous implemented slice: agent-side Clients outreach workspace.
  - Agent/admin navbar now includes a Clients dropdown with Client Leads,
    Client List, Add Client, Follow-ups, and Automated Alerts.
  - New pages/routes:
    - `/clients`
    - `/clients/new`
    - `/clients/[id]`
    - `/clients/[id]/edit`
    - `/clients/follow-ups`
    - `/clients/alerts`
    - `POST /api/clients`
    - `PUT /api/clients/[id]`
  - New `public.agent_clients` table is defined in `supabase/listings.sql`
    with owner-scoped contact fields, status, notes, next follow-up,
    saved listing criteria, and alert-prep fields.
  - RLS policies in `supabase/rls-policies.sql` keep agent client records
    owner-only; admins do not get global client/contact visibility.
  - Showing Requests now include Add to Clients links that prefill the new
    client form.
- Scheduled automated alerts are not implemented yet.
  - Current alert emails are manual only.
  - Scheduled sends later should require queue/worker behavior, unsubscribe or
    preference management, consent handling, duplicate suppression, and stronger
    abuse controls.
  - User applied the updated Supabase SQL and manually tested the Clients
    workflow successfully.
  - Local checks passed after implementation:
    - `npm.cmd run lint`
    - `npm.cmd run test -- --configLoader runner` with 78 tests
    - `npm.cmd run build`
  - Recommended checkpoint commit message:
    `Add agent client outreach workspace`
- Previous security slices completed:
  - Direct REST RLS abuse tests passed.
  - Authenticated Storage upload policies and user-scoped image uploads were
    implemented and manually verified.
- RLS implementation is prepared locally:
  - `supabase/rls-policies.sql` enables policies for profiles, listings, and
    showing requests.
  - `supabase/rls-rollback.sql` provides emergency rollback.
  - `docs/rls-rollout-testing.md` defines staged application and direct REST
    verification.
  - Role helper functions live in a non-exposed `ethiomls_private` schema.
  - Owner updates cannot alter admin-controlled approval fields; edits to
    rejected listings still resubmit them as Unapproved.
  - Anonymous showing-request inserts do not receive lead rows back.
- `supabase/rls-policies.sql` was applied to the connected Supabase environment,
  which currently contains disposable test data.
- Quick RLS smoke tests passed for public visibility and showing requests,
  agent ownership and lead isolation, non-owner denial, and admin review.
- Rejected and Unapproved listings are hidden from unrelated agents regardless
  of market status. Only Approved + Off Market listings receive the
  other-agent visibility exception.
- Listing collections use `created_at desc`, so newly uploaded listings appear
  first and editing an older listing does not move it above newer listings.
- Supabase credential paths are separated and verified:
  - Anonymous REST requests use the anon key as both `apikey` and bearer token.
  - Authenticated REST requests use the anon key as `apikey` and the signed-in
    user's access token as bearer token.
  - Service-role REST requests require the service key explicitly and do not
    fall back to another credential.
  - Listing image uploads use authenticated Storage requests under
    owner-scoped object paths.
- Public reads/submissions, owner operations, profile reads, showing-request
  reads, admin approval, and signup profile creation are wired to their
  intended credential paths.
- Credential and operation-routing tests pass, and missing credentials fail
  closed.
- RLS is enabled in the connected test-data environment.
- UUID ownership migration was applied and manually verified in Supabase.
- `listings.owner_id` and `showing_requests.agent_owner_id` now report the
  PostgreSQL `uuid` data type.
- Verified foreign keys:
  - `listings_owner_id_fkey`
  - `showing_requests_agent_owner_id_fkey`
  - `showing_requests_listing_id_fkey`
  - `showing_requests_listing_owner_fkey`
- Post-migration manual tests passed for listing CRUD, photo management,
  showing-request submission, owner-scoped request visibility, cascade cleanup,
  and non-owner authorization.
- Recommended next engineering task: complete the direct REST abuse tests in
  `docs/rls-rollout-testing.md`, then continue resolving remaining UX issues.
- UUID ownership migration is prepared:
  - `supabase/ownership-uuid-migration.sql` removes `agent-1`/`agent-2` demo
    records, validates all remaining ownership values, converts ownership
    columns to UUID, and adds cascading foreign keys.
  - `supabase/ownership-uuid-rollback.sql` reverses the schema changes but
    cannot restore deleted demo rows without a backup.
  - `supabase/listings.sql` now represents the UUID-based schema for new
    environments and no longer inserts legacy demo listings.
  - Migration contract tests cover cleanup, preflight aborts, UUID conversion,
    cascade relationships, and the canonical schema.
- Showing requests currently cascade-delete with their listing.
- TODO: Add requester cancellation email before production listing deletion;
  do not add email infrastructure as part of the ownership migration.
- The migration backup should be retained until the next stable production
  checkpoint.
- Production-safe listing read behavior is implemented:
  - Development uses mock fallback when Supabase reads fail.
  - Production fails closed by default.
  - Explicit demo deployments can set
    `ETHIOMLS_ENABLE_MOCK_LISTINGS=true`.
  - Affected pages render a reusable listings-unavailable state.
  - Read failures log operation context on the server.
- Listing read tests cover successful Supabase reads, development fallback,
  explicit production demo fallback, production failure, and missing
  configuration.
- The full Vitest suite passes with 67 tests.
- `npm run build` passes.
- The UUID ownership migration and Supabase credential-path separation are
  complete; do not rerun migration scripts against a verified environment
  without first confirming the current schema and backup state.
- Latest checkpoint commit:
  `288cb0d Harden RLS visibility and sort listings newest first`.
- Owner-filtered Supabase deletes now use `Prefer: return=representation` and
  require one returned row before reporting success.
- Delete helper and route tests cover owned, non-owned, missing, and Supabase
  failure outcomes.
- In restricted Windows sandboxes,
  use `npx vitest run --configLoader runner` if the default esbuild config
  loader cannot access the project path.
- Manual delete verification passed:
  - Signed-out requests return `401` with `Sign in required.`
  - Signed-in missing or non-owned requests return `404` with
    `Listing not found or access denied.`
- Targeted lint and TypeScript checks pass for the delete slice.
- Full-project lint still has pre-existing `react-hooks/set-state-in-effect`
  errors in `app/reset-password/page.tsx` and existing raw `<img>` warnings.
- Checkpoint commit: `ee2b232 Add auth tests and fail-closed profile handling`.
- The checkpoint was committed and pushed before the user's break.
- `npm run test` passes.
- `npm run build` passes.
- Missing-profile fail-closed behavior was manually tested successfully.
- Vitest coverage now includes session authorization, listing visibility,
  showing eligibility, protected API denials, and incomplete-user identity
  handling for showing requests.
- Authenticated users without a valid profile receive the `incomplete` role,
  retain public browsing and logout, and receive no agent/admin privileges.
- Login no longer creates or infers agent profiles. Explicit agent signup still
  creates an agent profile.
- Current app has Supabase listing persistence for CRUD.
- Current app has Supabase Storage primary image uploads.
- Current app has Supabase-backed admin approval/rejection with profile roles.
- Current app has Supabase Auth login/signup/logout plus forgot/reset password flows.
- Current app has role-aware agent/admin navigation and friendly auth errors.
- Current app has role-aware listing visibility and Approved + Active showing eligibility.
- Run `supabase/qa-product-rules-migration.sql` in existing Supabase environments.
- Detailed regression coverage is documented in `docs/qa-manual-testing.md`.
- Supabase REST URL bug was diagnosed: `NEXT_PUBLIC_SUPABASE_URL` must not include `/rest/v1`.
- User successfully tested adding a new home after Supabase setup.
- Database-owned MLS ID generation is implemented through Postgres sequence/function.
- UUID ownership migration must precede RLS implementation.
- Do not enable RLS or introduce client accounts before the ownership migration
  is prepared and tested.
