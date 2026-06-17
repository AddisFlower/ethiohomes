import { beforeEach, describe, expect, it, vi } from "vitest";
import { agentSession } from "@/tests/fixtures/auth";
import { createListingFixture } from "@/tests/fixtures/listings";

const mocks = vi.hoisted(() => ({
  authenticatedSupabaseRequest: vi.fn(),
  getAgentClientById: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  authenticatedSupabaseRequest: mocks.authenticatedSupabaseRequest,
}));

vi.mock("@/lib/clients", async () => {
  const actual = await vi.importActual<typeof import("@/lib/clients")>(
    "@/lib/clients"
  );

  return {
    ...actual,
    getAgentClientById: mocks.getAgentClientById,
  };
});

import { sendListingAlertNow } from "@/lib/client-alerts";
import type { AgentClient } from "@/lib/clients";

const client: AgentClient = {
  id: "client-1",
  ownerId: agentSession.user.id,
  name: "Client Example",
  email: "client@example.com",
  phone: null,
  source: "Manual",
  status: "Interested",
  notes: null,
  nextFollowUpAt: null,
  preferredLocation: "Bole",
  preferredPropertyType: "Apartment",
  preferredTransactionType: "For Sale",
  preferredMarketStatus: null,
  minPrice: null,
  maxPrice: null,
  minBedrooms: null,
  minBathrooms: null,
  alertEnabled: false,
  alertFrequency: "Off",
  alertMarketStatuses: ["Active"],
  alertLastCheckedAt: null,
  alertLastSentAt: null,
  alertMatchedListingIds: [],
  createdAt: "2026-06-15T12:00:00.000Z",
  updatedAt: "2026-06-15T12:00:00.000Z",
};

function mockSupabaseDefaults() {
  mocks.authenticatedSupabaseRequest.mockImplementation((path: string) => {
    if (path.includes("/client_alert_sends?select=*&")) {
      return Promise.resolve([]);
    }

    if (path.includes("/client_alert_sends?select=listing_id")) {
      return Promise.resolve([]);
    }

    if (path === "/client_alert_sends") {
      return Promise.resolve([
        {
          id: "history-1",
          send_batch_id: "batch-1",
          agent_client_id: client.id,
          agent_owner_id: agentSession.user.id,
          listing_id: "listing-1",
          listing_title: "Bole Apartment",
          listing_mls_id: "MLS-2001",
          recipient_email: client.email,
          status: "Sent",
          resend_email_id: "email-1",
          error_message: null,
          sent_at: "2026-06-17T12:00:00.000Z",
          created_at: "2026-06-17T12:00:00.000Z",
        },
      ]);
    }

    return Promise.resolve(undefined);
  });
}

describe("client listing alerts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test";
    process.env.LISTING_ALERT_FROM_EMAIL = "alerts@example.com";
    process.env.LISTING_ALERT_PRODUCT_NAME = "EthioMLS";
    mocks.getAgentClientById.mockResolvedValue(client);
    mockSupabaseDefaults();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: "email-1" }),
    }) as typeof fetch;
  });

  it("sends up to five approved unsent matching listings", async () => {
    const listings = Array.from({ length: 6 }, (_, index) =>
      createListingFixture({
        id: `listing-${index + 1}`,
        title: `Bole Apartment ${index + 1}`,
        location: "Addis Ababa, Bole",
        propertyType: "Apartment",
        transactionType: "For Sale",
        marketStatus: "Active",
        approvalStatus: "Approved",
      })
    );

    const result = await sendListingAlertNow({
      clientId: client.id,
      listings,
      session: agentSession,
      siteUrl: "https://ethiomls.example",
    });

    expect(result.ok).toBe(true);
    expect(result.sentCount).toBe(5);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
      })
    );
    expect(mocks.authenticatedSupabaseRequest).toHaveBeenCalledWith(
      "/client_alert_sends",
      agentSession.accessToken,
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"status":"Sent"'),
      })
    );
  });

  it("does not send when there are no unsent matches", async () => {
    mocks.authenticatedSupabaseRequest.mockImplementation((path: string) => {
      if (path.includes("/client_alert_sends?select=*&")) {
        return Promise.resolve([]);
      }

      if (path.includes("/client_alert_sends?select=listing_id")) {
        return Promise.resolve([{ listing_id: "listing-1" }]);
      }

      return Promise.resolve(undefined);
    });

    const result = await sendListingAlertNow({
      clientId: client.id,
      listings: [
        createListingFixture({
          id: "listing-1",
          location: "Addis Ababa, Bole",
          propertyType: "Apartment",
          transactionType: "For Sale",
        }),
      ],
      session: agentSession,
      siteUrl: "https://ethiomls.example",
    });

    expect(result.ok).toBe(true);
    expect(result.sentCount).toBe(0);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("records failed history when Resend rejects the email", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ message: "Too many requests" }),
    }) as typeof fetch;

    const result = await sendListingAlertNow({
      clientId: client.id,
      listings: [
        createListingFixture({
          id: "listing-1",
          title: "Bole Apartment",
          location: "Addis Ababa, Bole",
          propertyType: "Apartment",
          transactionType: "For Sale",
        }),
      ],
      session: agentSession,
      siteUrl: "https://ethiomls.example",
    });

    expect(result.ok).toBe(false);
    expect(result.status).toBe(429);
    expect(mocks.authenticatedSupabaseRequest).toHaveBeenCalledWith(
      "/client_alert_sends",
      agentSession.accessToken,
      expect.objectContaining({
        body: expect.stringContaining('"status":"Failed"'),
      })
    );
  });
});
