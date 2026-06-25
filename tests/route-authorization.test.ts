import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  agentSession,
  incompleteSession,
  publicSession,
} from "@/tests/fixtures/auth";

const mocks = vi.hoisted(() => ({
  createListing: vi.fn(),
  createAgentClient: vi.fn(),
  createShowingRequest: vi.fn(),
  deleteListing: vi.fn(),
  deleteAgentClient: vi.fn(),
  getAgentContactEmail: vi.fn(),
  getAppSession: vi.fn(),
  getListingsForViewer: vi.fn(),
  runScheduledClientAlerts: vi.fn(),
  sendListingAlertNow: vi.fn(),
  assertClientAlertRunSecret: vi.fn(),
  unsubscribeClientAlertByToken: vi.fn(),
  updateOwnProfile: vi.fn(),
  updateListing: vi.fn(),
  updateListingApproval: vi.fn(),
  updateAgentClient: vi.fn(),
  updateListingPhoto: vi.fn(),
}));

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>(
    "@/lib/auth"
  );

  return {
    ...actual,
    getAppSession: mocks.getAppSession,
  };
});

vi.mock("@/lib/listings", () => ({
  createListing: mocks.createListing,
  deleteListing: mocks.deleteListing,
  getListingsForViewer: mocks.getListingsForViewer,
  listingNotFoundOrDeniedMessage: "Listing not found or access denied.",
  updateListing: mocks.updateListing,
  updateListingApproval: mocks.updateListingApproval,
  updateListingPhoto: mocks.updateListingPhoto,
}));

vi.mock("@/lib/showing-requests", () => ({
  createShowingRequest: mocks.createShowingRequest,
  getAgentContactEmail: mocks.getAgentContactEmail,
  ShowingRequestError: class ShowingRequestError extends Error {
    status: number;

    constructor(message: string, status = 400) {
      super(message);
      this.name = "ShowingRequestError";
      this.status = status;
    }
  },
}));

vi.mock("@/lib/clients", () => ({
  createAgentClient: mocks.createAgentClient,
  deleteAgentClient: mocks.deleteAgentClient,
  clientNotFoundOrDeniedMessage: "Client not found or access denied.",
  updateAgentClient: mocks.updateAgentClient,
}));

vi.mock("@/lib/client-alerts", () => ({
  sendListingAlertNow: mocks.sendListingAlertNow,
}));

vi.mock("@/lib/client-alert-runner", () => ({
  assertClientAlertRunSecret: mocks.assertClientAlertRunSecret,
  runScheduledClientAlerts: mocks.runScheduledClientAlerts,
}));

vi.mock("@/lib/client-alert-preferences", () => ({
  unsubscribeClientAlertByToken: mocks.unsubscribeClientAlertByToken,
}));

vi.mock("@/lib/profiles", () => ({
  updateOwnProfile: mocks.updateOwnProfile,
}));

import { PATCH as updateApproval } from "@/app/api/admin/listings/[id]/approval/route";
import {
  GET as runClientAlertsCron,
  POST as runClientAlerts,
} from "@/app/api/client-alerts/run/route";
import { POST as sendClientAlert } from "@/app/api/client-alerts/send/route";
import { POST as unsubscribeClientAlert } from "@/app/api/client-alerts/unsubscribe/route";
import { POST as createAgentClient } from "@/app/api/clients/route";
import {
  DELETE as deleteAgentClient,
  PUT as updateAgentClient,
} from "@/app/api/clients/[id]/route";
import { POST as createListing } from "@/app/api/listings/route";
import {
  DELETE as deleteListing,
  PUT as updateListing,
} from "@/app/api/listings/[id]/route";
import { PUT as updateListingPhoto } from "@/app/api/listings/[id]/photo/route";
import { PATCH as updateProfile } from "@/app/api/profile/route";
import { POST as createShowingRequest } from "@/app/api/showing-requests/route";

