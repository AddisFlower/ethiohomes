import { canUseAdminFeatures, canUseAgentFeatures, getAppSession } from "@/lib/auth";
import {
  getAdminListings,
  getListings,
  getListingsByOwner,
  isListingReadError,
} from "@/lib/listings";
import { getShowingRequests } from "@/lib/showing-requests";
import ListingsUnavailable from "@/components/ListingsUnavailable";
import HomeContent from "./HomeContent";

export default async function Home() {
  const session = await getAppSession();
  const agentSession = canUseAgentFeatures(session) ? session : null;
  const adminSession = canUseAdminFeatures(session) ? session : null;
  const isAgent = agentSession !== null;
  const isAdmin = adminSession !== null;
  let dashboardData;

  try {
    dashboardData = await Promise.all([
      getListings(),
      agentSession
        ? getListingsByOwner(
            agentSession.user.id,
            agentSession.accessToken
          )
        : Promise.resolve([]),
      agentSession
        ? getShowingRequests(
            agentSession.user.id,
            agentSession.accessToken
          )
        : Promise.resolve([]),
      adminSession
        ? getAdminListings(adminSession.accessToken, "Unapproved")
        : Promise.resolve([]),
    ]);
  } catch (error) {
    if (isListingReadError(error)) {
      return <ListingsUnavailable />;
    }

    throw error;
  }

  const [properties, myListings, showingRequests, unapprovedListings] =
    dashboardData;

  return (
    <HomeContent
      properties={properties}
      isAdmin={isAdmin}
      isAgent={isAgent}
      myListingsCount={myListings.length}
      showingRequestsCount={showingRequests.length}
      unapprovedListingsCount={unapprovedListings.length}
    />
  );
}
