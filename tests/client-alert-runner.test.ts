import { beforeEach, describe, expect, it, vi } from "vitest";
import { agentSession } from "@/tests/fixtures/auth";
import { createListingFixture } from "@/tests/fixtures/listings";
import type { AgentClient } from "@/lib/clients";

const mocks = vi.hoisted(() => ({
  getAlertListingsForAutomation: vi.fn(),
  getAlertSenderProfile: vi.fn(),
  getScheduledAlertClients: vi.fn(),
  sendScheduledListingAlert: vi.fn(),
}));

vi.mock("@/lib/clients", async () => {
  const actual = await vi.importActual<typeof import("@/lib/clients")>(
    "@/lib/clients"
  );

  return {
    ...actual,
    getScheduledAlertClients: mocks.getScheduledAlertClients,
  };
});

vi.mock("@/lib/listings", () => ({
  getAlertListingsForAutomation: mocks.getAlertListingsForAutomation,
}));

vi.mock("@/lib/profiles", () => ({
  getAlertSenderProfile: mocks.getAlertSenderProfile,
}));

vi.mock("@/lib/client-alerts", () => ({
  sendScheduledListingAlert: mocks.sendScheduledListingAlert,
}));

import {
  assertClientAlertRunSecret,
  runScheduledClientAlerts,
} from "@/lib/client-alert-runner";

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
  alertEnabled: true,
  alertFrequency: "Daily",
  alertMarketStatuses: ["Active"],
  alertLastCheckedAt: null,
  alertLastSentAt: null,
  alertMatchedListingIds: [],
  alertConsentAt: "2026-06-18T12:00:00.000Z",
  alertUnsubscribedAt: null,
  alertUnsubscribeToken: "unsubscribe-token-1",
  createdAt: "2026-06-15T12:00:00.000Z",
  updatedAt: "2026-06-15T12:00:00.000Z",
};

describe("scheduled client alert runner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("CLIENT_ALERT_RUN_SECRET", "run-secret");
    mocks.getScheduledAlertClients.mockResolvedValue([client]);
    mocks.getAlertListingsForAutomation.mockResolvedValue([
      createListingFixture(),
    ]);
    mocks.getAlertSenderProfile.mockResolvedValue({
      id: agentSession.user.id,
      email: "agent-public@example.com",
      fullName: "Agent Example",
      agencyName: "Example Realty",
    });
    mocks.sendScheduledListingAlert.mockResolvedValue({
      ok: true,
      skipped: false,
      message: "Dry run found 1 matching listing.",
      sentCount: 0,
      matchCount: 1,
    });
  });

  it("requires the configured run secret", () => {
    expect(() => assertClientAlertRunSecret("run-secret")).not.toThrow();
    expect(() => assertClientAlertRunSecret("wrong")).toThrow(
      "Invalid client alert run secret."
    );
  });

  it("dry-runs due clients with owner sender profiles", async () => {
    const result = await runScheduledClientAlerts({
      dryRun: true,
      limit: 2,
      siteUrl: "https://ethiomls.example",
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: true,
        dryRun: true,
        clientCount: 1,
        processedCount: 1,
        matchCount: 1,
      })
    );
    expect(mocks.getScheduledAlertClients).toHaveBeenCalledWith(2);
    expect(mocks.sendScheduledListingAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        client,
        dryRun: true,
        sender: expect.objectContaining({
          fullName: "Agent Example",
        }),
      })
    );
  });

  it("skips daily clients that were checked recently", async () => {
    mocks.getScheduledAlertClients.mockResolvedValue([
      {
        ...client,
        alertLastCheckedAt: new Date().toISOString(),
      },
    ]);

    const result = await runScheduledClientAlerts({
      dryRun: true,
      siteUrl: "https://ethiomls.example",
    });

    expect(result.results[0]).toEqual(
      expect.objectContaining({
        ok: true,
        skipped: true,
        message: "Daily alert is not due yet.",
      })
    );
    expect(mocks.sendScheduledListingAlert).not.toHaveBeenCalled();
  });

  it("reports missing owner profiles without sending", async () => {
    mocks.getAlertSenderProfile.mockResolvedValue(null);

    const result = await runScheduledClientAlerts({
      dryRun: false,
      siteUrl: "https://ethiomls.example",
    });

    expect(result.ok).toBe(false);
    expect(result.results[0]).toEqual(
      expect.objectContaining({
        ok: false,
        skipped: true,
        message: "Listing alert owner profile was not found.",
      })
    );
    expect(mocks.sendScheduledListingAlert).not.toHaveBeenCalled();
  });
});
