import {
  authenticatedSupabaseRequest,
  serviceRoleSupabaseRequest,
} from "@/lib/supabase";

export type PublicProfileUpdateInput = {
  agencyName?: unknown;
  fullName?: unknown;
  publicContactEmail?: unknown;
};

type ProfileContactRow = {
  public_contact_email: string | null;
};

function assertEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanOptionalText(
  value: unknown,
  fieldName: string,
  maxLength: number
) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error(`${fieldName} must be text.`);
  }

  const cleaned = value.trim();

  if (cleaned.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer.`);
  }

  return cleaned || null;
}

function cleanPublicContactEmail(value: unknown) {
  const email = cleanOptionalText(value, "Public contact email", 254);

  if (email && !assertEmail(email)) {
    throw new Error("Public contact email must be a valid email address.");
  }

  return email?.toLowerCase() ?? null;
}

export async function updateOwnProfile(
  ownerId: string,
  accessToken: string,
  input: PublicProfileUpdateInput
) {
  const updateBody: Record<string, string | null> = {};

  if (Object.hasOwn(input, "fullName")) {
    updateBody.full_name = cleanOptionalText(
      input.fullName,
      "Full name",
      120
    );
  }

  if (Object.hasOwn(input, "agencyName")) {
    updateBody.agency_name = cleanOptionalText(
      input.agencyName,
      "Agency name",
      160
    );
  }

  if (Object.hasOwn(input, "publicContactEmail")) {
    updateBody.public_contact_email = cleanPublicContactEmail(
      input.publicContactEmail
    );
  }

  const rows = await authenticatedSupabaseRequest<
    Array<{
      id: string;
      full_name: string | null;
      agency_name: string | null;
      public_contact_email: string | null;
      role: string;
    }>
  >(`/profiles?id=eq.${encodeURIComponent(ownerId)}`, accessToken, {
    method: "PATCH",
    headers: {
      Prefer: "return=representation",
    },
    body: JSON.stringify(updateBody),
  });
  const profile = rows[0];

  if (!profile) {
    throw new Error("Profile not found or access denied.");
  }

  return profile;
}

export async function getPublicContactEmailForProfile(profileId: string) {
  const rows = await serviceRoleSupabaseRequest<ProfileContactRow[]>(
    `/profiles?select=public_contact_email&id=eq.${encodeURIComponent(
      profileId
    )}&limit=1`
  );
  const email = rows[0]?.public_contact_email?.trim();

  return email && assertEmail(email) ? email : null;
}
