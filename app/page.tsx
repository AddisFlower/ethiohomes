import { canUseAdminFeatures, canUseAgentFeatures, getAppSession } from "@/lib/auth";
import { getListings } from "@/lib/listings";
import HomeContent from "./HomeContent";

export default async function Home() {
  const session = await getAppSession();
  const properties = await getListings();

  return (
    <HomeContent
      properties={properties}
      isAdmin={canUseAdminFeatures(session)}
      isAgent={canUseAgentFeatures(session)}
    />
  );
}
