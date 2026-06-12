import { cookies } from "next/headers";
import {
  authenticatedSupabaseRequest,
  getSupabaseConfig,
} from "@/lib/supabase";

export type AppRole = "public" | "incomplete" | "agent" | "admin";

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
      role: "incomplete";
      user: AuthUser;
      profile: null;
      accessToken: string;
    }
  | {
      role: "agent";
      user: AuthUser;
      profile: Profile & { role: "agent" };
      accessToken: string;
    }
  | {
      role: "admin";
      user: AuthUser;
      profile: Profile & { role: "admin" };
      accessToken: string;
    };

export type AuthenticatedSession = Exclude<AppSession, { role: "public" }>;
export type AgentSession = Extract<
  AppSession,
  { role: "agent" | "admin" }
>;

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
      apikey: config.anonKey,
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

export async function getProfile(userId: string, accessToken: string) {
  try {
    const rows = await authenticatedSupabaseRequest<
      Array<Omit<Profile, "role"> & { role: string }>
    >(
      `/profiles?select=*&id=eq.${encodeURIComponent(userId)}&limit=1`,
      accessToken
    );
    const profile = rows[0];

    if (!profile || (profile.role !== "agent" && profile.role !== "admin")) {
      return null;
    }

    return {
      ...profile,
      role: profile.role,
    } satisfies Profile;
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

export function createAuthenticatedSession(
  user: AuthUser,
  profile: Profile | null,
  accessToken: string
): AuthenticatedSession {
  if (!profile) {
    return {
      role: "incomplete",
      user,
      profile: null,
      accessToken,
    };
  }

  if (profile.role === "admin") {
    return {
      role: "admin",
      user,
      profile: { ...profile, role: "admin" },
      accessToken,
    };
  }

  return {
    role: "agent",
    user,
    profile: { ...profile, role: "agent" },
    accessToken,
  };
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

  return createAuthenticatedSession(
    user,
    await getProfile(user.id, accessToken),
    accessToken
  );
}

export function isAuthenticated(
  session: AppSession
): session is AuthenticatedSession {
  return session.role !== "public";
}

export function canUseAgentFeatures(
  session: AppSession
): session is AgentSession {
  return session.role === "agent" || session.role === "admin";
}

export function canUseAdminFeatures(
  session: AppSession
): session is Extract<AppSession, { role: "admin" }> {
  return session.role === "admin";
}

export function canManageListing(
  session: AppSession,
  listing: { ownerId: string }
) {
  if (!canUseAgentFeatures(session)) {
    return false;
  }

  return listing.ownerId === session.user.id;
}

export function getAgentAccessDenial(session: AppSession) {
  if (session.role === "public") {
    return {
      error: "Sign in required.",
      status: 401,
    } as const;
  }

  if (!canUseAgentFeatures(session)) {
    return {
      error: "Agent profile required.",
      status: 403,
    } as const;
  }

  return null;
}

export function getAdminAccessDenial(session: AppSession) {
  const agentDenial = getAgentAccessDenial(session);

  if (agentDenial) {
    return agentDenial;
  }

  if (!canUseAdminFeatures(session)) {
    return {
      error: "Access denied.",
      status: 403,
    } as const;
  }

  return null;
}
