# EthioMLS

## Project Purpose
EthioMLS is an agent-facing MLS workspace for Ethiopian real estate professionals.

## Current Architecture
- Next.js App Router application using React, TypeScript, and Tailwind CSS.
- Core listing UI lives under `app/`.
- Shared listing form lives in `components/PropertyForm.tsx`.
- Listing persistence is now backed by Supabase/Postgres through server-side REST helpers:
  - `lib/supabase.ts` builds Supabase REST and Storage requests from environment variables.
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
- Showing requests are limited to Approved + Active listings in both UI and server logic.
- Residential room fields are required; Land stores null rooms; Commercial/Office use optional bathrooms and null bedrooms.
- Add Listing excludes Pending and Closed; Edit Listing supports the full market lifecycle.
- Edit Listing uses Manage Photos file upload instead of raw image URL editing.
- Successful login redirects to the dashboard.
- Navbar and home listing presets apply real Browse filters.
- Mobile navigation uses a compact menu with controlled dismissal behavior.
- Mock listing fallback is restricted to non-production environments or
  explicit demo mode.
- Production listing-read failures log server-side context and render a clear
  listings-unavailable state instead of silently showing demo data.

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
- New listings store the authenticated user's `auth.users.id` string in `listings.owner_id`.
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
- `market_status text not null` - `Coming Soon`, `Active`, `Pending`, `Closed`, or `Off Market`.
- `verified boolean not null default false`
- `bedrooms integer` - nullable when bedrooms do not apply.
- `bathrooms integer` - nullable for Land and optional for Commercial/Office.
- `agent text not null`
- `approval_status text not null` - `Unapproved`, `Approved`, or `Rejected`.
- `rejection_reason text`
- `description text not null`
- `image text not null`
- `owner_id text not null`
- `created_at timestamptz`
- `updated_at timestamptz` - source of truth for Last Updated displays.

Table: `public.profiles`

Important columns:
- `id uuid primary key references auth.users(id)` - Supabase Auth user ID.
- `full_name text`
- `agency_name text`
- `role text not null default 'agent'` - either `agent` or `admin`.
- `created_at timestamptz`

Table: `public.showing_requests`

Important columns:
- `id text primary key` - app-generated request identity.
- `listing_id text not null` - internal listing ID.
- `listing_title text not null` - title snapshot at request time.
- `listing_mls_id text not null` - MLS ID snapshot at request time.
- `agent_owner_id text not null` - owner ID for agent-scoped request inboxes.
- `requester_name text not null`
- `requester_email text not null`
- `requester_phone text`
- `preferred_datetime text`
- `message text`
- `status text not null default 'New'`
- `created_at timestamptz`

Indexes:
- `owner_id`
- `status`
- `property_type`
- `showing_requests.agent_owner_id`
- `showing_requests.listing_id`
- `showing_requests.created_at`

Trigger:
- Updates `updated_at` automatically before row updates.
- App code should format user-facing Last Updated labels from `updated_at`.

Seed data:
- `MLS-1001`, owner `agent-1`
- `MLS-1002`, owner `agent-2`
- `MLS-1003`, owner `agent-1`, rejected with a sample rejection reason

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
  - Coming Soon, Pending, Closed, Off Market, Unapproved, and Rejected listings cannot receive showing requests.
  - Email notifications are not implemented yet.
- Admins can approve or reject listings through `/admin`.
- Admins can filter and review Unapproved, Approved, Rejected, and All listings.
- Admin rejection requires a reason.
- Editing a rejected listing resubmits it by setting `approval_status = Unapproved` and clearing `rejection_reason`.
- Public browse/detail shows only `approval_status = Approved` listings with `market_status` in `Coming Soon`, `Active`, `Pending`, or `Closed`.
- Public browse/detail hides Unapproved listings, Rejected listings, and Off Market listings.
- Authenticated agents can browse public-visible listings plus Off Market listings from other agents.
- Owners can always browse and open all of their own listings regardless of approval or market status.
- Admins can browse and open all listings.
- Closed listings remain publicly visible.
- More market statuses may be added later depending on agent, admin, and client feedback.
- `owner_id` remains `text` for now so old seeded `agent-1`/`agent-2` demo rows can coexist with new Supabase Auth UUID owner IDs.
- TODO: Convert `owner_id` to `uuid references auth.users(id)` once test/demo rows are cleaned up.
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

