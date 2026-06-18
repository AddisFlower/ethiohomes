import { beforeEach, describe, expect, it, vi } from "vitest";
import { accessToken, authUser } from "@/tests/fixtures/auth";

const mocks = vi.hoisted(() => ({
  authenticatedSupabaseRequest: vi.fn(),
  serviceRoleSupabaseRequest: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  authenticatedSupabaseRequest: mocks.authenticatedSupabaseRequest,
  serviceRoleSupabaseRequest: mocks.serviceRoleSupabaseRequest,
}));

import {
  getPublicContactEmailForProfile,
  updateOwnProfile,
} from "@/lib/profiles";

describe("profile public contact email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticatedSupabaseRequest.mockResolvedValue([
      {
        id: authUser.id,
        full_name: "Agent Example",
        agency_name: "Example Realty",
        public_contact_email: "contact@example.com",
        role: "agent",
      },
    ]);
  });

  it("normalizes and updates the public contact email on the owner profile", async () => {
    await updateOwnProfile(authUser.id, accessToken, {
      fullName: "Agent Example",
      agencyName: "Example Realty",
      publicContactEmail: " CONTACT@Example.com ",
    });

    const init = mocks.authenticatedSupabaseRequest.mock.calls[0][2] as RequestInit;
    const body = JSON.parse(String(init.body));

    expect(mocks.authenticatedSupabaseRequest).toHaveBeenCalledWith(
      `/profiles?id=eq.${encodeURIComponent(authUser.id)}`,
      accessToken,
      expect.objectContaining({
        method: "PATCH",
      })
    );
    expect(body).toEqual(
      expect.objectContaining({
        full_name: "Agent Example",
        agency_name: "Example Realty",
        public_contact_email: "contact@example.com",
      })
    );
  });

  it("allows clearing the public contact email", async () => {
    await updateOwnProfile(authUser.id, accessToken, {
      publicContactEmail: " ",
    });

    const init = mocks.authenticatedSupabaseRequest.mock.calls[0][2] as RequestInit;
    const body = JSON.parse(String(init.body));

    expect(body.public_contact_email).toBeNull();
  });

  it("preserves omitted profile fields during partial updates", async () => {
    await updateOwnProfile(authUser.id, accessToken, {
      publicContactEmail: "public@example.com",
    });

    const init = mocks.authenticatedSupabaseRequest.mock.calls[0][2] as RequestInit;
    const body = JSON.parse(String(init.body));

    expect(body).toEqual({
      public_contact_email: "public@example.com",
    });
  });

  it("rejects invalid public contact emails before calling Supabase", async () => {
    await expect(
      updateOwnProfile(authUser.id, accessToken, {
        publicContactEmail: "not-an-email",
      })
    ).rejects.toThrow("Public contact email must be a valid email address.");

    expect(mocks.authenticatedSupabaseRequest).not.toHaveBeenCalled();
  });

  it("reads only the explicit public contact email for showing confirmations", async () => {
    mocks.serviceRoleSupabaseRequest.mockResolvedValueOnce([
      { public_contact_email: "public@example.com" },
    ]);

    await expect(
      getPublicContactEmailForProfile(authUser.id)
    ).resolves.toBe("public@example.com");

    expect(mocks.serviceRoleSupabaseRequest).toHaveBeenCalledWith(
      `/profiles?select=public_contact_email&id=eq.${encodeURIComponent(
        authUser.id
      )}&limit=1`
    );
  });

  it("returns null when no public contact email is configured", async () => {
    mocks.serviceRoleSupabaseRequest.mockResolvedValueOnce([
      { public_contact_email: null },
    ]);

    await expect(
      getPublicContactEmailForProfile(authUser.id)
    ).resolves.toBeNull();
  });
});
