import { randomUUID } from "node:crypto";
import { properties as mockProperties } from "@/data/properties";
import {
  supabaseRequest,
  uploadSupabaseStorageObject,
} from "@/lib/supabase";
import {
  approvalStatuses,
  canAgentBrowseListing,
  createMarketStatuses,
  getPropertyFieldRules,
  isPubliclyVisibleListing,
  marketStatuses,
  propertyTypes,
  type ApprovalStatus,
  type MarketStatus,
  transactionTypes,
  type TransactionType,
} from "@/lib/listing-rules";

export type Property = {
  id: string;
  listingId: string;
  title: string;
  price: string;
  location: string;
  address: string | null;
  propertyType: string;
  transactionType: TransactionType;
  marketStatus: MarketStatus;
  verified: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  agent: string;
  updatedAt: string;
  updatedAtTimestamp: string | null;
  approvalStatus: ApprovalStatus;
  rejectionReason: string | null;
  description: string;
  image: string;
  ownerId: string;
};

type ListingRow = {
  id: string;
  listing_id: string;
  title: string;
  price: string;
  location: string;
  address: string | null;
  property_type: string;
  transaction_type: string | null;
  market_status: string | null;
  verified: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  agent: string;
  updated_at: string | null;
  approval_status: string;
  rejection_reason: string | null;
  description: string;
  image: string;
  owner_id: string;
};

type ListingOwnerRow = {
  approval_status: string;
  owner_id: string;
};

type DeletedListingRow = {
  id: string;
  owner_id: string;
};

export type { ApprovalStatus, MarketStatus, TransactionType };

const fallbackImage =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop";
const listingImagesBucket = "listing-images";
export const listingNotFoundOrDeniedMessage =
  "Listing not found or access denied.";
export const listingsUnavailableMessage =
  "Listings are temporarily unavailable. Please try again later.";

export class ListingReadError extends Error {
  constructor(operation: string, cause: unknown) {
    super(listingsUnavailableMessage, { cause });
    this.name = "ListingReadError";
    this.operation = operation;
  }

  operation: string;
}

export function isListingReadError(error: unknown): error is ListingReadError {
  return error instanceof ListingReadError;
}

export function isMockListingFallbackEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ETHIOMLS_ENABLE_MOCK_LISTINGS === "true"
  );
}

async function readListingsWithFallback<T>(
  operation: string,
  read: () => Promise<T>,
  fallback: () => T
) {
  try {
    return await read();
  } catch (error) {
    console.error(`[EthioMLS] ${operation} failed.`, error);

    if (isMockListingFallbackEnabled()) {
      return fallback();
    }

    throw new ListingReadError(operation, error);
  }
}

function toMarketStatus(value: string | null | undefined): MarketStatus {
  if (marketStatuses.includes(value as MarketStatus)) {
    return value as MarketStatus;
  }

  return "Active";
}

function toTransactionType(
  value: string | null | undefined
): TransactionType {
  if (value === "For Rent" || value === "FOR RENT") {
    return "For Rent";
  }

  return "For Sale";
}

export { isPubliclyVisibleListing };

function formatUpdatedAt(updatedAt: string | null) {
  if (!updatedAt) {
    return "Updated date unavailable";
  }

  const timestamp = new Date(updatedAt).getTime();

  if (Number.isNaN(timestamp)) {
    return "Updated date unavailable";
  }

  const elapsedSeconds = Math.max(
    0,
    Math.floor((Date.now() - timestamp) / 1000)
  );
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedDays = Math.floor(elapsedHours / 24);

  if (elapsedSeconds < 60) {
    return "Updated just now";
  }

  if (elapsedMinutes < 60) {
    return `Updated ${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
  }

  if (elapsedHours < 24) {
    return `Updated ${elapsedHours} hour${elapsedHours === 1 ? "" : "s"} ago`;
  }

  if (elapsedDays === 1) {
    return "Updated yesterday";
  }

  if (elapsedDays < 7) {
    return `Updated ${elapsedDays} days ago`;
  }

  const date = new Date(timestamp);
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  if (new Date().getFullYear() !== date.getFullYear()) {
    options.year = "numeric";
  }

  return `Updated ${new Intl.DateTimeFormat("en-US", options).format(date)}`;
}

function toProperty(row: ListingRow): Property {
  return {
    id: row.id,
    listingId: row.listing_id,
    title: row.title,
    price: row.price,
    location: row.location,
    address: row.address,
    propertyType: row.property_type,
    transactionType: toTransactionType(row.transaction_type),
    marketStatus: toMarketStatus(row.market_status),
    verified: row.verified,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    agent: row.agent,
    updatedAt: formatUpdatedAt(row.updated_at),
    updatedAtTimestamp: row.updated_at,
    approvalStatus: toApprovalStatus(row.approval_status),
    rejectionReason: row.rejection_reason,
    description: row.description,
    image: row.image,
    ownerId: row.owner_id,
  };
}

function toApprovalStatus(value: string): ApprovalStatus {
  if (approvalStatuses.includes(value as ApprovalStatus)) {
    return value as ApprovalStatus;
  }

  return "Unapproved";
}

function getRequiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
}

function getOptionalNumber(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    return null;
  }

  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${key === "bedrooms" ? "Bedrooms" : "Bathrooms"} must be a valid number.`);
  }

  return number;
}

