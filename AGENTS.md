# EthioMLS

## Project Purpose
EthioMLS is an agent-facing MLS platform for Ethiopian real estate professionals.

## Current MVP Scope
- Browse listings
- View listing details
- Add listing
- Edit listing
- My Listings
- Ownership-based permissions

## Architecture Decisions

### Ownership
- Mock currentAgentId = "agent-1"
- Only owners can edit/delete listings
- Non-owners can request showings

### Listing Workflows
Browse Listings -> View Details -> Edit Listing
Add Listing -> My Listings -> Edit Listing

### Forms
- Shared PropertyForm component
- Reused by Add Listing and Edit Listing pages

### Authentication
- Not implemented yet
- All ownership checks use mock currentAgentId
- Replace later with authenticated user

### Navigation
Listings
- Browse Listings
- Add Listing
- Manage Listings (/my-listings)

### Not Implemented Yet
- Real database
- Real authentication
- Payments
- Image uploads
- Admin approval workflow
- Photo management

### Coding Rules
- Preserve EthioMLS styling
- Prefer reusable components
- Do not modify unrelated files
- Add TODO comments for future work