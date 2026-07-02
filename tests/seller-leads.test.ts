import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  serviceRoleSupabaseRequest: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  serviceRoleSupabaseRequest: mocks.serviceRoleSupabaseRequest,
}));

import {
  assignSellerLead,
  createSellerLead,
  getAssignedSellerLeadCount,
  getAssignedSellerLeads,
  getNewSellerLeadCount,
  markAssignedSellerLeadsViewed,
} from "@/lib/seller-leads";

describe("seller leads", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.serviceRoleSupabaseRequest.mockResolvedValue([
      {
        id: "lead-1",
        property_address: "Bole, Addis Ababa",
        property_type: "Apartment",
        intent: "Sell",
        seller_name: "Seller Example",
        seller_phone: "+251911111111",
        seller_email: "seller@example.com",
        preferred_contact_method: "WhatsApp",
        notes: "Ready to speak with an agent.",
        status: "New",
        created_at: "2026-07-02T12:00:00Z",
      },
    ]);
  });

  it("stores seller lead intake through the service role path", async () => {
    const lead = await createSellerLead({
      propertyAddress: "Bole, Addis Ababa",
      propertyType: "Apartment",
      intent: "Sell",
      sellerName: "Seller Example",
      sellerPhone: "+251911111111",
      sellerEmail: "SELLER@example.com",
      preferredContactMethod: "WhatsApp",
      notes: "Ready to speak with an agent.",
    });

    expect(mocks.serviceRoleSupabaseRequest).toHaveBeenCalledWith(
      "/seller_leads",
      expect.objectContaining({
        method: "POST",
        headers: {
          Prefer: "return=representation",
        },
      })
    );

    const init = mocks.serviceRoleSupabaseRequest.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body));

    expect(body).toEqual(
      expect.objectContaining({
        property_address: "Bole, Addis Ababa",
        property_type: "Apartment",
        intent: "Sell",
        seller_name: "Seller Example",
        seller_phone: "+251911111111",
        seller_email: "seller@example.com",
        preferred_contact_method: "WhatsApp",
        status: "New",
      })
    );
    expect(lead).toEqual(
      expect.objectContaining({
        id: "lead-1",
        propertyAddress: "Bole, Addis Ababa",
        sellerEmail: "seller@example.com",
        status: "New",
      })
    );
  });

  it.each([
    [
      "missing address",
      { sellerName: "Seller Example", sellerPhone: "+251911111111" },
      "Property address is required.",
    ],
    [
      "missing phone",
      { propertyAddress: "Bole", sellerName: "Seller Example" },
      "Phone is required.",
    ],
    [
      "invalid email",
      {
        propertyAddress: "Bole",
        sellerName: "Seller Example",
        sellerPhone: "+251911111111",
        sellerEmail: "not-an-email",
      },
      "Please enter a valid email address.",
    ],
  ])("rejects invalid seller lead payloads: %s", async (_name, input, message) => {
    await expect(createSellerLead(input)).rejects.toMatchObject({ message });
    expect(mocks.serviceRoleSupabaseRequest).not.toHaveBeenCalled();
  });

  it("assigns a seller lead to an agent profile", async () => {
    mocks.serviceRoleSupabaseRequest
      .mockResolvedValueOnce([
        {
          id: "agent-1",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "lead-1",
          property_address: "Bole, Addis Ababa",
          property_type: "Apartment",
          intent: "Sell",
          seller_name: "Seller Example",
          seller_phone: "+251911111111",
          seller_email: null,
          preferred_contact_method: "WhatsApp",
          notes: null,
          status: "Assigned",
          assigned_agent_id: "agent-1",
          created_at: "2026-07-02T12:00:00Z",
        },
      ]);

    const lead = await assignSellerLead("lead-1", "agent-1");

    expect(mocks.serviceRoleSupabaseRequest).toHaveBeenNthCalledWith(
      1,
      "/profiles?select=id&role=in.(agent,admin)&id=eq.agent-1&limit=1"
    );
    expect(mocks.serviceRoleSupabaseRequest).toHaveBeenNthCalledWith(
      2,
      "/seller_leads?id=eq.lead-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          assigned_agent_id: "agent-1",
          agent_viewed_at: null,
          status: "Assigned",
        }),
      })
    );
    expect(lead).toEqual(
      expect.objectContaining({
        id: "lead-1",
        assignedAgentId: "agent-1",
        status: "Assigned",
      })
    );
  });

  it("rejects assignments to missing agent profiles", async () => {
    mocks.serviceRoleSupabaseRequest.mockResolvedValueOnce([]);

    await expect(assignSellerLead("lead-1", "agent-1")).rejects.toMatchObject({
      message: "Selected agent was not found.",
      status: 404,
    });

    expect(mocks.serviceRoleSupabaseRequest).toHaveBeenCalledOnce();
  });

  it("reads only seller leads assigned to the signed-in agent", async () => {
    mocks.serviceRoleSupabaseRequest.mockResolvedValueOnce([
      {
        id: "lead-1",
        property_address: "Bole, Addis Ababa",
        property_type: "Apartment",
        intent: "Sell",
        seller_name: "Seller Example",
        seller_phone: "+251911111111",
        seller_email: null,
        preferred_contact_method: "WhatsApp",
        notes: null,
        status: "Assigned",
        assigned_agent_id: "agent-1",
        created_at: "2026-07-02T12:00:00Z",
      },
    ]);

    const leads = await getAssignedSellerLeads("agent-1");

    expect(mocks.serviceRoleSupabaseRequest).toHaveBeenCalledWith(
      expect.stringContaining("assigned_agent_id=eq.agent-1")
    );
    expect(leads).toHaveLength(1);
    expect(leads[0]).toEqual(
      expect.objectContaining({
        id: "lead-1",
        assignedAgentId: "agent-1",
      })
    );
  });

  it("counts new admin seller lead notifications", async () => {
    mocks.serviceRoleSupabaseRequest.mockResolvedValueOnce([
      { id: "lead-1" },
      { id: "lead-2" },
    ]);

    await expect(getNewSellerLeadCount()).resolves.toBe(2);
    expect(mocks.serviceRoleSupabaseRequest).toHaveBeenCalledWith(
      "/seller_leads?select=id&status=eq.New&assigned_agent_id=is.null"
    );
  });

  it("counts assigned agent seller lead notifications", async () => {
    mocks.serviceRoleSupabaseRequest.mockResolvedValueOnce([{ id: "lead-1" }]);

    await expect(getAssignedSellerLeadCount("agent-1")).resolves.toBe(1);
    expect(mocks.serviceRoleSupabaseRequest).toHaveBeenCalledWith(
      "/seller_leads?select=id&assigned_agent_id=eq.agent-1&status=eq.Assigned&agent_viewed_at=is.null"
    );
  });

  it("marks assigned seller lead notifications as viewed", async () => {
    mocks.serviceRoleSupabaseRequest.mockResolvedValueOnce(undefined);

    await markAssignedSellerLeadsViewed("agent-1");

    expect(mocks.serviceRoleSupabaseRequest).toHaveBeenCalledWith(
      "/seller_leads?assigned_agent_id=eq.agent-1&status=eq.Assigned&agent_viewed_at=is.null",
      expect.objectContaining({
        method: "PATCH",
        headers: {
          Prefer: "return=minimal",
        },
      })
    );
  });
});
