import {
  canUseAdminFeatures,
  canUseAgentFeatures,
  getAppSession,
  isAuthenticated,
} from "@/lib/auth";
import {
  getAssignedSellerLeadCount,
  getNewSellerLeadCount,
} from "@/lib/seller-leads";
import NavbarMenu from "./NavbarMenu";

export default async function Navbar() {
  const session = await getAppSession();
  const canUseAgent = canUseAgentFeatures(session);
  const canUseAdmin = canUseAdminFeatures(session);
  const displayName =
    session.role === "public"
      ? "Account"
      : session.profile?.full_name ?? session.user.email ?? "Account";
  let adminSellerLeadCount = 0;
  let assignedSellerLeadCount = 0;

  if (canUseAdmin) {
    try {
      adminSellerLeadCount = await getNewSellerLeadCount();
    } catch (error) {
      console.error("[EthioMLS] Seller lead admin count failed.", error);
    }
  }

  if (canUseAgent) {
    try {
      assignedSellerLeadCount = await getAssignedSellerLeadCount(
        session.user.id
      );
    } catch (error) {
      console.error("[EthioMLS] Assigned seller lead count failed.", error);
    }
  }

  return (
    <NavbarMenu
      adminSellerLeadCount={adminSellerLeadCount}
      assignedSellerLeadCount={assignedSellerLeadCount}
      canUseAdmin={canUseAdmin}
      canUseAgent={canUseAgent}
      displayName={displayName}
      isAuthenticated={isAuthenticated(session)}
    />
  );
}
