import { beforeEach, describe, expect, it, vi } from "vitest";
import { authUser } from "@/tests/fixtures/auth";
import { createListingFixture } from "@/tests/fixtures/listings";

const mocks = vi.hoisted(() => ({
  anonymousSupabaseRequest: vi.fn(),
  authenticatedSupabaseRequest: vi.fn(),
  getListingById: vi.fn(),
  serviceRoleSupabaseAuthRequest: vi.fn(),
}));

vi.mock("@/lib/listings", () => ({
  getListingById: mocks.getListingById,
}));

vi.mock("@/lib/supabase", () => ({
  anonymousSupabaseRequest: mocks.anonymousSupabaseRequest,
  authenticatedSupabaseRequest: mocks.authenticatedSupabaseRequest,
  serviceRoleSupabaseAuthRequest: mocks.serviceRoleSupabaseAuthRequest,
}));

import { createShowingRequest } from "@/lib/showing-requests";

describe("showing-request RLS compatibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getListingById.mockResolvedValue(createListingFixture());
    mocks.anonymousSupabaseRequest.mockResolvedValue(undefined);
  });

  it("submits public requests without requiring anonymous lead-row reads", async () => {
    const request = await createShowingRequest({
      listingId: "listing-1",
      name: "Buyer Example",
      email: "buyer@example.com",
      phone: "",
      preferredDatetime: "",
      message: "Please contact me.",
    });

    expect(mocks.anonymousSupabaseRequest).toHaveBeenCalledWith(
      "/showing_requests",
      expect.objectContaining({
        method: "POST",
        headers: {
          Prefer: "return=minimal",
        },
      })
    );

    const init = mocks.anonymousSupabaseRequest.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body));

    expect(body).toEqual(
      expect.objectContaining({
        listing_id: "listing-1",
        listing_title: "Test Listing",
        listing_mls_id: "MLS-2001",
        agent_owner_id: authUser.id,
        requester_name: "Buyer Example",
        requester_email: "buyer@example.com",
        status: "New",
      })
    );
    expect(request).toEqual(
      expect.objectContaining({
        id: body.id,
        listingId: "listing-1",
        agentOwnerId: authUser.id,
        requesterEmail: "buyer@example.com",
        status: "New",
      })
    );
    expect(mocks.authenticatedSupabaseRequest).not.toHaveBeenCalled();
  });
});
