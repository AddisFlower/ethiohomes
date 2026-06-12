import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { authUser, otherAuthUser } from "@/tests/fixtures/auth";

const mocks = vi.hoisted(() => ({
  anonymousSupabaseRequest: vi.fn(),
  authenticatedSupabaseRequest: vi.fn(),
  serviceRoleSupabaseRequest: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  anonymousSupabaseRequest: mocks.anonymousSupabaseRequest,
  authenticatedSupabaseRequest: mocks.authenticatedSupabaseRequest,
  serviceRoleSupabaseRequest: mocks.serviceRoleSupabaseRequest,
  uploadServiceRoleStorageObject: vi.fn(),
}));

import {
  deleteListing,
  getListings,
  getListingsByOwner,
  getListingsForViewer,
  isListingReadError,
  listingNotFoundOrDeniedMessage,
  listingsUnavailableMessage,
  updateListingApproval,
} from "@/lib/listings";

const approvedListingRow = {
  id: "listing-1",
  listing_id: "MLS-2001",
  title: "Supabase Listing",
  price: "1,000,000 ETB",
  location: "Addis Ababa",
  address: "Test Address",
  property_type: "House",
  transaction_type: "For Sale",
  market_status: "Active",
  verified: true,
  bedrooms: 3,
  bathrooms: 2,
  agent: "Agent Example",
  updated_at: "2026-06-10T12:00:00.000Z",
  approval_status: "Approved",
  rejection_reason: null,
  description: "Test description",
  image: "https://example.com/listing.jpg",
  owner_id: authUser.id,
};

describe("listing read fallback policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns successful Supabase reads without using mock listings", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.anonymousSupabaseRequest.mockResolvedValue([approvedListingRow]);

    const listings = await getListings();

    expect(listings).toHaveLength(1);
    expect(listings[0]).toEqual(
      expect.objectContaining({
        id: approvedListingRow.id,
        listingId: approvedListingRow.listing_id,
        title: approvedListingRow.title,
      })
    );
    expect(console.error).not.toHaveBeenCalled();
  });

  it("uses mock listings after a read failure in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mocks.anonymousSupabaseRequest.mockRejectedValue(
      new Error("Supabase is unavailable.")
    );

    const listings = await getListings();

    expect(listings.map((listing) => listing.id)).toContain("1");
    expect(console.error).toHaveBeenCalledWith(
      "[EthioMLS] Load public listings failed.",
      expect.any(Error)
    );
  });

  it("allows explicit demo fallback in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ETHIOMLS_ENABLE_MOCK_LISTINGS", "true");
    mocks.anonymousSupabaseRequest.mockRejectedValue(
      new Error("Supabase is unavailable.")
    );

    const listings = await getListings();

    expect(listings.map((listing) => listing.id)).toContain("1");
  });

  it("fails closed instead of returning mock listings in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ETHIOMLS_ENABLE_MOCK_LISTINGS", "false");
    mocks.anonymousSupabaseRequest.mockRejectedValue(
      new Error("Supabase is unavailable.")
    );

    const error = await getListings().catch((caughtError) => caughtError);

    expect(isListingReadError(error)).toBe(true);
    expect(error).toEqual(
      expect.objectContaining({
        message: listingsUnavailableMessage,
        operation: "Load public listings",
      })
    );
  });

  it("treats missing Supabase configuration as a production read failure", async () => {
    vi.stubEnv("NODE_ENV", "production");
    mocks.anonymousSupabaseRequest.mockRejectedValue(
      new Error("Supabase environment variables are not configured.")
    );

    await expect(getListings()).rejects.toSatisfy(isListingReadError);
    expect(console.error).toHaveBeenCalledWith(
      "[EthioMLS] Load public listings failed.",
      expect.objectContaining({
        message: "Supabase environment variables are not configured.",
      })
    );
  });
});

describe("deleteListing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes and returns the row matching both listing and owner IDs", async () => {
    const deletedRow = {
      id: "listing/with spaces",
      owner_id: authUser.id,
    };
    mocks.authenticatedSupabaseRequest.mockResolvedValue([deletedRow]);

    await expect(
      deleteListing(deletedRow.id, authUser.id, "user-access-token")
    ).resolves.toEqual(deletedRow);

    expect(mocks.authenticatedSupabaseRequest).toHaveBeenCalledWith(
      `/listings?id=eq.listing%2Fwith%20spaces&owner_id=eq.${authUser.id}`,
      "user-access-token",
      {
        method: "DELETE",
        headers: {
          Prefer: "return=representation",
        },
      }
    );
  });

  it("rejects a non-owner delete when the owner filter returns no row", async () => {
    mocks.authenticatedSupabaseRequest.mockResolvedValue([]);

    await expect(
      deleteListing("listing-1", otherAuthUser.id, "user-access-token")
    ).rejects.toThrow(listingNotFoundOrDeniedMessage);
  });

  it("rejects a missing listing when the delete returns no row", async () => {
    mocks.authenticatedSupabaseRequest.mockResolvedValue([]);

    await expect(
      deleteListing("missing-listing", authUser.id, "user-access-token")
    ).rejects.toThrow(listingNotFoundOrDeniedMessage);
  });

  it("preserves Supabase failures instead of reporting a successful delete", async () => {
    mocks.authenticatedSupabaseRequest.mockRejectedValue(
      new Error("Supabase delete failed.")
    );

    await expect(
      deleteListing("listing-1", authUser.id, "user-access-token")
    ).rejects.toThrow("Supabase delete failed.");
  });
});

describe("listing credential routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses the authenticated path for owner listing reads", async () => {
    mocks.authenticatedSupabaseRequest.mockResolvedValue([
      approvedListingRow,
    ]);

    await getListingsByOwner(authUser.id, "user-access-token");

    expect(mocks.authenticatedSupabaseRequest).toHaveBeenCalledWith(
      `/listings?select=*&owner_id=eq.${authUser.id}&order=id.asc`,
      "user-access-token"
    );
    expect(mocks.anonymousSupabaseRequest).not.toHaveBeenCalled();
    expect(mocks.serviceRoleSupabaseRequest).not.toHaveBeenCalled();
  });

  it("fails closed when an agent listing read has no user token", async () => {
    await expect(
      getListingsForViewer("agent", authUser.id)
    ).rejects.toThrow("Supabase authenticated access token is required.");
    expect(mocks.anonymousSupabaseRequest).not.toHaveBeenCalled();
    expect(mocks.authenticatedSupabaseRequest).not.toHaveBeenCalled();
    expect(mocks.serviceRoleSupabaseRequest).not.toHaveBeenCalled();
  });

  it("uses the service path for admin approval updates", async () => {
    mocks.serviceRoleSupabaseRequest.mockResolvedValue([
      approvedListingRow,
    ]);

    await updateListingApproval("listing-1", "Approved");

    expect(mocks.serviceRoleSupabaseRequest).toHaveBeenCalledWith(
      "/listings?id=eq.listing-1",
      expect.objectContaining({
        method: "PATCH",
      })
    );
    expect(mocks.anonymousSupabaseRequest).not.toHaveBeenCalled();
    expect(mocks.authenticatedSupabaseRequest).not.toHaveBeenCalled();
  });
});