const routeContext = {
  params: Promise.resolve({ id: "listing-1" }),
};
const clientRouteContext = {
  params: Promise.resolve({ id: "client-1" }),
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("protected listing route authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for anonymous listing creation", async () => {
    mocks.getAppSession.mockResolvedValue(publicSession);

    const response = await createListing(
      new Request("http://localhost/api/listings", { method: "POST" })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Sign in required.",
    });
    expect(mocks.createListing).not.toHaveBeenCalled();
  });

  it.each([
    ["create", () => createListing(new Request("http://localhost/api/listings"))],
    ["create client", () => createAgentClient(new Request("http://localhost/api/clients"))],
    [
      "send client alert",
      () =>
        sendClientAlert(
          new Request("http://localhost/api/client-alerts/send", {
            method: "POST",
            body: JSON.stringify({ clientId: "client-1" }),
          })
        ),
    ],
    [
      "update client",
      () =>
        updateAgentClient(
          new Request("http://localhost/api/clients/client-1"),
          clientRouteContext
        ),
    ],
    [
      "delete client",
      () =>
        deleteAgentClient(
          new Request("http://localhost/api/clients/client-1"),
          clientRouteContext
        ),
    ],
    [
      "update profile",
      () =>
        updateProfile(
          new Request("http://localhost/api/profile", {
            method: "PATCH",
            body: JSON.stringify({ publicContactEmail: "contact@example.com" }),
          })
        ),
    ],
    [
      "update",
      () =>
        updateListing(
          new Request("http://localhost/api/listings/listing-1"),
          routeContext
        ),
    ],
    [
      "delete",
      () =>
        deleteListing(
          new Request("http://localhost/api/listings/listing-1"),
          routeContext
        ),
    ],
    [
      "photo update",
      () =>
        updateListingPhoto(
          new Request("http://localhost/api/listings/listing-1/photo"),
          routeContext
        ),
    ],
  ])("returns 403 for incomplete-profile %s requests", async (_name, callRoute) => {
    mocks.getAppSession.mockResolvedValue(incompleteSession);

    const response = await callRoute();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Agent profile required.",
    });
  });

  it("returns a profile-required denial from the admin approval route", async () => {
    mocks.getAppSession.mockResolvedValue(incompleteSession);

    const response = await updateApproval(
      new Request("http://localhost/api/admin/listings/listing-1/approval"),
      routeContext
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Agent profile required.",
    });
    expect(mocks.updateListingApproval).not.toHaveBeenCalled();
  });
});

