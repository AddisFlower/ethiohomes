import { randomUUID } from "node:crypto";
import { getListingById } from "@/lib/listings";
import { getShowingEligibility } from "@/lib/listing-rules";
import {
  anonymousSupabaseRequest,
  authenticatedSupabaseRequest,
  serviceRoleSupabaseAuthRequest,
} from "@/lib/supabase";

export type ShowingRequest = {
  id: string;
  listingId: string;
  listingTitle: string;
  listingMlsId: string;
  agentOwnerId: string;
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string | null;
  preferredDatetime: string | null;
  message: string | null;
  status: "New";
  createdAt: string;
};

type ShowingRequestRow = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_mls_id: string;
  agent_owner_id: string;
  requester_name: string;
  requester_email: string;
  requester_phone: string | null;
  preferred_datetime: string | null;
  message: string | null;
  status: "New";
  created_at: string;
};

export type ShowingRequestInput = {
  email?: string;
  listingId?: string;
  message?: string;
  name?: string;
  phone?: string;
  preferredDatetime?: string;
};

type SupabaseAdminUser = {
  email?: string;
};

function toShowingRequest(row: ShowingRequestRow): ShowingRequest {
  return {
    id: row.id,
    listingId: row.listing_id,
    listingTitle: row.listing_title,
    listingMlsId: row.listing_mls_id,
    agentOwnerId: row.agent_owner_id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    requesterPhone: row.requester_phone,
    preferredDatetime: row.preferred_datetime,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  };
}

function cleanOptional(value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function assertEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function getAgentContactEmail(agentOwnerId: string) {
  // TODO: Replace the login email with a dedicated public contact field.
  const user = await serviceRoleSupabaseAuthRequest<SupabaseAdminUser>(
    `/admin/users/${encodeURIComponent(agentOwnerId)}`
  );
  const email = user.email?.trim();

  return email && assertEmail(email) ? email : null;
}

export async function createShowingRequest(
  input: ShowingRequestInput,
  requesterUserId?: string,
  accessToken?: string
) {
  const listingId = input.listingId?.trim();
  const requesterName = input.name?.trim();
  const requesterEmail = input.email?.trim();

  if (!listingId) {
    throw new Error("Listing is required.");
  }

  if (!requesterName) {
    throw new Error("Name is required.");
  }

  if (!requesterEmail || !assertEmail(requesterEmail)) {
    throw new Error("A valid email is required.");
  }

  const listing = await getListingById(listingId, accessToken);

  if (!listing) {
    throw new Error("Listing not found.");
  }

  if (requesterUserId && listing.ownerId === requesterUserId) {
    throw new Error("Owners cannot request showings for their own listings.");
  }

  const showingEligibility = getShowingEligibility(listing);

  if (!showingEligibility.allowed) {
    throw new Error(
      showingEligibility.message ?? "This listing is not accepting showings."
    );
  }

  const id = randomUUID();
  const requesterPhone = cleanOptional(input.phone);
  const preferredDatetime = cleanOptional(input.preferredDatetime);
  const message = cleanOptional(input.message);
  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      id,
      listing_id: listing.id,
      listing_title: listing.title,
      listing_mls_id: listing.listingId,
      agent_owner_id: listing.ownerId,
      requester_name: requesterName,
      requester_email: requesterEmail,
      requester_phone: requesterPhone,
      preferred_datetime: preferredDatetime,
      message,
      status: "New",
    }),
  };
  if (accessToken) {
    await authenticatedSupabaseRequest<void>(
      "/showing_requests",
      accessToken,
      requestInit
    );
  } else {
    await anonymousSupabaseRequest<void>("/showing_requests", requestInit);
  }

  return {
    id,
    listingId: listing.id,
    listingTitle: listing.title,
    listingMlsId: listing.listingId,
    agentOwnerId: listing.ownerId,
    requesterName,
    requesterEmail,
    requesterPhone,
    preferredDatetime,
    message,
    status: "New",
    createdAt: new Date().toISOString(),
  } satisfies ShowingRequest;
}

export async function getShowingRequests(
  ownerId: string,
  accessToken: string
) {
  const rows = await authenticatedSupabaseRequest<ShowingRequestRow[]>(
    `/showing_requests?select=*&agent_owner_id=eq.${encodeURIComponent(
      ownerId
    )}&order=created_at.desc`,
    accessToken
  );

  return rows.map(toShowingRequest);
}
