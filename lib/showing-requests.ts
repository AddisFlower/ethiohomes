import { randomUUID } from "node:crypto";
import { getListingById, isPubliclyVisibleListing } from "@/lib/listings";
import { supabaseRequest } from "@/lib/supabase";

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

export async function createShowingRequest(
  input: ShowingRequestInput,
  requesterUserId?: string
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

  const listing = await getListingById(listingId);

  if (!listing || !isPubliclyVisibleListing(listing)) {
    throw new Error("Listing not found.");
  }

  if (requesterUserId && listing.ownerId === requesterUserId) {
    throw new Error("Owners cannot request showings for their own listings.");
  }

  const rows = await supabaseRequest<ShowingRequestRow[]>("/showing_requests", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      id: randomUUID(),
      listing_id: listing.id,
      listing_title: listing.title,
      listing_mls_id: listing.listingId,
      agent_owner_id: listing.ownerId,
      requester_name: requesterName,
      requester_email: requesterEmail,
      requester_phone: cleanOptional(input.phone),
      preferred_datetime: cleanOptional(input.preferredDatetime),
      message: cleanOptional(input.message),
      status: "New",
    }),
  });

  return toShowingRequest(rows[0]);
}

export async function getShowingRequests(ownerId: string) {
  const rows = await supabaseRequest<ShowingRequestRow[]>(
    `/showing_requests?select=*&agent_owner_id=eq.${encodeURIComponent(
      ownerId
    )}&order=created_at.desc`
  );

  return rows.map(toShowingRequest);
}