describe("profile update route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAppSession.mockResolvedValue(agentSession);
  });

  it("updates the signed-in agent profile", async () => {
    mocks.updateOwnProfile.mockResolvedValue({
      id: agentSession.user.id,
      full_name: "Agent Example",
      agency_name: "Example Realty",
      public_contact_email: "public@example.com",
      role: "agent",
    });

    const response = await updateProfile(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          fullName: "Agent Example",
          agencyName: "Example Realty",
          publicContactEmail: "public@example.com",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.updateOwnProfile).toHaveBeenCalledWith(
      agentSession.user.id,
      agentSession.accessToken,
      expect.objectContaining({
        publicContactEmail: "public@example.com",
      })
    );
    await expect(response.json()).resolves.toEqual({
      profile: expect.objectContaining({
        public_contact_email: "public@example.com",
      }),
    });
  });

  it("returns validation errors from the profile helper", async () => {
    mocks.updateOwnProfile.mockRejectedValue(
      new Error("Public contact email must be a valid email address.")
    );

    const response = await updateProfile(
      new Request("http://localhost/api/profile", {
        method: "PATCH",
        body: JSON.stringify({
          publicContactEmail: "not-an-email",
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Public contact email must be a valid email address.",
    });
  });
});

describe("client alert unsubscribe route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows public unsubscribe by token", async () => {
    mocks.unsubscribeClientAlertByToken.mockResolvedValue({
      clientId: "client-1",
      email: "client@example.com",
      unsubscribedAt: "2026-06-18T12:00:00.000Z",
    });

    const response = await unsubscribeClientAlert(
      new Request("http://localhost/api/client-alerts/unsubscribe", {
        method: "POST",
        body: JSON.stringify({ token: "token-1" }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.getAppSession).not.toHaveBeenCalled();
    expect(mocks.unsubscribeClientAlertByToken).toHaveBeenCalledWith(
      "token-1"
    );
    await expect(response.json()).resolves.toEqual({
      ok: true,
      result: expect.objectContaining({
        clientId: "client-1",
      }),
    });
  });

  it("returns token validation errors from unsubscribe helper", async () => {
    mocks.unsubscribeClientAlertByToken.mockRejectedValue(
      new Error("Alert preference link is invalid or expired.")
    );

    const response = await unsubscribeClientAlert(
      new Request("http://localhost/api/client-alerts/unsubscribe", {
        method: "POST",
        body: JSON.stringify({ token: "bad-token" }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Alert preference link is invalid or expired.",
    });
  });
});

describe("scheduled client alert run route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.runScheduledClientAlerts.mockResolvedValue({
      ok: true,
      dryRun: true,
      clientCount: 1,
      processedCount: 1,
      sentCount: 0,
      matchCount: 1,
      results: [],
    });
  });

  it("requires the internal run secret", async () => {
    mocks.assertClientAlertRunSecret.mockImplementation(() => {
      throw new Error("Invalid client alert run secret.");
    });

    const response = await runClientAlerts(
      new Request("http://localhost/api/client-alerts/run", {
        method: "POST",
        body: JSON.stringify({ dryRun: true }),
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.runScheduledClientAlerts).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: "Invalid client alert run secret.",
    });
  });

  it("defaults scheduled alert runs to dry-run mode", async () => {
    const response = await runClientAlerts(
      new Request("http://localhost/api/client-alerts/run", {
        method: "POST",
        headers: {
          Authorization: "Bearer run-secret",
        },
        body: JSON.stringify({ limit: 2 }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.assertClientAlertRunSecret).toHaveBeenCalledWith(
      "run-secret"
    );
    expect(mocks.runScheduledClientAlerts).toHaveBeenCalledWith(
      expect.objectContaining({
        dryRun: true,
        limit: 2,
        siteUrl: "http://localhost",
      })
    );
  });

  it("allows explicit non-dry-run batches", async () => {
    const response = await runClientAlerts(
      new Request("http://localhost/api/client-alerts/run", {
        method: "POST",
        headers: {
          "x-client-alert-run-secret": "run-secret",
        },
        body: JSON.stringify({ dryRun: false, limit: 3 }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.runScheduledClientAlerts).toHaveBeenCalledWith(
      expect.objectContaining({
        dryRun: false,
        limit: 3,
      })
    );
  });

  it("requires Vercel's cron secret for scheduled GET runs", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");

    const response = await runClientAlertsCron(
      new Request("http://localhost/api/client-alerts/run", {
        method: "GET",
        headers: {
          Authorization: "Bearer wrong-secret",
        },
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.runScheduledClientAlerts).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: "Invalid cron secret.",
    });
  });

  it("runs scheduled GET invocations as live batches", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");

    const response = await runClientAlertsCron(
      new Request("http://localhost/api/client-alerts/run", {
        method: "GET",
        headers: {
          Authorization: "Bearer cron-secret",
        },
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.runScheduledClientAlerts).toHaveBeenCalledWith(
      expect.objectContaining({
        dryRun: false,
        siteUrl: "http://localhost",
      })
    );
  });
});

describe("client DELETE route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAppSession.mockResolvedValue(agentSession);
  });

  it("returns success after the owner-scoped client helper succeeds", async () => {
    mocks.deleteAgentClient.mockResolvedValue({
      id: "client-1",
      owner_id: agentSession.user.id,
    });

    const response = await deleteAgentClient(
      new Request("http://localhost/api/clients/client-1", {
        method: "DELETE",
      }),
      clientRouteContext
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.deleteAgentClient).toHaveBeenCalledWith(
      "client-1",
      agentSession.user.id,
      agentSession.accessToken
    );
  });

  it("returns 404 when the client matches no owner-filtered row", async () => {
    mocks.deleteAgentClient.mockRejectedValue(
      new Error("Client not found or access denied.")
    );

    const response = await deleteAgentClient(
      new Request("http://localhost/api/clients/client-1", {
        method: "DELETE",
      }),
      clientRouteContext
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Client not found or access denied.",
    });
  });
});

describe("listing DELETE route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAppSession.mockResolvedValue(agentSession);
  });

  it("returns success only after the owned listing helper succeeds", async () => {
    mocks.deleteListing.mockResolvedValue({
      id: "listing-1",
      owner_id: agentSession.user.id,
    });

    const response = await deleteListing(
      new Request("http://localhost/api/listings/listing-1", {
        method: "DELETE",
      }),
      routeContext
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.deleteListing).toHaveBeenCalledWith(
      "listing-1",
      agentSession.user.id,
      agentSession.accessToken
    );
  });

  it.each(["non-owned", "missing"])(
    "returns 404 when the %s listing matches no owner-filtered row",
    async () => {
      mocks.deleteListing.mockRejectedValue(
        new Error("Listing not found or access denied.")
      );

      const response = await deleteListing(
        new Request("http://localhost/api/listings/listing-1", {
          method: "DELETE",
        }),
        routeContext
      );

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toEqual({
        error: "Listing not found or access denied.",
      });
    }
  );

  it("returns 500 when Supabase fails", async () => {
    mocks.deleteListing.mockRejectedValue(
      new Error("Supabase delete failed.")
    );

    const response = await deleteListing(
      new Request("http://localhost/api/listings/listing-1", {
        method: "DELETE",
      }),
      routeContext
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Supabase delete failed.",
    });
  });
});

