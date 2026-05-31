import { cookies } from "next/headers";
import { getSupabaseConfig, supabaseRequest } from "@/lib/supabase";

export type AppRole = "public" | "agent" | "admin";

export type AuthUser = {
  id: string;
  email?: string;
  userMetadata?: {
    full_name?: string;
    name?: string;
  };
};

export type Profile = {
  id: string;
  full_name: string | null;
  agency_name: string | null;
  role: "agent" | "admin";
};

export type AppSession =
  | {
      role: "public";
      user: null;
      profile: null;
    }
  | {
      role: "agent" | "admin";
      user: AuthUser;
      profile: Profile;
    };

type SupabaseUserResponse = {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
};

const accessTokenCookie = "ethiomls_access_token";
const refreshTokenCookie = "ethiomls_refresh_token";

export async function getAuthTokens() {
  const cookieStore = await cookies();

  return {
    accessToken: cookieStore.get(accessTokenCookie)?.value,
    refreshToken: cookieStore.get(refreshTokenCookie)?.value,
  };
}

export function getAuthCookieNames() {
  return {
    accessTokenCookie,
    refreshTokenCookie,
  };
}

async function getCurrentUser(accessToken: string) {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  const response = await fetch(`${config.authUrl}/user`, {
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as SupabaseUserResponse;

  return {
    id: user.id,
    email: user.email,
    userMetadata: user.user_metadata,
  };
}

function getNameFromEmail(email?: string) {
  if (!email) {
    return "Agent";
  }

  const name = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();

  if (!name) {
    return "Agent";
  }

  return name.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getUserDisplayName(user: AuthUser) {
  return (
    user.userMetadata?.full_name?.trim() ||
    user.userMetadata?.name?.trim() ||
    getNameFromEmail(user.email)
  );
}

export async function getProfile(userId: string) {
  try {
    const rows = await supabaseRequest<Profile[]>(
      `/profiles?select=*&id=eq.${encodeURIComponent(userId)}&limit=1`
    );

    return rows[0] ?? null;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes("PGRST205") ||
        error.message.includes("public.profiles"))
    ) {
      return null;
    }

    throw error;
  }
}

export async function getAppSession(): Promise<AppSession> {
  const { accessToken } = await getAuthTokens();

  if (!accessToken) {
    return {
      role: "public",
      user: null,
      profile: null,
    };
  }

  const user = await getCurrentUser(accessToken);

  if (!user) {
    return {
      role: "public",
      user: null,
      profile: null,
    };
  }

  const profile =
    (await getProfile(user.id)) ??
    ({
      id: user.id,
      full_name: getUserDisplayName(user),
      agency_name: null,
      role: "agent",
    } satisfies Profile);

  return {
    role: profile.role,
    user,
    profile,
  };
}

export function canUseAgentFeatures(session: AppSession) {
  return session.role === "agent" || session.role === "admin";
}

export function canUseAdminFeatures(session: AppSession) {
  return session.role === "admin";
}

export function canManageListing(
  session: AppSession,
  listing: { ownerId: string }
) {
  return canUseAgentFeatures(session) && listing.ownerId === session.user.id;
}
