import { randomUUID } from "node:crypto";
import { getListingById } from "@/lib/listings";
import { getShowingEligibility } from "@/lib/listing-rules";
import { getPublicContactEmailForProfile } from "@/lib/profiles";
import {
  anonymousSupabaseRequest,
  authenticatedSupabaseRequest,
  serviceRoleSupabaseRequest,
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

export class ShowingRequestError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ShowingRequestError";
    this.status = status;
  }
}

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

function cleanRequiredString(
  value: unknown,
  fieldName: string,
  maxLength: number
) {
  if (typeof value !== "string") {
    throw new ShowingRequestError(`${fieldName} is required.`);
  }

  const cleaned = value.trim();

  if (!cleaned) {
    throw new ShowingRequestError(`${fieldName} is required.`);
  }

  if (cleaned.length > maxLength) {
    throw new ShowingRequestError(
      `${fieldName} must be ${maxLength} characters or fewer.`
    );
  }

  return cleaned;
}

function cleanOptionalString(
  value: unknown,
  fieldName: string,
  maxLength: number
) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new ShowingRequestError(`${fieldName} must be text.`);
  }

  const cleaned = value.trim();

  if (cleaned.length > maxLength) {
    throw new ShowingRequestError(
      `${fieldName} must be ${maxLength} characters or fewer.`
    );
  }

  return cleaned ? cleaned : null;
}

function assertEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function assertNoRecentDuplicateShowingRequest(
  listingId: string,
  requesterEmail: string
) {
  const cutoff = encodeURIComponent(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  );
  const rows = await serviceRoleSupabaseRequest<Pick<ShowingRequestRow, "id">[]>(
    `/showing_requests?select=id&listing_id=eq.${encodeURIComponent(
      listingId
    )}&requester_email=eq.${encodeURIComponent(
      requesterEmail
    )}&created_at=gte.${cutoff}&limit=1`
  );

  if (rows.length > 0) {
    throw new ShowingRequestError(
      "A showing request for this listing was already submitted with this email recently.",
      409
    );
  }
}

export async function getAgentContactEmail(agentOwnerId: string) {
  return getPublicContactEmailForProfile(agentOwnerId);
}

export async function createShowingRequest(
  input: ShowingRequestInput,
  requesterUserId?: string,
  accessToken?: string
) {
  const listingId = cleanRequiredString(input.listingId, "Listing", 120);
  const requesterName = cleanRequiredString(input.name, "Name", 120);
  const requesterEmail = cleanRequiredString(input.email, "Email", 254)
    .toLowerCase();

  if (!assertEmail(requesterEmail)) {
    throw new ShowingRequestError("A valid email is required.");
  }

  const listing = await getListingById(listingId, accessToken);
  if (!listing) {
    throw new ShowingRequestError("Listing not found.", 404);
  }

  if (requesterUserId && listing.ownerId === requesterUserId) {
    throw new ShowingRequestError(
      "Owners cannot request showings for their own listings."
    );
  }

  const showingEligibility = getShowingEligibility(listing);

  if (!showingEligibility.allowed) {
    throw new ShowingRequestError(
      showingEligibility.message ?? "This listing is not accepting showings."
    );
  }

  await assertNoRecentDuplicateShowingRequest(listing.id, requesterEmail);

  const id = randomUUID();
  const requesterPhone = cleanOptionalString(input.phone, "Phone", 40);
  const preferredDatetime = cleanOptionalString(
    input.preferredDatetime,
    "Preferred date/time",
    120
  );
  const message = cleanOptionalString(input.message, "Message", 1000);
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
