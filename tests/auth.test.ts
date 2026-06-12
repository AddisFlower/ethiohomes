import { describe, expect, it } from "vitest";
import {
  canManageListing,
  canUseAdminFeatures,
  canUseAgentFeatures,
  createAuthenticatedSession,
  getAdminAccessDenial,
  getAgentAccessDenial,
  isAuthenticated,
} from "@/lib/auth";
import {
  adminProfile,
  adminSession,
  agentProfile,
  agentSession,
  accessToken,
  authUser,
  incompleteSession,
  publicSession,
} from "@/tests/fixtures/auth";

describe("authorization session policies", () => {
  it("creates an incomplete session when an authenticated user has no profile", () => {
    expect(createAuthenticatedSession(authUser, null, accessToken)).toEqual(
      incompleteSession
    );
  });

  it("uses valid agent and admin profiles without changing their roles", () => {
    expect(
      createAuthenticatedSession(authUser, agentProfile, accessToken)
    ).toEqual(
      agentSession
    );
    expect(
      createAuthenticatedSession(authUser, adminProfile, accessToken)
    ).toEqual(
      adminSession
    );
  });

  it("recognizes incomplete users as authenticated without agent privileges", () => {
    expect(isAuthenticated(incompleteSession)).toBe(true);
    expect(canUseAgentFeatures(incompleteSession)).toBe(false);
    expect(canUseAdminFeatures(incompleteSession)).toBe(false);
  });

  it("allows admins to use agent features but not manage unowned listings", () => {
    expect(canUseAgentFeatures(adminSession)).toBe(true);
    expect(canUseAdminFeatures(adminSession)).toBe(true);
    expect(
      canManageListing(adminSession, {
        ownerId: "00000000-0000-4000-8000-000000000002",
      })
    ).toBe(false);
  });

  it("allows only an agent or admin owner to manage a listing", () => {
    expect(canManageListing(agentSession, { ownerId: authUser.id })).toBe(true);
    expect(canManageListing(incompleteSession, { ownerId: authUser.id })).toBe(
      false
    );
    expect(canManageListing(publicSession, { ownerId: authUser.id })).toBe(
      false
    );
  });

  it("distinguishes sign-in, profile, and admin denials", () => {
    expect(getAgentAccessDenial(publicSession)).toEqual({
      error: "Sign in required.",
      status: 401,
    });
    expect(getAgentAccessDenial(incompleteSession)).toEqual({
      error: "Agent profile required.",
      status: 403,
    });
    expect(getAgentAccessDenial(agentSession)).toBeNull();
    expect(getAdminAccessDenial(agentSession)).toEqual({
      error: "Access denied.",
      status: 403,
    });
    expect(getAdminAccessDenial(adminSession)).toBeNull();
  });
});
