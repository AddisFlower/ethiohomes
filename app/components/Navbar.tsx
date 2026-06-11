import {
  canUseAdminFeatures,
  canUseAgentFeatures,
  getAppSession,
  isAuthenticated,
} from "@/lib/auth";
import NavbarMenu from "./NavbarMenu";

export default async function Navbar() {
  const session = await getAppSession();
  const canUseAgent = canUseAgentFeatures(session);
  const canUseAdmin = canUseAdminFeatures(session);
  const displayName =
    session.role === "public"
      ? "Account"
      : session.profile?.full_name ?? session.user.email ?? "Account";

  return (
    <NavbarMenu
      canUseAdmin={canUseAdmin}
      canUseAgent={canUseAgent}
      displayName={displayName}
      isAuthenticated={isAuthenticated(session)}
    />
  );
}
