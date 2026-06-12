# EthioMLS RLS Rollout And Testing

Do not apply the RLS migration to the primary environment first. Use a
dedicated Supabase test project or a verified staging clone with disposable
test accounts and listings.

## Files

- Enable policies: `supabase/rls-policies.sql`
- Emergency rollback: `supabase/rls-rollback.sql`
- Canonical base schema: `supabase/listings.sql`

## Required Test Accounts

Prepare these Supabase Auth users and matching profile states:

1. Agent A with `public.profiles.role = agent`.
2. Agent B with `public.profiles.role = agent`.
3. Admin with `public.profiles.role = admin`.
4. Incomplete user with an Auth account but no `public.profiles` row.

Agent A and Agent B must each own at least one listing. Prepare listing rows
covering:

- Approved + Active
- Approved + Coming Soon
- Approved + Pending
- Approved + Closed
- Approved + Off Market
- Unapproved + Active
- Rejected + Active

## Before Enabling

1. Back up `public.profiles`, `public.listings`, and
   `public.showing_requests`.
2. Record row counts for all three tables.
3. Confirm `listings.owner_id` and `showing_requests.agent_owner_id` are UUID.
4. Confirm the application version that sends authenticated user JWTs is
   deployed to the test environment.
5. Confirm only `public` is exposed through the Supabase Data API; do not add
   the migration's `ethiomls_private` helper schema to exposed schemas.
6. Keep the rollback SQL open in a separate Supabase SQL Editor tab.

## Enable And Verify

1. Run `supabase/rls-policies.sql`.
2. Run the verification queries at the bottom of that file.
3. Confirm RLS is enabled for all three tables.
4. Confirm all eight policies are listed.
5. Confirm table row counts are unchanged.

## Application Tests

### Public

1. Sign out.
2. Confirm only Approved listings in Coming Soon, Active, Pending, or Closed
   appear.
3. Confirm direct URLs for Off Market, Unapproved, and Rejected listings return
   the not-found state.
4. Submit a showing request for Approved + Active.
5. Confirm it succeeds, displays the agent contact email, and creates one row.
6. Confirm showing requests for every other approval/market combination fail.

### Incomplete User

1. Sign in as the Auth user without a profile.
2. Confirm public-visible listings still load.
3. Confirm agent navigation and protected pages remain unavailable.
4. Confirm direct listing create, update, delete, and photo routes return the
   existing profile-required denial.

### Agent A

1. Confirm Agent A sees all owned listings.
2. Confirm Agent A sees public listings and Agent B's Off Market listings.
3. Confirm Agent A cannot see Agent B's Unapproved or Rejected Active listings.
4. Create a listing and confirm it is forced to Unapproved and owned by
   Agent A.
5. Edit and replace the photo on an owned listing.
6. Confirm a Rejected listing edit or photo replacement changes it to
   Unapproved, sets `verified = false`, and clears the rejection reason.
7. Delete an owned disposable listing.
8. Confirm Agent A cannot edit, replace photos, or delete Agent B's listings.
9. Confirm Showing Requests contains only requests for Agent A's listings.

### Admin

1. Confirm Browse and direct detail URLs show all listings.
2. Confirm the Admin review filters load all expected listings.
3. Approve and reject disposable listings.
4. Confirm admin status changes persist.
5. Confirm the admin cannot edit or delete another agent's listing through
   normal owner routes.
6. Confirm Showing Requests still contains only requests for listings the
   admin personally owns.

## Direct REST Abuse Tests

Use disposable records. Obtain Agent A and Agent B access tokens from the
Supabase password token endpoint. Send requests directly to
`https://PROJECT.supabase.co/rest/v1` using:

```text
apikey: ANON_KEY
Authorization: Bearer USER_ACCESS_TOKEN
```

Verify:

1. Agent A cannot update or delete an Agent B listing.
2. Agent A cannot insert a listing with `owner_id` set to Agent B.
3. Agent A cannot insert a listing as Approved or with `verified = true`.
4. Agent A cannot directly change an owned Approved listing to Rejected or
   change `verified`.
5. Agent A cannot read Agent B showing-request rows.
6. Admin cannot read another agent's showing-request rows.
7. Anonymous users cannot read any showing-request rows.
8. Anonymous users cannot insert a showing request with mismatched listing
   title, MLS ID, or owner snapshots.
9. Anonymous users cannot insert a showing request for a listing that is not
   Approved + Active.

## Rollback

If any required workflow fails:

1. Stop application testing.
2. Run `supabase/rls-rollback.sql`.
3. Confirm RLS is disabled on all three tables.
4. Confirm the application returns to route-level authorization behavior.
5. Preserve logs and the failing request before changing policy SQL.

Do not use the rollback as the final production state. It removes the database
authorization boundary and is only an emergency recovery measure.