4. Migrate ownership IDs to UUID relationships.
   - Convert `listings.owner_id` from `text` to a UUID foreign key referencing the authenticated profile/user.
   - Convert or replace `showing_requests.agent_owner_id` with a proper UUID relationship.
   - Add a foreign key from showing requests to listings and decide retention behavior for archived listings.
   - Preserve existing data through a deliberate demo-data migration.
   - Why: Text demo identities prevent reliable referential integrity and complicate RLS.
   - Dependencies: Remove or map `agent-1`/`agent-2` seed identities and define deletion/archival behavior.

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

7. Introduce client accounts only after the items above are complete.
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

Showing-request statuses beyond `New` are useful for real agent operations, but `New`-only is acceptable for the current MVP and internal demos.

## Latest MVP/Demo Audit
Current status:
- MVP listing CRUD is Supabase-backed and Vercel build is passing.
- Listing status model redesign is complete:
  - `approval_status`: `Unapproved`, `Approved`, `Rejected`.
  - `market_status`: `Coming Soon`, `Active`, `Pending`, `Closed`, `Off Market`.
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
2. Prepare and migrate `owner_id` and `agent_owner_id` to proper UUID relationships.
3. Prepare user-scoped Supabase helpers and RLS policy tests.
4. Implement RLS only after UUID ownership and integration-test prerequisites are ready.
5. Introduce client accounts.
6. Add favorites, inquiry history, showing-request statuses, and multi-photo galleries.

Recommended next implementation slice:
- Inventory legacy ownership values such as `agent-1` and `agent-2` in listings
  and showing requests.
- Define a deliberate mapping or removal strategy for demo ownership records
  before changing columns to UUID foreign keys.
- Document expected deletion/retention behavior for listings and showing
  requests before adding foreign keys.
- Prepare the ownership migration and rollback plan, then add migration-focused
  tests before applying schema changes.
- Keep this slice narrow: do not enable RLS or introduce client accounts while
  ownership identities are still mixed.

## Known Limitations and Technical Debt
- Create/update/delete use Supabase service role through server routes and should be revisited with RLS.
- Auth is enforced in app route handlers and server pages; RLS is still disabled for this phase.
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
- Admin access uses `public.profiles.role`; database RLS is still pending.
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
2. Inventory and map legacy ownership values such as `agent-1` and `agent-2`.
3. Migrate listing and showing-request ownership to UUID relationships.
4. Separate service-role, anonymous, and authenticated-user Supabase request paths.
5. Add RLS integration tests, then implement RLS.
6. Introduce client accounts.
7. Add favorites, inquiry history, showing-request statuses, and multi-photo galleries.

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
- Expected: Supabase seeded listings appear.
- Open `/listings/1`.
- Expected: seeded detail page loads with `MLS-1001`.
- Open `/my-listings`.
- Expected: only `agent-1` listings appear.
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
- The full Vitest suite passes with 35 tests.
- `npm run build` passes.
- Recommended next engineering task: inventory and map legacy ownership IDs
  before preparing the UUID ownership migration.
- Latest checkpoint commit: `1a9e85d Verify owner-filtered listing deletes`.
- Owner-filtered Supabase deletes now use `Prefer: return=representation` and
  require one returned row before reporting success.
- Delete helper and route tests cover owned, non-owned, missing, and Supabase
  failure outcomes.
- The full Vitest suite passes with 30 tests. In restricted Windows sandboxes,
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
