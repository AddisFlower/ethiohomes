import { serviceRoleSupabaseRequest } from "@/lib/supabase";

export type SellerLeadStatus = "New" | "Contacted" | "Assigned" | "Closed";

export type SellerLead = {
  id: string;
  propertyAddress: string;
  propertyType: string | null;
  intent: string | null;
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string | null;
  preferredContactMethod: string | null;
  notes: string | null;
  status: SellerLeadStatus;
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  assignedAgentAgency: string | null;
  agentViewedAt: string | null;
  createdAt: string | null;
};

type SellerLeadRow = {
  id: string;
  property_address: string;
  property_type: string | null;
  intent: string | null;
  seller_name: string;
  seller_phone: string;
  seller_email: string | null;
  preferred_contact_method: string | null;
  notes: string | null;
  status: SellerLeadStatus;
  assigned_agent_id: string | null;
  assigned_agent?: {
    full_name: string | null;
    agency_name: string | null;
  } | null;
  agent_viewed_at: string | null;
  created_at: string | null;
};

type AgentProfileRow = {
  id: string;
  full_name: string | null;
  agency_name: string | null;
  role: "agent" | "admin";
};

export type AssignableAgent = {
  id: string;
  name: string;
  agencyName: string | null;
  role: "agent" | "admin";
};

export class SellerLeadError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

function requireText(value: unknown, label: string, maxLength: number) {
  if (typeof value !== "string") {
    throw new SellerLeadError(`${label} is required.`);
  }

  const text = value.trim();

  if (!text) {
    throw new SellerLeadError(`${label} is required.`);
  }

  if (text.length > maxLength) {
    throw new SellerLeadError(
      `${label} must be ${maxLength} characters or fewer.`
    );
  }

  return text;
}

function optionalText(value: unknown, label: string, maxLength: number) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new SellerLeadError(`${label} must be text.`);
  }

  const text = value.trim();

  if (!text) {
    return null;
  }

  if (text.length > maxLength) {
    throw new SellerLeadError(
      `${label} must be ${maxLength} characters or fewer.`
    );
  }

  return text;
}

function normalizeEmail(value: unknown) {
  const email = optionalText(value, "Email", 254);

  if (!email) {
    return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new SellerLeadError("Please enter a valid email address.");
  }

  return email.toLowerCase();
}

function toSellerLead(row: SellerLeadRow): SellerLead {
  return {
    id: row.id,
    propertyAddress: row.property_address,
    propertyType: row.property_type,
    intent: row.intent,
    sellerName: row.seller_name,
    sellerPhone: row.seller_phone,
    sellerEmail: row.seller_email,
    preferredContactMethod: row.preferred_contact_method,
    notes: row.notes,
    status: row.status,
    assignedAgentId: row.assigned_agent_id,
    assignedAgentName: row.assigned_agent?.full_name ?? null,
    assignedAgentAgency: row.assigned_agent?.agency_name ?? null,
    agentViewedAt: row.agent_viewed_at,
    createdAt: row.created_at,
  };
}

export async function createSellerLead(input: unknown) {
  if (!input || typeof input !== "object") {
    throw new SellerLeadError("Request body must be an object.");
  }

  const body = input as Record<string, unknown>;
  const row = {
    id: crypto.randomUUID(),
    property_address: requireText(body.propertyAddress, "Property address", 240),
    property_type: optionalText(body.propertyType, "Property type", 80),
    intent: optionalText(body.intent, "Selling goal", 80),
    seller_name: requireText(body.sellerName, "Name", 120),
    seller_phone: requireText(body.sellerPhone, "Phone", 60),
    seller_email: normalizeEmail(body.sellerEmail),
    preferred_contact_method: optionalText(
      body.preferredContactMethod,
      "Preferred contact method",
      40
    ),
    notes: optionalText(body.notes, "Notes", 1000),
    status: "New" satisfies SellerLeadStatus,
  };

  const rows = await serviceRoleSupabaseRequest<SellerLeadRow[]>(
    "/seller_leads",
    {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(row),
    }
  );

  const createdLead = rows[0];

  if (!createdLead) {
    throw new SellerLeadError("Seller lead could not be saved.", 500);
  }

  return toSellerLead(createdLead);
}

export async function getAdminSellerLeads() {
  const rows = await serviceRoleSupabaseRequest<SellerLeadRow[]>(
    "/seller_leads?select=*,assigned_agent:profiles!seller_leads_assigned_agent_id_fkey(full_name,agency_name)&order=created_at.desc"
  );

  return rows.map(toSellerLead);
}

export async function getAssignedSellerLeads(agentId: string) {
  const rows = await serviceRoleSupabaseRequest<SellerLeadRow[]>(
    `/seller_leads?select=*,assigned_agent:profiles!seller_leads_assigned_agent_id_fkey(full_name,agency_name)&assigned_agent_id=eq.${encodeURIComponent(
      agentId
    )}&order=created_at.desc`
  );

  return rows.map(toSellerLead);
}

export async function getNewSellerLeadCount() {
  const rows = await serviceRoleSupabaseRequest<Array<{ id: string }>>(
    "/seller_leads?select=id&status=eq.New&assigned_agent_id=is.null"
  );

  return rows.length;
}

export async function getAssignedSellerLeadCount(agentId: string) {
  const rows = await serviceRoleSupabaseRequest<Array<{ id: string }>>(
    `/seller_leads?select=id&assigned_agent_id=eq.${encodeURIComponent(
      agentId
    )}&status=eq.Assigned&agent_viewed_at=is.null`
  );

  return rows.length;
}

export async function markAssignedSellerLeadsViewed(agentId: string) {
  await serviceRoleSupabaseRequest(
    `/seller_leads?assigned_agent_id=eq.${encodeURIComponent(
      agentId
    )}&status=eq.Assigned&agent_viewed_at=is.null`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        agent_viewed_at: new Date().toISOString(),
      }),
    }
  );
}

export async function getAssignableAgents(): Promise<AssignableAgent[]> {
  const rows = await serviceRoleSupabaseRequest<AgentProfileRow[]>(
    "/profiles?select=id,full_name,agency_name,role&role=in.(agent,admin)&order=full_name.asc"
  );

  return rows.map((profile) => ({
    id: profile.id,
    name: profile.full_name?.trim() || profile.agency_name?.trim() || "Unnamed agent",
    agencyName: profile.agency_name,
    role: profile.role,
  }));
}

export async function assignSellerLead(leadId: string, agentId: string) {
  const cleanLeadId = leadId.trim();
  const cleanAgentId = agentId.trim();

  if (!cleanLeadId) {
    throw new SellerLeadError("Seller lead is required.");
  }

  if (!cleanAgentId) {
    throw new SellerLeadError("Agent is required.");
  }

  const matchingAgents = await serviceRoleSupabaseRequest<AgentProfileRow[]>(
    `/profiles?select=id&role=in.(agent,admin)&id=eq.${encodeURIComponent(
      cleanAgentId
    )}&limit=1`
  );

  if (!matchingAgents[0]) {
    throw new SellerLeadError("Selected agent was not found.", 404);
  }

  const rows = await serviceRoleSupabaseRequest<SellerLeadRow[]>(
    `/seller_leads?id=eq.${encodeURIComponent(cleanLeadId)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        assigned_agent_id: cleanAgentId,
        agent_viewed_at: null,
        status: "Assigned" satisfies SellerLeadStatus,
      }),
    }
  );

  const sellerLead = rows[0];

  if (!sellerLead) {
    throw new SellerLeadError("Seller lead was not found.", 404);
  }

  return toSellerLead(sellerLead);
}
