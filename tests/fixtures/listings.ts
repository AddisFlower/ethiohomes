import type { Property } from "@/lib/listings";

export function createListingFixture(
  overrides: Partial<Property> = {}
): Property {
  return {
    id: "listing-1",
    listingId: "MLS-2001",
    title: "Test Listing",
    price: "1,000,000 ETB",
    location: "Addis Ababa",
    address: "Test Address",
    propertyType: "House",
    transactionType: "For Sale",
    marketStatus: "Active",
    verified: true,
    bedrooms: 3,
    bathrooms: 2,
    agent: "Agent Example",
    updatedAt: "Updated just now",
    updatedAtTimestamp: "2026-06-10T12:00:00.000Z",
    approvalStatus: "Approved",
    rejectionReason: null,
    description: "Test description",
    image: "https://example.com/listing.jpg",
    ownerId: "00000000-0000-4000-8000-000000000001",
    ...overrides,
  };
}
