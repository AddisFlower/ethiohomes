import { beforeEach, describe, expect, it, vi } from "vitest";
import { authUser } from "@/tests/fixtures/auth";
import { createListingFixture } from "@/tests/fixtures/listings";

const mocks = vi.hoisted(() => ({
  authenticatedSupabaseRequest: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  authenticatedSupabaseRequest: mocks.authenticatedSupabaseRequest,
}));

import {
  createAgentClient,
  deleteAgentClient,
  getAgentClients,
  getClientListingMatches,
} from "@/lib/clients";

const clientRow = {
  id: "client-1",
  owner_id: authUser.id,
  name: "Client Example",
  email: "client@example.com",
  phone: "+251911111111",
  source: "Manual",
  status: "Interested",
  notes: "Looking for Bole apartments.",
  next_follow_up_at: "2026-06-20T12:00:00.000Z",
  preferred_location: "Bole",
  preferred_property_type: "Apartment",
  preferred_transaction_type: "For Sale",
  preferred_market_status: null,
  min_price: 1_000_000,
  max_price: 15_000_000,
  min_bedrooms: 2,
  min_bathrooms: 1,
  alert_enabled: true,
  alert_frequency: "Daily",
  alert_market_statuses: ["Active"],
  alert_last_checked_at: null,
  alert_last_sent_at: null,
  alert_matched_listing_ids: [],
  alert_consent_at: "2026-06-15T12:00:00.000Z",
  alert_unsubscribed_at: null,
  alert_unsubscribe_token: "unsubscribe-token-1",
  created_at: "2026-06-15T12:00:00.000Z",
  updated_at: "2026-06-15T12:00:00.000Z",
};

describe("agent clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads only clients owned by the signed-in agent", async () => {
    mocks.authenticatedSupabaseRequest.mockResolvedValue([clientRow]);

    const clients = await getAgentClients(authUser.id, "user-access-token");

    expect(clients).toHaveLength(1);
    expect(clients[0]).toEqual(
      expect.objectContaining({
        id: "client-1",
        ownerId: authUser.id,
        alertEnabled: true,
        alertConsentAt: "2026-06-15T12:00:00.000Z",
        alertUnsubscribedAt: null,
        alertUnsubscribeToken: "unsubscribe-token-1",
      })
    );
    expect(mocks.authenticatedSupabaseRequest).toHaveBeenCalledWith(
      `/agent_clients?select=*&owner_id=eq.${authUser.id}&order=updated_at.desc`,
      "user-access-token"
    );
  });

  it("creates an owner-scoped client from form data", async () => {
    const formData = new FormData();
    formData.set("name", "Client Example");
    formData.set("email", "client@example.com");
    formData.set("phone", "+251911111111");
    formData.set("source", "Referral");
    formData.set("status", "Contacted");
    formData.set("notes", "Needs a Villa.");
    formData.set("preferredLocation", "Summit");
    formData.set("preferredPropertyType", "Villa");
    formData.set("preferredTransactionType", "For Rent");
    formData.set("minPrice", "1000");
    formData.set("maxPrice", "5000");
    formData.set("minBedrooms", "3");
    formData.set("minBathrooms", "2");
    formData.set("alertEnabled", "on");
    formData.set("alertFrequency", "Weekly");
    formData.append("alertMarketStatuses", "Active");
    mocks.authenticatedSupabaseRequest.mockResolvedValue([
      {
        ...clientRow,
        source: "Referral",
        status: "Contacted",
        alert_frequency: "Weekly",
      },
    ]);

    await createAgentClient(formData, authUser.id, "user-access-token");

    expect(mocks.authenticatedSupabaseRequest).toHaveBeenCalledWith(
      "/agent_clients",
      "user-access-token",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining(`"owner_id":"${authUser.id}"`),
      })
    );
    const init = mocks.authenticatedSupabaseRequest.mock.calls[0][2] as RequestInit;
    const body = JSON.parse(String(init.body));
    expect(body.alert_unsubscribe_token).toEqual(expect.any(String));
    expect(body.alert_consent_at).toEqual(expect.any(String));
    expect(body.alert_unsubscribed_at).toBeNull();
  });

  it("rejects invalid client email", async () => {
    const formData = new FormData();
    formData.set("name", "Client Example");
    formData.set("email", "not-an-email");
    formData.set("status", "New");
    formData.set("alertFrequency", "Immediate");

    await expect(
      createAgentClient(formData, authUser.id, "user-access-token")
    ).rejects.toThrow("A valid email is required.");
    expect(mocks.authenticatedSupabaseRequest).not.toHaveBeenCalled();
  });

  it("deletes only an owner-scoped client after Supabase returns a row", async () => {
    mocks.authenticatedSupabaseRequest.mockResolvedValue([
      {
        id: "client-1",
        owner_id: authUser.id,
      },
    ]);

    await expect(
      deleteAgentClient("client-1", authUser.id, "user-access-token")
    ).resolves.toEqual({
      id: "client-1",
      owner_id: authUser.id,
    });
    expect(mocks.authenticatedSupabaseRequest).toHaveBeenCalledWith(
      `/agent_clients?id=eq.client-1&owner_id=eq.${authUser.id}`,
      "user-access-token",
      expect.objectContaining({
        method: "DELETE",
      })
    );
  });

  it("rejects client delete when no owner-filtered row is returned", async () => {
    mocks.authenticatedSupabaseRequest.mockResolvedValue([]);

    await expect(
      deleteAgentClient("client-1", authUser.id, "user-access-token")
    ).rejects.toThrow("Client not found or access denied.");
  });

  it("matches listings against saved client criteria", () => {
    const client = {
      ...clientRow,
      owner_id: authUser.id,
    };
    const matchingListing = createListingFixture({
      bedrooms: 3,
      bathrooms: 2,
      location: "Addis Ababa, Bole",
      price: "12,000,000 ETB",
      propertyType: "Apartment",
      transactionType: "For Sale",
      marketStatus: "Active",
    });
    const expensiveListing = createListingFixture({
      id: "listing-2",
      price: "30,000,000 ETB",
      location: "Addis Ababa, Bole",
      propertyType: "Apartment",
      transactionType: "For Sale",
      marketStatus: "Active",
    });

    const matches = getClientListingMatches(
      {
        id: client.id,
        ownerId: client.owner_id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        source: client.source,
        status: "Interested",
        notes: client.notes,
        nextFollowUpAt: client.next_follow_up_at,
        preferredLocation: client.preferred_location,
        preferredPropertyType: client.preferred_property_type,
        preferredTransactionType: client.preferred_transaction_type,
        preferredMarketStatus: client.preferred_market_status,
        minPrice: client.min_price,
        maxPrice: client.max_price,
        minBedrooms: client.min_bedrooms,
        minBathrooms: client.min_bathrooms,
        alertEnabled: client.alert_enabled,
        alertFrequency: "Daily",
        alertMarketStatuses: ["Active"],
        alertLastCheckedAt: client.alert_last_checked_at,
        alertLastSentAt: client.alert_last_sent_at,
        alertMatchedListingIds: [],
        alertConsentAt: client.alert_consent_at,
        alertUnsubscribedAt: client.alert_unsubscribed_at,
        alertUnsubscribeToken: client.alert_unsubscribe_token,
        createdAt: client.created_at,
        updatedAt: client.updated_at,
      },
      [matchingListing, expensiveListing]
    );

    expect(matches.map((listing) => listing.id)).toEqual([
      matchingListing.id,
    ]);
  });
});
