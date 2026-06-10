import type { AppSession, AuthUser, Profile } from "@/lib/auth";

export const authUser: AuthUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "agent@example.com",
};

export const otherAuthUser: AuthUser = {
  id: "00000000-0000-4000-8000-000000000002",
  email: "other@example.com",
};

export const agentProfile: Profile = {
  id: authUser.id,
  full_name: "Agent Example",
  agency_name: "Example Realty",
  role: "agent",
};

export const adminProfile: Profile = {
  ...agentProfile,
  role: "admin",
};

export const publicSession: AppSession = {
  role: "public",
  user: null,
  profile: null,
};

export const incompleteSession: AppSession = {
  role: "incomplete",
  user: authUser,
  profile: null,
};

export const agentSession: AppSession = {
  role: "agent",
  user: authUser,
  profile: agentProfile,
};

export const adminSession: AppSession = {
  role: "admin",
  user: authUser,
  profile: adminProfile,
};
