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
  sendListingAlertNow: vi.fn(),
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

import { PATCH as updateApproval } from "@/app/api/admin/listings/[id]/approval/route";
import { POST as sendClientAlert } from "@/app/api/client-alerts/send/route";
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
import { POST as createShowingRequest } from "@/app/api/showing-requests/route";

const routeContext = {
  params: Promise.resolve({ id: "listing-1" }),
};
const clientRouteContext = {
  params: Promise.resolve({ id: "client-1" }),
};

afterEach(() => {
  vi.restoreAllMocks();
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
});
