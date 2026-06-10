# EthioMLS QA Manual Testing

Run `supabase/qa-product-rules-migration.sql` in the Supabase SQL Editor before
testing the updated application.

## Schema And Backfill

1. Before migration, record the total listing count and several existing IDs.
2. Run `supabase/qa-product-rules-migration.sql`.
3. Confirm the listing count and recorded IDs are unchanged.
4. Confirm the legacy `status` column still exists and retains its data.
5. Confirm `transaction_type` exists, defaults to `For Sale`, and is not null.
6. Confirm legacy `FOR RENT` or `For Rent` rows have `transaction_type = For Rent`.
7. Confirm other missing or invalid transaction values became `For Sale`.
8. Confirm `market_status` exists, defaults to `Active`, and is not null.
9. Confirm valid existing market statuses were preserved.
10. Confirm missing or invalid market statuses became `Active`.
11. Confirm `bedrooms` and `bathrooms` accept null.
12. Confirm approval values are limited to Unapproved, Approved, and Rejected.
13. Run the migration a second time and confirm it completes without data loss.

## Public Visibility

Create or update listings covering every approval and market status combination.
Sign out before each public test.

1. Confirm Approved + Coming Soon appears in Browse and detail pages.
2. Confirm Approved + Active appears in Browse and detail pages.
3. Confirm Approved + Pending appears in Browse and detail pages.
4. Confirm Approved + Closed appears in Browse and detail pages.
5. Confirm Approved + Off Market is absent and its direct detail URL is hidden.
6. Confirm Unapproved listings are absent for every market status.
7. Confirm Rejected listings are absent for every market status.

## Agent Visibility

Use two agent accounts, Agent A and Agent B.

1. As Agent A, confirm all Agent A listings appear regardless of approval or market status.
2. Confirm Agent A can open direct detail URLs for all owned listings.
3. Confirm Agent A sees Agent B's publicly visible listings.
4. Confirm Agent A sees Agent B's Off Market listings.
5. Confirm Agent A does not see Agent B's Unapproved or Rejected listings unless they are Off Market.
6. Confirm Agent A cannot edit or manage photos for Agent B's listings.

## Admin Visibility

1. Sign in with an admin profile.
2. Confirm Browse shows all listings, including Unapproved, Rejected, and Off Market.
3. Confirm direct detail pages work for all listings.
4. Confirm Admin filters are Unapproved, Approved, Rejected, and All.
5. Confirm each filter returns only its matching approval status.
6. Confirm admin access does not grant edit/photo ownership over another agent's listing.

## Showing Requests

Use a non-owner visitor or agent for each test.

1. Approved + Active: confirm Request Showing is available and submission succeeds.
2. Confirm the success panel is prominent and includes Back to Browse Listings.
3. Coming Soon: confirm the page says "Showings are not available yet."
4. Pending: confirm showing requests are unavailable.
5. Closed: confirm showing requests are unavailable.
6. Off Market: confirm showing requests are unavailable for authenticated viewers.
7. Unapproved and Rejected owned listings: confirm showing requests are unavailable.
8. As the owner, confirm showing request controls are not offered.
9. Send a direct POST to `/api/showing-requests` for every ineligible status and confirm it is rejected.
10. Confirm only successful Approved + Active requests appear in the owner's Showing Requests page.

## Add Listing Validation

1. Confirm market options are Coming Soon, Active, and Off Market only.
2. Confirm Pending and Closed cannot be submitted by manually altering the request.
3. For Apartment, Villa, House, Condo, and Multi-Family, confirm bedrooms and bathrooms are visible and required.
4. Confirm the server rejects missing residential bedroom or bathroom values.
5. For Land, confirm bedrooms and bathrooms are hidden and saved as null.
6. For Commercial and Office, confirm bedrooms are hidden and saved as null.
7. Confirm Commercial/Office bathrooms are visible, optional, and save null when empty.
8. Change from residential to Land and confirm both room fields clear.
9. Change from residential to Commercial/Office and confirm bedrooms clear.
10. Confirm a new listing is saved as Unapproved.

## Edit Listing Validation

1. Confirm Edit includes Coming Soon, Active, Pending, Closed, and Off Market.
2. Repeat the property-type field tests from Add Listing.
3. Confirm saving Land stores null bedrooms and bathrooms.
4. Confirm the form disables while saving and the button reads Saving.
5. Confirm a prominent saved confirmation appears and controls remain disabled afterward.
6. Reject a listing, edit it as owner, and confirm approval becomes Unapproved, rejection reason becomes null, and verified becomes false.

## Image Workflow

1. Confirm Add Listing accepts an optional primary image file and has no image URL field.
2. Confirm Edit Listing shows the current image but no editable URL field.
3. Click Manage Photos from Edit and upload a replacement file.
4. Confirm the replacement appears on Browse, My Listings, detail, and Edit.
5. Replace the photo on a Rejected listing and confirm it resubmits as Unapproved with the rejection reason cleared.
6. Confirm non-owners cannot access Manage Photos.

## Login Redirect

1. Sign out and open `/login`.
2. Sign in as an agent and confirm the destination is `/`.
3. Repeat with an admin and confirm the destination is `/`.
4. Confirm the dashboard cards display the correct role-aware counts.

## Missing Profile Authorization

1. Create a Supabase Auth user, then delete the matching `public.profiles` row.
2. Sign in with that user's email and password.
3. Confirm sign-in succeeds without creating a replacement profile.
4. Confirm the navbar shows the account and Logout but no Add Listing, My
   Listings, Showing Requests, or Admin links.
5. Open `/add-listing`, `/my-listings`, `/showing-requests`, and `/admin`.
6. Confirm each protected agent page displays Agent profile required without
   redirecting back to login.
7. Open an existing listing's edit and photo-management URLs.
8. Confirm both display Agent profile required.
9. Send direct create, update, delete, and photo API requests.
10. Confirm each request returns `403` with `Agent profile required.`
11. Confirm public Browse and public-visible listing detail pages still work.
12. Confirm Logout works.
13. Restore a valid `agent` profile and confirm agent capabilities return.

## Navbar And Dashboard Filters

1. Select Residential Sale and confirm only residential For Sale listings appear.
2. Confirm Residential Rent shows only residential For Rent listings.
3. Confirm Land shows only Land listings.
4. Confirm Commercial shows only Commercial and Office listings.
5. Use the home search presets and confirm equivalent filters are applied.
6. Confirm Browse filters initialize from URL parameters.
7. Combine search, category, transaction, market status, and property type filters.
8. Click Clear Filters and confirm the viewer-appropriate listing set returns.
