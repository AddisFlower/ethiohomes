import { randomUUID } from "node:crypto";
import { properties as mockProperties } from "@/data/properties";
import {
  supabaseRequest,
  uploadSupabaseStorageObject,
} from "@/lib/supabase";

export type Property = {
  id: string;
  listingId: string;
  title: string;
  price: string;
  location: string;
  address: string | null;
  propertyType: string;
  status: string;
  verified: boolean;
  bedrooms: number;
  bathrooms: number;
  agent: string;
  updatedAt: string;
  approvalStatus: string;
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
  status: string;
  verified: boolean;
  bedrooms: number;
  bathrooms: number;
  agent: string;
  updated_at_label: string;
  approval_status: string;
  rejection_reason: string | null;
  description: string;
  image: string;
  owner_id: string;
};

type ListingOwnerRow = {
  owner_id: string;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop";
const listingImagesBucket = "listing-images";

function toProperty(row: ListingRow): Property {
  return {
    id: row.id,
    listingId: row.listing_id,
    title: row.title,
    price: row.price,
    location: row.location,
    address: row.address,
    propertyType: row.property_type,
    status: row.status,
    verified: row.verified,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    agent: row.agent,
    updatedAt: row.updated_at_label,
    approvalStatus: row.approval_status,
    rejectionReason: row.rejection_reason,
    description: row.description,
    image: row.image,
    ownerId: row.owner_id,
  };
}

function fromFormData(formData: FormData, imageUrl?: string) {
  const city = String(formData.get("city") ?? "Addis Ababa");
  const price = Number(formData.get("price") ?? 0);
  const image =
    (imageUrl ?? String(formData.get("image") ?? "")) || fallbackImage;

  return {
    title: String(formData.get("title") ?? ""),
    price: `${price.toLocaleString("en-US")} ETB`,
    location: city,
    address: String(formData.get("address") ?? ""),
    property_type: String(formData.get("propertyType") ?? "Apartment"),
    status: String(formData.get("listingType") ?? "FOR SALE"),
    bedrooms: Number(formData.get("bedrooms") ?? 0),
    bathrooms: Number(formData.get("bathrooms") ?? 0),
    description: String(formData.get("description") ?? ""),
    image,
    updated_at_label: "Updated just now",
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
    `/listings?select=owner_id&id=eq.${encodeURIComponent(id)}&limit=1`
  );

  if (!rows[0] || rows[0].owner_id !== ownerId) {
    throw new Error("Listing not found or access denied.");
  }
}

export async function getListings(): Promise<Property[]> {
  try {
    const rows = await supabaseRequest<ListingRow[]>(
      "/listings?select=*&order=id.asc"
    );

    return rows.map(toProperty);
  } catch {
    return mockProperties;
  }
}

export async function getListingById(id: string): Promise<Property | null> {
  try {
    const rows = await supabaseRequest<ListingRow[]>(
      `/listings?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
    );

    return rows[0] ? toProperty(rows[0]) : null;
  } catch {
    return mockProperties.find((property) => property.id === id) ?? null;
  }
}

export async function getListingsByOwner(ownerId: string): Promise<Property[]> {
  try {
    const rows = await supabaseRequest<ListingRow[]>(
      `/listings?select=*&owner_id=eq.${encodeURIComponent(ownerId)}&order=id.asc`
    );

    return rows.map(toProperty);
  } catch {
    return mockProperties.filter((property) => property.ownerId === ownerId);
  }
}

export type AdminListingStatusFilter =
  | "All"
  | "Pending"
  | "Approved"
  | "Rejected";

export async function getAdminListings(
  status: AdminListingStatusFilter = "Pending"
): Promise<Property[]> {
  const statusFilter =
    status === "All"
      ? ""
      : `&approval_status=eq.${encodeURIComponent(status)}`;
  const rows = await supabaseRequest<ListingRow[]>(
    `/listings?select=*${statusFilter}&order=updated_at.desc`
  );

  return rows.map(toProperty);
}

export async function createListing(
  formData: FormData,
  ownerId: string,
  agentName: string
) {
  const id = randomUUID();
  const imageUrl = await uploadListingImage(formData, id);
  const body = {
    ...fromFormData(formData, imageUrl),
    id,
    verified: false,
    agent: agentName,
    approval_status: "Pending",
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
        updated_at_label: "Updated just now",
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
  await assertListingOwner(id, ownerId);

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
        updated_at_label: "Updated just now",
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
    ...fromFormData(formData),
    ...(existingRows[0].approval_status === "Rejected"
      ? {
          approval_status: "Pending",
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
  await supabaseRequest(
    `/listings?id=eq.${encodeURIComponent(id)}&owner_id=eq.${encodeURIComponent(
      ownerId
    )}`,
    {
      method: "DELETE",
    }
  );
}