function fromFormData(formData: FormData, mode: "create" | "edit") {
  const city = String(formData.get("city") ?? "Addis Ababa");
  const price = Number(formData.get("price") ?? 0);
  const propertyType = getRequiredText(
    formData,
    "propertyType",
    "Property type"
  );
  const transactionType = getRequiredText(
    formData,
    "transactionType",
    "Transaction type"
  );
  const marketStatus = getRequiredText(
    formData,
    "marketStatus",
    "Market status"
  );
  const fieldRules = getPropertyFieldRules(propertyType);
  const bedrooms = fieldRules.showBedrooms
    ? getOptionalNumber(formData, "bedrooms")
    : null;
  const bathrooms = fieldRules.showBathrooms
    ? getOptionalNumber(formData, "bathrooms")
    : null;

  if (!propertyTypes.includes(propertyType as (typeof propertyTypes)[number])) {
    throw new Error("Select a valid property type.");
  }

  if (!transactionTypes.includes(transactionType as TransactionType)) {
    throw new Error("Select a valid transaction type.");
  }

  if (!marketStatuses.includes(marketStatus as MarketStatus)) {
    throw new Error("Select a valid market status.");
  }

  if (
    mode === "create" &&
    !createMarketStatuses.includes(
      marketStatus as (typeof createMarketStatuses)[number]
    )
  ) {
    throw new Error(
      "New listings can only be Coming Soon, Active, or Off Market."
    );
  }

  if (fieldRules.bedroomsRequired && bedrooms === null) {
    throw new Error("Bedrooms are required for residential listings.");
  }

  if (fieldRules.bathroomsRequired && bathrooms === null) {
    throw new Error("Bathrooms are required for residential listings.");
  }

  if (!Number.isFinite(price) || price < 1) {
    throw new Error("Price must be at least 1 ETB.");
  }

  return {
    title: getRequiredText(formData, "title", "Property title"),
    price: `${price.toLocaleString("en-US")} ETB`,
    location: city,
    address: getRequiredText(formData, "address", "Property address"),
    property_type: propertyType,
    transaction_type: transactionType,
    market_status: marketStatus,
    bedrooms,
    bathrooms,
    description: getRequiredText(formData, "description", "Description"),
  };
}

function getImageFile(formData: FormData) {
  const file = formData.get("imageFile");

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Please upload an image file.");
  }

  return file;
}

function getFileExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  return file.type.split("/")[1] || "jpg";
}

async function uploadListingImage(formData: FormData, listingId: string) {
  const file = getImageFile(formData);

  if (!file) {
    return undefined;
  }

  const extension = getFileExtension(file);
  const path = `${listingId}/primary-${randomUUID()}.${extension}`;

  return uploadSupabaseStorageObject(listingImagesBucket, path, file);
}

async function assertListingOwner(id: string, ownerId: string) {
  const rows = await supabaseRequest<ListingOwnerRow[]>(
    `/listings?select=owner_id,approval_status&id=eq.${encodeURIComponent(
      id
    )}&limit=1`
  );

  if (!rows[0] || rows[0].owner_id !== ownerId) {
    throw new Error("Listing not found or access denied.");
  }

  return rows[0];
}

export async function getListings(): Promise<Property[]> {
  return readListingsWithFallback(
    "Load public listings",
    async () => {
      const rows = await supabaseRequest<ListingRow[]>(
        "/listings?select=*&approval_status=eq.Approved&order=id.asc"
      );

      return rows.map(toProperty).filter(isPubliclyVisibleListing);
    },
    () => mockProperties.filter(isPubliclyVisibleListing)
  );
}

export async function getListingsForViewer(
  role: "public" | "incomplete" | "agent" | "admin",
  userId?: string
): Promise<Property[]> {
  if (role === "admin") {
    return readListingsWithFallback(
      "Load listings for admin viewer",
      async () => {
        const rows = await supabaseRequest<ListingRow[]>(
          "/listings?select=*&order=updated_at.desc"
        );

        return rows.map(toProperty);
      },
      () => mockProperties
    );
  }

  if (role === "agent" && userId) {
    return readListingsWithFallback(
      "Load listings for agent viewer",
      async () => {
        const rows = await supabaseRequest<ListingRow[]>(
          "/listings?select=*&order=updated_at.desc"
        );

        return rows
          .map(toProperty)
          .filter((listing) => canAgentBrowseListing(listing, userId));
      },
      () =>
        mockProperties.filter((listing) =>
          canAgentBrowseListing(listing, userId)
        )
    );
  }

  return getListings();
}