describe("showing request identity handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getAgentContactEmail.mockResolvedValue("agent@example.com");
  });

  it("passes an incomplete authenticated user's ID to the owner check", async () => {
    mocks.getAppSession.mockResolvedValue(incompleteSession);
    mocks.createShowingRequest.mockResolvedValue({
      id: "request-1",
      agentOwnerId: agentSession.user.id,
    });

    const response = await createShowingRequest(
      new Request("http://localhost/api/showing-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.10",
        },
        body: JSON.stringify({
          listingId: "listing-1",
          name: "Test User",
          email: "test@example.com",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.createShowingRequest).toHaveBeenCalledWith(
      expect.objectContaining({ listingId: "listing-1" }),
      incompleteSession.user.id,
      incompleteSession.accessToken
    );
    await expect(response.json()).resolves.toEqual({
      showingRequest: {
        id: "request-1",
        agentOwnerId: agentSession.user.id,
      },
      agentContactEmail: "agent@example.com",
    });
  });

  it("keeps the showing request successful when contact lookup fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mocks.getAppSession.mockResolvedValue(publicSession);
    mocks.createShowingRequest.mockResolvedValue({
      id: "request-1",
      agentOwnerId: agentSession.user.id,
    });
    mocks.getAgentContactEmail.mockRejectedValue(
      new Error("Supabase Auth unavailable.")
    );

    const response = await createShowingRequest(
      new Request("http://localhost/api/showing-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.11",
        },
        body: JSON.stringify({
          listingId: "listing-1",
          name: "Test User",
          email: "test@example.com",
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      showingRequest: {
        id: "request-1",
        agentOwnerId: agentSession.user.id,
      },
      agentContactEmail: null,
    });
    expect(console.error).toHaveBeenCalledWith(
      "[EthioMLS] Agent contact email lookup failed.",
      expect.any(Error)
    );
  });

  it("rejects oversized showing request payloads before parsing JSON", async () => {
    mocks.getAppSession.mockResolvedValue(publicSession);

    const response = await createShowingRequest(
      new Request("http://localhost/api/showing-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "content-length": "9000",
          "x-forwarded-for": "203.0.113.12",
        },
        body: "{}",
      })
    );

    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      error: "Showing request is too large.",
    });
    expect(mocks.getAppSession).not.toHaveBeenCalled();
    expect(mocks.createShowingRequest).not.toHaveBeenCalled();
  });

  it("rejects malformed showing request JSON", async () => {
    mocks.getAppSession.mockResolvedValue(publicSession);

    const response = await createShowingRequest(
      new Request("http://localhost/api/showing-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.13",
        },
        body: "{",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Request body must be valid JSON.",
    });
    expect(mocks.createShowingRequest).not.toHaveBeenCalled();
  });

  it("rate limits repeated showing request submissions from one IP", async () => {
    mocks.getAppSession.mockResolvedValue(publicSession);
    mocks.createShowingRequest.mockResolvedValue({
      id: "request-1",
      agentOwnerId: agentSession.user.id,
    });

    for (let index = 0; index < 5; index += 1) {
      const response = await createShowingRequest(
        new Request("http://localhost/api/showing-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "203.0.113.14",
          },
          body: JSON.stringify({
            listingId: "listing-1",
            name: "Test User",
            email: `test-${index}@example.com`,
          }),
        })
      );

      expect(response.status).toBe(200);
    }

    const response = await createShowingRequest(
      new Request("http://localhost/api/showing-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.14",
        },
        body: JSON.stringify({
          listingId: "listing-1",
          name: "Test User",
          email: "test-6@example.com",
        }),
      })
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error:
        "Too many showing requests. Please wait a few minutes before trying again.",
    });
  });
});
