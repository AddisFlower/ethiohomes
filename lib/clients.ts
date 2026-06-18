import { randomUUID } from "node:crypto";
import { authenticatedSupabaseRequest } from "@/lib/supabase";
import type { Property } from "@/lib/listings";

export const clientStatuses = [
  "New",
  "Contacted",
  "Interested",
  "Tour Scheduled",
  "Closed",
  "Not Interested",
] as const;

export const alertFrequencies = ["Off", "Immediate", "Daily", "Weekly"] as const;
export const alertMarketStatuses = ["Coming Soon", "Active", "Closed"] as const;

export type ClientStatus = (typeof clientStatuses)[number];
export type AlertFrequency = (typeof alertFrequencies)[number];
export type AlertMarketStatus = (typeof alertMarketStatuses)[number];

export type AgentClient = {
  id: string;
  ownerId: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  status: ClientStatus;
  notes: string | null;
  nextFollowUpAt: string | null;
  preferredLocation: string | null;
  preferredPropertyType: string | null;
  preferredTransactionType: string | null;
  preferredMarketStatus: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minBedrooms: number | null;
  minBathrooms: number | null;
  alertEnabled: boolean;
  alertFrequency: AlertFrequency;
  alertMarketStatuses: AlertMarketStatus[];
  alertLastCheckedAt: string | null;
  alertLastSentAt: string | null;
  alertMatchedListingIds: string[];
  createdAt: string;
  updatedAt: string;
};

export const clientNotFoundOrDeniedMessage =
  "Client not found or access denied.";

type AgentClientRow = {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  phone: string | null;
  source: string;
  status: string;
  notes: string | null;
  next_follow_up_at: string | null;
  preferred_location: string | null;
  preferred_property_type: string | null;
  preferred_transaction_type: string | null;
  preferred_market_status: string | null;
  min_price: number | null;
  max_price: number | null;
  min_bedrooms: number | null;
  min_bathrooms: number | null;
  alert_enabled: boolean;
  alert_frequency: string;
  alert_market_statuses?: string[] | null;
  alert_last_checked_at?: string | null;
  alert_last_sent_at: string | null;
  alert_matched_listing_ids: string[] | null;
  created_at: string;
  updated_at: string;
};

function toClientStatus(value: string): ClientStatus {
  if (clientStatuses.includes(value as ClientStatus)) {
    return value as ClientStatus;
  }

  return "New";
}

function toAlertFrequency(value: string): AlertFrequency {
  if (alertFrequencies.includes(value as AlertFrequency)) {
    return value as AlertFrequency;
  }

  return "Off";
}

function toAlertMarketStatuses(
  value: string[] | null | undefined
): AlertMarketStatus[] {
  const statuses =
    value?.filter((status): status is AlertMarketStatus =>
      alertMarketStatuses.includes(status as AlertMarketStatus)
    ) ?? [];

  return statuses.length > 0 ? statuses : ["Active"];
}

function toAgentClient(row: AgentClientRow): AgentClient {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    source: row.source,
    status: toClientStatus(row.status),
    notes: row.notes,
    nextFollowUpAt: row.next_follow_up_at,
    preferredLocation: row.preferred_location,
    preferredPropertyType: row.preferred_property_type,
    preferredTransactionType: row.preferred_transaction_type,
    preferredMarketStatus: row.preferred_market_status,
    minPrice: row.min_price,
    maxPrice: row.max_price,
    minBedrooms: row.min_bedrooms,
    minBathrooms: row.min_bathrooms,
    alertEnabled: row.alert_enabled,
    alertFrequency: toAlertFrequency(row.alert_frequency),
    alertMarketStatuses: toAlertMarketStatuses(row.alert_market_statuses),
    alertLastCheckedAt: row.alert_last_checked_at ?? null,
    alertLastSentAt: row.alert_last_sent_at,
    alertMatchedListingIds: row.alert_matched_listing_ids ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
}

function getOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function getOptionalNumber(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} must be a valid number.`);
  }

  return number;
}

function getOptionalDateTime(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Follow-up date must be a valid date.");
  }

  return date.toISOString();
}

function assertEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function fromFormData(formData: FormData, ownerId: string) {
  const email = getText(formData, "email", "Email");
  const status = getText(formData, "status", "Status");
  const alertFrequency = getText(
    formData,
    "alertFrequency",
    "Alert frequency"
  );
  const minPrice = getOptionalNumber(formData, "minPrice", "Minimum price");
  const maxPrice = getOptionalNumber(formData, "maxPrice", "Maximum price");

  if (!assertEmail(email)) {
    throw new Error("A valid email is required.");
  }

  if (!clientStatuses.includes(status as ClientStatus)) {
    throw new Error("Select a valid client status.");
  }

  if (!alertFrequencies.includes(alertFrequency as AlertFrequency)) {
    throw new Error("Select a valid alert frequency.");
  }

  const selectedAlertMarketStatuses = formData
    .getAll("alertMarketStatuses")
    .map((value) => String(value));

  if (
    selectedAlertMarketStatuses.some(
      (status) => !alertMarketStatuses.includes(status as AlertMarketStatus)
    )
  ) {
    throw new Error("Select valid alert market statuses.");
  }

  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    throw new Error("Minimum price cannot be greater than maximum price.");
  }

  return {
    owner_id: ownerId,
    name: getText(formData, "name", "Client name"),
    email,
    phone: getOptionalText(formData, "phone"),
    source: getOptionalText(formData, "source") ?? "Manual",
    status,
    notes: getOptionalText(formData, "notes"),
    next_follow_up_at: getOptionalDateTime(formData, "nextFollowUpAt"),
    preferred_location: getOptionalText(formData, "preferredLocation"),
    preferred_property_type: getOptionalText(
      formData,
      "preferredPropertyType"
    ),
    preferred_transaction_type: getOptionalText(
      formData,
      "preferredTransactionType"
    ),
    preferred_market_status: null,
    min_price: minPrice,
    max_price: maxPrice,
    min_bedrooms: getOptionalNumber(
      formData,
      "minBedrooms",
      "Minimum bedrooms"
    ),
    min_bathrooms: getOptionalNumber(
      formData,
      "minBathrooms",
      "Minimum bathrooms"
    ),
    alert_enabled: formData.get("alertEnabled") === "on",
    alert_frequency: alertFrequency,
    alert_market_statuses:
      selectedAlertMarketStatuses.length > 0
        ? selectedAlertMarketStatuses
        : ["Active"],
  };
}

export async function getAgentClients(ownerId: string, accessToken: string) {
  const rows = await authenticatedSupabaseRequest<AgentClientRow[]>(
    `/agent_clients?select=*&owner_id=eq.${encodeURIComponent(
      ownerId
    )}&order=updated_at.desc`,
    accessToken
  );

  return rows.map(toAgentClient);
}

export async function getAgentClientById(
  id: string,
  ownerId: string,
  accessToken: string
) {
  const rows = await authenticatedSupabaseRequest<AgentClientRow[]>(
    `/agent_clients?select=*&id=eq.${encodeURIComponent(
      id
    )}&owner_id=eq.${encodeURIComponent(ownerId)}&limit=1`,
    accessToken
  );

  return rows[0] ? toAgentClient(rows[0]) : null;
}

export async function getDueFollowUps(ownerId: string, accessToken: string) {
  const now = encodeURIComponent(new Date().toISOString());
  const rows = await authenticatedSupabaseRequest<AgentClientRow[]>(
    `/agent_clients?select=*&owner_id=eq.${encodeURIComponent(
      ownerId
    )}&next_follow_up_at=not.is.null&next_follow_up_at=lte.${now}&order=next_follow_up_at.asc`,
    accessToken
  );

  return rows.map(toAgentClient);
}

export async function getAlertEnabledClients(
  ownerId: string,
  accessToken: string
) {
  const rows = await authenticatedSupabaseRequest<AgentClientRow[]>(
    `/agent_clients?select=*&owner_id=eq.${encodeURIComponent(
      ownerId
    )}&alert_enabled=eq.true&order=updated_at.desc`,
    accessToken
  );

  return rows.map(toAgentClient);
}

export async function createAgentClient(
  formData: FormData,
  ownerId: string,
  accessToken: string
) {
  const body = {
    id: randomUUID(),
    ...fromFormData(formData, ownerId),
  };

  const rows = await authenticatedSupabaseRequest<AgentClientRow[]>(
    "/agent_clients",
    accessToken,
    {
      method: "POST",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    }
  );

  return toAgentClient(rows[0]);
}

export async function updateAgentClient(
  id: string,
  formData: FormData,
  ownerId: string,
  accessToken: string
) {
  const body = fromFormData(formData, ownerId);
  const rows = await authenticatedSupabaseRequest<AgentClientRow[]>(
    `/agent_clients?id=eq.${encodeURIComponent(
      id
    )}&owner_id=eq.${encodeURIComponent(ownerId)}`,
    accessToken,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    }
  );

  if (!rows[0]) {
    throw new Error("Client not found or access denied.");
  }

  return toAgentClient(rows[0]);
}

export async function deleteAgentClient(
  id: string,
  ownerId: string,
  accessToken: string
) {
  const rows = await authenticatedSupabaseRequest<
    Pick<AgentClientRow, "id" | "owner_id">[]
  >(
    `/agent_clients?id=eq.${encodeURIComponent(
      id
    )}&owner_id=eq.${encodeURIComponent(ownerId)}`,
    accessToken,
    {
      method: "DELETE",
      headers: {
        Prefer: "return=representation",
      },
    }
  );

  if (!rows[0]) {
    throw new Error(clientNotFoundOrDeniedMessage);
  }

  return rows[0];
}

function parsePrice(value: string) {
  const number = Number(value.replace(/[^0-9]/g, ""));
  return Number.isFinite(number) ? number : null;
}

export function getClientListingMatches(
  client: AgentClient,
  listings: Property[],
  options: {
    alertOnly?: boolean;
    excludeListingIds?: string[];
    limit?: number;
  } = {}
) {
  const excluded = new Set(options.excludeListingIds ?? []);
  const matches = listings.filter((listing) => {
    const price = parsePrice(listing.price);
    const location = client.preferredLocation?.toLowerCase();

    if (excluded.has(listing.id)) {
      return false;
    }

    if (options.alertOnly) {
      if (listing.approvalStatus !== "Approved") {
        return false;
      }

      if (
        !alertMarketStatuses.includes(
          listing.marketStatus as AlertMarketStatus
        ) ||
        !client.alertMarketStatuses.includes(
          listing.marketStatus as AlertMarketStatus
        )
      ) {
        return false;
      }
    }

    if (
      location &&
      !listing.location.toLowerCase().includes(location) &&
      !(listing.address?.toLowerCase().includes(location) ?? false)
    ) {
      return false;
    }

    if (
      client.preferredPropertyType &&
      listing.propertyType !== client.preferredPropertyType
    ) {
      return false;
    }

    if (
      client.preferredTransactionType &&
      listing.transactionType !== client.preferredTransactionType
    ) {
      return false;
    }

    if (price !== null && client.minPrice !== null && price < client.minPrice) {
      return false;
    }

    if (price !== null && client.maxPrice !== null && price > client.maxPrice) {
      return false;
    }

    if (
      client.minBedrooms !== null &&
      (listing.bedrooms ?? 0) < client.minBedrooms
    ) {
      return false;
    }

    if (
      client.minBathrooms !== null &&
      (listing.bathrooms ?? 0) < client.minBathrooms
    ) {
      return false;
    }

    return true;
  });

  return typeof options.limit === "number"
    ? matches.slice(0, options.limit)
    : matches;
}

export function getClientAlertMatchDiagnostics(
  client: AgentClient,
  listings: Property[],
  excludeListingIds: string[] = []
) {
  const approvedListings = listings.filter(
    (listing) => listing.approvalStatus === "Approved"
  );
  const alertMarketListings = approvedListings.filter(
    (listing) =>
      alertMarketStatuses.includes(listing.marketStatus as AlertMarketStatus) &&
      client.alertMarketStatuses.includes(
        listing.marketStatus as AlertMarketStatus
      )
  );
  const eligibleMatches = getClientListingMatches(client, listings, {
    alertOnly: true,
  });
  const unsentMatches = getClientListingMatches(client, listings, {
    alertOnly: true,
    excludeListingIds,
    limit: 5,
  });

  return {
    visibleListingCount: listings.length,
    approvedListingCount: approvedListings.length,
    alertMarketListingCount: alertMarketListings.length,
    eligibleMatchCount: eligibleMatches.length,
    unsentMatchCount: unsentMatches.length,
    previouslySentCount: excludeListingIds.length,
  };
}

export function getClientAlertExclusionReasons(
  client: AgentClient,
  listing: Property,
  excludeListingIds: string[] = []
) {
  const reasons: string[] = [];

  if (listing.approvalStatus !== "Approved") {
    reasons.push(`Approval is ${listing.approvalStatus}`);
  }

  if (
    !alertMarketStatuses.includes(listing.marketStatus as AlertMarketStatus)
  ) {
    reasons.push(`${listing.marketStatus} is not alert-eligible`);
  } else if (
    !client.alertMarketStatuses.includes(
      listing.marketStatus as AlertMarketStatus
    )
  ) {
    reasons.push(`${listing.marketStatus} is not selected for alerts`);
  }

  if (excludeListingIds.includes(listing.id)) {
    reasons.push("Already sent to this client");
  }

  const criteriaMatch = getClientListingMatches(client, [listing], {
    alertOnly: false,
  }).length;

  if (criteriaMatch === 0) {
    reasons.push("Does not match saved criteria");
  }

  return reasons;
}
