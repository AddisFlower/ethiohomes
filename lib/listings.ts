import { randomUUID } from "node:crypto";
import { properties as mockProperties } from "@/data/properties";
import { supabaseRequest } from "@/lib/supabase";

export type Property = {
  id: string;
  listingId: string;
  title: string;
  price: string;
  location: string;
  propertyType: string;
  status: string;
  verified: boolean;
  bedrooms: number;
  bathrooms: number;
  agent: string;
  updatedAt: string;
  approvalStatus: string;
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
  property_type: string;
  status: string;
  verified: boolean;
  bedrooms: number;
  bathrooms: number;
  agent: string;
  updated_at_label: string;
  approval_status: string;
  description: string;
  image: string;
  owner_id: string;
};

type ListingIdRow = {
  listing_id: string;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop";

function toProperty(row: ListingRow): Property {
  return {
    id: row.id,
    listingId: row.listing_id,
    title: row.title,
    price: row.price,
    location: row.location,
    propertyType: row.property_type,
    status: row.status,
    verified: row.verified,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    agent: row.agent,
    updatedAt: row.updated_at_label,
    approvalStatus: row.approval_status,
    description: row.description,
    image: row.image,
    ownerId: row.owner_id,
  };
}

function fromFormData(formData: FormData) {
  const city = String(formData.get("city") ?? "Addis Ababa");
  const price = Number(formData.get("price") ?? 0);

  return {
    title: String(formData.get("title") ?? ""),
    price: `${price.toLocaleString("en-US")} ETB`,
    location: city,
    property_type: String(formData.get("propertyType") ?? "Apartment"),
    status: String(formData.get("listingType") ?? "FOR SALE"),
    bedrooms: Number(formData.get("bedrooms") ?? 0),
    bathrooms: Number(formData.get("bathrooms") ?? 0),
    description: String(formData.get("description") ?? ""),
    image: String(formData.get("image") ?? "") || fallbackImage,
    updated_at_label: "Updated just now",
  };
}

async function getNextListingId() {
  const rows = await supabaseRequest<ListingIdRow[]>(
    "/listings?select=listing_id"
  );

  const highestListingNumber = rows.reduce((highest, row) => {
    const match = row.listing_id.match(/^MLS-(\d+)$/);

    if (!match) {
      return highest;
    }

    return Math.max(highest, Number(match[1]));
  }, 1000);

  return `MLS-${highestListingNumber + 1}`;
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

export async function createListing(formData: FormData, ownerId: string) {
  const listingId = await getNextListingId();
  const body = {
    ...fromFormData(formData),
    id: randomUUID(),
    listing_id: listingId,
    verified: false,
    agent: "Mac Yifru",
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

export async function updateListing(
  id: string,
  formData: FormData,
  ownerId: string
) {
  const body = fromFormData(formData);

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
