import { canUseAdminFeatures, canUseAgentFeatures, getAppSession } from "@/lib/auth";
import {
  getAdminListings,
  getListings,
  getListingsByOwner,
} from "@/lib/listings";
import { getShowingRequests } from "@/lib/showing-requests";
import HomeContent from "./HomeContent";

export default async function Home() {
  const session = await getAppSession();
  const isAgent = canUseAgentFeatures(session);
  const isAdmin = canUseAdminFeatures(session);
  const [properties, myListings, showingRequests, unapprovedListings] =
    await Promise.all([
      getListings(),
      isAgent ? getListingsByOwner(session.user.id) : Promise.resolve([]),
      isAgent ? getShowingRequests(session.user.id) : Promise.resolve([]),
      isAdmin ? getAdminListings("Unapproved") : Promise.resolve([]),
    ]);

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
