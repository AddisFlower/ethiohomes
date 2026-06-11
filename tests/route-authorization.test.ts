import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  agentSession,
  incompleteSession,
  publicSession,
} from "@/tests/fixtures/auth";

const mocks = vi.hoisted(() => ({
  createListing: vi.fn(),
  createShowingRequest: vi.fn(),
  deleteListing: vi.fn(),
  getAppSession: vi.fn(),
  updateListing: vi.fn(),
  updateListingApproval: vi.fn(),
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
  listingNotFoundOrDeniedMessage: "Listing not found or access denied.",
  updateListing: mocks.updateListing,
  updateListingApproval: mocks.updateListingApproval,
  updateListingPhoto: mocks.updateListingPhoto,
}));

vi.mock("@/lib/showing-requests", () => ({
  createShowingRequest: mocks.createShowingRequest,
}));

import { PATCH as updateApproval } from "@/app/api/admin/listings/[id]/approval/route";
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
      agentSession.user.id
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
  it("passes an incomplete authenticated user's ID to the owner check", async () => {
    mocks.getAppSession.mockResolvedValue(incompleteSession);
    mocks.createShowingRequest.mockResolvedValue({ id: "request-1" });

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
      incompleteSession.user.id
    );
  });
});