export async function getListingById(id: string): Promise<Property | null> {
  return readListingsWithFallback(
    "Load listing detail",
    async () => {
      const rows = await supabaseRequest<ListingRow[]>(
        `/listings?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
      );

      return rows[0] ? toProperty(rows[0]) : null;
    },
    () => mockProperties.find((property) => property.id === id) ?? null
  );
}

export async function getListingsByOwner(ownerId: string): Promise<Property[]> {
  return readListingsWithFallback(
    "Load listings by owner",
    async () => {
      const rows = await supabaseRequest<ListingRow[]>(
        `/listings?select=*&owner_id=eq.${encodeURIComponent(ownerId)}&order=id.asc`
      );

      return rows.map(toProperty);
    },
    () => mockProperties.filter((property) => property.ownerId === ownerId)
  );
}

export type AdminListingStatusFilter =
  | "All"
  | "Unapproved"
  | "Approved"
  | "Rejected";

export async function getAdminListings(
  status: AdminListingStatusFilter = "Unapproved"
): Promise<Property[]> {
  const statusFilter =
    status === "All"
      ? ""
      : `&approval_status=eq.${encodeURIComponent(status)}`;
  return readListingsWithFallback(
    "Load admin review listings",
    async () => {
      const rows = await supabaseRequest<ListingRow[]>(
        `/listings?select=*${statusFilter}&order=updated_at.desc`
      );

      return rows.map(toProperty);
    },
    () =>
      status === "All"
        ? mockProperties
        : mockProperties.filter(
            (listing) => listing.approvalStatus === status
          )
  );
}

export async function createListing(
  formData: FormData,
  ownerId: string,
  agentName: string
) {
  const id = randomUUID();
  const imageUrl = await uploadListingImage(formData, id);
  const body = {
    ...fromFormData(formData, "create"),
    id,
    image: imageUrl ?? fallbackImage,
    verified: false,
    agent: agentName,
    approval_status: "Unapproved",
    owner_id: ownerId,
  };

  const rows = await supabaseRequest<ListingRow[]>("/listings", {
    method: "POST",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });

  return toProperty(rows[0]);
}

export async function updateListingApproval(
  id: string,
  approvalStatus: "Approved" | "Rejected",
  rejectionReason?: string
) {
  const reason = rejectionReason?.trim() ?? "";

  if (approvalStatus === "Rejected" && !reason) {
    throw new Error("Rejection reason is required.");
  }

  const rows = await supabaseRequest<ListingRow[]>(
    `/listings?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        approval_status: approvalStatus,
        verified: approvalStatus === "Approved",
        rejection_reason: approvalStatus === "Rejected" ? reason : null,
      }),
    }
  );

  if (!rows[0]) {
    throw new Error("Listing not found.");
  }

  return toProperty(rows[0]);
}

export async function updateListingPhoto(
  id: string,
  formData: FormData,
  ownerId: string
) {
  const existingListing = await assertListingOwner(id, ownerId);

  const imageUrl = await uploadListingImage(formData, id);

  if (!imageUrl) {
    throw new Error("Please choose a photo to upload.");
  }

  const rows = await supabaseRequest<ListingRow[]>(
    `/listings?id=eq.${encodeURIComponent(id)}&owner_id=eq.${encodeURIComponent(
      ownerId
    )}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        image: imageUrl,
        ...(existingListing.approval_status === "Rejected"
          ? {
              approval_status: "Unapproved",
              verified: false,
              rejection_reason: null,
            }
          : {}),
      }),
    }
  );

  if (!rows[0]) {
    throw new Error("Listing not found or access denied.");
  }

  return toProperty(rows[0]);
}

export async function updateListing(
  id: string,
  formData: FormData,
  ownerId: string
) {
  const existingRows = await supabaseRequest<
    Pick<ListingRow, "approval_status">[]
  >(
    `/listings?select=approval_status&id=eq.${encodeURIComponent(
      id
    )}&owner_id=eq.${encodeURIComponent(ownerId)}&limit=1`
  );

  if (!existingRows[0]) {
    throw new Error("Listing not found or access denied.");
  }

  const body = {
    ...fromFormData(formData, "edit"),
    ...(existingRows[0].approval_status === "Rejected"
      ? {
          approval_status: "Unapproved",
          verified: false,
          rejection_reason: null,
        }
      : {}),
  };

  const rows = await supabaseRequest<ListingRow[]>(
    `/listings?id=eq.${encodeURIComponent(id)}&owner_id=eq.${encodeURIComponent(
      ownerId
    )}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    }
  );

  if (!rows[0]) {
    throw new Error("Listing not found or access denied.");
  }

  return toProperty(rows[0]);
}

export async function deleteListing(id: string, ownerId: string) {
  const rows = await supabaseRequest<DeletedListingRow[]>(
    `/listings?id=eq.${encodeURIComponent(id)}&owner_id=eq.${encodeURIComponent(
      ownerId
    )}`,
    {
      method: "DELETE",
      headers: {
        Prefer: "return=representation",
      },
    }
  );

  if (!rows[0]) {
    throw new Error(listingNotFoundOrDeniedMessage);
  }

  return rows[0];
}
