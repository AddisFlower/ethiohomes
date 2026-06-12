import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  anonymousSupabaseRequest,
  authenticatedSupabaseRequest,
  serviceRoleSupabaseAuthRequest,
  serviceRoleSupabaseRequest,
} from "@/lib/supabase";

const supabaseUrl = "https://project.supabase.co";
const anonKey = "anon-key";
const serviceRoleKey = "service-role-key";
const accessToken = "user-access-token";

function successfulResponse(body: unknown = []) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Supabase credential paths", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", supabaseUrl);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", anonKey);
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", serviceRoleKey);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(successfulResponse()));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses the anonymous key for public requests", async () => {
    await anonymousSupabaseRequest("/listings?select=*");

    expect(fetch).toHaveBeenCalledWith(
      `${supabaseUrl}/rest/v1/listings?select=*`,
      expect.objectContaining({
        headers: expect.objectContaining({
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        }),
      })
    );
  });

  it("accepts successful return-minimal responses with no body", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(null, { status: 201 })
    );

    await expect(
      anonymousSupabaseRequest("/showing_requests", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
      })
    ).resolves.toBeUndefined();
  });

  it("uses the anonymous API key and user JWT for authenticated requests", async () => {
    await authenticatedSupabaseRequest(
      "/listings?id=eq.listing-1",
      accessToken
    );

    expect(fetch).toHaveBeenCalledWith(
      `${supabaseUrl}/rest/v1/listings?id=eq.listing-1`,
      expect.objectContaining({
        headers: expect.objectContaining({
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
        }),
      })
    );
  });

  it("uses the service role key only for explicit service requests", async () => {
    await serviceRoleSupabaseRequest("/listings?id=eq.listing-1");

    expect(fetch).toHaveBeenCalledWith(
      `${supabaseUrl}/rest/v1/listings?id=eq.listing-1`,
      expect.objectContaining({
        headers: expect.objectContaining({
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        }),
      })
    );
  });

  it("uses the service role key for explicit Auth admin requests", async () => {
    await serviceRoleSupabaseAuthRequest(
      "/admin/users/00000000-0000-4000-8000-000000000001"
    );

    expect(fetch).toHaveBeenCalledWith(
      `${supabaseUrl}/auth/v1/admin/users/00000000-0000-4000-8000-000000000001`,
      expect.objectContaining({
        headers: expect.objectContaining({
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        }),
      })
    );
  });

  it("rejects authenticated requests without a user token", async () => {
    expect(() => authenticatedSupabaseRequest("/listings", " ")).toThrow(
      "Supabase authenticated access token is required."
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects service requests without the service role key", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    expect(() => serviceRoleSupabaseRequest("/listings")).toThrow(
      "Supabase service role key is not configured."
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not use the service key when public configuration is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(() => anonymousSupabaseRequest("/listings")).toThrow(
      "Supabase URL and anonymous key are not configured."
    );
    expect(fetch).not.toHaveBeenCalled();
  });
});
