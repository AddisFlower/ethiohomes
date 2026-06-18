import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  serviceRoleSupabaseRequest: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  serviceRoleSupabaseRequest: mocks.serviceRoleSupabaseRequest,
}));

import { unsubscribeClientAlertByToken } from "@/lib/client-alert-preferences";

describe("client alert preferences", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("turns off alerts using an unsubscribe token", async () => {
    mocks.serviceRoleSupabaseRequest.mockResolvedValue([
      {
        id: "client-1",
        name: "Client Example",
        email: "client@example.com",
        alert_unsubscribed_at: "2026-06-18T12:00:00.000Z",
      },
    ]);

    const result = await unsubscribeClientAlertByToken(" token-1 ");

    expect(result).toEqual(
      expect.objectContaining({
        clientId: "client-1",
        email: "client@example.com",
        unsubscribedAt: "2026-06-18T12:00:00.000Z",
      })
    );
    expect(mocks.serviceRoleSupabaseRequest).toHaveBeenCalledWith(
      "/agent_clients?alert_unsubscribe_token=eq.token-1",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining('"alert_enabled":false'),
      })
    );
    const init = mocks.serviceRoleSupabaseRequest.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body));
    expect(body).toEqual(
      expect.objectContaining({
        alert_enabled: false,
        alert_frequency: "Off",
        alert_unsubscribed_at: expect.any(String),
      })
    );
  });

  it("rejects missing preference tokens", async () => {
    await expect(unsubscribeClientAlertByToken(" ")).rejects.toThrow(
      "A valid alert preference link is required."
    );
    expect(mocks.serviceRoleSupabaseRequest).not.toHaveBeenCalled();
  });

  it("rejects unknown preference tokens", async () => {
    mocks.serviceRoleSupabaseRequest.mockResolvedValue([]);

    await expect(unsubscribeClientAlertByToken("token-1")).rejects.toThrow(
      "Alert preference link is invalid or expired."
    );
  });
});
