import { beforeEach, describe, expect, it, vi } from "vitest";
import { agentSession } from "@/tests/fixtures/auth";
import { createListingFixture } from "@/tests/fixtures/listings";

const mocks = vi.hoisted(() => ({
  authenticatedSupabaseRequest: vi.fn(),
  serviceRoleSupabaseRequest: vi.fn(),
  getAgentClientById: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  authenticatedSupabaseRequest: mocks.authenticatedSupabaseRequest,
  serviceRoleSupabaseRequest: mocks.serviceRoleSupabaseRequest,
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

import {
  sendListingAlertNow,
  sendScheduledListingAlert,
} from "@/lib/client-alerts";
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
  alertConsentAt: null,
  alertUnsubscribedAt: null,
  alertUnsubscribeToken: "unsubscribe-token-1",
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
    mocks.serviceRoleSupabaseRequest.mockImplementation((path: string) => {
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
    const resendInit = vi.mocked(global.fetch).mock.calls[0][1] as RequestInit;
    expect(String(resendInit.body)).toContain(
      "/alerts/unsubscribe?token=unsubscribe-token-1"
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
    expect(result.message).toBe(
      "All matching listings were already sent to this client. Use Resend matches to send them again."
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("can intentionally resend previously sent matching listings", async () => {
    mocks.authenticatedSupabaseRequest.mockImplementation((path: string) => {
      if (path.includes("/client_alert_sends?select=*&")) {
        return Promise.resolve([]);
      }

      if (path.includes("/client_alert_sends?select=listing_id")) {
        return Promise.resolve([{ listing_id: "listing-1" }]);
      }

      if (path === "/client_alert_sends") {
        return Promise.resolve([
          {
            id: "history-2",
            send_batch_id: "batch-2",
            agent_client_id: client.id,
            agent_owner_id: agentSession.user.id,
            listing_id: "listing-1",
            listing_title: "Bole Apartment",
            listing_mls_id: "MLS-2001",
            recipient_email: client.email,
            status: "Sent",
            resend_email_id: "email-2",
            error_message: null,
            sent_at: "2026-06-17T12:05:00.000Z",
            created_at: "2026-06-17T12:05:00.000Z",
          },
        ]);
      }

      return Promise.resolve(undefined);
    });

    const result = await sendListingAlertNow({
      clientId: client.id,
      includePreviouslySent: true,
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

    expect(result.ok).toBe(true);
    expect(result.sentCount).toBe(1);
    expect(global.fetch).toHaveBeenCalled();
  });

  it("sends the exact previewed unsent listing when preview IDs are provided", async () => {
    const result = await sendListingAlertNow({
      clientId: client.id,
      previewListingIds: ["listing-2"],
      listings: [
        createListingFixture({
          id: "listing-1",
          title: "Older Bole Apartment",
          location: "Addis Ababa, Bole",
          propertyType: "Apartment",
          transactionType: "For Sale",
        }),
        createListingFixture({
          id: "listing-2",
          title: "New Bole Apartment",
          location: "Addis Ababa, Bole",
          propertyType: "Apartment",
          transactionType: "For Sale",
        }),
      ],
      session: agentSession,
      siteUrl: "https://ethiomls.example",
    });

    expect(result.ok).toBe(true);
    expect(result.sentCount).toBe(1);
    expect(mocks.authenticatedSupabaseRequest).toHaveBeenCalledWith(
      "/client_alert_sends",
      agentSession.accessToken,
      expect.objectContaining({
        body: expect.stringContaining('"listing_id":"listing-2"'),
      })
    );
  });

  it("returns diagnostics when previewed listings are not visible to the send route", async () => {
    const result = await sendListingAlertNow({
      clientId: client.id,
      previewListingIds: ["listing-2"],
      listings: [
        createListingFixture({
          id: "listing-1",
          title: "Older Bole Apartment",
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
    expect(result.message).toBe(
      "The previewed listing is no longer visible to this session. Refresh alerts and try again."
    );
    expect(result.diagnostics).toEqual(
      expect.objectContaining({
        previewListingCount: 1,
        serverVisibleListingCount: 1,
        scopedListingCount: 0,
        approvedListingCount: 0,
        alertMarketListingCount: 0,
        unsentMatchCount: 0,
      })
    );
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

  it("does not send to unsubscribed clients", async () => {
    mocks.getAgentClientById.mockResolvedValue({
      ...client,
      alertUnsubscribedAt: "2026-06-17T12:00:00.000Z",
    });

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
    expect(result.status).toBe(409);
    expect(result.message).toBe(
      "This client has unsubscribed from listing alerts. Re-enable alerts on the client record before sending."
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("dry-runs scheduled alerts without sending or writing history", async () => {
    const result = await sendScheduledListingAlert({
      client: {
        ...client,
        alertEnabled: true,
        alertConsentAt: "2026-06-15T12:00:00.000Z",
      },
      dryRun: true,
      listings: [
        createListingFixture({
          id: "listing-1",
          title: "Bole Apartment",
          location: "Addis Ababa, Bole",
          propertyType: "Apartment",
          transactionType: "For Sale",
        }),
      ],
      sender: {
        email: "agent-public@example.com",
        fullName: "Agent Example",
        agencyName: "Example Realty",
      },
      siteUrl: "https://ethiomls.example",
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        sentCount: 0,
        matchCount: 1,
        skipped: false,
      })
    );
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mocks.serviceRoleSupabaseRequest).not.toHaveBeenCalledWith(
      "/client_alert_sends",
      expect.anything()
    );
  });

  it("sends scheduled alerts with service-role history writes", async () => {
    const result = await sendScheduledListingAlert({
      client: {
        ...client,
        alertEnabled: true,
        alertConsentAt: "2026-06-15T12:00:00.000Z",
      },
      dryRun: false,
      listings: [
        createListingFixture({
          id: "listing-1",
          title: "Bole Apartment",
          location: "Addis Ababa, Bole",
          propertyType: "Apartment",
          transactionType: "For Sale",
        }),
      ],
      sender: {
        email: "agent-public@example.com",
        fullName: "Agent Example",
        agencyName: "Example Realty",
      },
      siteUrl: "https://ethiomls.example",
    });

    expect(result.ok).toBe(true);
    expect(result.sentCount).toBe(1);
    expect(global.fetch).toHaveBeenCalled();
    expect(mocks.serviceRoleSupabaseRequest).toHaveBeenCalledWith(
      "/client_alert_sends",
      expect.objectContaining({
        method: "POST",
      })
    );
  });
});
